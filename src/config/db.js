const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  dialect: "postgres",
  logging: false, // temporarily enable logging to see SQL queries
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");
    // Force sync in development - this will drop and recreate all tables
    await sequelize.sync();
    console.log("All models were synchronized successfully");
    return sequelize;
  } catch (error) {
    console.error("Unable to connect to database:", error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
