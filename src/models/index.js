const { sequelize } = require("../config/db");
const { Sequelize, DataTypes } = require("sequelize");

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Initialize models
db.User = require("./user")(sequelize, DataTypes);
db.Streak = require("./streak")(sequelize, DataTypes);

// Define associations
db.Streak.belongsTo(db.User, {
  foreignKey: "userId",
  as: "user",
});

db.User.hasOne(db.Streak, {
  foreignKey: "userId",
  as: "streaks",
});

// Sync database
db.sequelize
  .sync({ force: false, alter: true })
  .then(() => {
    console.log("Database synchronized successfully");
  })
  .catch((error) => {
    console.error("Error syncing database:", error);
  });

module.exports = db;
