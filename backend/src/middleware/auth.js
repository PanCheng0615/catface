/**
 * JWT 验证中间件（Member 1 负责，此处为简化版供 Member 2 联调用）
 * 需要登录的接口使用 protect；需要特定角色使用 authorize('rescue_staff') 等
 */
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 验证 JWT，把用户信息挂到 req.user
 */
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '未提供 Token',
        message: '请先登录'
      });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'catface-secret-change-in-production');
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户不存在',
        message: '请重新登录'
      });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token 无效或已过期',
        message: '请重新登录'
      });
    }
    console.error('auth middleware error:', err);
    return res.status(500).json({ success: false, error: '服务器错误', message: '验证失败' });
  }
}

/**
 * 限制角色：protect 之后使用，如 authorize('rescue_staff', 'admin')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未登录', message: '请先登录' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: '权限不足',
        message: '您没有权限执行此操作'
      });
    }
    next();
  };
}

module.exports = { protect, authorize };
