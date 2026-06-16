/**
 * CatFace 数据导出脚本
 * 功能：将数据库中的数据导出为 JSON 文件（完整数据）和 Excel 文件（便于人工查看/编辑）
 *
 * 使用: node scripts/export_data.js
 * 输出: backend/data/export/ 目录下的多个 JSON 和 Excel 文件
 */

require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

// 输出目录
const EXPORT_DIR = path.join(__dirname, '..', 'data', 'export');
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

const MODELS = [
  'user',
  'organization',
  'cat',
  'catTag',
  'catRequirement',
  'catUpdate',
  'catFaceEmbedding',
  'userFollow',
  'adopterPreference',
  'adoptionSwipe',
  'adoptionApplication',
  'adoptionEvent',
  'post',
  'postLike',
  'comment',
  'postModeration',
  'ownerHealthRecord',
  'clinicHealthReport',
  'clinicRecordEndorsement',
  'healthSharePermission',
  'conversation',
  'message',
  'messageAttachment',
  'notificationRead',
];

// JSON 序列化时的处理
function safeSerialize(value) {
  if (value === undefined) return null;
  if (value instanceof Buffer) return value.toString('base64');
  if (value instanceof Date) return value.toISOString();
  return value;
}

// 主导出逻辑
async function exportModel(modelName) {
  console.log(`  Exporting ${modelName}...`);
  const records = await prisma[modelName].findMany({});
  const cleaned = records.map(r => {
    const obj = { ...r };
    for (const key of Object.keys(obj)) {
      obj[key] = safeSerialize(obj[key]);
    }
    return obj;
  });
  return cleaned;
}

// 将数据写入 JSON 文件
function writeJSON(filename, data) {
  const filePath = path.join(EXPORT_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  Wrote: ${filename} (${data.length} rows)`);
}

// 将数据写入 Excel 文件
function writeExcel(filename, data) {
  if (data.length === 0) {
    console.log(`  Skipped (empty): ${filename}`);
    return;
  }
  const filePath = path.join(EXPORT_DIR, filename);
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  // 设置列宽
  const cols = Object.keys(data[0] || {});
  worksheet['!cols'] = cols.map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, filePath);
  console.log(`  Wrote: ${filename} (${data.length} rows, Excel)`);
}

// 单独导出关键数据为 Excel（方便查看）
async function exportKeyExcel() {
  console.log('\n Generating Excel summary files...');

  const [users, orgs, cats, posts] = await Promise.all([
    prisma.user.findMany({ select: { id: true, email: true, username: true, display_name: true, role: true, has_cat: true, created_at: true } }),
    prisma.organization.findMany({ select: { id: true, name: true, type: true, email: true, phone: true, is_verified: true, created_at: true } }),
    prisma.cat.findMany({ select: { id: true, name: true, breed: true, age_months: true, gender: true, color: true, status: true, is_neutered: true, is_vaccinated: true, is_dewormed: true, org_id: true, owner_id: true, created_at: true } }),
    prisma.post.findMany({ select: { id: true, content: true, image_url: true, user_id: true, created_at: true } }),
  ]);

  const [healthRecords, clinicReports, endorsements, permissions] = await Promise.all([
    prisma.ownerHealthRecord.findMany({ select: { id: true, cat_id: true, record_type: true, description: true, date: true, next_due_date: true, weight_kg: true, vet_name: true, clinic_name: true, created_at: true } }),
    prisma.clinicHealthReport.findMany({ select: { id: true, cat_id: true, org_id: true, report_type: true, description: true, findings: true, recommendations: true, vet_name: true, vet_license: true, date: true, created_at: true } }),
    prisma.clinicRecordEndorsement.findMany({ select: { id: true, record_id: true, org_id: true, endorsement: true, note: true, created_at: true } }),
    prisma.healthSharePermission.findMany({ select: { id: true, cat_id: true, user_id: true, org_id: true, permission_type: true, is_allowed: true, expires_at: true, created_at: true } }),
  ]);

  const summary = {
    '01_Users': users,
    '02_Organizations': orgs,
    '03_Cats': cats,
    '04_HealthRecords': healthRecords,
    '05_ClinicReports': clinicReports,
    '06_Endorsements': endorsements,
    '07_Permissions': permissions,
    '08_Posts': posts,
  };

  for (const [name, data] of Object.entries(summary)) {
    writeExcel(`${name}.xlsx`, data);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║   CatFace 数据导出脚本             ║');
  console.log('╚══════════════════════════════════════╝\n');
  console.log(`输出目录: ${EXPORT_DIR}\n`);

  const stats = {};

  for (const model of MODELS) {
    try {
      const data = await exportModel(model);
      writeJSON(`${model}.json`, data);
      stats[model] = data.length;
    } catch (e) {
      console.warn(`  ⚠  Skip ${model}: ${e.message}`);
    }
  }

  await exportKeyExcel();

  // 生成汇总文件
  const manifest = {
    exported_at: new Date().toISOString(),
    db_url: process.env.DATABASE_URL || 'N/A',
    counts: stats,
    note: '此文件由 export_data.js 自动生成。使用 import_data.js 导入。',
  };
  writeJSON('_manifest.json', manifest);

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   导出完成！                           ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  console.log('📁 输出文件:');
  console.log(`   JSON 目录: ${EXPORT_DIR}`);
  console.log('');
  console.log('📊 数据统计:');
  for (const [model, count] of Object.entries(stats)) {
    console.log(`   ${model.padEnd(30)} : ${String(count).padStart(6)} 条`);
  }
  console.log('');
  console.log('💡 使用 import_data.js 导入到其他环境:');
  console.log('   node scripts/import_data.js');
}

main()
  .catch(e => { console.error('❌ 错误:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
