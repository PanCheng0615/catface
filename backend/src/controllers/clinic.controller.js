const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const VALID_REPORT_TYPES = ['vaccination', 'deworming', 'checkup', 'blood_test', 'treatment', 'surgery', 'other'];

// 优先使用 JWT 中的 organization_id；如果是旧 token，再回退到邮箱映射。
async function getOrgIdForUser(authUser) {
  if (!authUser || authUser.role !== 'clinic_staff') return null;
  if (authUser.organization_id) {
    return authUser.organization_id;
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
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
    const orgId = await getOrgIdForUser(req.user);
    if (!orgId) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '仅诊所工作人员可访问' });
    }

    const now = new Date();
    const permissions = await prisma.healthSharePermission.findMany({
      where: {
        org_id: orgId,
        is_allowed: true,
        OR: [
          { expires_at: null },
          { expires_at: { gt: now } }
        ]
      },
      include: {
        cat: {
          select: {
            id: true, face_code: true, name: true, breed: true, age_months: true,
            gender: true, color: true, photo_url: true, status: true,
            is_neutered: true, is_vaccinated: true, is_dewormed: true,
            owner: { select: { id: true, username: true, display_name: true } }
          }
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    return res.json({
      success: true,
      data: permissions.map((p) => ({
        permission_id: p.id,
        user_id: p.user_id,
        permission_type: p.permission_type,
        expires_at: p.expires_at,
        note: p.note,
        cat: p.cat
      })),
      message: '获取授权猫咪列表成功'
    });
  } catch (error) {
    console.error('getAuthorizedCats error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// GET /api/clinic/permissions
// 诊所端查看自己的所有授权（含统计）
async function getClinicPermissions(req, res) {
  try {
    const orgId = await getOrgIdForUser(req.user);
    if (!orgId) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '仅诊所工作人员可访问' });
    }

    const now = new Date();
    const permissions = await prisma.healthSharePermission.findMany({
      where: { org_id: orgId },
      include: {
        cat: { select: { id: true, name: true, breed: true } },
        user: { select: { id: true, username: true, display_name: true } }
      },
      orderBy: { updated_at: 'desc' }
    });

    const stats = {
      total: permissions.length,
      active: permissions.filter(p => p.is_allowed && (!p.expires_at || p.expires_at > now)).length,
      expired: permissions.filter(p => p.expires_at && p.expires_at <= now).length,
      pending: permissions.filter(p => !p.is_allowed).length
    };

    return res.json({
      success: true,
      data: { permissions, stats },
      message: '获取授权统计成功'
    });
  } catch (error) {
    console.error('getClinicPermissions error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// GET /api/clinic/reports/:reportId
// 获取单份诊所报告详情
async function getClinicReport(req, res) {
  try {
    const { reportId } = req.params;
    const orgId = await getOrgIdForUser(req.user);
    if (!orgId) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '仅诊所工作人员可访问' });
    }

    const report = await prisma.clinicHealthReport.findUnique({
      where: { id: reportId },
      include: {
        cat: {
          select: {
            id: true, name: true, breed: true, age_months: true,
            gender: true, color: true, photo_url: true, is_neutered: true,
            is_vaccinated: true, is_dewormed: true,
            owner: { select: { id: true, username: true, display_name: true } }
          }
        },
        organization: { select: { id: true, name: true, address: true, phone: true } }
      }
    });

    if (!report) {
      return res.status(404).json({ success: false, error: 'NotFound', message: '报告不存在' });
    }

    if (orgId && report.org_id !== orgId) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '无权查看此报告' });
    }

    return res.json({ success: true, data: report, message: '获取报告成功' });
  } catch (error) {
    console.error('getClinicReport error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// GET /api/clinic/reports/:reportId/print
// 生成可打印的专业医疗报告 HTML
// 允许报告所属诊所或猫主人本人访问
async function generateReportPrint(req, res) {
  try {
    const { reportId } = req.params;
    const orgId = await getOrgIdForUser(req.user);

    const report = await prisma.clinicHealthReport.findUnique({
      where: { id: reportId },
      include: {
        cat: {
          select: {
            id: true, name: true, breed: true, age_months: true,
            gender: true, color: true, photo_url: true, is_neutered: true,
            is_vaccinated: true, is_dewormed: true,
            owner: { select: { id: true, username: true, display_name: true } }
          }
        },
        organization: { select: { name: true, address: true, phone: true, logo_url: true } }
      }
    });

    if (!report) {
      return res.status(404).json({ success: false, error: 'NotFound', message: '报告不存在' });
    }

    const isOwner = Boolean(
      req.user &&
      req.user.role === 'user' &&
      report.cat &&
      report.cat.owner &&
      report.cat.owner.id === req.user.id
    );
    const isClinic = Boolean(orgId && report.org_id === orgId);

    if (!isOwner && !isClinic) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '无权查看此报告' });
    }

    const reportNum = `RPT-${new Date(report.date).getFullYear()}-${report.id.slice(0, 8).toUpperCase()}`;
    const typeLabels = {
      vaccination: '疫苗接种证明', deworming: '驱虫证明', checkup: '健康检查报告',
      blood_test: '血液检验报告', treatment: '疾病治疗记录', surgery: '手术/绝育证明', other: '其他医疗文件'
    };
    const genderLabels = { male: '公', female: '母', unknown: '未知' };

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>宠物医疗报告 - ${report.cat.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif; background: #f0f4f8; color: #1a202c; padding: 40px; }
  .report-container { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
  .report-header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: #fff; padding: 32px 40px; }
  .org-name { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
  .org-contact { font-size: 13px; opacity: 0.85; }
  .report-title { text-align: center; padding: 20px 40px; border-bottom: 2px solid #e2e8f0; }
  .report-title h1 { font-size: 20px; letter-spacing: 4px; color: #1e3a5f; }
  .report-title p { font-size: 12px; color: #718096; margin-top: 4px; }
  .report-meta { display: flex; justify-content: space-between; padding: 16px 40px; background: #f7fafc; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #4a5568; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .info-section { padding: 20px 40px; border-bottom: 1px solid #e2e8f0; }
  .info-section h3 { font-size: 13px; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  .info-grid .info-section:first-child { border-right: 1px solid #e2e8f0; }
  .info-row { display: flex; margin-bottom: 8px; font-size: 14px; }
  .info-label { color: #718096; width: 80px; flex-shrink: 0; }
  .info-value { color: #2d3748; font-weight: 500; }
  .report-type-bar { display: flex; align-items: center; gap: 12px; padding: 20px 40px; background: #edf2f7; border-bottom: 1px solid #e2e8f0; }
  .type-badge { display: inline-block; padding: 6px 16px; background: #2d5a87; color: #fff; border-radius: 20px; font-size: 14px; font-weight: 600; }
  .report-body { padding: 28px 40px; }
  .section-title { font-size: 13px; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  .report-body p { font-size: 15px; line-height: 1.8; color: #2d3748; white-space: pre-wrap; }
  .report-footer { padding: 20px 40px; background: #f7fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  .vet-info { font-size: 13px; color: #4a5568; }
  .vet-info strong { display: block; color: #2d3748; margin-top: 4px; }
  .watermark { font-size: 12px; color: #a0aec0; text-align: right; }
  .no-print { display: none; }
  @media print {
    body { background: #fff; padding: 0; }
    .report-container { box-shadow: none; border-radius: 0; }
    .no-print { display: none !important; }
    @page { margin: 20mm; }
  }
</style>
</head>
<body>
<div class="report-container">
  <div class="report-header">
    <div class="org-name">${report.organization?.name || report.org_name || '宠物医疗机构'}</div>
    ${report.organization?.address ? `<div class="org-contact">${report.organization.address}</div>` : ''}
    ${report.organization?.phone ? `<div class="org-contact">${report.organization.phone}</div>` : ''}
  </div>

  <div class="report-title">
    <h1>宠物医疗报告 / PET MEDICAL REPORT</h1>
    <p>本报告由医疗机构出具，具有官方效力</p>
  </div>

  <div class="report-meta">
    <span>报告编号：<strong>${reportNum}</strong></span>
    <span>报告日期：<strong>${new Date(report.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
  </div>

  <div class="info-grid">
    <div class="info-section">
      <h3>宠物信息</h3>
      <div class="info-row"><span class="info-label">名字</span><span class="info-value">${report.cat.name}</span></div>
      <div class="info-row"><span class="info-label">品种</span><span class="info-value">${report.cat.breed || '未知'}</span></div>
      <div class="info-row"><span class="info-label">年龄</span><span class="info-value">${report.cat.age_months ? report.cat.age_months + ' 个月' : '未知'}</span></div>
      <div class="info-row"><span class="info-label">性别</span><span class="info-value">${genderLabels[report.cat.gender] || '未知'}</span></div>
      <div class="info-row"><span class="info-label">体重</span><span class="info-value">${report.findings ? (report.findings.match(/体重[：:]\s*([0-9.]+)\s*kg/i) ? report.findings.match(/体重[：:]\s*([0-9.]+)\s*kg/i)[1] + ' kg' : '—') : '—'}</span></div>
    </div>
    <div class="info-section">
      <h3>主人信息</h3>
      <div class="info-row"><span class="info-label">姓名</span><span class="info-value">${report.cat.owner?.display_name || report.cat.owner?.username || '—'}</span></div>
    </div>
  </div>

  <div class="report-type-bar">
    <span class="type-badge">${typeLabels[report.report_type] || '医疗报告'}</span>
  </div>

  <div class="report-body">
    ${report.findings ? `<div style="margin-bottom:24px;"><div class="section-title">检查结论 / FINDINGS</div><p>${report.findings}</p></div>` : ''}
    <div style="margin-bottom:24px;"><div class="section-title">报告详情 / DETAILS</div><p>${report.description}</p></div>
    ${report.recommendations ? `<div><div class="section-title">医嘱建议 / RECOMMENDATIONS</div><p>${report.recommendations}</p></div>` : ''}
  </div>

  <div class="report-footer">
    <div class="vet-info">
      ${report.vet_name ? `<span>主治兽医：<strong>${report.vet_name}</strong></span>` : ''}
      ${report.vet_license ? `<span style="margin-top:4px;display:block;">执照编号：${report.vet_license}</span>` : ''}
    </div>
    <div class="watermark">
      ${report.organization?.name || report.org_name || '宠物医疗机构'}<br>
      ${new Date(report.created_at).toLocaleDateString('zh-CN')}
    </div>
  </div>

  ${report.file_url ? `<div style="padding:20px 40px;border-top:1px solid #e2e8f0;"><div class="section-title">附件 / ATTACHMENTS</div><a href="${report.file_url}" target="_blank" style="color:#2d5a87;font-size:14px;">点击查看附件文件</a></div>` : ''}
</div>

<div style="max-width:800px;margin:24px auto 0;text-align:center;" class="no-print">
  <button onclick="window.print()" style="padding:10px 32px;background:#2d5a87;color:#fff;border:none;border-radius:8px;font-size:15px;cursor:pointer;margin-right:12px;">列印报告</button>
  <button onclick="window.close()" style="padding:10px 32px;background:#e2e8f0;color:#4a5568;border:none;border-radius:8px;font-size:15px;cursor:pointer;">關閉</button>
</div>
</body>
</html>`;

    return res.json({ success: true, data: { html, report_num: reportNum }, message: '报告生成成功' });
  } catch (error) {
    console.error('generateReportPrint error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// POST /api/clinic/reports/:catId
// 诊所上传一份官方健康报告（org_id 从登录用户关联的机构自动取得）
async function createClinicReport(req, res) {
  try {
    const { catId } = req.params;
    const orgId = await getOrgIdForUser(req.user);
    if (!orgId) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '无法识别您的诊所身份，请确认账号已关联诊所' });
    }
    const { report_type, description, findings, recommendations, vet_name, vet_license, date, file_url } = req.body;

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

    const now = new Date();
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

    if (permission.expires_at && permission.expires_at <= now) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '该授权已过期，无法上传报告'
      });
    }

    if (permission.permission_type === 'read_only') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '该授权类型为只读，不允许上传报告'
      });
    }

    const org = await prisma.organization.findUnique({ where: { id: orgId } });

    const report = await prisma.clinicHealthReport.create({
      data: {
        cat_id: catId,
        org_id: orgId,
        report_type,
        description,
        findings: findings || null,
        recommendations: recommendations || null,
        vet_name: vet_name || null,
        vet_license: vet_license || null,
        org_name: org ? org.name : null,
        date: new Date(date),
        file_url: file_url || null
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
    const { report_type, description, findings, recommendations, vet_name, vet_license, date, file_url } = req.body;
    const orgId = await getOrgIdForUser(req.user);

    if (!orgId) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '仅诊所工作人员可访问' });
    }

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
    if (existing.org_id !== orgId) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '无权修改其他诊所的报告' });
    }

    const data = {};
    if (report_type)           data.report_type    = report_type;
    if (description)            data.description    = description;
    if (findings !== undefined) data.findings      = findings || null;
    if (recommendations !== undefined) data.recommendations = recommendations || null;
    if (vet_name !== undefined) data.vet_name      = vet_name || null;
    if (vet_license !== undefined) data.vet_license = vet_license || null;
    if (date)                  data.date           = new Date(date);
    if (file_url !== undefined) data.file_url      = file_url || null;

    const report = await prisma.clinicHealthReport.update({
      where: { id: reportId },
      data
    });
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
    const orgId = await getOrgIdForUser(req.user);

    if (!orgId) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '仅诊所工作人员可访问' });
    }

    const existing = await prisma.clinicHealthReport.findUnique({ where: { id: reportId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'NotFound', message: '报告不存在' });
    }
    if (existing.org_id !== orgId) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '无权删除其他诊所的报告' });
    }

    await prisma.clinicHealthReport.delete({ where: { id: reportId } });
    return res.json({ success: true, data: null, message: '诊所报告已删除' });
  } catch (error) {
    console.error('deleteClinicReport error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// GET /api/clinic/records/:recordId
// 诊所查看用户健康记录的详细信息（含认证状态）
async function getOwnerRecord(req, res) {
  try {
    const { recordId } = req.params;
    const orgId = await getOrgIdForUser(req.user);
    if (!orgId) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '仅诊所工作人员可访问' });
    }

    const record = await prisma.ownerHealthRecord.findUnique({
      where: { id: recordId },
      include: {
        cat: { select: { id: true, name: true } },
        endorsements: {
          include: { organization: { select: { id: true, name: true } } }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ success: false, error: 'NotFound', message: '记录不存在' });
    }

    const permission = await prisma.healthSharePermission.findUnique({
      where: { cat_id_org_id: { cat_id: record.cat_id, org_id: orgId } }
    });

    if (!permission || !permission.is_allowed) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '未获得该猫咪主人的授权' });
    }

    return res.json({ success: true, data: record, message: '获取记录成功' });
  } catch (error) {
    console.error('getOwnerRecord error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// POST /api/clinic/records/:recordId/endorse
// 诊所对用户健康记录添加官方认证/补充说明
async function endorseOwnerRecord(req, res) {
  try {
    const { recordId } = req.params;
    const orgId = await getOrgIdForUser(req.user);
    if (!orgId) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '无法识别您的诊所身份' });
    }

    const { endorsement, note } = req.body;
    if (!endorsement || !endorsement.trim()) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'endorsement 为必填项'
      });
    }

    const record = await prisma.ownerHealthRecord.findUnique({
      where: { id: recordId },
      include: { cat: { select: { id: true, name: true } } }
    });
    if (!record) {
      return res.status(404).json({ success: false, error: 'NotFound', message: '记录不存在' });
    }

    const permission = await prisma.healthSharePermission.findUnique({
      where: { cat_id_org_id: { cat_id: record.cat_id, org_id: orgId } }
    });
    if (!permission || !permission.is_allowed) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '未获得该猫咪主人的授权' });
    }
    if (permission.expires_at && permission.expires_at <= new Date()) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: '授权已过期' });
    }

    const existing = await prisma.clinicRecordEndorsement.findUnique({
      where: { record_id_org_id: { record_id: recordId, org_id: orgId } }
    });

    let result;
    if (existing) {
      result = await prisma.clinicRecordEndorsement.update({
        where: { record_id_org_id: { record_id: recordId, org_id: orgId } },
        data: { endorsement: endorsement.trim(), note: note ? note.trim() : null }
      });
    } else {
      result = await prisma.clinicRecordEndorsement.create({
        data: {
          record_id: recordId,
          org_id: orgId,
          endorsement: endorsement.trim(),
          note: note ? note.trim() : null
        }
      });
    }

    return res.json({ success: true, data: result, message: '认证添加成功' });
  } catch (error) {
    console.error('endorseOwnerRecord error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

module.exports = {
  getAuthorizedCats,
  getClinicPermissions,
  getClinicReport,
  createClinicReport,
  updateClinicReport,
  deleteClinicReport,
  generateReportPrint,
  endorseOwnerRecord,
  getOwnerRecord
};
