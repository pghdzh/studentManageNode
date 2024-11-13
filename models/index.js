// models/index.js

const sequelize = require("../config/db");
const Assignment = require("./Assignment");
const Submission = require("./Submission");
const Course = require("./Course");
const Student = require("./Student");
const CourseStudent = require("./CourseStudent");

// 定义关联
// Assignment 和 Submission 之间是一对多关系
Assignment.hasMany(Submission, {
  foreignKey: "assignment_id",
});
Submission.belongsTo(Assignment, {
  foreignKey: "assignment_id",
});
// Student 和 Submission 之间是一对多关系
Student.hasMany(Submission, {
  foreignKey: "student_id",
});
Submission.belongsTo(Student, {
  foreignKey: "student_id",
});
Course.belongsToMany(Student, {
  through: CourseStudent,
  foreignKey: "course_id",
});
Student.belongsToMany(Course, {
  through: CourseStudent,
  foreignKey: "student_id",
});
CourseStudent.belongsTo(Student, { foreignKey: "student_id" });
CourseStudent.belongsTo(Course, { foreignKey: "course_id" });
// 导出所有模型
module.exports = {
  sequelize,
  Course,
  Student,
  CourseStudent,
  Assignment,
  Submission,
};
