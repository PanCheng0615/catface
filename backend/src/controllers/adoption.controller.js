const { PrismaClient } = require('@prisma/client');
const { scoreCatForUser, normalizeText, getWeights, updateWeights } = require('../utils/adoptionRecommendScore');

const prisma = new PrismaClient();

const catCardInclude = {
  tags: true,
  organization: { select: { id: true, name: true, logo_url: true } }
};

// POST /api/adoption/swipe
// 请求体字段与 AdoptionSwipe 模型一致：cat_id、liked（user_id 由服务端从 token 写入）
async function recordSwipe(req, res) {
  try {
    const { cat_id, liked } = req.body;

    if (!cat_id) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '缺少 cat_id'
      });
    }

    if (typeof liked !== 'boolean') {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'liked 必须为布尔值（与 schema 中 AdoptionSwipe.liked 一致）'
      });
    }

    const cat = await prisma.cat.findUnique({ where: { id: cat_id } });
    if (!cat) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '猫咪不存在'
      });
    }

    const swipe = await prisma.adoptionSwipe.upsert({
      where: {
        user_id_cat_id: { user_id: req.user.id, cat_id: cat_id }
      },
      create: {
        user_id: req.user.id,
        cat_id: cat_id,
        liked
      },
      update: { liked }
    });

    return res.json({
      success: true,
      data: swipe,
      message: '已记录滑动'
    });
  } catch (error) {
    console.error('recordSwipe error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// GET /api/adoption/feed — 按偏好 + 右滑喜欢学习到的品种/标签打分排序（仅返回尚未滑动过的待领养猫）
async function getFeed(req, res) {
  try {
    const limitRaw = req.query.limit;
    let limit = 30;
    if (limitRaw != null && limitRaw !== '') {
      const n = parseInt(String(limitRaw), 10);
      if (!Number.isNaN(n) && n > 0) {
        limit = Math.min(n, 50);
      }
    }

    const userId = req.user.id;

    const pref = await prisma.adopterPreference.findUnique({
      where: { user_id: userId }
    });

    const likedSwipes = await prisma.adoptionSwipe.findMany({
      where: { user_id: userId, liked: true },
      include: {
        cat: { include: { tags: true } }
      }
    });

    const likedBreedSet = new Set();
    const likedTagSet = new Set();
    for (const sw of likedSwipes) {
      if (!sw.cat) continue;
      const b = normalizeText(sw.cat.breed);
      if (b) likedBreedSet.add(b);
      if (Array.isArray(sw.cat.tags)) {
        for (const row of sw.cat.tags) {
          const t = normalizeText(row.tag);
          if (t) likedTagSet.add(t);
        }
      }
    }

    const allSwipes = await prisma.adoptionSwipe.findMany({
      where: { user_id: userId },
      select: { cat_id: true }
    });
    const swipedCatIds = allSwipes.map((s) => s.cat_id);

    const where = {
      is_available: true,
      ...(swipedCatIds.length > 0 ? { id: { notIn: swipedCatIds } } : {})
    };

    const candidates = await prisma.cat.findMany({
      where,
      include: catCardInclude,
      orderBy: { created_at: 'desc' }
    });

    const scored = candidates.map((cat) => {
      const { recommendation_score, score_breakdown } = scoreCatForUser(
        cat,
        pref,
        likedBreedSet,
        likedTagSet
      );
      return {
        ...cat,
        recommendation_score,
        score_breakdown
      };
    });

    scored.sort((a, b) => {
      if (b.recommendation_score !== a.recommendation_score) {
        return b.recommendation_score - a.recommendation_score;
      }
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });

    const data = scored.slice(0, limit);

    return res.json({
      success: true,
      data,
      message: '获取推荐列表成功'
    });
  } catch (error) {
    console.error('getFeed error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// GET /api/adoption/swipes — 当前用户全部滑动历史（与 AdoptionSwipe 表字段一致，含 liked）
// 修改态度：再次 POST /api/adoption/swipe，body 传同一 cat_id 与新的 liked（upsert），推荐打分会自动按最新 liked 计算
async function getSwipes(req, res) {
  try {
    const rows = await prisma.adoptionSwipe.findMany({
      where: { user_id: req.user.id },
      include: { cat: { include: catCardInclude } },
      orderBy: { created_at: 'desc' }
    });

    return res.json({
      success: true,
      data: rows,
      message: '获取滑动历史成功'
    });
  } catch (error) {
    console.error('getSwipes error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// GET /api/adoption/liked
async function getLiked(req, res) {
  try {
    const rows = await prisma.adoptionSwipe.findMany({
      where: { user_id: req.user.id, liked: true },
      include: { cat: { include: catCardInclude } },
      orderBy: { created_at: 'desc' }
    });

    const cats = rows.map((r) => r.cat).filter(Boolean);

    return res.json({
      success: true,
      data: cats,
      message: '获取喜欢的猫咪成功'
    });
  } catch (error) {
    console.error('getLiked error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// POST /api/adoption/preferences
async function setPreferences(req, res) {
  try {
    const { preferred_age, preferred_gender, preferred_breed } = req.body;

    const pref = await prisma.adopterPreference.upsert({
      where: { user_id: req.user.id },
      create: {
        user_id: req.user.id,
        preferred_age: preferred_age ?? null,
        preferred_gender: preferred_gender ?? null,
        preferred_breed: preferred_breed ?? null
      },
      update: {
        preferred_age: preferred_age ?? undefined,
        preferred_gender: preferred_gender ?? undefined,
        preferred_breed: preferred_breed ?? undefined
      }
    });

    return res.json({
      success: true,
      data: pref,
      message: '领养偏好已保存'
    });
  } catch (error) {
    console.error('setPreferences error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// POST /api/adoption/applications
// 请求体字段与 AdoptionApplication 一致：cat_id、message（可选）
async function createApplication(req, res) {
  try {
    const { cat_id, message } = req.body;

    if (!cat_id) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '缺少 cat_id'
      });
    }

    const cat = await prisma.cat.findUnique({ where: { id: cat_id } });
    if (!cat) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '猫咪不存在'
      });
    }

    const pending = await prisma.adoptionApplication.findFirst({
      where: {
        user_id: req.user.id,
        cat_id: cat_id,
        status: 'pending'
      }
    });

    if (pending) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '该猫咪已有待处理的申请'
      });
    }

    const application = await prisma.adoptionApplication.create({
      data: {
        user_id: req.user.id,
        cat_id: cat_id,
        message: message ?? null,
        status: 'pending'
      },
      include: {
        cat: { include: catCardInclude }
      }
    });

    return res.status(201).json({
      success: true,
      data: application,
      message: '领养申请已提交'
    });
  } catch (error) {
    console.error('createApplication error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// GET /api/adoption/applications/me
async function getMyApplications(req, res) {
  try {
    const applications = await prisma.adoptionApplication.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      include: {
        cat: { include: catCardInclude }
      }
    });

    return res.json({
      success: true,
      data: applications,
      message: '获取申请状态成功'
    });
  } catch (error) {
    console.error('getMyApplications error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// DELETE /api/adoption/applications/:id
async function cancelApplication(req, res) {
  try {
    const appId = req.params.id;

    const application = await prisma.adoptionApplication.findUnique({
      where: { id: appId },
      include: { cat: { include: { organization: true } } }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Application not found'
      });
    }

    if (application.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only cancel your own applications'
      });
    }

    if (application.status !== 'pending') {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'Only pending applications can be cancelled'
      });
    }

    await prisma.adoptionApplication.delete({ where: { id: appId } });

    const catName = application.cat ? application.cat.name : 'Unknown';
    const orgName = application.cat && application.cat.organization
      ? application.cat.organization.name
      : null;

    return res.json({
      success: true,
      data: {
        id: appId,
        cat_name: catName,
        org_name: orgName,
        cancelled_at: new Date().toISOString()
      },
      message: 'Application cancelled successfully'
    });
  } catch (error) {
    console.error('cancelApplication error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: 'Server error'
    });
  }
}

// GET /api/adoption/scoring-config
async function getScoringConfig(req, res) {
  try {
    return res.json({
      success: true,
      data: getWeights(),
      message: 'Current scoring weights'
    });
  } catch (error) {
    console.error('getScoringConfig error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: 'Server error'
    });
  }
}

// PUT /api/adoption/scoring-config
async function putScoringConfig(req, res) {
  try {
    const patch = req.body;
    if (!patch || typeof patch !== 'object') {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'Request body must be a JSON object with weight keys'
      });
    }
    const updated = updateWeights(patch);
    return res.json({
      success: true,
      data: updated,
      message: 'Scoring weights updated'
    });
  } catch (error) {
    console.error('putScoringConfig error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: 'Server error'
    });
  }
}

module.exports = {
  recordSwipe,
  getFeed,
  getSwipes,
  getLiked,
  setPreferences,
  createApplication,
  cancelApplication,
  getMyApplications,
  getScoringConfig,
  putScoringConfig
};
