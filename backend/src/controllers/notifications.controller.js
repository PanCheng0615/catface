const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function formatDisplayName(user) {
  if (!user) return 'User';
  return user.display_name || user.username || 'User';
}

function makeNotification(item, overrides) {
  return {
    unread_count: 1,
    is_outgoing: false,
    actor_id: '',
    actor_username: '',
    target_user_id: '',
    target_username: '',
    post_id: '',
    post_preview: '',
    comment_text: '',
    ...item,
    ...overrides
  };
}

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
  return new Set();
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
      const likesReceived = await prisma.postLike.findMany({
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
        likesReceived.map((x) =>
          makeNotification(
            {
              id: 'like_received_' + x.id,
              type: 'likes',
              title: formatDisplayName(x.user),
              detail: 'liked your post: ' + (x.post.content || '').slice(0, 80),
              category: 'Likes',
              time: formatTime(x.created_at),
              created_at: x.created_at.toISOString(),
              avatar_url: x.user.avatar_url || '',
              snippet: 'liked your post'
            },
            {
              actor_id: x.user_id,
              actor_username: x.user.username || '',
              post_id: x.post.id,
              post_preview: (x.post.content || '').slice(0, 140)
            }
          )
        )
      );

      const likesGiven = await prisma.postLike.findMany({
        where: {
          user_id: userId,
          post: { user_id: { not: userId } }
        },
        orderBy: { created_at: 'desc' },
        include: {
          post: {
            select: {
              id: true,
              content: true,
              user_id: true,
              user: { select: { username: true, display_name: true, avatar_url: true } }
            }
          }
        },
        take: 50
      });
      list = list.concat(
        likesGiven.map((x) =>
          makeNotification(
            {
              id: 'like_given_' + x.id,
              type: 'likes',
              title: 'You',
              detail: 'liked ' + formatDisplayName(x.post.user) + '\'s post: ' + (x.post.content || '').slice(0, 80),
              category: 'Likes',
              time: formatTime(x.created_at),
              created_at: x.created_at.toISOString(),
              avatar_url: '',
              snippet: 'liked a post'
            },
            {
              is_outgoing: true,
              target_user_id: x.post.user_id,
              target_username: x.post.user.username || '',
              post_id: x.post.id,
              post_preview: (x.post.content || '').slice(0, 140)
            }
          )
        )
      );
    }

    if (type === 'all' || type === 'comments') {
      const commentsReceived = await prisma.comment.findMany({
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
        commentsReceived.map((x) =>
          makeNotification(
            {
              id: 'comment_received_' + x.id,
              type: 'comments',
              title: formatDisplayName(x.user),
              detail: 'commented: ' + (x.content || '').slice(0, 120),
              category: 'Comments',
              time: formatTime(x.created_at),
              created_at: x.created_at.toISOString(),
              avatar_url: x.user.avatar_url || '',
              snippet: 'commented on your post'
            },
            {
              actor_id: x.user_id,
              actor_username: x.user.username || '',
              post_id: x.post.id,
              comment_text: x.content || '',
              post_preview: (x.post.content || '').slice(0, 140)
            }
          )
        )
      );

      const commentsGiven = await prisma.comment.findMany({
        where: {
          user_id: userId,
          post: { user_id: { not: userId } }
        },
        orderBy: { created_at: 'desc' },
        include: {
          post: {
            select: {
              id: true,
              content: true,
              user_id: true,
              user: { select: { username: true, display_name: true, avatar_url: true } }
            }
          }
        },
        take: 50
      });
      list = list.concat(
        commentsGiven.map((x) =>
          makeNotification(
            {
              id: 'comment_given_' + x.id,
              type: 'comments',
              title: 'You',
              detail: 'commented on ' + formatDisplayName(x.post.user) + '\'s post',
              category: 'Comments',
              time: formatTime(x.created_at),
              created_at: x.created_at.toISOString(),
              avatar_url: '',
              snippet: 'commented on a post'
            },
            {
              is_outgoing: true,
              target_user_id: x.post.user_id,
              target_username: x.post.user.username || '',
              post_id: x.post.id,
              comment_text: x.content || '',
              post_preview: (x.post.content || '').slice(0, 140)
            }
          )
        )
      );
    }

    if (type === 'all' || type === 'follows') {
      const followsReceived = await prisma.userFollow.findMany({
        where: { following_id: userId },
        orderBy: { created_at: 'desc' },
        include: {
          follower: { select: { username: true, display_name: true, avatar_url: true } }
        },
        take: 50
      });
      list = list.concat(
        followsReceived.map((x) =>
          makeNotification(
            {
              id: 'follow_received_' + x.id,
              type: 'follows',
              title: formatDisplayName(x.follower),
              detail: 'started following you',
              category: 'Follows',
              time: formatTime(x.created_at),
              created_at: x.created_at.toISOString(),
              avatar_url: x.follower.avatar_url || '',
              snippet: 'started following you'
            },
            {
              actor_id: x.follower_id,
              actor_username: x.follower.username || ''
            }
          )
        )
      );

      const followsGiven = await prisma.userFollow.findMany({
        where: { follower_id: userId },
        orderBy: { created_at: 'desc' },
        include: {
          following: { select: { username: true, display_name: true, avatar_url: true } }
        },
        take: 50
      });
      list = list.concat(
        followsGiven.map((x) =>
          makeNotification(
            {
              id: 'follow_given_' + x.id,
              type: 'follows',
              title: 'You',
              detail: 'followed ' + formatDisplayName(x.following),
              category: 'Follows',
              time: formatTime(x.created_at),
              created_at: x.created_at.toISOString(),
              avatar_url: '',
              snippet: 'followed a user'
            },
            {
              is_outgoing: true,
              target_user_id: x.following_id,
              target_username: x.following.username || ''
            }
          )
        )
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
    return res.json({
      success: true,
      data: { count: 0 },
      message: '当前版本未持久化已读状态'
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
