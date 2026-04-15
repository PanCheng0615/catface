const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/events
// 获取领养活动列表，支持按 org_id 筛选
async function getEvents(req, res) {
  try {
    const { org_id } = req.query;

    const where = org_id ? { org_id } : {};

    const events = await prisma.adoptionEvent.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true, type: true } },
        _count: { select: { cats: true, applications: true } }
      },
      orderBy: { start_date: 'desc' }
    });

    return res.json({ success: true, data: events, message: '获取领养活动列表成功' });
  } catch (error) {
    console.error('getEvents error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// GET /api/events/:id
// 获取某次活动详情，包含参与猫咪列表
async function getEventById(req, res) {
  try {
    const { id } = req.params;

    const event = await prisma.adoptionEvent.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true, logo_url: true } },
        cats: {
          select: {
            id: true, name: true, breed: true, age_months: true,
            gender: true, color: true, photo_url: true, status: true,
            is_neutered: true, is_vaccinated: true, is_dewormed: true,
            tags: { select: { tag: true } }
          }
        },
        _count: { select: { applications: true } }
      }
    });

    if (!event) {
      return res.status(404).json({ success: false, error: 'NotFound', message: '领养活动不存在' });
    }

    return res.json({ success: true, data: event, message: '获取活动详情成功' });
  } catch (error) {
    console.error('getEventById error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// POST /api/events
// 创建新领养活动
async function createEvent(req, res) {
  try {
    const { name, edition, start_date, end_date, location, description, org_id } = req.body;

    if (!name || !start_date) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'name、start_date 为必填项'
      });
    }

    const event = await prisma.adoptionEvent.create({
      data: {
        name,
        edition:     edition     ? parseInt(edition)    : null,
        start_date:  new Date(start_date),
        end_date:    end_date    ? new Date(end_date)   : null,
        location:    location    || null,
        description: description || null,
        org_id:      org_id      || null
      },
      include: {
        organization: { select: { id: true, name: true } }
      }
    });

    return res.status(201).json({ success: true, data: event, message: '领养活动创建成功' });
  } catch (error) {
    console.error('createEvent error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// PUT /api/events/:id
// 更新活动信息
async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const { name, edition, start_date, end_date, location, description } = req.body;

    const existing = await prisma.adoptionEvent.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'NotFound', message: '领养活动不存在' });
    }

    const data = {};
    if (name        !== undefined) data.name        = name;
    if (edition     !== undefined) data.edition     = edition     ? parseInt(edition)  : null;
    if (start_date  !== undefined) data.start_date  = new Date(start_date);
    if (end_date    !== undefined) data.end_date    = end_date    ? new Date(end_date) : null;
    if (location    !== undefined) data.location    = location    || null;
    if (description !== undefined) data.description = description || null;

    const event = await prisma.adoptionEvent.update({ where: { id }, data });
    return res.json({ success: true, data: event, message: '活动信息更新成功' });
  } catch (error) {
    console.error('updateEvent error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// DELETE /api/events/:id
// 删除领养活动
async function deleteEvent(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.adoptionEvent.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'NotFound', message: '领养活动不存在' });
    }

    await prisma.adoptionEvent.delete({ where: { id } });
    return res.json({ success: true, data: null, message: '领养活动已删除' });
  } catch (error) {
    console.error('deleteEvent error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};
