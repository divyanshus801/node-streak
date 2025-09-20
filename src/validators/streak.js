const Joi = require('joi');

const createStreakSchema = Joi.object({
  streakGoal: Joi.number()
    .integer()
    .min(1)
    .default(7)
    .description('Target number of days for the streak'),
  
  lastActivityDate: Joi.date()
    .iso()
    .max('now')
    .allow(null)
    .description('Date of last activity'),
  
  streakStartDate: Joi.date()
    .iso()
    .max('now')
    .allow(null)
    .description('Date when streak started'),
});

const validateCreateStreak = (data) => {
  return createStreakSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateCreateStreak
};