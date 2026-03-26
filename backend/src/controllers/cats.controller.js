const { PrismaClient } = require('@prisma/client');
const {
  PrismaClientKnownRequestError,
  PrismaClientValidationError
} = require('@prisma/client/runtime/library');

const prisma = new PrismaClient();

/**
 * 将 Prisma 写入类错误映射为 422，避免非法枚举等以 500 返回。
 * @returns {boolean} 若已发送响应则 true，否则 false（由调用方继续走 500）
 */
function tryRespondPrismaCatWriteError(error, res) {
  if (error instanceof PrismaClientValidationError) {
    const msg = String(error.message || '');
    let message = '请求参数与数据库约束不匹配，请检查字段类型与枚举取值';
    if (/[`']status[`']|CatStatus|\.status/i.test(msg)) {
      message = 'status 取值无效，请使用：available、adopted、fostered、deceased';
    } else if (/[`']gender[`']|CatGender|\.gender/i.test(msg)) {
      message = 'gender 取值无效，请使用：male、female、unknown';
    } else if (/Invalid value for argument/i.test(msg)) {
      message = '部分字段取值无效（如 status、gender 等枚举），请对照 API 文档填写';
    }
    res.status(422).json({
      success: false,
      error: 'ValidationError',
      message
    });
    return true;
  }

  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = error.meta && error.meta.target;
      const field = Array.isArray(target) ? target.join(', ') : String(target || '');
      res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: field.includes('face_code')
          ? 'face_code 已存在，请使用其他编号'
          : '数据冲突：唯一字段已存在，请修改后重试'
      });
      return true;
    }
    if (error.code === 'P2003') {
      res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '关联的 owner_id 或 org_id 不存在（外键无效）'
      });
      return true;
    }
  }

  const raw = String((error && error.message) || '');
  if (/invalid input value for enum|22P02/i.test(raw)) {
    res.status(422).json({
      success: false,
      error: 'ValidationError',
      message: '枚举字段取值无效（如 status 或 gender），请使用允许的枚举值'
    });
    return true;
  }

  return false;
}

// 与 prisma/schema.prisma 中 CatStatus 枚举保持一致
const CAT_STATUSES = ['available', 'adopted', 'fostered', 'deceased'];

/**
 * @param {unknown} raw
 * @returns {'available'|'adopted'|'fostered'|'deceased'|null}
 */
function parseCatStatus(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().toLowerCase();
  return CAT_STATUSES.includes(s)
    ? /** @type {'available'|'adopted'|'fostered'|'deceased'} */ (s)
    : null;
}

/**
 * @param {{ status?: unknown }} body
 * @returns {'available'|'adopted'|'fostered'|'deceased'}
 */
function resolveCatStatusForCreate(body) {
  const parsed = parseCatStatus(body.status);
  if (parsed) return parsed;
  return 'available';
}

const catInclude = {
  tags: true,
  requirements: true,
  organization: { select: { id: true, name: true, logo_url: true } },
  owner: {
    select: { id: true, username: true, display_name: true, avatar_url: true }
  }
};

