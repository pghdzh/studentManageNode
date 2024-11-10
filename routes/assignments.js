// routes/assignments.js
const express = require("express");
const { Assignment } = require("../models");
const { Submission } = require("../models");
const multer = require("multer");
const router = express.Router();

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
      where.title = title; // 按学号查询
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
  try {
    const { id } = req.params;

    // 查找作业
    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ message: "作业未找到" });
    }

    // 删除作业
    await assignment.destroy();
    res.status(200).json({ message: "作业删除成功", code: 200 });
  } catch (error) {
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
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/assignments/");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post(
  "/:assignmentId/submit",
  upload.single("file"),
  async (req, res) => {
    const { assignmentId } = req.params;
    const { studentId } = req.body;

    try {
      const fileUrl = path.join("uploads", "assignments", req.file.filename);

      const submission = await Submission.create({
        student_id: studentId,
        assignment_id: assignmentId,
        file_url: fileUrl,
        status: "已提交", // 提交状态
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
router.post("/:assignmentId/grade", async (req, res) => {
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
    submission.status = "graded"; // 更新作业状态为已评分

    await submission.save();

    res.status(200).json({ message: "评分成功", submission });
  } catch (error) {
    console.error("评分失败:", error);
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

module.exports = router;
