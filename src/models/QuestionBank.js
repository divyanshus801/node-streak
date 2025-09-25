
module.exports = (sequelize, DataTypes) => {
  const QuestionBank = sequelize.define(
    "QuestionBank",
    {
      id: {
        type: DataTypes.UUID,
       defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        defaltValue: "Global Question Bank",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    { timestamps: true }
  );



  return QuestionBank;
};
