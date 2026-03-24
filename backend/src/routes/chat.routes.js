const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createConversation,
  getConversations,
  getMessages,
  sendMessage
} = require('../controllers/chat.controller');

const router = express.Router();

router.post('/conversations', protect, authorize('rescue_staff', 'clinic_staff', 'admin', 'user'), createConversation);
router.get('/conversations', protect, authorize('rescue_staff', 'clinic_staff', 'admin', 'user'), getConversations);
router.get('/conversations/:id/messages', protect, authorize('rescue_staff', 'clinic_staff', 'admin', 'user'), getMessages);
router.post('/conversations/:id/messages', protect, authorize('rescue_staff', 'clinic_staff', 'admin', 'user'), sendMessage);

module.exports = router;
