// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');

// 注册
router.post('/register', register);

// 登录
router.post('/login', login);

module.exports = router;