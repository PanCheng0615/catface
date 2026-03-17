// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

// 需要登录才能访问的接口，用这个中间件
function protect(req, res, next) {
  let token;

  // 从请求头里找 Authorization: Bearer xxx
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token',
      message: '未提供登录凭证，请先登录'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 把解析后的用户信息挂到 req 上，后面的接口可以用
    req.user = decoded;
    next();
  } catch (error) {
    console.error('auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: '登录凭证无效或已过期，请重新登录'
    });
  }
}

// 角色限制：只有指定角色才能访问
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '权限不足'
      });
    }
    next();
  };
}

module.exports = { protect, authorize };