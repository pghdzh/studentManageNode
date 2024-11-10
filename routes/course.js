const express = require("express");
const router = express.Router();
const Course = require("../models/Course");

// 获取所有课程
router.get("/", async (req, res) => {
  try {
    const courses = await Course.findAll();
    res.status(200).json(courses);
  } catch (error) {
    console.error("Error occurred:", error); // 打印详细错误信息
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

// 创建课程
router.post("/", async (req, res) => {
  const { course_name, course_teacher } = req.body;

  if (!course_name || !course_teacher) {
    return res.status(400).json({ message: "缺少必要的字段" });
  }

  try {
    const newCourse = await Course.create({ course_name, course_teacher });
    res.status(200).json({
      code: 200, // 标识请求成功
    });
  } catch (error) {
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

// 更新课程
router.put("/:id", async (req, res) => {
  const { course_name, course_teacher } = req.body;

  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "课程未找到" });
    }

    course.course_name = course_name || course.course_name;
    course.course_teacher = course_teacher || course.course_teacher;

    await course.save();
    res.status(200).json({
      code: 200, // 标识请求成功
    });
  } catch (error) {
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

router.delete("/allCourses", async (req, res) => {
  console.log("123123123123123123123")
  try {
    // 删除 Course 表中的所有课程记录
    await Course.destroy({
      where: {},
    });

    res.status(200).json({ message: "所有课程已成功删除", code: 200 });
  } catch (error) {
    console.error("删除所有课程失败:", error);
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});

// 删除课程
router.delete("/:id", async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ code: 404, message: "课程未找到" });
    }

    await course.destroy();
    res.status(200).json({
      code: 200, // 标识请求成功
    });
  } catch (error) {
    res.status(500).json({ message: "服务器错误", error: error.message });
  }
});



module.exports = router;
