const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createClinicReport(req, res) {
  try {
    const { catId } = req.params;
    const { org_id, report_type, description, date, file_url } = req.body;

    if (!org_id || !report_type || !description || !date) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'org_id、report_type、description、date 为必填项'
      });
    }

    const report = await prisma.clinicHealthReport.create({
      data: {
        cat_id: catId,
        org_id,
        report_type,
        description,
        date: new Date(date),
        file_url: file_url || null
      }
    });

    return res.status(201).json({
      success: true,
      data: report,
      message: '诊所报告上传成功'
    });
  } catch (error) {
    console.error('createClinicReport error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function getAuthorizedCats(req, res) {
  try {
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'orgId 为必填项'
      });
    }

    const permissions = await prisma.healthSharePermission.findMany({
      where: {
        org_id: orgId,
        is_allowed: true
      },
      include: {
        cat: true
      },
      orderBy: {
        updated_at: 'desc'
      }
    });

    return res.json({
      success: true,
      data: permissions.map((permission) => ({
        permission_id: permission.id,
        user_id: permission.user_id,
        cat: permission.cat
      })),
      message: '获取授权猫咪列表成功'
    });
  } catch (error) {
    console.error('getAuthorizedCats error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

module.exports = {
  createClinicReport,
  getAuthorizedCats
};
