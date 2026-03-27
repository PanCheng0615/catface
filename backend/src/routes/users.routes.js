const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const {
  getMe,
  updateMe,
  getMyProfile,
  updateMyProfile,
  toggleFollow,
  getFollowStatus,
  getUserProfile
} = require('../controllers/users.controller');
const { protect } = require('../middleware/auth');

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    } catch (error) {
      req.user = null;
    }
  }
  next();
}

// 当前登录用户信息
router.get('/me', protect, getMe);

// 更新当前用户资料
router.put('/me', protect, updateMe);
router.get('/me/profile', protect, getMyProfile);
router.put('/me/profile', protect, updateMyProfile);

router.get('/:id/profile', optionalAuth, getUserProfile);
router.post('/:id/follow', protect, toggleFollow);
router.get('/:id/follow-status', protect, getFollowStatus);

module.exports = router;