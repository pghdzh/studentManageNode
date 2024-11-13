// routes/assignments.js
const express = require("express");

const {
  Submission,
  Student,
  Assignment,
  CourseStudent,
  sequelize,
} = require("../models");

const multer = require("multer");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// 获取作业
router.get("/", async (req, res) => {
  try {
    // 获取查询参数：page，limit，和student_number
    const { page = 1, limit = 10, title } = req.query;

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 创建查询条件
    const where = {};
    if (title) {
      where.title = title;
    }

    // 执行查询
    const { count, rows: assignments } = await Assignment.findAndCountAll({
      where, // 条件查询
      offset: parseInt(offset, 10), // 偏移量
      limit: parseInt(limit, 10), // 每页条数
    });

    // 返回查询结果
    res.status(200).json({
      total: count, // 总条数
      currentPage: parseInt(page, 10), // 当前页码
      totalPages: Math.ceil(count / limit), // 总页数
      assignments, // 作业数据
      code: 200,
    });
  } catch (error) {
    console.error("Error occurred:", error); // 打印详细错误信息
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});
// 创建作业
router.post("/", async (req, res) => {
  try {
    const { title, description, due_date, course_id } = req.body;

    const assignment = await Assignment.create({
      title,
      description,
      due_date,
      course_id,
    });

    res.status(201).json({ message: "作业创建成功", assignment, code: 200 });
  } catch (error) {
    console.error("创建作业失败:", error);
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

// 删除作业接口
router.delete("/:id", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    // 查找作业
    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ message: "作业未找到" });
    }

    // 删除作业对应的提交记录
    await Submission.destroy({ where: { assignment_id: id } }, { transaction });

    // 删除服务器上的作业文件夹
    const folderPath = path.join("uploads", `${id}`);
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }

    // 删除作业记录
    await assignment.destroy({ transaction });

    await transaction.commit();
    res.status(200).json({ message: "作业及相关文件删除成功", code: 200 });
  } catch (error) {
    await transaction.rollback();
    console.error("删除作业失败:", error);
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

// 修改作业接口
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date, course_id } = req.body;

    // 查找作业
    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ message: "作业未找到" });
    }

    // 更新作业信息
    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.due_date = due_date || assignment.due_date;
    assignment.course_id = course_id || assignment.course_id;

    // 保存更新后的作业
    await assignment.save();
    res.status(200).json({ message: "作业修改成功", assignment, code: 200 });
  } catch (error) {
    console.error("修改作业失败:", error);
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

//提交作业
// 动态设置存储路径和文件名
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const { assignmentId } = req.params;
    try {
      // 获取作业标题，用作文件夹名（若标题包含特殊字符，可进行处理）

      const folderName = `${assignmentId}`;
      const destPath = path.join("uploads", folderName);

      // 检查路径是否存在，不存在则创建
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      cb(null, destPath);
    } catch (error) {
      console.error("路径创建失败:", error);
      cb(error, null);
    }
  },
  filename: async function (req, file, cb) {
    const { studentId } = req.body;
    try {
      // 查询学生信息，拼接学号和姓名作为文件名
      const student = await Student.findByPk(studentId);
      const fileName = student
        ? `${student.student_number}_${student.full_name.replace(
            /[^a-zA-Z0-9\u4e00-\u9fa5]/g,
            "_"
          )}${path.extname(file.originalname)}`
        : file.originalname.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_");
      cb(null, fileName);
    } catch (error) {
      console.error("文件命名失败:", error);
      cb(error, null);
    }
  },
});

const upload = multer({ storage });

// 作业提交接口
router.post(
  "/:assignmentId/submit",
  upload.single("file"),
  async (req, res) => {
    const { assignmentId } = req.params;
    const { studentId } = req.body;

    try {
      const fileUrl = `http://1.94.189.79:3000/uploads/${assignmentId}/${req.file.filename}`;

      // 保存提交记录
      const submission = await Submission.create({
        student_id: studentId,
        assignment_id: assignmentId,
        file_path: fileUrl,
        status: "已提交",
      });

      res.status(200).json({ message: "作业提交成功", submission });
    } catch (error) {
      console.error("作业提交失败:", error);
      res.status(500).json({ message: "服务器错误", error: error.message });
    }
  }
);

