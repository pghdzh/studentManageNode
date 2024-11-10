const express = require("express");
const sequelize = require("./config/db");
const courseRouter = require("./routes/course");
const studentRouter = require("./routes/student");
const courseStudentRouter = require("./routes/courseStudent");
const assignmentRouter = require("./routes/assignments");
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require("cors");

// 中间件
app.use(express.json()); // 解析 JSON 请求体
// 使用 cors 中间件，允许跨域请求
app.use(cors());

// 路由
app.use("/api/courses", courseRouter);
app.use("/api/student", studentRouter);
app.use("/api/courseStudent", courseStudentRouter);
app.use("/api/assignment", assignmentRouter);
// 数据库连接和服务器启动
sequelize
  .sync({ force: false }) // 确保数据库表已同步
  .then(() => {
    app.listen(PORT, () => {
      console.log(`服务器已启动，端口：${PORT}`);
    });
  })
  .catch((error) => {
    console.error("数据库连接失败", error);
  });
