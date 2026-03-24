const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const {
  recordSwipe,
  getFeed,
  getSwipes,
  getLiked,
  setPreferences,
  createApplication,
  getMyApplications,
  getScoringConfig,
  putScoringConfig
} = require('../controllers/adoption.controller');

router.post('/swipe', protect, recordSwipe);
router.get('/feed', protect, getFeed);
router.get('/swipes', protect, getSwipes);
router.get('/liked', protect, getLiked);
router.post('/preferences', protect, setPreferences);
router.post('/applications', protect, createApplication);
router.get('/applications/me', protect, getMyApplications);

router.get('/scoring-config', protect, authorize('admin', 'rescue_staff'), getScoringConfig);
router.put('/scoring-config', protect, authorize('admin', 'rescue_staff'), putScoringConfig);

module.exports = router;
