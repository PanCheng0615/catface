// backend/src/routes/users.routes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const {
  getMe,
  updateMe,
  toggleFollow,
  getFollowNetwork,
  getFollowSuggestions,
  getUserProfile,
  toggleProfilePostLike,
  addProfilePostComment
} = require('../controllers/users.controller');
const { protect } = require('../middleware/auth');

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
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
router.get('/follow-suggestions', optionalAuth, getFollowSuggestions);
router.get('/:id/profile', optionalAuth, getUserProfile);
router.post('/:id/profile/posts/:postId/like', protect, toggleProfilePostLike);
router.post('/:id/profile/posts/:postId/comments', protect, addProfilePostComment);

// 关注 / 取消关注（简单占位）
router.post('/:id/follow', protect, toggleFollow);
router.get('/follows', protect, getFollowNetwork);

module.exports = router;