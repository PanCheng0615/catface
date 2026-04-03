const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function formatRelativeTime(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function mapPostToFeed(post, currentUserId, followingSet) {
  const author = post.user;
  const authorName = author.display_name || author.username || 'User';
  const createdAt = new Date(post.created_at);
  const isSelf = !!(currentUserId && author.id === currentUserId);
  const followed =
    !currentUserId || isSelf
      ? false
      : followingSet
        ? followingSet.has(author.id)
        : false;
  return {
    id: post.id,
    author: authorName,
    authorId: author.id,
    authorInitial: authorName.charAt(0).toUpperCase(),
    image: post.image_url || '',
    text: post.content,
    likes: post.likes.length,
    liked: currentUserId ? post.likes.some((x) => x.user_id === currentUserId) : false,
    followed,
    comments: post.comments.map((c) => ({
      id: c.id,
      author: c.user.display_name || c.user.username || 'User',
      text: c.content
    })),
    created_at: createdAt.toISOString(),
    time: formatRelativeTime(createdAt)
  };
}

async function getPosts(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);
    const feed = String(req.query.feed || 'recommended').toLowerCase();
    const viewerId = req.user && req.user.id;

    let where = {};
    if (feed === 'followed') {
      if (!viewerId) {
        return res.json({ success: true, data: [], message: '操作成功' });
      }
      const followingRows = await prisma.userFollow.findMany({
        where: { follower_id: viewerId },
        select: { following_id: true }
      });
      const followingIds = followingRows.map((f) => f.following_id);
      if (!followingIds.length) {
        return res.json({ success: true, data: [], message: '操作成功' });
      }
      where = { user_id: { in: followingIds } };
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, username: true, display_name: true } },
        likes: { select: { user_id: true } },
        comments: { include: { user: { select: { username: true, display_name: true } } } }
      }
    });

    let followingSet = null;
    if (viewerId) {
      const authorIds = [...new Set(posts.map((p) => p.user.id).filter((id) => id !== viewerId))];
      followingSet = new Set();
      if (authorIds.length) {
        const rows = await prisma.userFollow.findMany({
          where: { follower_id: viewerId, following_id: { in: authorIds } },
          select: { following_id: true }
        });
        rows.forEach((r) => followingSet.add(r.following_id));
      }
    }

    const strictFollowedPosts =
      feed === 'followed' && viewerId
        ? posts.filter((p) => followingSet && followingSet.has(p.user.id))
        : posts;

    const data = strictFollowedPosts.map((p) => mapPostToFeed(p, viewerId, followingSet));
    return res.json({ success: true, data, message: '操作成功' });
  } catch (error) {
    console.error('getPosts error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

async function createPost(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: '请先登录' });
    }
    const content = String(req.body.content || '').trim();
    if (!content) {
      return res.status(422).json({ success: false, error: 'ValidationError', message: '内容不能为空' });
    }
    const imageUrl = req.body.image_url ? String(req.body.image_url) : null;

    const post = await prisma.post.create({
      data: {
        user_id: userId,
        content: content.slice(0, 500),
        image_url: imageUrl
      },
      include: {
        user: { select: { id: true, username: true, display_name: true } },
        likes: { select: { user_id: true } },
        comments: { include: { user: { select: { username: true, display_name: true } } } }
      }
    });

    return res.status(201).json({
      success: true,
      data: mapPostToFeed(post, userId, new Set()),
      message: '发布成功'
    });
  } catch (error) {
    console.error('createPost error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

async function toggleLike(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: '请先登录' });
    }
    const postId = req.params.id;

    const existing = await prisma.postLike.findUnique({
      where: { user_id_post_id: { user_id: userId, post_id: postId } }
    });

    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.postLike.create({ data: { user_id: userId, post_id: postId } });
    }

    const likes = await prisma.postLike.count({ where: { post_id: postId } });
    const liked = !existing;
    return res.json({
      success: true,
      data: { liked, likes },
      message: liked ? '点赞成功' : '已取消点赞'
    });
  } catch (error) {
    console.error('toggleLike error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

async function getComments(req, res) {
  try {
    const postId = req.params.id;
    const comments = await prisma.comment.findMany({
      where: { post_id: postId },
      orderBy: { created_at: 'asc' },
      include: { user: { select: { username: true, display_name: true } } }
    });
    return res.json({
      success: true,
      data: comments.map((c) => ({
        id: c.id,
        author: c.user.display_name || c.user.username || 'User',
        text: c.content
      })),
      message: '操作成功'
    });
  } catch (error) {
    console.error('getComments error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

async function addComment(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: '请先登录' });
    }
    const postId = req.params.id;
    const content = String(req.body.content || '').trim();
    if (!content) {
      return res.status(422).json({ success: false, error: 'ValidationError', message: '评论内容不能为空' });
    }
    const comment = await prisma.comment.create({
      data: { user_id: userId, post_id: postId, content: content.slice(0, 500) },
      include: { user: { select: { username: true, display_name: true } } }
    });
    return res.status(201).json({
      success: true,
      data: {
        id: comment.id,
        author: comment.user.display_name || comment.user.username || 'User',
        text: comment.content
      },
      message: '评论成功'
    });
  } catch (error) {
    console.error('addComment error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

async function uploadPlaceholder(req, res) {
  try {
    const incoming = req.body && typeof req.body.imageDataUrl === 'string' ? req.body.imageDataUrl.trim() : '';
    if (!incoming) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '图片不能为空'
      });
    }
    const dataUrlPattern = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i;
    if (!dataUrlPattern.test(incoming)) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '仅支持 png/jpg/jpeg/webp/gif 的 base64 图片'
      });
    }
    const base64Part = incoming.split(',')[1] || '';
    const approxSizeBytes = Math.ceil((base64Part.length * 3) / 4);
    if (approxSizeBytes > 3 * 1024 * 1024) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '图片过大，请上传不超过 3MB 的图片'
      });
    }
    return res.json({
      success: true,
      data: { url: incoming },
      message: '上传成功（占位）'
    });
  } catch (error) {
    console.error('uploadPlaceholder error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

module.exports = {
  getPosts,
  createPost,
  toggleLike,
  getComments,
  addComment,
  uploadPlaceholder
};
