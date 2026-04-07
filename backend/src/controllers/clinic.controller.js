const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const VALID_REPORT_TYPES = ['vaccination', 'deworming', 'checkup', 'blood_test', 'treatment', 'surgery', 'other'];

// 根据登录用户邮箱查找其所属机构 ID（用于 clinic_staff 鉴权）
async function getOrgIdForUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true }
  });
  if (!user || user.role !== 'clinic_staff') return null;
  const org = await prisma.organization.findFirst({
    where: { email: user.email }
  });
  return org ? org.id : null;
}

// GET /api/clinic/cats
// 获取某诊所被授权查看的猫咪列表（clinic_staff 只能看自己机构的）
async function getAuthorizedCats(req, res) {
  try {
    const orgId = await getOrgIdForUser(req.user.id);
    if (!orgId) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '仅诊所工作人员可访问' });
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
// 诊所上传一份官方健康报告（org_id 从登录用户关联的机构自动取得）
async function createClinicReport(req, res) {
  try {
    const { catId } = req.params;
    const orgId = await getOrgIdForUser(req.user.id);
    if (!orgId) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '无法识别您的诊所身份，请确认账号已关联诊所' });
    }
    const { report_type, description, date, file_url } = req.body;

    if (!report_type || !description || !date) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'report_type、description、date 为必填项'
      });
    }

    if (!VALID_REPORT_TYPES.includes(report_type)) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: `report_type 必须是以下之一：${VALID_REPORT_TYPES.join(', ')}`
      });
    }

    const permission = await prisma.healthSharePermission.findUnique({
      where: { cat_id_org_id: { cat_id: catId, org_id: orgId } }
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
        org_id:      orgId,
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
