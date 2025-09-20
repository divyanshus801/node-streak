const { UUID, INTEGER } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Streak = sequelize.define(
    "Streak",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        primaryKey: true,
      },
      userId: {
        type: UUID,
        allowNull: false,
      },
      currentStreak: {
        type: INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      longestStreak: {
        type: INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      lastActivityDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      streakStartDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      streakGoal: {
        type: DataTypes.INTEGER,
        defaultValue: 7, // Default 7-day streak goal
        allowNull: false,
      },
    },
    { timestamps: true }
  );

  // Define associations
  Streak.associate = function (models) {
    Streak.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return Streak;
};
