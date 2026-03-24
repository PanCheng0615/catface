const express = require('express');

const {
  getHealthRecords,
  createOwnerHealthRecord,
  updateOwnerHealthRecord,
  deleteOwnerHealthRecord,
  getSharePermissions,
  setHealthSharePermission
} = require('../controllers/health.controller');

const router = express.Router();

// 健康记录（主人维护）
router.get('/records/:catId',        getHealthRecords);
router.post('/records/:catId',       createOwnerHealthRecord);
router.put('/records/:recordId',     updateOwnerHealthRecord);
router.delete('/records/:recordId',  deleteOwnerHealthRecord);

// 诊所授权
router.get('/share/:catId',  getSharePermissions);
router.post('/share',        setHealthSharePermission);

module.exports = router;
