// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  identifyCatFace,
  loginWithCatFace,
  orgLogin
} = require('../controllers/auth.controller');

// 注册
router.post('/register', register);

// 登录
router.post('/login', login);

// 猫脸识别登录
router.post('/cat-face/identify', identifyCatFace);
router.post('/cat-face/login', loginWithCatFace);

// 机构登录
router.post('/org/login', orgLogin);

module.exports = router;