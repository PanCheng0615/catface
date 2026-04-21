/**
 * CatFace 数据导入脚本
 * 功能：从 export_data.js 导出的 JSON 文件恢复数据到数据库
 *       自动处理 ID 映射（外键关系）
 *
 * 使用:
 *   node scripts/import_data.js              # 导入所有
 *   node scripts/import_data.js --skip-user  # 跳过 User 表（已有账号）
 *   node scripts/import_data.js --clear       # 导入前清空所有表
 *   node scripts/import_data.js --dry-run     # 仅预览，不实际写入
 *
 * 注意：不会覆盖已有数据（基于 ID 唯一约束跳过重复）
 *      外键关联自动重映射（cat_id, user_id, org_id 等）
 */

require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// 导入顺序很重要：先导主表，再导关联表
const IMPORT_ORDER = [
  'organization',
  'user',
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

// 外键字段映射：模型名 -> [外键字段列表]
const FK_FIELDS = {
  user:                    ['id'],
  organization:             ['id'],
  cat:                     ['id', 'org_id', 'owner_id', 'event_id'],
  catTag:                  ['id', 'cat_id'],
  catRequirement:          ['id', 'cat_id'],
  catUpdate:               ['id', 'cat_id'],
  catFaceEmbedding:        ['id', 'cat_id'],
  userFollow:              ['id', 'follower_id', 'following_id'],
  adopterPreference:       ['id', 'user_id'],
  adoptionSwipe:           ['id', 'user_id', 'cat_id'],
  adoptionApplication:     ['id', 'user_id', 'cat_id', 'event_id', 'reviewed_by'],
  adoptionEvent:           ['id', 'org_id'],
  post:                    ['id', 'user_id'],
  postLike:                ['id', 'user_id', 'post_id'],
  comment:                 ['id', 'user_id', 'post_id'],
  postModeration:          ['id', 'post_id'],
  ownerHealthRecord:       ['id', 'cat_id', 'user_id'],
  clinicHealthReport:      ['id', 'cat_id', 'org_id'],
  clinicRecordEndorsement: ['id', 'record_id', 'org_id'],
  healthSharePermission:   ['id', 'cat_id', 'user_id', 'org_id'],
  conversation:            ['id', 'user_id', 'org_id'],
  message:                 ['id', 'conversation_id', 'sender_id'],
  messageAttachment:       ['id', 'message_id'],
  notificationRead:        ['id', 'user_id'],
};

// Prisma DateTime 字段（需要从 ISO 字符串转换）
const DATETIME_FIELDS = [
  'created_at', 'updated_at', 'date', 'next_due_date',
  'expires_at', 'reviewed_at', 'start_date', 'end_date',
  'reviewed_at', 'updated_at',
];

// ID 映射表：oldId -> newId
const idMap = {};

// 命令行参数
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CLEAR_FIRST = args.includes('--clear');
const SKIP_USER = args.includes('--skip-user');

function log(msg) { console.log(msg); }
function info(msg) { console.log(`  ℹ  ${msg}`); }
function warn(msg) { console.warn(`  ⚠  ${msg}`); }
function ok(msg) { console.log(`  ✅ ${msg}`); }

// 日期字符串转 Date
function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// 处理单条记录的外键映射
function remapRecord(modelName, record) {
  const fkFields = FK_FIELDS[modelName] || [];
  const mapped = { ...record };

  for (const field of fkFields) {
    if (mapped[field] !== undefined && mapped[field] !== null) {
      const oldId = String(mapped[field]);
      if (idMap[oldId]) {
        mapped[field] = idMap[oldId];
      }
    }
  }

  // 转换日期字段
  for (const field of DATETIME_FIELDS) {
    if (mapped[field] !== undefined && mapped[field] !== null) {
      mapped[field] = parseDate(mapped[field]);
    }
  }

  // JSON 字段反序列化
  for (const key of Object.keys(mapped)) {
    if (typeof mapped[key] === 'string' && mapped[key].startsWith('___json___')) {
      try {
        mapped[key] = JSON.parse(mapped[key].replace('___json___', ''));
      } catch (e) { /* keep as string */ }
    }
  }

  return mapped;
}

// 尝试插入或跳过（基于 ID 唯一约束）
async function upsertRecord(modelName, record, skipFields = []) {
  const model = prisma[modelName];
  const data = remapRecord(modelName, record);

  // 移除自动字段
  delete data.updated_at;

  try {
    // 先尝试按 ID 查找是否已存在
    const existing = await model.findUnique({ where: { id: data.id } });
    if (existing) {
      return { action: 'skip', reason: 'already exists' };
    }

    if (DRY_RUN) {
      return { action: 'dry-run', data };
    }

    const created = await model.create({ data });
    // 记录 ID 映射
    if (data.id !== created.id) {
      idMap[data.id] = created.id;
    } else {
      idMap[data.id] = data.id;
    }
    return { action: 'created', id: created.id };
  } catch (e) {
    // 唯一约束冲突 → 跳过
    if (e.code === 'P2002') {
      return { action: 'skip', reason: 'unique constraint' };
    }
    // 外键约束失败
    if (e.code === 'P2003') {
      return { action: 'skip', reason: `fk constraint failed` };
    }
    throw e;
  }
}

// 清空指定模型的数据（按依赖顺序反向删除）
async function clearTable(modelName) {
  try {
    await prisma[modelName].deleteMany({});
    log(`  🗑  Cleared: ${modelName}`);
  } catch (e) {
    warn(`  ⚠  Clear ${modelName} failed (may have FK dep): ${e.message}`);
  }
}

async function importModel(modelName, records) {
  if (!records || records.length === 0) {
    info(`${modelName}: 0 records, skipped`);
    return { total: 0, created: 0, skipped: 0 };
  }

  log(`\n  📦 ${modelName} (${records.length} records)`);

  let created = 0, skipped = 0;

  for (const record of records) {
    // 跳过 User 表（如果设置了 --skip-user）
    if (SKIP_USER && modelName === 'user') {
      skipped++;
      continue;
    }

    const result = await upsertRecord(modelName, record);
    if (result.action === 'created') created++;
    else skipped++;
  }

  ok(`${modelName}: created=${created}, skipped=${skipped}`);
  return { total: records.length, created, skipped };
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   CatFace 数据导入脚本              ║');
  console.log('╚══════════════════════════════════════════╝\n');

  if (DRY_RUN) {
    console.log('🔍 干跑模式（Dry Run）— 不会实际写入数据库\n');
  }

  const EXPORT_DIR = path.join(__dirname, '..', 'data', 'export');
  if (!fs.existsSync(EXPORT_DIR)) {
    console.error(`❌ 导出目录不存在: ${EXPORT_DIR}`);
    console.error('   请先运行: node scripts/export_data.js');
    process.exit(1);
  }

  const manifestPath = path.join(EXPORT_DIR, '_manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`📅 导出时间: ${manifest.exported_at}`);
    console.log(`📊 数据统计:`);
    for (const [model, count] of Object.entries(manifest.counts || {})) {
      console.log(`   ${model.padEnd(30)} : ${String(count).padStart(6)} 条`);
    }
    console.log('');
  }

  // 清空模式
  if (CLEAR_FIRST) {
    console.log('⚠  清空模式 — 将删除所有现有数据！');
    console.log('   按 Ctrl+C 取消，或等待 3 秒继续...\n');
    await new Promise(r => setTimeout(r, 3000));
    console.log('   开始清空表...');
    for (const model of [...IMPORT_ORDER].reverse()) {
      await clearTable(model);
    }
    console.log('');
  }

  // 逐模型导入
  const results = {};
  for (const model of IMPORT_ORDER) {
    const jsonPath = path.join(EXPORT_DIR, `${model}.json`);
    if (!fs.existsSync(jsonPath)) {
      warn(`${model}: JSON file not found, skipped`);
      continue;
    }

    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // 处理嵌套的 JSON 字段（embedding_json 等）
    const records = rawData.map(r => {
      const rec = { ...r };
      for (const key of Object.keys(rec)) {
        if (typeof rec[key] === 'string' && (rec[key].startsWith('[') || rec[key].startsWith('{'))) {
          try {
            const parsed = JSON.parse(rec[key]);
            if (typeof parsed === 'object') {
              rec[key] = parsed;
            }
          } catch (e) { /* not JSON, keep as string */ }
        }
      }
      return rec;
    });

    const result = await importModel(model, records);
    results[model] = result;
  }

  // ID 映射汇总
  const mapCount = Object.keys(idMap).length;

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   导入完成！                           ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  console.log('📊 导入结果:');
  let totalCreated = 0, totalSkipped = 0;
  for (const [model, r] of Object.entries(results)) {
    const status = r.created > 0 ? '✅' : (r.skipped === r.total ? '⏭ ' : '⚠ ');
    console.log(`   ${status} ${model.padEnd(30)} : created=${String(r.created).padStart(4)}, skipped=${String(r.skipped).padStart(4)}`);
    totalCreated += r.created;
    totalSkipped += r.skipped;
  }
  console.log('');
  console.log(`   总计: created=${totalCreated}, skipped=${totalSkipped}`);
  if (mapCount > 0) {
    console.log(`   ID 映射条目: ${mapCount}`);
  }
  console.log('');
  if (DRY_RUN) {
    console.log('💡 以上为干跑预览，实际运行去掉 --dry-run 参数即可导入数据。');
  }
}

main()
  .catch(e => { console.error('\n❌ 错误:', e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
