const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // 引入数据库配置

const Course = sequelize.define(
  "Course",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "id", // 映射到数据库中的 'id' 列
    },
    course_name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "course_name", // 映射到数据库中的 'course_name' 列
    },
    course_teacher: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "teacher_name", // 映射到数据库中的 'course_teacher' 列
    },
  },
  {
    timestamps: true, // 自动处理 createdAt 和 updatedAt 字段
    createdAt: "created_at", // 映射到数据库中的 'created_at'
    updatedAt: "updated_at", // 映射到数据库中的 'updated_at'
    tableName: "courses", // 显式指定表名
  }
);

module.exports = Course;
