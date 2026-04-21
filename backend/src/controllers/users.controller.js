// backend/src/controllers/users.controller.js
const { PrismaClient } = require('@prisma/client');
const { ensureDemoCommunityData } = require('./community.controller');

const prisma = new PrismaClient();

function envNumber(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const SUGGEST_ACTIVITY_POST_WEIGHT = envNumber('FOLLOW_SUGGEST_ACTIVITY_POST_WEIGHT', 2);
const SUGGEST_ACTIVITY_ENGAGEMENT_WEIGHT = envNumber('FOLLOW_SUGGEST_ACTIVITY_ENGAGEMENT_WEIGHT', 0.6);
const SUGGEST_POPULARITY_FOLLOWER_WEIGHT = envNumber('FOLLOW_SUGGEST_POPULARITY_FOLLOWER_WEIGHT', 8);
const SUGGEST_POPULARITY_POST_WEIGHT = envNumber('FOLLOW_SUGGEST_POPULARITY_POST_WEIGHT', 4);
const SUGGEST_FRESHNESS_DAYS_CAP = envNumber('FOLLOW_SUGGEST_FRESHNESS_DAYS_CAP', 30);
const SUGGEST_FRESHNESS_WEIGHT = envNumber('FOLLOW_SUGGEST_FRESHNESS_WEIGHT', 0.5);
const SUGGEST_SOCIAL_MUTUAL_WEIGHT = envNumber('FOLLOW_SUGGEST_SOCIAL_MUTUAL_WEIGHT', 5);
const SUGGEST_PROFILE_BIO_BONUS = envNumber('FOLLOW_SUGGEST_PROFILE_BIO_BONUS', 0.6);

function canStartOrgChat(role) {
  return role === 'rescue_staff' || role === 'clinic_staff' || role === 'admin';
}

function mapUserSummary(user) {
  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name || '',
    avatar_url: user.avatar_url || '',
    bio: user.bio || ''
  };
}

function buildFollowRecommendationReason(params) {
  const mutualCount = Number(params && params.mutualCount) || 0;
  const recentPostsCount = Number(params && params.recentPostsCount) || 0;
  const recentEngagement = Number(params && params.recentEngagement) || 0;
  const followerCount = Number(params && params.followerCount) || 0;
  const postCount = Number(params && params.postCount) || 0;
  const freshnessDays = Number(params && params.freshnessDays);

  if (mutualCount > 0) {
    return mutualCount + ' mutual connections';
  }
  if (recentPostsCount >= 3) {
    return 'Active in the last 30 days';
  }
  if (recentEngagement >= 20) {
    return 'High recent engagement';
  }
  if (Number.isFinite(freshnessDays) && freshnessDays <= 7) {
    return 'Fresh recent post';
  }
  if (followerCount >= 5) {
    return 'Popular in the community';
  }
  if (postCount > 0) {
    return 'Community creator worth exploring';
  }
  return 'New profile to discover';
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
        avatar_url: true,
        has_cat: true,
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
    const { display_name, has_cat, avatar_url } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        display_name: display_name ?? undefined,
        avatar_url: avatar_url === undefined ? undefined : (avatar_url || null),
        has_cat: typeof has_cat === 'boolean' ? has_cat : undefined
      },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        avatar_url: true,
        has_cat: true,
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

