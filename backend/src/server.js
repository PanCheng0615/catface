const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const path    = require('path');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 静态文件服务：上传的图片/PDF 可通过 /uploads/<filename> 访问
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Member 1 — 用户系统
const authRouter  = require('./routes/auth.routes');
const usersRouter = require('./routes/users.routes');
app.use('/api/auth',  authRouter);
app.use('/api/users', usersRouter);

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

// 404 兜底
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'NotFound', message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});