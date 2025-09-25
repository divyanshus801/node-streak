const { QuestionBank, Question } = require("../models");
const validateCreateQuestion = require("../validators/question");

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
    console.log(req.user.id)
    const validatorRes = validateCreateQuestion({...req.body, createdBy: req.user.id});
    if (validatorRes.error) {
      return res.status(400).json({
        message: validatorRes.error.details.map((d) => d.message),
      });
    }

    const question = await Question.create({
      ...validatorRes.value
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
        createdBy: question?.createdBy
      },
    });
  } catch (err) {
    console.error("❌ Error adding question:", err);
    return res.status(500).json({
      message: "Server Error!",
    });
  }
};

module.exports = {
  createQuestionBank,
  addQuestionToQuestionBank,
};
