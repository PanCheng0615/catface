require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const catsRoutes = require('./routes/cats.routes');
const adoptionRoutes = require('./routes/adoption.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ success: true, data: { ok: true }, message: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/cats', catsRoutes);
app.use('/api/adoption', adoptionRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: '接口不存在'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
