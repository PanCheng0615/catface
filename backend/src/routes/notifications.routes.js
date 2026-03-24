const express = require("express");
const router = express.Router();
const { protect } = require('../middleware/auth');
const notificationsController = require("../controllers/notifications.controller.js");

router.get("/", protect, notificationsController.getNotifications);
router.post("/read", protect, notificationsController.markNotificationsRead);

module.exports = router;
