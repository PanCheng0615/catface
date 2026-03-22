// backend/src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // 读取 .env（如果有）

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const authRouter = require('./routes/auth.routes');
const usersRouter = require('./routes/users.routes');
// 这里挂载路由
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

// 测试接口：确认服务器能跑
app.get('/api/healthcheck', (req, res) => {
  res.json({
    success: true,
    data: 'OK',
    message: 'Server is running'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});