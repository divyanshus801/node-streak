
const Joi = require("joi");

const questionSchema = Joi.object({
  questionBankId: Joi.string()
    .uuid({ version: "uuidv4" })
    .required(),

  questionText: Joi.string()
    .min(5)
    .required(),

  options: Joi.array()
    .items(Joi.string().min(1))
    .min(4) // at least 2 options
    .required(),

  correctOption: Joi.string()
    .required(),

  difficulty: Joi.string()
    .valid("Easy", "Medium", "Hard")
    .default("Easy"),

  tags: Joi.array()
    .items(Joi.string())
    .default([]),

  createdBy: Joi.string()
    .uuid({ version: "uuidv4" })
    .required(),
});

const validateCreateQuestion = (data) => {
  return questionSchema.validate(data, { abortEarly: false });
};

module.exports = validateCreateQuestion;