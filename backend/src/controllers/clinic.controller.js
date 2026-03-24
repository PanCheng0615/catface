const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const VALID_REPORT_TYPES = ['vaccination', 'deworming', 'checkup', 'blood_test', 'treatment', 'surgery', 'other'];

// GET /api/clinic/cats
// 获取某诊所被授权查看的猫咪列表（需要 is_allowed=true）
async function getAuthorizedCats(req, res) {
  try {
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(422).json({ success: false, error: 'ValidationError', message: 'orgId 为必填查询参数' });
    }

    const permissions = await prisma.healthSharePermission.findMany({
      where: { org_id: orgId, is_allowed: true },
      include: {
        cat: {
          select: {
            id: true, name: true, breed: true, age_months: true,
            gender: true, color: true, photo_url: true, status: true,
            is_neutered: true, is_vaccinated: true, is_dewormed: true
          }
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    return res.json({
      success: true,
      data: permissions.map((p) => ({ permission_id: p.id, user_id: p.user_id, cat: p.cat })),
      message: '获取授权猫咪列表成功'
    });
  } catch (error) {
    console.error('getAuthorizedCats error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// POST /api/clinic/reports/:catId
// 诊所上传一份官方健康报告
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

    if (!VALID_REPORT_TYPES.includes(report_type)) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: `report_type 必须是以下之一：${VALID_REPORT_TYPES.join(', ')}`
      });
    }

    // 确认诊所对该猫有授权
    const permission = await prisma.healthSharePermission.findUnique({
      where: { cat_id_org_id: { cat_id: catId, org_id } }
    });

    if (!permission || !permission.is_allowed) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '未获得该猫咪主人的授权，无法上传报告'
      });
    }

    const report = await prisma.clinicHealthReport.create({
      data: {
        cat_id:      catId,
        org_id,
        report_type,
        description,
        date:        new Date(date),
        file_url:    file_url || null
      }
    });

    return res.status(201).json({ success: true, data: report, message: '诊所报告上传成功' });
  } catch (error) {
    console.error('createClinicReport error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// PUT /api/clinic/reports/:reportId
// 更新一份诊所报告（补充说明等）
async function updateClinicReport(req, res) {
  try {
    const { reportId } = req.params;
    const { report_type, description, date, file_url } = req.body;

    if (report_type && !VALID_REPORT_TYPES.includes(report_type)) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: `report_type 必须是以下之一：${VALID_REPORT_TYPES.join(', ')}`
      });
    }

    const existing = await prisma.clinicHealthReport.findUnique({ where: { id: reportId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'NotFound', message: '报告不存在' });
    }

    const data = {};
    if (report_type)        data.report_type = report_type;
    if (description)        data.description = description;
    if (date)               data.date        = new Date(date);
    if (file_url !== undefined) data.file_url = file_url || null;

    const report = await prisma.clinicHealthReport.update({ where: { id: reportId }, data });
    return res.json({ success: true, data: report, message: '诊所报告更新成功' });
  } catch (error) {
    console.error('updateClinicReport error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// DELETE /api/clinic/reports/:reportId
// 删除一份诊所报告
async function deleteClinicReport(req, res) {
  try {
    const { reportId } = req.params;

    const existing = await prisma.clinicHealthReport.findUnique({ where: { id: reportId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'NotFound', message: '报告不存在' });
    }

    await prisma.clinicHealthReport.delete({ where: { id: reportId } });
    return res.json({ success: true, data: null, message: '诊所报告已删除' });
  } catch (error) {
    console.error('deleteClinicReport error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

module.exports = {
  getAuthorizedCats,
  createClinicReport,
  updateClinicReport,
  deleteClinicReport
};
