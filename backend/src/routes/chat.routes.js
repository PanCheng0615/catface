const express = require('express');
const router = express.Router();

const {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  uploadConversationImages
} = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth');

router.post('/conversations', protect, createConversation);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id/messages', protect, getMessages);
router.post('/conversations/:id/messages', protect, sendMessage);
router.post('/conversations/:id/upload', protect, uploadConversationImages);

module.exports = router;
