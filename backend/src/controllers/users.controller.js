// backend/src/controllers/users.controller.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function mapUserSummary(user) {
  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name || '',
    avatar_url: user.avatar_url || '',
    bio: user.bio || ''
  };
}

// GET /api/users/me
async function getMe(req, res) {
  try {
    // protect 中间件已经把 { id, role } 放在 req.user 里
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '用户不存在'
      });
    }

    return res.json({
      success: true,
      data: user,
      message: '获取当前用户信息成功'
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// PUT /api/users/me
async function updateMe(req, res) {
  try {
    const { display_name } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        display_name: display_name ?? undefined
      },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        role: true
      }
    });

    return res.json({
      success: true,
      data: updated,
      message: '更新个人资料成功'
    });
  } catch (error) {
    console.error('updateMe error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// POST /api/users/:id/follow
async function toggleFollow(req, res) {
  try {
    const targetUserId = req.params.id;

    if (targetUserId === req.user.id) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '不能关注自己'
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true }
    });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '目标用户不存在'
      });
    }

    const existing = await prisma.userFollow.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: req.user.id,
          following_id: targetUserId
        }
      }
    });

    let following = false;
    if (existing) {
      await prisma.userFollow.delete({
        where: { id: existing.id }
      });
    } else {
      await prisma.userFollow.create({
        data: {
          follower_id: req.user.id,
          following_id: targetUserId
        }
      });
      following = true;
    }

    return res.json({
      success: true,
      data: { following },
      message: following ? '关注成功' : '已取消关注'
    });
  } catch (error) {
    console.error('toggleFollow error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function getFollowNetwork(req, res) {
  try {
    const userId = req.user.id;
    const type = String(req.query.type || 'followers').toLowerCase();
    if (type !== 'followers' && type !== 'following') {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'type 参数仅支持 followers/following'
      });
    }

    if (type === 'followers') {
      const rows = await prisma.userFollow.findMany({
        where: { following_id: userId },
        orderBy: { created_at: 'desc' },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              display_name: true,
              avatar_url: true,
              bio: true
            }
          }
        }
      });

      const followerIds = rows.map((row) => row.follower.id);
      const followBackRows = followerIds.length
        ? await prisma.userFollow.findMany({
            where: {
              follower_id: userId,
              following_id: { in: followerIds }
            },
            select: { following_id: true }
          })
        : [];
      const followingSet = new Set(followBackRows.map((row) => row.following_id));

      return res.json({
        success: true,
        data: rows.map((row) => ({
          ...mapUserSummary(row.follower),
          created_at: row.created_at,
          is_following: followingSet.has(row.follower.id)
        })),
        message: '操作成功'
      });
    }

    const rows = await prisma.userFollow.findMany({
      where: { follower_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            bio: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: rows.map((row) => ({
        ...mapUserSummary(row.following),
        created_at: row.created_at,
        is_following: true
      })),
      message: '操作成功'
    });
  } catch (error) {
    console.error('getFollowNetwork error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function getUserProfile(req, res) {
  try {
    const targetUserId = String(req.params.id || '').trim();
    if (!targetUserId) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '用户 ID 不能为空'
      });
    }

    const viewerId = req.user && req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar_url: true,
        bio: true,
        created_at: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true
          }
        },
        posts: {
          orderBy: { created_at: 'desc' },
          take: 12,
          select: {
            id: true,
            content: true,
            image_url: true,
            created_at: true,
            likes: { select: { id: true } },
            comments: { select: { id: true } }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '用户不存在'
      });
    }

    let isFollowing = false;
    if (viewerId && viewerId !== targetUserId) {
      const row = await prisma.userFollow.findUnique({
        where: {
          follower_id_following_id: {
            follower_id: viewerId,
            following_id: targetUserId
          }
        }
      });
      isFollowing = !!row;
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        display_name: user.display_name || user.username || 'User',
        avatar_url: user.avatar_url || '',
        bio: user.bio || '',
        created_at: user.created_at,
        is_self: !!viewerId && viewerId === user.id,
        is_following: isFollowing,
        counts: {
          posts: user._count.posts,
          followers: user._count.followers,
          following: user._count.following
        },
        posts: user.posts.map((post) => ({
          id: post.id,
          content: post.content,
          image_url: post.image_url || '',
          created_at: post.created_at,
          likes: post.likes.length,
          comments: post.comments.length
        }))
      },
      message: '操作成功'
    });
  } catch (error) {
    console.error('getUserProfile error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

module.exports = { getMe, updateMe, toggleFollow, getFollowNetwork, getUserProfile };