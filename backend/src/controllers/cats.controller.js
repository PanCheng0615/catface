const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CAT_STATUSES = ['available', 'adopted', 'unavailable'];

/**
 * @param {unknown} raw
 * @returns {'available'|'adopted'|'unavailable'|null}
 */
function parseCatStatus(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().toLowerCase();
  return CAT_STATUSES.includes(s) ? /** @type {'available'|'adopted'|'unavailable'} */ (s) : null;
}

/**
 * Body: prefer `status` (CatStatus); legacy `is_available` maps to available / unavailable.
 * @param {{ status?: unknown, is_available?: unknown }} body
 * @returns {'available'|'adopted'|'unavailable'}
 */
function resolveCatStatusForCreate(body) {
  const parsed = parseCatStatus(body.status);
  if (parsed) return parsed;
  const { is_available } = body;
  if (is_available === true || is_available === 'true' || is_available === '1') return 'available';
  if (is_available === false || is_available === 'false' || is_available === '0') return 'unavailable';
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
// 查询：status=available|adopted|unavailable；兼容旧参数 is_available=true|false（映射为 status）
async function getCats(req, res) {
  try {
    const { status: statusQ, is_available: legacyAvail } = req.query;
    const where = {};

    const parsed = parseCatStatus(statusQ);
    if (parsed) {
      where.status = parsed;
    } else if (legacyAvail === 'true' || legacyAvail === '1') {
      where.status = 'available';
    } else if (legacyAvail === 'false' || legacyAvail === '0') {
      where.status = { not: 'available' };
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
      is_available,
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
        message: 'status 必须是 available、adopted 或 unavailable（CatStatus）'
      });
    }

    // tags：与 CatTag 模型一致，每项为 { tag: string }（无需传 cat_id，由创建时关联）
    const tagCreates = Array.isArray(tags)
      ? tags
          .filter((row) => row && typeof row.tag === 'string' && row.tag.trim())
          .map((row) => ({ tag: row.tag.trim() }))
      : [];

    // requirements：与 CatRequirement 模型一致，每项为 { description: string }
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
        status: resolveCatStatusForCreate({ status, is_available }),
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
      is_available,
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
          message: 'status 必须是 available、adopted 或 unavailable（CatStatus）'
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
      data.status = /** @type {'available'|'adopted'|'unavailable'} */ (parseCatStatus(status));
    } else if (is_available !== undefined) {
      data.status = Boolean(is_available) ? 'available' : 'unavailable';
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
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

module.exports = { getCats, getCatById, createCat, updateCat };
