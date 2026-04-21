// backend/src/server.js
const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const path    = require('path');

dotenv.config(); // 读取 .env（如果有）

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// 静态文件服务：上传的图片/PDF 可通过 /uploads/<filename> 访问
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// 静态文件服务：前端页面（放在 API 路由之前，这样 /api/* 优先匹配）
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

// Member 1 — 用户系统
const authRouter  = require('./routes/auth.routes');
const usersRouter = require('./routes/users.routes');
app.use('/api/auth',  authRouter);
app.use('/api/users', usersRouter);

// Member 2 — cats & adoption
const catsRoutes     = require('./routes/cats.routes');
const adoptionRoutes = require('./routes/adoption.routes');
app.use('/api/cats',      catsRoutes);
app.use('/api/adoption',  adoptionRoutes);

// Member 3 — 社区与通知
const communityRoutes      = require('./routes/community.routes');
const notificationsRoutes  = require('./routes/notifications.routes');
const chatRoutes           = require('./routes/chat.routes');
app.use('/api/community',      communityRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/chat',           chatRoutes);

// Member 5 — 救助机构、领养活动、健康管理、诊所
const orgRouter    = require('./routes/organization.routes');
const eventRouter  = require('./routes/event.routes');
const healthRouter = require('./routes/health.routes');
const clinicRouter = require('./routes/clinic.routes');
const rescueRouter = require('./routes/rescue.routes');
app.use('/api/organizations', orgRouter);
app.use('/api/events',        eventRouter);
app.use('/api/health',        healthRouter);
app.use('/api/clinic',        clinicRouter);
app.use('/api/rescue',        rescueRouter);

// 健康检查
app.get('/api/healthcheck', (req, res) => {
  res.json({ success: true, data: 'OK', message: 'Server is running' });
});

// 404 兜底
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: '接口不存在'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'PayloadTooLarge',
      message: '图片过大，请选择更小的图片后重试'
    });
  }
  return next(err);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
