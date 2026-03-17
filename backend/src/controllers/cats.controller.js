/**
 * 猫咪档案 Controller（Member 2）
 * 创建/获取/更新猫咪信息
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/** GET /api/cats — 获取猫咪列表（可带 is_available 等筛选） */
async function getCats(req, res) {
  try {
    const { is_available } = req.query;
    const where = {};
    if (is_available !== undefined) {
      where.is_available = is_available === 'true';
    }
    const cats = await prisma.cat.findMany({
      where,
      include: {
        tags: true,
        organization: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    return res.status(200).json({ success: true, data: cats, message: '获取成功' });
  } catch (error) {
    console.error('getCats error:', error);
    return res.status(500).json({ success: false, error: error.message, message: '服务器错误' });
  }
}

/** GET /api/cats/:id — 获取单只猫信息 */
async function getCatById(req, res) {
  try {
    const { id } = req.params;
    const cat = await prisma.cat.findUnique({
      where: { id },
      include: {
        tags: true,
        requirements: true,
        organization: { select: { id: true, name: true, phone: true, address: true } }
      }
    });
    if (!cat) {
      return res.status(404).json({ success: false, error: '猫咪不存在', message: '未找到该猫咪' });
    }
    return res.status(200).json({ success: true, data: cat, message: '获取成功' });
  } catch (error) {
    console.error('getCatById error:', error);
    return res.status(500).json({ success: false, error: error.message, message: '服务器错误' });
  }
}

/** POST /api/cats — 创建猫咪档案（救助机构） */
async function createCat(req, res) {
  try {
    const body = req.body;
    const { name, breed, age_months, gender, color, description, photo_url, tags } = body;
    if (!name || !name.trim()) {
      return res.status(422).json({ success: false, error: '缺少姓名', message: '请填写猫咪名字' });
    }
    const cat = await prisma.cat.create({
      data: {
        name: name.trim(),
        breed: breed?.trim() || null,
        age_months: age_months != null ? parseInt(age_months, 10) : null,
        gender: gender?.trim() || null,
        color: color?.trim() || null,
        description: description?.trim() || null,
        photo_url: photo_url?.trim() || null,
        org_id: body.org_id?.trim() || null,
        tags: Array.isArray(tags) && tags.length
          ? { create: tags.filter(Boolean).map((t) => ({ tag: String(t).trim() })) }
          : undefined
      },
      include: { tags: true }
    });
    return res.status(201).json({ success: true, data: cat, message: '创建成功' });
  } catch (error) {
    console.error('createCat error:', error);
    return res.status(500).json({ success: false, error: error.message, message: '服务器错误' });
  }
}

/** PUT /api/cats/:id — 更新猫咪信息 */
async function updateCat(req, res) {
  try {
    const { id } = req.params;
    const body = req.body;
    const cat = await prisma.cat.findUnique({ where: { id } });
    if (!cat) {
      return res.status(404).json({ success: false, error: '猫咪不存在', message: '未找到该猫咪' });
    }
    const { name, breed, age_months, gender, color, description, photo_url, is_available } = body;
    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (breed !== undefined) data.breed = breed ? String(breed).trim() : null;
    if (age_months !== undefined) data.age_months = age_months === '' || age_months == null ? null : parseInt(age_months, 10);
    if (gender !== undefined) data.gender = gender ? String(gender).trim() : null;
    if (color !== undefined) data.color = color ? String(color).trim() : null;
    if (description !== undefined) data.description = description ? String(description).trim() : null;
    if (photo_url !== undefined) data.photo_url = photo_url ? String(photo_url).trim() : null;
    if (typeof is_available === 'boolean') data.is_available = is_available;
    const updated = await prisma.cat.update({
      where: { id },
      data,
      include: { tags: true }
    });
    return res.status(200).json({ success: true, data: updated, message: '更新成功' });
  } catch (error) {
    console.error('updateCat error:', error);
    return res.status(500).json({ success: false, error: error.message, message: '服务器错误' });
  }
}

module.exports = {
  getCats,
  getCatById,
  createCat,
  updateCat
};