// GET /api/users/follow-suggestions
async function getFollowSuggestions(req, res) {
  try {
    await ensureDemoCommunityData();

    const viewerId = req.user && req.user.id ? req.user.id : null;
    const rawLimit = parseInt(String(req.query.limit || '6'), 10);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 20)) : 6;

    let viewerFollowingIds = [];
    let followingSet = new Set();
    if (viewerId) {
      const followingRows = await prisma.userFollow.findMany({
        where: { follower_id: viewerId },
        select: { following_id: true }
      });
      viewerFollowingIds = followingRows.map((row) => row.following_id);
      followingSet = new Set(viewerFollowingIds);
    }

    const candidates = await prisma.user.findMany({
      where: {
        role: 'user',
        ...(viewerId ? { id: { not: viewerId } } : {})
      },
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
            followers: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 200
    });

    const filteredCandidates = candidates.filter((user) => !followingSet.has(user.id));
    const candidateIds = filteredCandidates.map((user) => user.id);

    const recentSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentPosts = candidateIds.length
      ? await prisma.post.findMany({
          where: {
            user_id: { in: candidateIds },
            created_at: { gte: recentSince }
          },
          select: {
            user_id: true,
            created_at: true,
            _count: {
              select: {
                likes: true,
                comments: true
              }
            }
          }
        })
      : [];

    const recentStatsMap = new Map();
    recentPosts.forEach((post) => {
      const key = post.user_id;
      const current = recentStatsMap.get(key) || {
        recent_posts: 0,
        recent_likes: 0,
        recent_comments: 0,
        last_post_at: null
      };
      current.recent_posts += 1;
      current.recent_likes += Number(post._count && post._count.likes) || 0;
      current.recent_comments += Number(post._count && post._count.comments) || 0;
      if (!current.last_post_at || new Date(post.created_at).getTime() > new Date(current.last_post_at).getTime()) {
        current.last_post_at = post.created_at;
      }
      recentStatsMap.set(key, current);
    });

    const mutualRows = viewerFollowingIds.length && candidateIds.length
      ? await prisma.userFollow.findMany({
          where: {
            follower_id: { in: viewerFollowingIds },
            following_id: { in: candidateIds }
          },
          select: { following_id: true }
        })
      : [];

    const mutualMap = new Map();
    mutualRows.forEach((row) => {
      const key = row.following_id;
      mutualMap.set(key, (mutualMap.get(key) || 0) + 1);
    });

    const suggestions = candidates
      .filter((user) => !followingSet.has(user.id))
      .map((user) => {
        const postCount = Number(user._count && user._count.posts) || 0;
        const followerCount = Number(user._count && user._count.followers) || 0;
        const recent = recentStatsMap.get(user.id) || {
          recent_posts: 0,
          recent_likes: 0,
          recent_comments: 0,
          last_post_at: null
        };
        const mutualCount = Number(mutualMap.get(user.id)) || 0;
        const recentEngagement = recent.recent_likes + recent.recent_comments * 2;
        const activityScore =
          recent.recent_posts * SUGGEST_ACTIVITY_POST_WEIGHT +
          recentEngagement * SUGGEST_ACTIVITY_ENGAGEMENT_WEIGHT;
        const popularityScore =
          Math.log10(followerCount + 1) * SUGGEST_POPULARITY_FOLLOWER_WEIGHT +
          Math.log10(postCount + 1) * SUGGEST_POPULARITY_POST_WEIGHT;
        const freshnessDays = recent.last_post_at
          ? Math.max(0, (Date.now() - new Date(recent.last_post_at).getTime()) / (1000 * 60 * 60 * 24))
          : 60;
        const freshnessScore =
          Math.max(0, SUGGEST_FRESHNESS_DAYS_CAP - freshnessDays) * SUGGEST_FRESHNESS_WEIGHT;
        const socialScore = mutualCount * SUGGEST_SOCIAL_MUTUAL_WEIGHT;
        const profileScore = String(user.bio || '').trim() ? SUGGEST_PROFILE_BIO_BONUS : 0;
        const score = activityScore + popularityScore + freshnessScore + socialScore + profileScore;
        const recommendationReason = buildFollowRecommendationReason({
          mutualCount: mutualCount,
          recentPostsCount: recent.recent_posts,
          recentEngagement: recentEngagement,
          followerCount: followerCount,
          postCount: postCount,
          freshnessDays: freshnessDays
        });
        return {
          ...mapUserSummary(user),
          posts_count: postCount,
          followers_count: followerCount,
          mutual_count: mutualCount,
          recent_posts_count: recent.recent_posts,
          recent_engagement: recentEngagement,
          is_following: false,
          score,
          recommendation_reason: recommendationReason
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        username: item.username,
        display_name: item.display_name || item.username || 'User',
        avatar_url: item.avatar_url || '',
        bio: item.bio || '',
        posts_count: item.posts_count,
        followers_count: item.followers_count,
        mutual_count: item.mutual_count,
        recent_posts_count: item.recent_posts_count,
        recent_engagement: item.recent_engagement,
        is_following: item.is_following,
        recommendation_reason: item.recommendation_reason
      }));

    return res.json({
      success: true,
      data: suggestions,
      message: '操作成功'
    });
  } catch (error) {
    console.error('getFollowSuggestions error:', error);
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
        role: true,
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
            likes: { select: { user_id: true } },
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
        role: user.role,
        created_at: user.created_at,
        is_self: !!viewerId && viewerId === user.id,
        is_following: isFollowing,
        can_message: !!viewerId && viewerId !== user.id && canStartOrgChat(user.role),
        message_target_user_id: canStartOrgChat(user.role) ? user.id : '',
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
          liked: !!viewerId && post.likes.some((like) => like.user_id === viewerId),
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

async function findProfilePostOrNull(targetUserId, postId) {
  if (!targetUserId || !postId) return null;
  return prisma.post.findFirst({
    where: {
      id: postId,
      user_id: targetUserId
    },
    select: { id: true }
  });
}

async function toggleProfilePostLike(req, res) {
  try {
    const userId = req.user && req.user.id;
    const targetUserId = String(req.params.id || '').trim();
    const postId = String(req.params.postId || '').trim();
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '请先登录'
      });
    }
    if (!targetUserId || !postId) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '缺少作者或帖子参数'
      });
    }

    const post = await findProfilePostOrNull(targetUserId, postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '帖子不存在或不属于该作者'
      });
    }

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
    console.error('toggleProfilePostLike error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function addProfilePostComment(req, res) {
  try {
    const userId = req.user && req.user.id;
    const targetUserId = String(req.params.id || '').trim();
    const postId = String(req.params.postId || '').trim();
    const content = String(req.body.content || '').trim();
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '请先登录'
      });
    }
    if (!targetUserId || !postId) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '缺少作者或帖子参数'
      });
    }
    if (!content) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '评论内容不能为空'
      });
    }

    const post = await findProfilePostOrNull(targetUserId, postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '帖子不存在或不属于该作者'
      });
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
    console.error('addProfilePostComment error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

module.exports = {
  getMe,
  updateMe,
  toggleFollow,
  getFollowNetwork,
  getFollowSuggestions,
  getUserProfile,
  toggleProfilePostLike,
  addProfilePostComment
};