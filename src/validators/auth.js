const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/) // only Indian numbers starting 6–9, total 10 digits
    .messages({
      "string.pattern.base": "Phone must be a valid 10-digit Indian number",
      "any.required": "Phone is required",
    }),
  timeZone: Joi.string(),
  password: Joi.string().min(6).required(),
}).or("phone", "email");

const verifyOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/) // only Indian numbers starting 6–9, total 10 digits
    .messages({
      "string.pattern.base": "Phone must be a valid 10-digit Indian number",
      "any.required": "Phone is required",
    }),
  otp: Joi.string().min(6).max(6).required(),
});

const validateCreateUser = (data) => {
  return registerSchema.validate(data, { abortEarly: false });
};

const validateVerifyOtp = (data) => {
  return verifyOtpSchema.validate(data, { abortEarly: false });
};

module.exports = { validateCreateUser, validateVerifyOtp };
