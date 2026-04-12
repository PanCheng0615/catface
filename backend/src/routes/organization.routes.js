const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization
} = require('../controllers/organization.controller');

const router = express.Router();

router.get('/',     getOrganizations);
router.get('/:id',  getOrganizationById);
router.post('/',    protect, authorize('rescue_staff'), createOrganization);
router.put('/:id',  protect, authorize('rescue_staff', 'admin'), updateOrganization);

module.exports = router;
