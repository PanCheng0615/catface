// backend/src/utils/cloudinary.js
// Cloudinary 图片上传工具函数，由 Member 5 维护
// 将来所有图片上传统一走这里，目前 backend/uploads/ 用本地磁盘暂存
// 使用方式：const { uploadImage } = require('../utils/cloudinary');

const cloudinary = require('cloudinary').v2;

// 仅在配置了环境变量时启用 Cloudinary，否则跳过
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * 上传本地文件到 Cloudinary
 * @param {string} filePath - 文件的绝对路径
 * @param {string} folder   - Cloudinary 上的目标文件夹，例如 'catface/health'
 * @returns {Promise<object>} Cloudinary 上传结果，包含 secure_url
 */
async function uploadImage(filePath, folder = 'catface') {
  if (!cloudinary.config().cloud_name) {
    throw new Error('Cloudinary 未配置，请检查环境变量');
  }
  return cloudinary.uploader.upload(filePath, { folder });
}

/**
 * 从 Cloudinary 删除图片
 * @param {string} publicId - Cloudinary 资源 public_id
 */
async function deleteImage(publicId) {
  if (!cloudinary.config().cloud_name) return;
  return cloudinary.uploader.destroy(publicId);
}

module.exports = { uploadImage, deleteImage };
