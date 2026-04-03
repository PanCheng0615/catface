require('dotenv').config();
process.env.TZ = process.env.TZ || 'Asia/Shanghai';

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务：上传的图片/PDF 可通过 /uploads/<filename> 访问
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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
app.use('/api/community',      communityRoutes);
app.use('/api/notifications', notificationsRoutes);

// Member 5 — 救助机构、领养活动、健康管理、诊所
const orgRouter    = require('./routes/organization.routes');
const eventRouter  = require('./routes/event.routes');
const healthRouter = require('./routes/health.routes');
const clinicRouter = require('./routes/clinic.routes');
app.use('/api/organizations', orgRouter);
app.use('/api/events',        eventRouter);
app.use('/api/health',        healthRouter);
app.use('/api/clinic',        clinicRouter);

// 健康检查
app.get('/api/healthcheck', (req, res) => {
  res.json({ success: true, data: 'OK', message: 'Server is running' });
});
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { ok: true }, message: 'ok' });
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
