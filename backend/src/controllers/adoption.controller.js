/**
 * 领养模块 Controller（Member 2）
 * 滑动、喜欢列表、偏好、领养申请
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/** POST /api/adoption/swipe — 记录滑动行为（like / pass） */
async function recordSwipe(req, res) {
  try {
    const userId = req.user.id;
    const { cat_id, direction } = req.body;
    if (!cat_id) {
      return res.status(422).json({ success: false, error: '缺少 cat_id', message: '请选择猫咪' });
    }
    const cat = await prisma.cat.findUnique({ where: { id: cat_id } });
    if (!cat) {
      return res.status(404).json({ success: false, error: '猫咪不存在', message: '未找到该猫咪' });
    }
    if (direction === 'like') {
      await prisma.catLike.upsert({
        where: {
          user_id_cat_id: { user_id: userId, cat_id }
        },
        create: { user_id: userId, cat_id },
        update: {}
      });
    }
    return res.status(200).json({ success: true, data: { cat_id, direction }, message: '已记录' });
  } catch (error) {
    console.error('recordSwipe error:', error);
    return res.status(500).json({ success: false, error: error.message, message: '服务器错误' });
  }
}

/** GET /api/adoption/liked — 获取已喜欢的猫列表 */
async function getLikedCats(req, res) {
  try {
    const userId = req.user.id;
    const likes = await prisma.catLike.findMany({
      where: { user_id: userId },
      include: {
        cat: {
          include: { tags: true, organization: { select: { name: true } } }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    const cats = likes.map((l) => l.cat);
    return res.status(200).json({ success: true, data: cats, message: '获取成功' });
  } catch (error) {
    console.error('getLikedCats error:', error);
    return res.status(500).json({ success: false, error: error.message, message: '服务器错误' });
  }
}

/** POST /api/adoption/preferences — 设置领养偏好 */
async function setPreferences(req, res) {
  try {
    const userId = req.user.id;
    const { preferred_age, preferred_gender, preferred_breed } = req.body;
    const prefs = await prisma.adopterPreference.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        preferred_age: preferred_age?.trim() || null,
        preferred_gender: preferred_gender?.trim() || null,
        preferred_breed: preferred_breed?.trim() || null
      },
      update: {
        preferred_age: preferred_age !== undefined ? (preferred_age?.trim() || null) : undefined,
        preferred_gender: preferred_gender !== undefined ? (preferred_gender?.trim() || null) : undefined,
        preferred_breed: preferred_breed !== undefined ? (preferred_breed?.trim() || null) : undefined
      }
    });
    return res.status(200).json({ success: true, data: prefs, message: '偏好已保存' });
  } catch (error) {
    console.error('setPreferences error:', error);
    return res.status(500).json({ success: false, error: error.message, message: '服务器错误' });
  }
}

/** POST /api/adoption/applications — 提交领养申请 */
async function submitApplication(req, res) {
  try {
    const userId = req.user.id;
    const { cat_id, message } = req.body;
    if (!cat_id) {
      return res.status(422).json({ success: false, error: '缺少 cat_id', message: '请选择要申请的猫咪' });
    }
    const cat = await prisma.cat.findUnique({ where: { id: cat_id } });
    if (!cat) {
      return res.status(404).json({ success: false, error: '猫咪不存在', message: '未找到该猫咪' });
    }
    if (!cat.is_available) {
      return res.status(422).json({ success: false, error: '猫咪不可领养', message: '该猫咪暂不开放领养' });
    }
    const existing = await prisma.adoptionApplication.findFirst({
      where: { user_id: userId, cat_id }
    });
    if (existing) {
      return res.status(422).json({ success: false, error: '已申请过', message: '您已提交过该猫咪的领养申请' });
    }
    const app = await prisma.adoptionApplication.create({
      data: {
        user_id: userId,
        cat_id,
        message: message?.trim() || null
      },
      include: { cat: { select: { name: true } } }
    });
    return res.status(201).json({ success: true, data: app, message: '申请已提交' });
  } catch (error) {
    console.error('submitApplication error:', error);
    return res.status(500).json({ success: false, error: error.message, message: '服务器错误' });
  }
}

/** GET /api/adoption/applications/me — 获取当前用户的领养申请列表 */
async function getMyApplications(req, res) {
  try {
    const userId = req.user.id;
    const list = await prisma.adoptionApplication.findMany({
      where: { user_id: userId },
      include: {
        cat: {
          select: { id: true, name: true, photo_url: true, breed: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    return res.status(200).json({ success: true, data: list, message: '获取成功' });
  } catch (error) {
    console.error('getMyApplications error:', error);
    return res.status(500).json({ success: false, error: error.message, message: '服务器错误' });
  }
}

module.exports = {
  recordSwipe,
  getLikedCats,
  setPreferences,
  submitApplication,
  getMyApplications
};
