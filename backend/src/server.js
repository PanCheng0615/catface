/**
 * CatFace 后端入口（Member 1 创建）
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const catsRouter = require('./routes/cats.routes');
const adoptionRouter = require('./routes/adoption.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CatFace API is running' });
});

// 猫咪档案 + 领养模块（Member 2）
app.use('/api/cats', catsRouter);
app.use('/api/adoption', adoptionRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
