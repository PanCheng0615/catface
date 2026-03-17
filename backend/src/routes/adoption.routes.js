/**
 * 领养模块路由（Member 2）
 */
const express = require('express');
const router = express.Router();
const {
  recordSwipe,
  getLikedCats,
  setPreferences,
  submitApplication,
  getMyApplications
} = require('../controllers/adoption.controller');
const { protect } = require('../middleware/auth');

// 以下接口均需要登录
router.post('/swipe', protect, recordSwipe);
router.get('/liked', protect, getLikedCats);
router.post('/preferences', protect, setPreferences);
router.post('/applications', protect, submitApplication);
router.get('/applications/me', protect, getMyApplications);

module.exports = router;
