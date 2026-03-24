const express = require('express');
const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');

const {
  getHealthRecords,
  createOwnerHealthRecord,
  updateOwnerHealthRecord,
  deleteOwnerHealthRecord,
  getSharePermissions,
  setHealthSharePermission
} = require('../controllers/health.controller');

const router = express.Router();

// ── 文件上传配置 ──
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(12).toString('hex') + ext;
    cb(null, name);
  }
});
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error('只允許上傳圖片（JPG/PNG/GIF/WEBP）或 PDF'));
  }
});

// POST /api/health/upload — 上传附件，返回可访问的 URL
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'NoFile', message: '未收到檔案' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  return res.json({ success: true, data: { url: fileUrl, filename: req.file.filename }, message: '上傳成功' });
});

// 健康记录（主人维护）
router.get('/records/:catId',       getHealthRecords);
router.post('/records/:catId',      createOwnerHealthRecord);
router.put('/records/:recordId',    updateOwnerHealthRecord);
router.delete('/records/:recordId', deleteOwnerHealthRecord);

// 诊所授权
router.get('/share/:catId', getSharePermissions);
router.post('/share',       setHealthSharePermission);

module.exports = router;
