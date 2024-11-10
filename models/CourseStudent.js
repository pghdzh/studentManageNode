const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Course = require("./Course"); // 引入课程模型
const Student = require("./Student"); // 引入学生模型

const CourseStudent = sequelize.define(
  "CourseStudent",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "id",
    },
    course_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Course,
        key: "id",
      },
      allowNull: false,
    },
    student_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Student,
        key: "id",
      },
      allowNull: false,
    },
  },
  {
    timestamps: false,
    tableName: "course_students",
  }
);



module.exports = CourseStudent;
