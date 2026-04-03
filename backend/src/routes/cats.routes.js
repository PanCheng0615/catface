const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getCats, getCatById, createCat, updateCat } = require('../controllers/cats.controller');

router.get('/', protect, getCats);
router.get('/:id', protect, getCatById);
router.post('/', protect, authorize('rescue_staff', 'admin'), createCat);
router.put('/:id', protect, updateCat);

module.exports = router;
