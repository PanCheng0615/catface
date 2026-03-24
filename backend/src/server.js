// backend/src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // 读取 .env（如果有）
process.env.TZ = process.env.TZ || 'Asia/Shanghai';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const authRouter = require('./routes/auth.routes');
const usersRouter = require('./routes/users.routes');
const communityRouter = require('./routes/community.routes');
const notificationsRouter = require('./routes/notifications.routes');
// 这里挂载路由
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/community', communityRouter);
app.use('/api/notifications', notificationsRouter);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ok'
  });
});

// 测试接口：确认服务器能跑
app.get('/api/healthcheck', (req, res) => {
  res.json({
    success: true,
    data: 'OK',
    message: 'Server is running'
  });
});

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Payload too large',
      message: '图片过大，请选择更小的图片后重试'
    });
  }
  return next(err);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});