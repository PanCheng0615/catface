// backend/src/utils/generateToken.js
const jwt = require('jsonwebtoken');

function generateToken(user) {
  // user: 至少要有 id 和 role 字段
  const payload = {
    id: user.id,
    role: user.role
  };

  Object.keys(user).forEach((key) => {
    if (key !== 'id' && key !== 'role' && user[key] !== undefined) {
      payload[key] = user[key];
    }
  });

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

module.exports = { generateToken };