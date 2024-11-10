const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // 引入数据库配置

const Student = sequelize.define(
  "Student",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "id", // 映射到数据库中的 'id' 列
    },
    student_number: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "student_number", // 映射到数据库中的 'course_name' 列
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "password", // 映射到数据库中的 'course_teacher' 列
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "full_name", // 映射到数据库中的 'course_teacher' 列
    },
  },
  {
    timestamps: true, // 自动处理 createdAt 和 updatedAt 字段
    createdAt: "created_at", // 映射到数据库中的 'created_at'
    updatedAt: "updated_at", // 映射到数据库中的 'updated_at'
    tableName: "users", // 显式指定表名
  }
);

module.exports = Student;
