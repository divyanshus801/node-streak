const AWS = require("aws-sdk");
const { Question, UploadJob } = require("../models");

AWS.config.update({ region: process.env.AWS_REGION });
const sqs = new AWS.SQS();
const QUEUE_URL = process.env.SQS_QUEUE_URL;

const POLL_INTERVAL_MS = 2000; // 2 seconds between polls
const BATCH_INSERT_SIZE = 10;   // insert 10 questions at a time

async function pollMessages() {
  try {
    const params = {
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 10,
      VisibilityTimeout: 300,
    };

    const { Messages } = await sqs.receiveMessage(params).promise();
    if (!Messages || Messages.length === 0) return;

    const questionsToInsert = [];
    const deleteEntries = [];

    for (const msg of Messages) {
      try {
        const data = JSON.parse(msg.Body);

        questionsToInsert.push({
          id: data.id,
          jobId: data.jobId,
          questionBankId: data.questionBankId,
          questionText: data.questionText,
          options: data.options,
          correctOption: data.correctOption,
          difficulty: data.difficulty || "Easy",
          tags: data.tags || [],
          createdBy: data.createdBy || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // prepare for batch delete after successful DB insert
        deleteEntries.push({
          Id: msg.MessageId,
          ReceiptHandle: msg.ReceiptHandle,
        });
      } catch (err) {
        console.error(`❌ Failed parsing message ${msg.MessageId}:`, err);
      }
    }

    // Insert into DB in batches
    for (let i = 0; i < questionsToInsert.length; i += BATCH_INSERT_SIZE) {
      const batch = questionsToInsert.slice(i, i + BATCH_INSERT_SIZE);
      try {
        await Question.bulkCreate(batch, { ignoreDuplicates: true });

        // update UploadJob counts
        const jobIds = [...new Set(batch.map(q => q.jobId).filter(Boolean))];
        for (const jobId of jobIds) {
          const count = batch.filter(q => q.jobId === jobId).length;
          await UploadJob.increment({ processedCount: count }, { where: { id: jobId } });

          const job = await UploadJob.findByPk(jobId);
          if (job.processedCount + job.failedCount >= job.totalCount) {
            await job.update({ status: "completed" });
          }
        }
      } catch (err) {
        console.error("❌ DB insert failed for batch:", err);

        // increment failedCount in UploadJob
        const jobIds = [...new Set(batch.map(q => q.jobId).filter(Boolean))];
        for (const jobId of jobIds) {
          const count = batch.filter(q => q.jobId === jobId).length;
          await UploadJob.increment({ failedCount: count }, { where: { id: jobId } });
        }
      }
    }

    // Batch delete successfully processed messages
    if (deleteEntries.length > 0) {
      const deleteParams = { QueueUrl: QUEUE_URL, Entries: deleteEntries };
      await sqs.deleteMessageBatch(deleteParams).promise();
      console.log(`✅ Deleted ${deleteEntries.length} messages from SQS`);
    }

  } catch (err) {
    console.error("Polling error:", err.message);
  }
}

function startConsumer() {
  console.log("🚀 SQS consumer started");

  async function pollLoop() {
    await pollMessages();
    setTimeout(pollLoop, POLL_INTERVAL_MS);
  }

  pollLoop();
}

module.exports = { startConsumer };
