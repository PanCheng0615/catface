const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/event.controller');

const router = express.Router();

router.get('/',              getEvents);
router.get('/:id',           getEventById);
router.post('/',             protect, authorize('rescue_staff'), createEvent);
router.put('/:id',          protect, authorize('rescue_staff'), updateEvent);
router.delete('/:id',       protect, authorize('rescue_staff'), deleteEvent);

module.exports = router;
