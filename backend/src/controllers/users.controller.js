const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function toTrimmedString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function calcAgeMonthsFromBirthday(birthdayRaw) {
  if (!birthdayRaw) return null;
  const birthday = new Date(birthdayRaw);
  if (Number.isNaN(birthday.getTime())) return null;
  const now = new Date();
  let months = (now.getFullYear() - birthday.getFullYear()) * 12;
  months += now.getMonth() - birthday.getMonth();
  if (now.getDate() < birthday.getDate()) months -= 1;
  if (months < 0) months = 0;
  return months;
}

// GET /api/users/me
async function getMe(req, res) {
  try {
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

// GET /api/users/me/profile
async function getMyProfile(req, res) {
  try {
    const userId = req.user.id;
    const [user, pref, cat] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, username: true, display_name: true, bio: true, role: true }
      }),
      prisma.adopterPreference.findUnique({ where: { user_id: userId } }),
      prisma.cat.findFirst({
        where: { owner_id: userId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          breed: true,
          gender: true,
          age_months: true,
          photo_url: true,
          description: true
        }
      })
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '用户不存在'
      });
    }

    return res.json({
      success: true,
      data: {
        user,
        has_cat: !!cat,
        cat: cat || null,
        preferences: pref
          ? {
              preferred_gender: pref.preferred_gender || '',
              preferred_age: pref.preferred_age || '',
              preferred_breed: pref.preferred_breed || ''
            }
          : {
              preferred_gender: '',
              preferred_age: '',
              preferred_breed: ''
            }
      },
      message: '操作成功'
    });
  } catch (error) {
    console.error('getMyProfile error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// PUT /api/users/me/profile
async function updateMyProfile(req, res) {
  try {
    const userId = req.user.id;
    const displayName = toTrimmedString(req.body.display_name);
    const hasCat = !!req.body.has_cat;
    const preferences = req.body.preferences && typeof req.body.preferences === 'object' ? req.body.preferences : null;
    const catInput = req.body.cat && typeof req.body.cat === 'object' ? req.body.cat : null;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          display_name: displayName || undefined
        }
      });

      if (preferences) {
        await tx.adopterPreference.upsert({
          where: { user_id: userId },
          create: {
            user_id: userId,
            preferred_gender: toTrimmedString(preferences.preferred_gender) || null,
            preferred_age: toTrimmedString(preferences.preferred_age) || null,
            preferred_breed: toTrimmedString(preferences.preferred_breed) || null
          },
          update: {
            preferred_gender: toTrimmedString(preferences.preferred_gender) || null,
            preferred_age: toTrimmedString(preferences.preferred_age) || null,
            preferred_breed: toTrimmedString(preferences.preferred_breed) || null
          }
        });
      }

      if (!hasCat) {
        await tx.cat.deleteMany({ where: { owner_id: userId } });
        return;
      }

      const existingCat = await tx.cat.findFirst({
        where: { owner_id: userId },
        orderBy: { created_at: 'desc' },
        select: { id: true, age_months: true }
      });

      const fallbackName =
        toTrimmedString(catInput && catInput.name) ||
        displayName ||
        'My Cat';
      const birthdayInput = toTrimmedString(catInput && catInput.birthday);
      const catData = {
        name: fallbackName,
        breed: toTrimmedString(catInput && catInput.breed) || null,
        gender: toTrimmedString(catInput && catInput.gender) || null,
        age_months: birthdayInput
          ? calcAgeMonthsFromBirthday(birthdayInput)
          : (existingCat ? existingCat.age_months : null),
        photo_url: toTrimmedString(catInput && catInput.photo_url) || null,
        description: toTrimmedString(catInput && catInput.description) || null
      };

      if (existingCat) {
        await tx.cat.update({
          where: { id: existingCat.id },
          data: catData
        });
      } else {
        await tx.cat.create({
          data: {
            owner_id: userId,
            ...catData
          }
        });
      }
    });

    const [user, pref, cat] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, username: true, display_name: true, bio: true, role: true }
      }),
      prisma.adopterPreference.findUnique({ where: { user_id: userId } }),
      prisma.cat.findFirst({
        where: { owner_id: userId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          breed: true,
          gender: true,
          age_months: true,
          photo_url: true,
          description: true
        }
      })
    ]);

    return res.json({
      success: true,
      data: {
        user,
        has_cat: !!cat,
        cat: cat || null,
        preferences: pref
          ? {
              preferred_gender: pref.preferred_gender || '',
              preferred_age: pref.preferred_age || '',
              preferred_breed: pref.preferred_breed || ''
            }
          : {
              preferred_gender: '',
              preferred_age: '',
              preferred_breed: ''
            }
      },
      message: '更新成功'
    });
  } catch (error) {
    console.error('updateMyProfile error:', error);
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
    const targetUserId = String(req.params.id || '').trim();
    const currentUserId = req.user.id;

    if (!targetUserId) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '目标用户ID不能为空'
      });
    }

    if (targetUserId === currentUserId) {
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
          follower_id: currentUserId,
          following_id: targetUserId
        }
      }
    });

    let following = false;
    if (existing) {
      await prisma.userFollow.delete({
        where: {
          follower_id_following_id: {
            follower_id: currentUserId,
            following_id: targetUserId
          }
        }
      });
      following = false;
    } else {
      try {
        await prisma.userFollow.create({
          data: {
            follower_id: currentUserId,
            following_id: targetUserId
          }
        });
        following = true;
      } catch (createErr) {
        // Handle fast repeated clicks that can race on unique constraint.
        if (createErr && createErr.code === 'P2002') {
          following = true;
        } else {
          throw createErr;
        }
      }
    }

    const followersCount = await prisma.userFollow.count({
      where: { following_id: targetUserId }
    });
    const followingCount = await prisma.userFollow.count({
      where: { follower_id: targetUserId }
    });

    return res.json({
      success: true,
      data: {
        targetUserId,
        following,
        followersCount,
        followingCount
      },
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

// GET /api/users/:id/follow-status
async function getFollowStatus(req, res) {
  try {
    const targetUserId = String(req.params.id || '').trim();
    const currentUserId = req.user.id;

    if (!targetUserId) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '目标用户ID不能为空'
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
          follower_id: currentUserId,
          following_id: targetUserId
        }
      }
    });
    const followersCount = await prisma.userFollow.count({
      where: { following_id: targetUserId }
    });
    const followingCount = await prisma.userFollow.count({
      where: { follower_id: targetUserId }
    });

    return res.json({
      success: true,
      data: {
        targetUserId,
        following: !!existing,
        followersCount,
        followingCount
      },
      message: '获取关注状态成功'
    });
  } catch (error) {
    console.error('getFollowStatus error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// GET /api/users/:id/profile
async function getUserProfile(req, res) {
  try {
    const targetUserId = req.params.id;
    const viewerId = req.user && req.user.id ? req.user.id : null;

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        display_name: true,
        bio: true,
        avatar_url: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '目标用户不存在'
      });
    }

    const [followersCount, followingCount, cats, posts] = await Promise.all([
      prisma.userFollow.count({ where: { following_id: targetUserId } }),
      prisma.userFollow.count({ where: { follower_id: targetUserId } }),
      prisma.cat.findMany({
        where: { owner_id: targetUserId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          breed: true,
          age_months: true,
          gender: true,
          photo_url: true,
          description: true
        }
      }),
      prisma.post.findMany({
        where: { user_id: targetUserId },
        orderBy: { created_at: 'desc' },
        include: {
          likes: { select: { id: true } },
          comments: { select: { id: true } }
        },
        take: 50
      })
    ]);

    let following = false;
    if (viewerId && viewerId !== targetUserId) {
      const existing = await prisma.userFollow.findFirst({
        where: { follower_id: viewerId, following_id: targetUserId },
        select: { id: true }
      });
      following = !!existing;
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        bio: user.bio,
        avatar_url: user.avatar_url,
        followers_count: followersCount,
        following_count: followingCount,
        following,
        has_cat: cats.length > 0,
        cats,
        posts: posts.map((p) => ({
          id: p.id,
          content: p.content,
          image_url: p.image_url,
          created_at: p.created_at,
          likes_count: p.likes.length,
          comments_count: p.comments.length
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

module.exports = {
  getMe,
  updateMe,
  getMyProfile,
  updateMyProfile,
  toggleFollow,
  getFollowStatus,
  getUserProfile
};