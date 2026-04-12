// backend/src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config(); // 读取 .env（如果有）

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// 本地上传文件（健康/诊所附件）：/uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const authRouter = require('./routes/auth.routes');
const usersRouter = require('./routes/users.routes');
const chatRouter = require('./routes/chat.routes');
const rescueRouter = require('./routes/rescue.routes');
const communityRouter = require('./routes/community.routes');
const notificationsRouter = require('./routes/notifications.routes');
const catsRouter = require('./routes/cats.routes');
const adoptionRouter = require('./routes/adoption.routes');

// Member 5 — 机构、领养活动、健康、诊所
const orgRouter = require('./routes/organization.routes');
const eventRouter = require('./routes/event.routes');
const healthRouter = require('./routes/health.routes');
const clinicRouter = require('./routes/clinic.routes');

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/chat', chatRouter);
app.use('/api/rescue', rescueRouter);
app.use('/api/community', communityRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/cats', catsRouter);
app.use('/api/adoption', adoptionRouter);

app.use('/api/organizations', orgRouter);
app.use('/api/events', eventRouter);
app.use('/api/health', healthRouter);
app.use('/api/clinic', clinicRouter);

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