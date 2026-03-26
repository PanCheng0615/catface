// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { register, login, identifySignupCatFace } = require('../controllers/auth.controller');

// 注册
router.post('/register', register);

// 登录
router.post('/login', login);

router.post('/cat-face/identify', identifySignupCatFace);

module.exports = router;