// GET /api/cats
// 查询参数：status=available|adopted|fostered|deceased
async function getCats(req, res) {
  try {
    const { status: statusQ } = req.query;
    const where = {};

    if (statusQ != null && String(statusQ).trim() !== '') {
      const parsed = parseCatStatus(statusQ);
      if (!parsed) {
        return res.status(422).json({
          success: false,
          error: 'ValidationError',
          message: '查询参数 status 必须是 available、adopted、fostered 或 deceased（CatStatus）'
        });
      }
      where.status = parsed;
    }

    const cats = await prisma.cat.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        tags: true,
        organization: { select: { id: true, name: true, logo_url: true } }
      }
    });

    return res.json({
      success: true,
      data: cats,
      message: '获取猫咪列表成功'
    });
  } catch (error) {
    console.error('getCats error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// GET /api/cats/:id
async function getCatById(req, res) {
  try {
    const cat = await prisma.cat.findUnique({
      where: { id: req.params.id },
      include: {
        ...catInclude,
        updates: { orderBy: { created_at: 'desc' }, take: 20 }
      }
    });

    if (!cat) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '猫咪不存在'
      });
    }

    return res.json({
      success: true,
      data: cat,
      message: '获取猫咪信息成功'
    });
  } catch (error) {
    console.error('getCatById error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// POST /api/cats — 救助机构建档
async function createCat(req, res) {
  try {
    const {
      name,
      breed,
      age_months,
      gender,
      color,
      description,
      photo_url,
      status,
      owner_id,
      org_id,
      tags,
      requirements
    } = req.body;

    if (!name) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'name 不能为空（Cat.name）'
      });
    }

    if (status !== undefined && status !== null && status !== '' && !parseCatStatus(status)) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'status 必须是 available、adopted、fostered 或 deceased（CatStatus）'
      });
    }

    const tagCreates = Array.isArray(tags)
      ? tags
          .filter((row) => row && typeof row.tag === 'string' && row.tag.trim())
          .map((row) => ({ tag: row.tag.trim() }))
      : [];

    const reqCreates = Array.isArray(requirements)
      ? requirements
          .filter((row) => row && typeof row.description === 'string' && row.description.trim())
          .map((row) => ({ description: row.description.trim() }))
      : [];

    const cat = await prisma.cat.create({
      data: {
        name,
        breed: breed ?? null,
        age_months: age_months != null ? Number(age_months) : null,
        gender: gender ?? null,
        color: color ?? null,
        description: description ?? null,
        photo_url: photo_url ?? null,
        status: resolveCatStatusForCreate({ status }),
        owner_id: owner_id ?? null,
        org_id: org_id || null,
        tags: tagCreates.length ? { create: tagCreates } : undefined,
        requirements: reqCreates.length ? { create: reqCreates } : undefined
      },
      include: {
        tags: true,
        requirements: true,
        organization: { select: { id: true, name: true, logo_url: true } }
      }
    });

    return res.status(201).json({
      success: true,
      data: cat,
      message: '创建猫咪档案成功'
    });
  } catch (error) {
    console.error('createCat error:', error);
    if (tryRespondPrismaCatWriteError(error, res)) return;
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

function canEditCat(user, cat) {
  if (user.role === 'admin' || user.role === 'rescue_staff') {
    return true;
  }
  if (user.role === 'user' && cat.owner_id && cat.owner_id === user.id) {
    return true;
  }
  return false;
}

// PUT /api/cats/:id
async function updateCat(req, res) {
  try {
    const cat = await prisma.cat.findUnique({ where: { id: req.params.id } });
    if (!cat) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '猫咪不存在'
      });
    }

    if (!canEditCat(req.user, cat)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权修改该猫咪信息'
      });
    }

    const {
      name,
      breed,
      age_months,
      gender,
      color,
      description,
      photo_url,
      status,
      owner_id,
      org_id,
      tags,
      requirements
    } = req.body;

    if (status !== undefined && status !== null && status !== '') {
      const p = parseCatStatus(status);
      if (!p) {
        return res.status(422).json({
          success: false,
          error: 'ValidationError',
          message: 'status 必须是 available、adopted、fostered 或 deceased（CatStatus）'
        });
      }
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (breed !== undefined) data.breed = breed;
    if (age_months !== undefined) data.age_months = age_months != null ? Number(age_months) : null;
    if (gender !== undefined) data.gender = gender;
    if (color !== undefined) data.color = color;
    if (description !== undefined) data.description = description;
    if (photo_url !== undefined) data.photo_url = photo_url;
    if (status !== undefined && status !== null && status !== '') {
      data.status = /** @type {'available'|'adopted'|'fostered'|'deceased'} */ (parseCatStatus(status));
    }
    if (owner_id !== undefined) data.owner_id = owner_id || null;
    if (org_id !== undefined) data.org_id = org_id || null;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.cat.update({
        where: { id: cat.id },
        data
      });

      if (Array.isArray(tags)) {
        await tx.catTag.deleteMany({ where: { cat_id: cat.id } });
        const tagRows = tags
          .filter((row) => row && typeof row.tag === 'string' && row.tag.trim())
          .map((row) => ({ cat_id: cat.id, tag: row.tag.trim() }));
        if (tagRows.length) {
          await tx.catTag.createMany({ data: tagRows });
        }
      }

      if (Array.isArray(requirements)) {
        await tx.catRequirement.deleteMany({ where: { cat_id: cat.id } });
        const reqRows = requirements
          .filter((row) => row && typeof row.description === 'string' && row.description.trim())
          .map((row) => ({ cat_id: cat.id, description: row.description.trim() }));
        if (reqRows.length) {
          await tx.catRequirement.createMany({ data: reqRows });
        }
      }

      return tx.cat.findUnique({
        where: { id: cat.id },
        include: {
          tags: true,
          requirements: true,
          organization: { select: { id: true, name: true, logo_url: true } },
          owner: { select: { id: true, username: true, display_name: true } }
        }
      });
    });

    return res.json({
      success: true,
      data: updated,
      message: '更新猫咪信息成功'
    });
  } catch (error) {
    console.error('updateCat error:', error);
    if (tryRespondPrismaCatWriteError(error, res)) return;
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

module.exports = { getCats, getCatById, createCat, updateCat };
