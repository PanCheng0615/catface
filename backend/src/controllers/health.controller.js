const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
        orderBy: { date: 'desc' }
      }),
      prisma.healthSharePermission.findMany({
        where: { cat_id: catId },
        orderBy: { created_at: 'desc' }
      })
    ]);

    return res.json({
      success: true,
      data: {
        owner_records: ownerRecords,
        clinic_reports: clinicReports,
        share_permissions: sharePermissions
      },
      message: '获取健康记录成功'
    });
  } catch (error) {
    console.error('getHealthRecords error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function upsertOwnerHealthRecord(req, res) {
  try {
    const { catId } = req.params;
    const { record_id, user_id, record_type, description, date } = req.body;

    if (!user_id || !record_type || !description || !date) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'user_id、record_type、description、date 为必填项'
      });
    }

    const data = {
      cat_id: catId,
      user_id,
      record_type,
      description,
      date: new Date(date)
    };

    const record = record_id
      ? await prisma.ownerHealthRecord.update({
          where: { id: record_id },
          data
        })
      : await prisma.ownerHealthRecord.create({
          data
        });

    return res.json({
      success: true,
      data: record,
      message: record_id ? '更新健康记录成功' : '创建健康记录成功'
    });
  } catch (error) {
    console.error('upsertOwnerHealthRecord error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function setHealthSharePermission(req, res) {
  try {
    const { cat_id, user_id, org_id, is_allowed } = req.body;

    if (!cat_id || !user_id || !org_id || typeof is_allowed !== 'boolean') {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'cat_id、user_id、org_id、is_allowed 为必填项'
      });
    }

    const permission = await prisma.healthSharePermission.upsert({
      where: {
        cat_id_org_id: {
          cat_id,
          org_id
        }
      },
      update: {
        user_id,
        is_allowed
      },
      create: {
        cat_id,
        user_id,
        org_id,
        is_allowed
      }
    });

    return res.json({
      success: true,
      data: permission,
      message: '健康数据共享权限更新成功'
    });
  } catch (error) {
    console.error('setHealthSharePermission error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

module.exports = {
  getHealthRecords,
  upsertOwnerHealthRecord,
  setHealthSharePermission
};
