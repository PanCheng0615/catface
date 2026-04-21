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
  orgRegister,
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

    // 机构注册（诊所 / 救助站注册：同时创建 Organization + User）
    // type 可选 'clinic' 或 'rescue'，默认为 'clinic'
    router.post('/org/register', orgRegister);

module.exports = router;