const { UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define(
    "Question",
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: UUIDV4,
        primaryKey: true
      },
      questionBankId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "QuestionBanks",
            key: "id"
        },
        onDelete: 'CASCADE'
      }, 
      questionText: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      options: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      correctOption: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      difficulty: {
        type: DataTypes.ENUM("Easy", "Medium", "Hard"),
        defaultValue: "Easy",
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      indexes: [{fields: ["id"]}, {fields: ["createdBy"]}, {fields: ["tags"]}],
      timeStamps: true,
    }
  );
  return Question;
};
