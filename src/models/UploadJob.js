module.exports = (sequelize, DataTypes) => {
  const UplaodJob = sequelize.define(
    "UploadJob",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      questionBankId: { type: DataTypes.UUID, allowNull: false },
      totalCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      enqueuedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      processedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      failedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "queued",
          "processing",
          "completed",
          "failed"
        ),
        defaultValue: "pending",
      },
      createdBy: { type: DataTypes.UUID, allowNull: true },
    },
    {
      tableName: "UploadJobs",
      timestamps: true,
    }
  );
  return UplaodJob;
};
