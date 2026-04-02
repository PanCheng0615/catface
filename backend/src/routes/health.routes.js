const express = require('express');
const upload  = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

const {
  getHealthRecords,
  createOwnerHealthRecord,
  updateOwnerHealthRecord,
  deleteOwnerHealthRecord,
  getSharePermissions,
  setHealthSharePermission
} = require('../controllers/health.controller');

const router = express.Router();

// POST /api/health/upload — 上传附件（诊所工作人员可上传图片/PDF）
router.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'NoFile', message: '未收到檔案' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  return res.json({ success: true, data: { url: fileUrl, filename: req.file.filename }, message: '上傳成功' });
});

// 健康记录（需要登录）
router.get('/records/:catId',   protect, getHealthRecords);
router.post('/records/:catId',  protect, createOwnerHealthRecord);
router.put('/records/:recordId', protect, updateOwnerHealthRecord);
router.delete('/records/:recordId', protect, deleteOwnerHealthRecord);

// 诊所授权（需要登录）
router.get('/share/:catId', protect, getSharePermissions);
router.post('/share',       protect, setHealthSharePermission);

module.exports = router;
