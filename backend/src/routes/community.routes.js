const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const communityController = require("../controllers/community.controller.js");
const { protect } = require("../middleware/auth");

// Optional auth: pass-through middleware that sets req.user if token present (Member 1 provides real auth later)
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      req.user = null;
    }
  }
  next();
}

router.get("/posts", optionalAuth, communityController.getPosts);
router.post("/posts", protect, communityController.createPost);
router.post("/posts/:id/like", protect, communityController.toggleLike);
router.get("/posts/:id/comments", optionalAuth, communityController.getComments);
router.post("/posts/:id/comments", protect, communityController.addComment);
router.post("/upload", protect, communityController.uploadPlaceholder);

module.exports = router;
