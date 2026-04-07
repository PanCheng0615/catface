const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function formatTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

async function loadReadSet(userId, notificationIds) {
  if (!notificationIds.length) return new Set();
  const rows = await prisma.notificationRead.findMany({
    where: {
      user_id: String(userId),
      notification_id: { in: notificationIds }
    },
    select: { notification_id: true }
  });
  return new Set(rows.map((x) => x.notification_id));
}

async function getNotifications(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '请先登录'
      });
    }

    const type = String(req.query.type || 'all').toLowerCase();
    const allowedTypes = new Set(['all', 'likes', 'comments', 'follows']);
    if (!allowedTypes.has(type)) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'type 参数仅支持 all/likes/comments/follows'
      });
    }

    let list = [];

    if (type === 'all' || type === 'likes') {
      const likes = await prisma.postLike.findMany({
        where: {
          post: { user_id: userId },
          user_id: { not: userId }
        },
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { username: true, display_name: true, avatar_url: true } },
          post: { select: { id: true, content: true } }
        },
        take: 50
      });
      list = list.concat(
        likes.map((x) => ({
          id: 'like_' + x.id,
          type: 'likes',
          title: x.user.display_name || x.user.username || 'User',
          detail: 'liked your post: ' + (x.post.content || '').slice(0, 80),
          category: 'Likes',
          time: formatTime(x.created_at),
          created_at: x.created_at.toISOString(),
          avatar_url: x.user.avatar_url || '',
          snippet: 'liked your post',
          unread_count: 1
        }))
      );
    }

    if (type === 'all' || type === 'comments') {
      const comments = await prisma.comment.findMany({
        where: {
          post: { user_id: userId },
          user_id: { not: userId }
        },
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { username: true, display_name: true, avatar_url: true } },
          post: { select: { id: true, content: true } }
        },
        take: 50
      });
      list = list.concat(
        comments.map((x) => ({
          id: 'comment_' + x.id,
          type: 'comments',
          title: x.user.display_name || x.user.username || 'User',
          detail: 'commented: ' + (x.content || '').slice(0, 120),
          category: 'Comments',
          time: formatTime(x.created_at),
          created_at: x.created_at.toISOString(),
          avatar_url: x.user.avatar_url || '',
          snippet: 'commented on your post',
          unread_count: 1
        }))
      );
    }

    if (type === 'all' || type === 'follows') {
      const follows = await prisma.userFollow.findMany({
        where: { following_id: userId },
        orderBy: { created_at: 'desc' },
        include: {
          follower: { select: { username: true, display_name: true, avatar_url: true } }
        },
        take: 50
      });
      list = list.concat(
        follows.map((x) => ({
          id: 'follow_' + x.id,
          type: 'follows',
          title: x.follower.display_name || x.follower.username || 'User',
          detail: 'started following you',
          category: 'New Follows',
          time: formatTime(x.created_at),
          created_at: x.created_at.toISOString(),
          avatar_url: x.follower.avatar_url || '',
          snippet: 'started following you',
          unread_count: 1
        }))
      );
    }

    if (type === 'all' && list.length) {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const readSet = await loadReadSet(
      userId,
      list.map((x) => x.id)
    );
    const data = list.map((item) => {
      const isRead = readSet.has(item.id);
      return {
        ...item,
        is_read: isRead,
        unread_count: isRead ? 0 : 1
      };
    });

    return res.json({
      success: true,
      data,
      message: '操作成功'
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function markNotificationsRead(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '请先登录'
      });
    }

    const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids : [];
    const normalized = [...new Set(ids.map((x) => String(x || '').trim()).filter(Boolean))];
    if (!normalized.length) {
      return res.json({
        success: true,
        data: { count: 0 },
        message: '没有需要标记的通知'
      });
    }

    await prisma.notificationRead.createMany({
      data: normalized.map((id) => ({
        user_id: String(userId),
        notification_id: id
      })),
      skipDuplicates: true
    });

    return res.json({
      success: true,
      data: { count: normalized.length },
      message: '已标记为已读'
    });
  } catch (error) {
    console.error('markNotificationsRead error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

module.exports = { getNotifications, markNotificationsRead };
