// backend/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/generateToken');
const { runKamFaceInference } = require('../services/cat-face.service');

const prisma = new PrismaClient();

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
async function identifySignupCatFace(req, res) {
  try {
    const { image_data_url } = req.body;

    if (!image_data_url) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'image_data_url is required'
      });
    }

    const payload = await runKamFaceInference(image_data_url);

    return res.status(200).json(payload);
  } catch (error) {
    console.error('identifySignupCatFace error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: error.message || 'Cat face identification failed'
    });
  }
}
module.exports = { register, login, identifySignupCatFace };