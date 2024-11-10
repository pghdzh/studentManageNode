const express = require("express");
const router = express.Router();
const Student = require("../models/Student");


// 获取所有学生（支持分页和按学号查询）
router.get("/", async (req, res) => {
  try {
    // 获取查询参数：page，limit，和student_number
    const { page = 1, limit = 10, student_number } = req.query;

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 创建查询条件
    const where = {};
    if (student_number) {
      where.student_number = student_number; // 按学号查询
    }

    // 执行查询
    const { count, rows: students } = await Student.findAndCountAll({
      where, // 条件查询
      offset: parseInt(offset, 10), // 偏移量
      limit: parseInt(limit, 10), // 每页条数
    });

    // 返回查询结果
    res.status(200).json({
      total: count, // 总条数
      currentPage: parseInt(page, 10), // 当前页码
      totalPages: Math.ceil(count / limit), // 总页数
      students, // 学生数据
      code:200
    });
  } catch (error) {
    console.error("Error occurred:", error); // 打印详细错误信息
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

// 重置密码
router.put("/rePass/:id", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "学生未找到" });
    }
    student.password = student.student_number;
    await student.save();
    res.status(200).json({
      code: 200, // 标识请求成功
    });
  } catch (error) {
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

// 修改姓名
router.put("/reName/:id", async (req, res) => {
  const { full_name } = req.body;

  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "学生未找到" });
    }

    student.full_name = full_name || student.full_name;

    await student.save();
    res.status(200).json({
      code: 200, // 标识请求成功
    });
  } catch (error) {
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

// 删除学生
router.delete("/:id", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ code: 404, message: "学生未找到" });
    }

    await student.destroy();
    res.status(200).json({
      code: 200, // 标识请求成功
    });
  } catch (error) {
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

module.exports = router;
