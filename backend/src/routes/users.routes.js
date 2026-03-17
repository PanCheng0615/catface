// backend/src/routes/users.routes.js
const express = require('express');
const router = express.Router();
const { getMe, updateMe, toggleFollow } = require('../controllers/users.controller');
const { protect } = require('../middleware/auth');

// 当前登录用户信息
router.get('/me', protect, getMe);

// 更新当前用户资料
router.put('/me', protect, updateMe);

// 关注 / 取消关注（简单占位）
router.post('/:id/follow', protect, toggleFollow);

module.exports = router;