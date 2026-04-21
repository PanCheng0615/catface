const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const {
  getAuthorizedCats,
  getClinicPermissions,
  getClinicReport,
  createClinicReport,
  updateClinicReport,
  deleteClinicReport,
  generateReportPrint,
  endorseOwnerRecord,
  getOwnerRecord
} = require('../controllers/clinic.controller');

const router = express.Router();

router.use(protect);

router.get('/reports/:reportId/print', generateReportPrint);
router.get('/cats', authorize('clinic_staff'), getAuthorizedCats);
router.get('/permissions', authorize('clinic_staff'), getClinicPermissions);
router.get('/reports/:reportId', authorize('clinic_staff'), getClinicReport);
router.get('/records/:recordId', authorize('clinic_staff'), getOwnerRecord);
router.post('/records/:recordId/endorse', authorize('clinic_staff'), endorseOwnerRecord);
router.post('/reports/:catId', authorize('clinic_staff'), createClinicReport);
router.put('/reports/:reportId', authorize('clinic_staff'), updateClinicReport);
router.delete('/reports/:reportId', authorize('clinic_staff'), deleteClinicReport);

module.exports = router;
