// backend/src/routes/users.routes.js
const express = require('express');
const router = express.Router();
const { getMe, updateMe, toggleFollow, getFollowNetwork, getUserProfile } = require('../controllers/users.controller');
const { protect } = require('../middleware/auth');

// 当前登录用户信息
router.get('/me', protect, getMe);

// 更新当前用户资料
router.put('/me', protect, updateMe);
router.get('/:id/profile', protect, getUserProfile);

// 关注 / 取消关注（简单占位）
router.post('/:id/follow', protect, toggleFollow);
router.get('/follows', protect, getFollowNetwork);

module.exports = router;