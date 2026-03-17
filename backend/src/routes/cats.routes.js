/**
 * 猫咪档案路由（Member 2）
 */
const express = require('express');
const router = express.Router();
const { getCats, getCatById, createCat, updateCat } = require('../controllers/cats.controller');
const { protect, authorize } = require('../middleware/auth');

// 获取猫咪列表（可不需要登录，方便领养页展示）
router.get('/', getCats);
// 获取单只猫详情
router.get('/:id', getCatById);

// 以下需要登录
router.post('/', protect, authorize('rescue_staff', 'admin'), createCat);
router.put('/:id', protect, updateCat);

module.exports = router;
