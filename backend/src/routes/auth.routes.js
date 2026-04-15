// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  identifyCatFace,
  loginWithCatFace,
  bindCatFaceOwner,
  enrollCatWithFace,
  orgLogin
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// 注册
router.post('/register', register);

// 登录
router.post('/login', login);

// 猫脸识别登录
router.post('/cat-face/identify', identifyCatFace);
router.post('/cat-face/login', loginWithCatFace);
router.post('/cat-face/bind-owner', protect, bindCatFaceOwner);
router.post('/cat-face/enroll-cat', protect, enrollCatWithFace);

// 机构登录
router.post('/org/login', orgLogin);

module.exports = router;