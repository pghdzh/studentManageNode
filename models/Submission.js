// 提交表
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Submission = sequelize.define(
  "Submission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Students",
        key: "id",
      },
    },
    assignment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Assignments",
        key: "id",
      },
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: true, // 文件路径
    },

    feedback: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("未交", "已提交", "已评分", "迟交"),
      defaultValue: "已提交",
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "submissions",
  }
);

module.exports = Submission;
