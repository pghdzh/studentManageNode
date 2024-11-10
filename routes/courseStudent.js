const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");

const { Student, CourseStudent, Course, sequelize } = require("../models"); // 假设在 index.js 中集中导出

const router = express.Router();

// 使用内存存储的 multer 配置
const upload = multer({ storage: multer.memoryStorage() });

// 导入学生的 API 接口
router.post(
  "/courses/:courseId/import-students",
  upload.single("file"),
  async (req, res) => {
    const courseId = req.params.courseId;

    try {
      // 检查是否上传了文件
      if (!req.file) {
        return res.status(400).json({ message: "请上传一个 Excel 文件" });
      }

      // 读取 Excel 文件内容
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // 读取第一个工作表
      const studentsData = xlsx.utils.sheet_to_json(worksheet); // 解析为 JSON

      // 检查 Excel 文件是否为空
      if (!studentsData || studentsData.length === 0) {
        return res.status(400).json({ message: "Excel 文件内容为空" });
      }

      // 用于存储学号到学生id的映射
      const studentNumberToIdMap = {};

      // 遍历学生数据，先查找已有学生
      for (const row of studentsData) {
        const { 学号: studentNumber } = row; // 获取学号

        if (studentNumber && !studentNumberToIdMap[studentNumber]) {
          // 如果学生的学号没有找到对应的id，查找学生表
          const existingStudent = await Student.findOne({
            where: { student_number: studentNumber },
          });

          if (existingStudent) {
            studentNumberToIdMap[studentNumber] = existingStudent.id;
          }
        }
      }

      // 构建新学生信息，避免重复插入
      const newStudents = [];
      const courseStudents = [];

      for (const row of studentsData) {
        const { 学号: studentNumber, 姓名: fullName } = row;

        if (!studentNumber || !fullName) {
          return res
            .status(400)
            .json({ message: "Excel 文件缺少必要的学生信息" });
        }

        // 如果学生是新学生（没有在 studentNumberToIdMap 中找到），则插入
        if (!studentNumberToIdMap[studentNumber]) {
          newStudents.push({
            student_number: studentNumber,
            password: studentNumber, // 默认用学号作为密码
            full_name: fullName,
          });
        }

        // 获取学生id，无论是新学生还是已存在的学生
        const studentId = studentNumberToIdMap[studentNumber] || null;

        if (studentId) {
          // 如果找到了学生的id，则添加课程学生关联
          courseStudents.push({ course_id: courseId, student_id: studentId });
        }
      }

      // 批量插入新学生
      const createdStudents = await Student.bulkCreate(newStudents, {
        ignoreDuplicates: true,
      });

      // 更新映射，确保所有新插入的学生有对应的 id
      createdStudents.forEach((student) => {
        studentNumberToIdMap[student.student_number] = student.id;
      });

      // 使用学号到学生 id 的映射建立课程学生关联
      const courseStudentToInsert = [];
      for (const studentNumber in studentNumberToIdMap) {
        const studentId = studentNumberToIdMap[studentNumber];
        courseStudentToInsert.push({
          course_id: courseId,
          student_id: studentId,
        });
      }

      // 批量插入课程学生关联信息，确保没有重复关联
      await CourseStudent.bulkCreate(courseStudentToInsert, {
        ignoreDuplicates: true,
      });

      res.status(200).json({ message: "学生数据批量导入成功", code: 200 });
    } catch (error) {
      console.error("批量导入学生失败:", error);
      res.status(500).json({ message: "服务器错误", error: error.message });
    }
  }
);

// 根据课程 ID 查询该课程下的学生（支持分页）
router.get("/courses/:courseId/students", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 查询该课程下的学生信息
    const { count, rows: students } = await Student.findAndCountAll({
      include: [
        {
          model: Course,
          through: {
            model: CourseStudent,
            where: { course_id: courseId },
            attributes: [], // 可以省略中间表字段
          },
          required: true, // 确保这条查询必须关联上课程
        },
      ],
      offset: parseInt(offset, 10), // 偏移量
      limit: parseInt(limit, 10), // 每页条数
    });

    // 返回查询结果
    res.status(200).json({
      total: count, // 总条数
      currentPage: parseInt(page, 10), // 当前页码
      totalPages: Math.ceil(count / limit), // 总页数
      students, // 学生数据
      code: 200,
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

// 删除所有学生及其课程关系
router.delete("/allStudents", async (req, res) => {
  let transaction; // 在外部声明 transaction 变量

  try {
    // 开启事务
    transaction = await sequelize.transaction();

    // 1. 删除 CourseStudent 表中的所有学生关联关系
    await CourseStudent.destroy({
      where: {},
      transaction,
    });

    // 2. 删除 Student 表中的所有学生记录
    await Student.destroy({
      where: {},
      transaction,
    });

    // 提交事务
    await transaction.commit();

    res
      .status(200)
      .json({ message: "所有学生及其关联关系已成功删除", code: 200 });
  } catch (error) {
    console.error("删除所有学生失败:", error);

    // 如果事务存在，则回滚
    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});
//删除特定关联
router.delete("/:courseId/:studentId", async (req, res) => {
  const { courseId, studentId } = req.params;

  try {
    // 查找并删除课程和学生的对应关系
    const result = await CourseStudent.destroy({
      where: {
        course_id: courseId,
        student_id: studentId,
      },
    });

    // 检查是否删除成功
    if (result === 0) {
      return res.status(404).json({
        code: 404,
        message: "没有找到指定的课程和学生关联关系",
      });
    }

    res.status(200).json({
      code: 200,
      message: "课程和学生的关联关系已删除",
    });
  } catch (error) {
    console.error("删除课程和学生关联关系失败:", error);
    res.status(500).json({
      code: 500,
      message: "服务器错误",
      error: error.message,
    });
  }
});

module.exports = router;
