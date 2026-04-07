const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const {
  getAuthorizedCats,
  createClinicReport,
  updateClinicReport,
  deleteClinicReport
} = require('../controllers/clinic.controller');

const router = express.Router();

// 所有诊所接口需要登录，且角色为 clinic_staff
router.use(protect, authorize('clinic_staff'));

router.get('/cats',                  getAuthorizedCats);
router.post('/reports/:catId',       createClinicReport);
router.put('/reports/:reportId',     updateClinicReport);
router.delete('/reports/:reportId',  deleteClinicReport);

module.exports = router;
