const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const VALID_RECORD_TYPES = ['vaccine', 'deworming', 'checkup', 'treatment', 'surgery', 'other'];

// GET /api/health/records/:catId
// 获取指定猫咪的全部健康档案（主人记录 + 诊所报告 + 授权状态）
async function getHealthRecords(req, res) {
  try {
    const { catId } = req.params;

    const [ownerRecords, clinicReports, sharePermissions] = await Promise.all([
      prisma.ownerHealthRecord.findMany({
        where: { cat_id: catId },
        orderBy: { date: 'desc' }
      }),
      prisma.clinicHealthReport.findMany({
        where: { cat_id: catId },
        include: { organization: { select: { id: true, name: true, type: true } } },
        orderBy: { date: 'desc' }
      }),
      prisma.healthSharePermission.findMany({
        where: { cat_id: catId }
      })
    ]);

    return res.json({
      success: true,
      data: { owner_records: ownerRecords, clinic_reports: clinicReports, share_permissions: sharePermissions },
      message: '获取健康记录成功'
    });
  } catch (error) {
    console.error('getHealthRecords error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// POST /api/health/records/:catId
// 新建一条主人健康记录
async function createOwnerHealthRecord(req, res) {
  try {
    const { catId } = req.params;
    const { user_id, record_type, description, date, next_due_date, weight_kg, vet_name, clinic_name, file_url } = req.body;

    if (!user_id || !record_type || !description || !date) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'user_id、record_type、description、date 为必填项'
      });
    }

    if (!VALID_RECORD_TYPES.includes(record_type)) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: `record_type 必须是以下之一：${VALID_RECORD_TYPES.join(', ')}`
      });
    }

    const record = await prisma.ownerHealthRecord.create({
      data: {
        cat_id:        catId,
        user_id,
        record_type,
        description,
        date:          new Date(date),
        next_due_date: next_due_date ? new Date(next_due_date) : null,
        weight_kg:     weight_kg     ? parseFloat(weight_kg)  : null,
        vet_name:      vet_name      || null,
        clinic_name:   clinic_name   || null,
        file_url:      file_url      || null
      }
    });

    return res.status(201).json({ success: true, data: record, message: '健康记录创建成功' });
  } catch (error) {
    console.error('createOwnerHealthRecord error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// PUT /api/health/records/:recordId
// 更新一条主人健康记录
async function updateOwnerHealthRecord(req, res) {
  try {
    const { recordId } = req.params;
    const { record_type, description, date, next_due_date, weight_kg, vet_name, clinic_name } = req.body;

    if (record_type && !VALID_RECORD_TYPES.includes(record_type)) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: `record_type 必须是以下之一：${VALID_RECORD_TYPES.join(', ')}`
      });
    }

    const existing = await prisma.ownerHealthRecord.findUnique({ where: { id: recordId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'NotFound', message: '健康记录不存在' });
    }

    const data = {};
    if (record_type)   data.record_type   = record_type;
    if (description)   data.description   = description;
    if (date)          data.date          = new Date(date);
    if (next_due_date !== undefined) data.next_due_date = next_due_date ? new Date(next_due_date) : null;
    if (weight_kg     !== undefined) data.weight_kg     = weight_kg     ? parseFloat(weight_kg)  : null;
    if (vet_name      !== undefined) data.vet_name      = vet_name      || null;
    if (clinic_name   !== undefined) data.clinic_name   = clinic_name   || null;

    const record = await prisma.ownerHealthRecord.update({ where: { id: recordId }, data });
    return res.json({ success: true, data: record, message: '健康记录更新成功' });
  } catch (error) {
    console.error('updateOwnerHealthRecord error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// DELETE /api/health/records/:recordId
// 删除一条主人健康记录
async function deleteOwnerHealthRecord(req, res) {
  try {
    const { recordId } = req.params;

    const existing = await prisma.ownerHealthRecord.findUnique({ where: { id: recordId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'NotFound', message: '健康记录不存在' });
    }

    await prisma.ownerHealthRecord.delete({ where: { id: recordId } });
    return res.json({ success: true, data: null, message: '健康记录已删除' });
  } catch (error) {
    console.error('deleteOwnerHealthRecord error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// GET /api/health/share/:catId
// 获取某只猫的诊所授权列表
async function getSharePermissions(req, res) {
  try {
    const { catId } = req.params;

    const permissions = await prisma.healthSharePermission.findMany({
      where: { cat_id: catId }
    });

    return res.json({ success: true, data: permissions, message: '获取授权列表成功' });
  } catch (error) {
    console.error('getSharePermissions error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

// POST /api/health/share
// 设置或更新猫主人对某诊所的授权（upsert）
async function setHealthSharePermission(req, res) {
  try {
    const { cat_id, user_id, org_id, is_allowed } = req.body;

    if (!cat_id || !user_id || !org_id || typeof is_allowed !== 'boolean') {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'cat_id、user_id、org_id、is_allowed（布尔值）为必填项'
      });
    }

    const permission = await prisma.healthSharePermission.upsert({
      where:  { cat_id_org_id: { cat_id, org_id } },
      update: { user_id, is_allowed },
      create: { cat_id, user_id, org_id, is_allowed }
    });

    return res.json({ success: true, data: permission, message: '授权设置成功' });
  } catch (error) {
    console.error('setHealthSharePermission error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

module.exports = {
  getHealthRecords,
  createOwnerHealthRecord,
  updateOwnerHealthRecord,
  deleteOwnerHealthRecord,
  getSharePermissions,
  setHealthSharePermission
};
