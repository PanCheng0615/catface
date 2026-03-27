require('dotenv').config();
process.env.TZ = process.env.TZ || 'Asia/Shanghai';

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const catsRoutes = require('./routes/cats.routes');
const adoptionRoutes = require('./routes/adoption.routes');
const communityRoutes = require('./routes/community.routes');
const notificationsRoutes = require('./routes/notifications.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ success: true, data: { ok: true }, message: 'ok' });
});
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { ok: true }, message: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/cats', catsRoutes);
app.use('/api/adoption', adoptionRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/notifications', notificationsRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: '接口不存在'
  });
});

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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
