const { QuestionBank, Question } = require("../models");
const validateCreateQuestion = require("../validators/question");
const AWS = require("aws-sdk");
const csv = require("csv-parser");
const { v4: uuidv4 } = require("uuid");
const { UploadJob } = require("../models");

AWS.config.update({ region: process.env.AWS_REGION });
const sqs = new AWS.SQS();

const SQS_BATCH_SIZE = 10;

function parseOptionsField(raw) {
  if (!raw) return [];
  try { return JSON.parse(raw); } 
  catch (e) {
    return raw.includes(';') ? raw.split(';').map(s => s.trim()) :
           raw.includes('|') ? raw.split('|').map(s => s.trim()) :
           raw.split(',').map(s => s.trim());
  }
}

const createQuestionBank = async (req, res) => {
  try {
    const { title, description } = req.body;
    const user = req.user;
    if (!title) {
      return res.status(400).json({
        message: "Title is required!",
      });
    }

    const questionBank = await QuestionBank.create({
      title: title,
      description: description,
      createdBy: user?.id,
    });

    return res.status(201).json({
      message: "Question Bank Created Succesfully",
      questionBank: {
        id: questionBank?.id,
        title: questionBank.title,
        description: questionBank?.description,
        createdAt: questionBank?.createdAt,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

const addQuestionToQuestionBank = async (req, res) => {
  try {
    console.log(req.user.id);
    const validatorRes = validateCreateQuestion({
      ...req.body,
      createdBy: req.user.id,
    });
    if (validatorRes.error) {
      return res.status(400).json({
        message: validatorRes.error.details.map((d) => d.message),
      });
    }

    const question = await Question.create({
      ...validatorRes.value,
      jobId: null
    });

    return res.status(200).json({
      message: "Question added to question bank",
      question: {
        questionBankId: question?.questionBankId,
        questionText: question?.questionText,
        options: question?.options,
        correctOption: question?.correctOption,
        difficulty: question?.difficulty,
        tags: question?.tags,
        createdBy: question?.createdBy,
      },
    });
  } catch (err) {
    console.error("❌ Error adding question:", err);
    return res.status(500).json({
      message: "Server Error!",
    });
  }
};

const getAllQuestionByQuestionBankId = async (req, res) => {
  try {
    const { questionBankId } = req.query;
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);

    const allQuestion = await Question.findAll({
      where: { questionBankId },
      limit: limit,
      offset: (page - 1) * limit,
      order: [["createdAt", "ASC"]],
    });

    if (!allQuestion) {
      return res.status(400).json({
        message: "No Question Found",
      });
    }
    return res.status(200).json({
      message: "Data Found",
      questions: allQuestion,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Server Error!",
    });
  }
};

const uploadQuestionsCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const jobId = uuidv4();
    const questionBankId = req.body.questionBankId;
    const createdBy = req.body.createdBy;

    await UploadJob.create({
      id: jobId,
      status: "pending",
      questionBankId,
      createdBy,
    });

    let currentBatch = [];
    let enqueuedCount = 0;
    let totalRows = 0;
    const sendPromises = [];

    const flushBatchToSQS = async () => {
      if (!currentBatch.length) return;
      const Entries = currentBatch.map((msg, i) => ({
        Id: `${Date.now()}-${i}`,
        MessageBody: JSON.stringify(msg),
      }));

      const params = { QueueUrl: process.env.SQS_QUEUE_URL, Entries };
      const p = sqs
        .sendMessageBatch(params)
        .promise()
        .then(async (result) => {
          const success = (result.Successful || []).length;
          enqueuedCount += success;
          await UploadJob.increment(
            { enqueuedCount: success },
            { where: { id: jobId } }
          );

          if ((result.Failed || []).length) {
            console.error("SQS send failures:", result.Failed);
            await UploadJob.increment(
              { failedCount: result.Failed.length },
              { where: { id: jobId } }
            );
          }
        })
        .catch(async (err) => {
          console.error("SQS send error", err);
          await UploadJob.increment(
            { failedCount: currentBatch.length },
            { where: { id: jobId } }
          );
        });

      sendPromises.push(p);
      currentBatch = [];
    };

    // stream from Multer memory buffer
    const bufferStream = require("stream").PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
      .pipe(csv())
      .on("data", async (row) => {
        if (!row.questionText || row.questionText.trim() === "") return;
        totalRows++;
        const payload = {
          id: uuidv4(),
          jobId,
          questionBankId: questionBankId || row.questionBankId,
          questionText: row.questionText,
          options: parseOptionsField(row.options),
          correctOption: row.correctOption,
          difficulty: row.difficulty || "Easy",
          tags: row.tags ? row.tags.split(",").map((s) => s.trim()) : [],
          createdBy: createdBy || row.createdBy || null,
        };

        currentBatch.push(payload);
        if (currentBatch.length >= SQS_BATCH_SIZE) await flushBatchToSQS();
      })
      .on("end", async () => {
        await flushBatchToSQS();
        await Promise.all(sendPromises);

        await UploadJob.update(
          { totalCount: totalRows, status: "queued" },
          { where: { id: jobId } }
        );

        return res.status(202).json({
          message: "File received — queued for processing",
          jobId,
          totalRowsEnqueued: enqueuedCount,
        });
      })
      .on("error", (err) => {
        console.error("CSV parse error:", err);
        return res.status(500).json({ message: "CSV parse error" });
      });
  } catch (err) {
    console.error("Upload endpoint error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

async function testSend() {
  const params = {
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify({ hello: "world", from: "Divyanshu" }),
  };

  try {
    const result = await sqs.sendMessage(params).promise();
    console.log("✅ Message sent:", result.MessageId);
  } catch (err) {
    console.error("❌ Error sending message:", err);
  }
}


module.exports = {
  createQuestionBank,
  addQuestionToQuestionBank,
  getAllQuestionByQuestionBankId,
  uploadQuestionsCSV,
  testSend
};
