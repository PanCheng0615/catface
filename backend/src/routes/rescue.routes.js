const express = require('express');
const router = express.Router();

const {
  getCats,
  createCat,
  updateCat,
  generateCatFaceId,
  getApplications,
  reviewApplication,
  getAnalytics
} = require('../controllers/rescue.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/cats', protect, authorize('rescue_staff', 'admin'), getCats);
router.post('/cats', protect, authorize('rescue_staff', 'admin'), createCat);
router.put('/cats/:id', protect, authorize('rescue_staff', 'admin'), updateCat);
router.post('/cat-face-id', protect, authorize('rescue_staff', 'admin'), generateCatFaceId);
router.get('/applications', protect, authorize('rescue_staff', 'admin'), getApplications);
router.put('/applications/:id/review', protect, authorize('rescue_staff', 'admin'), reviewApplication);
router.get('/analytics', protect, authorize('rescue_staff', 'admin'), getAnalytics);

module.exports = router;
