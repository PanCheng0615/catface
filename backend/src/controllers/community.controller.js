const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});
const prisma = new PrismaClient({ adapter });

function formatRelativeTime(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  if (diff < 604800) return Math.floor(diff / 86400) + "d ago";
  return date.toLocaleDateString();
}

function mapPostToFeed(post, currentUserId) {
  const author = post.user;
  const authorName = author.display_name || author.username || "User";
  const initial = authorName.charAt(0).toUpperCase();
  return {
    id: post.id,
    author: authorName,
    authorInitial: initial,
    authorId: author.id,
    followed: false,
    image: post.image_url || "",
    text: post.content,
    likes: post.likes?.length ?? 0,
    liked: currentUserId
      ? (post.likes || []).some((l) => l.user_id === currentUserId)
      : false,
    comments: (post.comments || []).map((c) => ({
      id: c.id,
      author: c.user?.display_name || c.user?.username || "User",
      text: c.content
    })),
    time: formatRelativeTime(new Date(post.created_at))
  };
}

async function getPosts(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const posts = await prisma.post.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        user: {
          select: { id: true, username: true, display_name: true, avatar_url: true }
        },
        likes: { select: { user_id: true } },
        comments: {
          include: {
            user: { select: { username: true, display_name: true } }
          }
        }
      }
    });
    const currentUserId = req.user?.id || null;
    const data = posts.map((p) => mapPostToFeed(p, currentUserId));
    return res.status(200).json({
      success: true,
      data,
      message: "操作成功"
    });
  } catch (error) {
    console.error("getPosts error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "服务器错误"
    });
  }
}

async function createPost(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "请先登录"
      });
    }
    const { content, imageUrl } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(422).json({
        success: false,
        error: "Validation failed",
        message: "内容不能为空"
      });
    }
    const post = await prisma.post.create({
      data: {
        user_id: userId,
        content: content.trim().slice(0, 500),
        image_url: imageUrl || null
      },
      include: {
        user: {
          select: { id: true, username: true, display_name: true, avatar_url: true }
        },
        likes: { select: { user_id: true } },
        comments: true
      }
    });
    const data = mapPostToFeed(post, userId);
    return res.status(201).json({
      success: true,
      data,
      message: "发布成功"
    });
  } catch (error) {
    console.error("createPost error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "服务器错误"
    });
  }
}

async function toggleLike(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "请先登录"
      });
    }
    const postId = req.params.id;
    const existing = await prisma.postLike.findUnique({
      where: {
        user_id_post_id: { user_id: userId, post_id: postId }
      }
    });
    if (existing) {
      await prisma.postLike.delete({
        where: { id: existing.id }
      });
      return res.status(200).json({
        success: true,
        data: { liked: false },
        message: "已取消点赞"
      });
    }
    await prisma.postLike.create({
      data: { user_id: userId, post_id: postId }
    });
    return res.status(200).json({
      success: true,
      data: { liked: true },
      message: "点赞成功"
    });
  } catch (error) {
    console.error("toggleLike error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "服务器错误"
    });
  }
}

async function getComments(req, res) {
  try {
    const postId = req.params.id;
    const comments = await prisma.comment.findMany({
      where: { post_id: postId },
      orderBy: { created_at: "asc" },
      include: {
        user: { select: { username: true, display_name: true } }
      }
    });
    const data = comments.map((c) => ({
      id: c.id,
      author: c.user?.display_name || c.user?.username || "User",
      text: c.content
    }));
    return res.status(200).json({
      success: true,
      data,
      message: "操作成功"
    });
  } catch (error) {
    console.error("getComments error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "服务器错误"
    });
  }
}

async function addComment(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "请先登录"
      });
    }
    const postId = req.params.id;
    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(422).json({
        success: false,
        error: "Validation failed",
        message: "评论内容不能为空"
      });
    }
    const comment = await prisma.comment.create({
      data: {
        user_id: userId,
        post_id: postId,
        content: content.trim().slice(0, 500)
      },
      include: {
        user: { select: { username: true, display_name: true } }
      }
    });
    const data = {
      id: comment.id,
      author: comment.user?.display_name || comment.user?.username || "User",
      text: comment.content
    };
    return res.status(201).json({
      success: true,
      data,
      message: "评论成功"
    });
  } catch (error) {
    console.error("addComment error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "服务器错误"
    });
  }
}

module.exports = {
  getPosts,
  createPost,
  toggleLike,
  getComments,
  addComment
};
