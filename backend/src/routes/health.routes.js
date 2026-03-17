const express = require('express');

const {
  getHealthRecords,
  upsertOwnerHealthRecord,
  setHealthSharePermission
} = require('../controllers/health.controller');

const router = express.Router();

router.get('/:catId', getHealthRecords);
router.put('/owner/:catId', upsertOwnerHealthRecord);
router.post('/share', setHealthSharePermission);

module.exports = router;
