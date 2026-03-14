const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notifications.controller.js");

// 占位：后续可加 auth 中间件，按当前用户返回通知
router.get("/", notificationsController.getNotifications);

module.exports = router;
