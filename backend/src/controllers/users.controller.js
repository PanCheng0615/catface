// backend/src/controllers/users.controller.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/users/me
async function getMe(req, res) {
  try {
    // protect 中间件已经把 { id, role } 放在 req.user 里
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

// POST /api/users/:id/follow
async function toggleFollow(req, res) {
  try {
    const targetUserId = req.params.id;

    if (targetUserId === req.user.id) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '不能关注自己'
      });
    }

    // 这里假设 Member3/5 在 Prisma 里有 user_follows 表，你可以先简单返回成功占位
    return res.json({
      success: true,
      data: null,
      message: '关注/取关功能占位，后续与 user_follows 表联调'
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

module.exports = { getMe, updateMe, toggleFollow };