const { sequelize } = require("../config/db");
const defineUserModel = require("./user");

// Initialize models
const User = defineUserModel(sequelize);

// Add models to db object
const db = {
  sequelize,
  User,
};

module.exports = db;
