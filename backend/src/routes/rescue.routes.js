const express = require('express');
<<<<<<< Updated upstream
const router = express.Router();

=======
>>>>>>> Stashed changes
const {
  getCats,
  createCat,
  updateCat,
  generateCatFaceId,
<<<<<<< Updated upstream
=======
  identifyCatFace,
  registerCatFaceEmbedding,
>>>>>>> Stashed changes
  getApplications,
  reviewApplication,
  getAnalytics
} = require('../controllers/rescue.controller');
const { protect, authorize } = require('../middleware/auth');

<<<<<<< Updated upstream
=======
const router = express.Router();

>>>>>>> Stashed changes
router.get('/cats', protect, authorize('rescue_staff', 'admin'), getCats);
router.post('/cats', protect, authorize('rescue_staff', 'admin'), createCat);
router.put('/cats/:id', protect, authorize('rescue_staff', 'admin'), updateCat);
router.post('/cat-face-id', protect, authorize('rescue_staff', 'admin'), generateCatFaceId);
<<<<<<< Updated upstream
=======
router.post('/cat-face/identify', protect, authorize('rescue_staff', 'admin'), identifyCatFace);
router.post('/cat-face/register', protect, authorize('rescue_staff', 'admin'), registerCatFaceEmbedding);
>>>>>>> Stashed changes
router.get('/applications', protect, authorize('rescue_staff', 'admin'), getApplications);
router.put('/applications/:id/review', protect, authorize('rescue_staff', 'admin'), reviewApplication);
router.get('/analytics', protect, authorize('rescue_staff', 'admin'), getAnalytics);

module.exports = router;
