const express = require('express');

const {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization
} = require('../controllers/organization.controller');

const router = express.Router();

router.get('/',     getOrganizations);
router.get('/:id',  getOrganizationById);
router.post('/',    createOrganization);
router.put('/:id',  updateOrganization);

module.exports = router;
