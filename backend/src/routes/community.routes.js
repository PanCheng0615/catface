const express = require("express");
const router = express.Router();
const communityController = require("../controllers/community.controller.js");

// Optional auth: pass-through middleware that sets req.user if token present (Member 1 provides real auth later)
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    // TODO: Member 1 — verify JWT and set req.user
    req.user = null;
  }
  next();
}

router.get("/posts", optionalAuth, communityController.getPosts);
router.post("/posts", optionalAuth, communityController.createPost);
router.post("/posts/:id/like", optionalAuth, communityController.toggleLike);
router.get("/posts/:id/comments", optionalAuth, communityController.getComments);
router.post("/posts/:id/comments", optionalAuth, communityController.addComment);

module.exports = router;
