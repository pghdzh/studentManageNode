const { Sequelize } = require("sequelize");

// 创建 Sequelize 实例，连接到数据库
const sequelize = new Sequelize("zy", "root", "885216", {
  host: "localhost",
  dialect: "mysql",
});
try {
  sequelize.authenticate();
  console.log("数据库连接成功");
} catch (error) {
  console.error("无法连接到数据库:", error);
}

module.exports = sequelize;