//查看作业提交
router.get("/:assignmentId/submissions", async (req, res) => {
  const { assignmentId } = req.params;

  try {
    const submissions = await Submission.findAll({
      where: { assignment_id: assignmentId },
    });

    res.status(200).json(submissions);
  } catch (error) {
    console.error("获取提交记录失败:", error);
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

//评分和反馈
router.post("/:assignmentId/feedback", async (req, res) => {
  const { assignmentId } = req.params;
  const { studentId, feedback } = req.body;

  try {
    const submission = await Submission.findOne({
      where: { assignment_id: assignmentId, student_id: studentId },
    });

    if (!submission) {
      return res.status(404).json({ message: "作业提交未找到" });
    }

    submission.feedback = feedback;
    submission.status = "已评分"; // 更新作业状态为已评分

    await submission.save();

    res.status(200).json({ message: "评分成功", submission, code: 200 });
  } catch (error) {
    console.error("评分失败:", error);
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

// 查询作业所有提交记录
router.get("/subitByAssignment/:assignmentId", async (req, res) => {
  const { assignmentId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // 计算偏移量
  const offset = (page - 1) * limit;
  try {
    const { count, rows: submissions } = await Submission.findAndCountAll({
      where: { assignment_id: assignmentId },
      offset: parseInt(offset, 10), // 偏移量
      limit: parseInt(limit, 10), // 每页条数
    });

    // 获取所有学生ID
    const studentIds = submissions.map((submission) => submission.student_id);

    // 查找学生信息，注意区分ID字段
    const students = await Student.findAll({
      where: {
        id: studentIds,
      },
    });

    // 将学生信息合并到每个提交记录中
    const submissionsWithStudents = submissions.map((submission) => {
      const student = students.find((s) => s.id === submission.student_id);
      return {
        ...submission.toJSON(),
        fullName: student.full_name,
        student_number: student.student_number, // 将学生信息添加到作业提交记录中
        studnetId: student.id,
      };
    });

    res.status(200).json({
      code: 200,
      data: submissionsWithStudents,
      total: count, // 总条数
      currentPage: parseInt(page, 10), // 当前页码
    });
  } catch (error) {
    console.error("获取学生作业记录失败:", error);
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

// 查询学生所有作业提交记录
router.get("/students/:studentId/assignments", async (req, res) => {
  const { studentId } = req.params;

  try {
    const submissions = await Submission.findAll({
      where: { student_id: studentId },
    });

    res.status(200).json(submissions);
  } catch (error) {
    console.error("获取学生作业记录失败:", error);
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

// 查询指定学生的所有作业（包含未提交和已提交状态）
router.get("/student/:studentId/all-assignments", async (req, res) => {
  const { studentId } = req.params;

  try {
    // 查询所有作业并通过左连接检查该学生是否有提交记录
    const assignments = await Assignment.findAll({
      attributes: ["id", "title", "due_date", "description"],
      include: [
        {
          model: Submission,
          required: false, // 使用 left join 保留所有作业
          where: { student_id: studentId },
          attributes: ["status", "feedback", "created_at"],
        },
      ],
    });

    // 格式化返回数据：区分已提交和未提交作业
    const assignmentData = assignments.map((assignment) => {
      const submission = assignment.Submissions[0]; // 获取提交信息
      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        due_date: assignment.due_date,
        status: submission ? submission.status : "未提交", // 判断是否有提交记录
        feedback: submission ? submission.feedback : null,
      };
    });

    res.status(200).json({
      code: 200,
      message: "查询成功",
      data: assignmentData,
    });
  } catch (error) {
    console.error("查询学生作业信息失败：", error);
    res
      .status(500)
      .json({ code: 500, message: "服务器错误", error: error.message });
  }
});

//下载作业下的全部文件

router.get("/downloadAllAss/:assignmentId", async (req, res) => {
  const { assignmentId } = req.params;
  const folderPath = path.join("uploads", assignmentId);

  if (!fs.existsSync(folderPath)) {
    return res.status(404).json({ message: "文件夹未找到" });
  }

  try {
    const files = fs.readdirSync(folderPath);
    const fileUrls = files.map((file) => ({
      fileName: file,
      url: `/uploads/${assignmentId}/${file}`,
    }));

    res.status(200).json({ files: fileUrls });
  } catch (error) {
    console.error("读取文件失败:", error);
    res.status(500).json({ message: "读取文件列表失败", error: error.message });
  }
});

// 获取未提交作业的学生列表
router.get("/:assignmentId/unsubmitted", async (req, res) => {
  const { assignmentId } = req.params;

  try {
    // 获取作业所属的课程ID
    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "作业未找到" });
    }

    const courseId = assignment.course_id;

    // 获取课程中的所有学生
    const courseStudents = await CourseStudent.findAll({
      where: { course_id: courseId },
      include: [Student], // 不使用别名 as，直接引用模型
    });

    // 提取所有学生的ID
    const courseStudentIds = courseStudents.map((cs) => cs.student_id);

    // 获取已提交该作业的学生ID列表
    const submittedStudentIds = await Submission.findAll({
      where: { assignment_id: assignmentId },
      attributes: ["student_id"],
    }).then((submissions) =>
      submissions.map((submission) => submission.student_id)
    );

    // 筛选出未提交作业的学生
    const unsubmittedStudentIds = courseStudentIds.filter(
      (id) => !submittedStudentIds.includes(id)
    );

    // 获取未提交学生的详细信息
    const unsubmittedStudents = await Student.findAll({
      where: { id: unsubmittedStudentIds },
      attributes: ["id", "student_number", "full_name"],
    });

    res.status(200).json({ code: 200, unsubmittedStudents });
  } catch (error) {
    console.error("获取未提交学生失败:", error);
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

module.exports = router;
