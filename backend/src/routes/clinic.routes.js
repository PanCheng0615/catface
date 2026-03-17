const express = require('express');

const {
  createClinicReport,
  getAuthorizedCats
} = require('../controllers/clinic.controller');

const router = express.Router();

router.post('/reports/:catId', createClinicReport);
router.get('/cats', getAuthorizedCats);

module.exports = router;
