const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');

const healthRouter = require('./routes/health.routes');
const clinicRouter = require('./routes/clinic.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/healthcheck', (req, res) => {
  res.json({
    success: true,
    data: 'OK',
    message: 'Member 5 local server is running'
  });
});

app.use('/api/health', healthRouter);
app.use('/api/clinic', clinicRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: '接口不存在'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
