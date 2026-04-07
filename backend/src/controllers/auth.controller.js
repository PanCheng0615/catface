// backend/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/generateToken');

const prisma = new PrismaClient();

function slugifyName(name) {
  return String(name || 'organization')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20) || 'organization';
}

async function buildUniqueUsername(baseName) {
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? baseName : `${baseName}_${suffix}`;
    const existingUser = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true }
    });

    if (!existingUser) {
      return candidate;
    }

    suffix += 1;
  }
}

async function ensureRescueStaffUserForOrganization(organization) {
  const targetRole = organization.type === 'clinic' ? 'clinic_staff' : 'rescue_staff';
  const existingUser = await prisma.user.findUnique({
    where: { email: organization.email }
  });

  if (existingUser && existingUser.role !== targetRole) {
    throw new Error(`该机构邮箱已被其他账号占用，无法映射为 ${targetRole} 账号`);
  }

  if (existingUser) {
    if (existingUser.display_name !== organization.name || existingUser.password !== organization.password) {
      return prisma.user.update({
        where: { id: existingUser.id },
        data: {
          display_name: organization.name,
          password: organization.password,
          role: targetRole
        }
      });
    }

    return existingUser;
  }

  const username = await buildUniqueUsername(`org_${slugifyName(organization.name)}`);

  return prisma.user.create({
    data: {
      email: organization.email,
      password: organization.password,
      username,
      display_name: organization.name,
      role: targetRole
    }
  });
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { email, password, username, display_name, role } = req.body;

    if (!email || !password || !username) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '邮箱和密码是必填的'
      });
    }

    // 检查是否已存在用户
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(422).json({
        success: false,
        error: 'UserExists',
        message: '该邮箱已注册'
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户（字段名要和 Member5 的 users 表对应）
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,                         // 必填
        display_name: display_name || '', // 可选
        role: role || 'user'
      }
    });

    const token = generateToken({ id: user.id, role: user.role });

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name,
          role: user.role
        }
      },
      message: '注册成功'
    });
  } catch (error) {
    console.error('register error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '邮箱和密码是必填的'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'InvalidCredentials',
        message: '邮箱或密码错误'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'InvalidCredentials',
        message: '邮箱或密码错误'
      });
    }

    const token = generateToken({ id: user.id, role: user.role });

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name,
          role: user.role
        }
      },
      message: '登录成功'
    });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// POST /api/auth/org/login
async function orgLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '机构邮箱和密码是必填的'
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { email }
    });

    if (!organization) {
      return res.status(401).json({
        success: false,
        error: 'InvalidCredentials',
        message: '机构邮箱或密码错误'
      });
    }

    const isMatch = await bcrypt.compare(password, organization.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'InvalidCredentials',
        message: '机构邮箱或密码错误'
      });
    }

    const rescueStaffUser = await ensureRescueStaffUserForOrganization(organization);

    const token = generateToken({
      id: rescueStaffUser.id,
      role: rescueStaffUser.role,
      account_type: 'organization',
      organization_id: organization.id,
      organization_type: organization.type,
      organization_name: organization.name
    });

    return res.json({
      success: true,
      data: {
        token,
        organization: {
          id: organization.id,
          name: organization.name,
          type: organization.type,
          email: organization.email,
          phone: organization.phone,
          address: organization.address,
          logo_url: organization.logo_url,
          description: organization.description
        },
        rescue_staff_user: {
          id: rescueStaffUser.id,
          username: rescueStaffUser.username,
          display_name: rescueStaffUser.display_name,
          role: rescueStaffUser.role
        }
      },
      message: '机构登录成功'
    });
  } catch (error) {
    console.error('orgLogin error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: error.message || '服务器错误'
    });
  }
}

module.exports = { register, login, orgLogin, ensureRescueStaffUserForOrganization };
