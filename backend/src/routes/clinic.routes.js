const express = require('express');

const {
  getAuthorizedCats,
  createClinicReport,
  updateClinicReport,
  deleteClinicReport
} = require('../controllers/clinic.controller');

const router = express.Router();

router.get('/cats',                  getAuthorizedCats);
router.post('/reports/:catId',       createClinicReport);
router.put('/reports/:reportId',     updateClinicReport);
router.delete('/reports/:reportId',  deleteClinicReport);

module.exports = router;
