const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  recordSwipe,
  getFeed,
  getSwipes,
  getLiked,
  setPreferences,
  createApplication,
  getMyApplications
} = require('../controllers/adoption.controller');

router.post('/swipe', protect, recordSwipe);
router.get('/feed', protect, getFeed);
router.get('/swipes', protect, getSwipes);
router.get('/liked', protect, getLiked);
router.post('/preferences', protect, setPreferences);
router.post('/applications', protect, createApplication);
router.get('/applications/me', protect, getMyApplications);

module.exports = router;
