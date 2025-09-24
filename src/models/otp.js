const { Sequelize } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const userOtp = sequelize.define(
    "userOtp",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      isUsed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      indexes: [{ fields: ["phone"] }, { fields: ["userId"] }],
      timeStamp: true,
    }
  );
  userOtp.associate = (models) => {
    userOtp.belongsTo(models.User, { foreignKey: "userId", as: "user" });
  };
  return userOtp;
};
