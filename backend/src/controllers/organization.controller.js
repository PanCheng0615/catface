const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const VALID_ORG_TYPES = ['rescue', 'clinic'];

// GET /api/organizations
// 获取机构列表，支持按 type 筛选
async function getOrganizations(req, res) {
  try {
    const { type } = req.query;

    const where = {};
    if (type) {
      if (!VALID_ORG_TYPES.includes(type)) {
        return res.status(422).json({
          success: false,
          error: 'ValidationError',
          message: `type 必须是以下之一：${VALID_ORG_TYPES.join(', ')}`
        });
      }
      where.type = type;
    }

    const orgs = await prisma.organization.findMany({
      where,
      select: {
        id: true, name: true, type: true, email: true,
        phone: true, address: true, logo_url: true,
        description: true, license_number: true,
        is_verified: true, created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    return res.json({ success: true, data: orgs, message: '获取机构列表成功' });
  } catch (error) {
    console.error('getOrganizations error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// GET /api/organizations/:id
// 获取单个机构详情
async function getOrganizationById(req, res) {
  try {
    const { id } = req.params;

    const org = await prisma.organization.findUnique({
      where: { id },
      select: {
        id: true, name: true, type: true, email: true,
        phone: true, address: true, logo_url: true,
        description: true, license_number: true,
        is_verified: true, created_at: true,
        _count: { select: { cats: true, adoption_events: true, clinic_reports: true } }
      }
    });

    if (!org) {
      return res.status(404).json({ success: false, error: 'NotFound', message: '机构不存在' });
    }

    return res.json({ success: true, data: org, message: '获取机构详情成功' });
  } catch (error) {
    console.error('getOrganizationById error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// POST /api/organizations
// 注册新机构
async function createOrganization(req, res) {
  try {
    const { name, type, email, password, phone, address, logo_url, description, license_number } = req.body;

    if (!name || !type || !email || !password) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'name、type、email、password 为必填项'
      });
    }

    if (!VALID_ORG_TYPES.includes(type)) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: `type 必须是以下之一：${VALID_ORG_TYPES.join(', ')}`
      });
    }

    const existing = await prisma.organization.findUnique({ where: { email } });
    if (existing) {
      return res.status(422).json({ success: false, error: 'DuplicateEmail', message: '该邮箱已被注册' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const org = await prisma.organization.create({
      data: {
        name, type, email,
        password:       hashedPassword,
        phone:          phone          || null,
        address:        address        || null,
        logo_url:       logo_url       || null,
        description:    description    || null,
        license_number: license_number || null
      },
      select: {
        id: true, name: true, type: true, email: true,
        phone: true, address: true, logo_url: true,
        description: true, license_number: true,
        is_verified: true, created_at: true
      }
    });

    return res.status(201).json({ success: true, data: org, message: '机构注册成功' });
  } catch (error) {
    console.error('createOrganization error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// PUT /api/organizations/:id
// 更新机构信息
async function updateOrganization(req, res) {
  try {
    const { id } = req.params;
    const { name, phone, address, logo_url, description, license_number } = req.body;

    const existing = await prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'NotFound', message: '机构不存在' });
    }

    const data = {};
    if (name           !== undefined) data.name           = name;
    if (phone          !== undefined) data.phone          = phone          || null;
    if (address        !== undefined) data.address        = address        || null;
    if (logo_url       !== undefined) data.logo_url       = logo_url       || null;
    if (description    !== undefined) data.description    = description    || null;
    if (license_number !== undefined) data.license_number = license_number || null;

    const org = await prisma.organization.update({
      where: { id },
      data,
      select: {
        id: true, name: true, type: true, email: true,
        phone: true, address: true, logo_url: true,
        description: true, license_number: true,
        is_verified: true, updated_at: true
      }
    });

    return res.json({ success: true, data: org, message: '机构信息更新成功' });
  } catch (error) {
    console.error('updateOrganization error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

module.exports = {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization
};
