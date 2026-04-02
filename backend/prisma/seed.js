// backend/prisma/seed.js
// 运行: cd backend && node prisma/seed.js
// 先确保 .env 正确，然后 npx prisma db push

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充测试数据...');

  // 清理旧数据（按依赖顺序）
  await prisma.healthSharePermission.deleteMany();
  await prisma.clinicHealthReport.deleteMany();
  await prisma.ownerHealthRecord.deleteMany();
  await prisma.cat.deleteMany();
  await prisma.adoptionEvent.deleteMany();
  await prisma.adoptionApplication.deleteMany();
  await prisma.adopterPreference.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageAttachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.post.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
  await prisma.catFaceEmbedding.deleteMany();

  // ── Organizations ──
  const rescue = await prisma.organization.create({
    data: {
      name:        '愛貓救助站',
      type:        'rescue',
      email:       'rescue@catface-test.com',
      password:    await bcrypt.hash('test1234', 10),
      phone:       '02-12345678',
      address:     '台北市大安區和平東路一段',
      description: '專業流浪貓救助機構',
      is_verified: true
    }
  });

  const clinic = await prisma.organization.create({
    data: {
      name:        '毛孩寵物診所',
      type:        'clinic',
      email:       'clinic@catface-test.com',
      password:    await bcrypt.hash('test1234', 10),
      phone:       '02-87654321',
      address:     '台北市信義區仁愛路四段',
      description: '專業寵物健康檢查與治療',
      is_verified: true
    }
  });

  console.log('✅ Organizations:', rescue.name, '/', clinic.name);

  // ── Users ──
  // 诊所用户的 email 必须和所属机构 email 一致，否则 getOrgIdForUser 找不到对应诊所
  const alice = await prisma.user.create({
    data: {
      email:       'alice@test.com',
      password:    await bcrypt.hash('test1234', 10),
      username:    'alice',
      display_name: '愛貓一族',
      role:        'user'
    }
  });

  // 兽医账号：email 与机构 email 相同，getOrgIdForUser 据此匹配
  const vet = await prisma.user.create({
    data: {
      email:       'clinic@catface-test.com',   // 与下面 clinic org 的 email 一致
      password:    await bcrypt.hash('test1234', 10),
      username:    'vetdoctor',
      display_name: '阿獸醫生',
      role:        'clinic_staff'
    }
  });

  // 救助站工作人员账号：email 与机构 email 一致
  const staff = await prisma.user.create({
    data: {
      email:       'rescue@catface-test.com',  // 与下面 rescue org 的 email 一致
      password:    await bcrypt.hash('test1234', 10),
      username:    'rescuestaffer',
      display_name: '救助站工作員',
      role:        'rescue_staff'
    }
  });

  console.log('✅ Users:', alice.username, '/', vet.username, '/', staff.username);

  // ── Cats ──
  const cat1 = await prisma.cat.create({
    data: {
      name:          '小花',
      breed:         '橘貓',
      age_months:    24,
      gender:        'female',
      color:         '橘白',
      description:   '性格溫順，愛撒嬌',
      status:        'available',
      is_neutered:   false,
      is_vaccinated: true,
      is_dewormed:   true,
      owner_id:      alice.id,
      org_id:        rescue.id,
      face_code:     'CF-2026-00001'
    }
  });

  const cat2 = await prisma.cat.create({
    data: {
      name:          '小黑',
      breed:         '米克斯',
      age_months:    12,
      gender:        'male',
      color:         '黑白',
      description:   '活潑好動',
      status:        'available',
      is_neutered:   true,
      is_vaccinated: true,
      is_dewormed:   false,
      owner_id:      alice.id,
      face_code:     'CF-2026-00002'
    }
  });

  const cat3 = await prisma.cat.create({
    data: {
      name:          '小白',
      breed:         '波斯貓',
      age_months:    36,
      gender:        'male',
      color:         '白色',
      description:   '安靜優雅',
      status:        'available',
      is_neutered:   true,
      is_vaccinated: true,
      is_dewormed:   true,
      org_id:        rescue.id,
      face_code:     'CF-2026-00003'
    }
  });

  console.log('✅ Cats:', cat1.name, '/', cat2.name, '/', cat3.name);

  // ── Health Records (owner) ──
  const hr1 = await prisma.ownerHealthRecord.create({
    data: {
      cat_id:       cat1.id,
      user_id:      alice.id,
      record_type:  'vaccine',
      description:  '施打貓三合一疫苗',
      date:         new Date('2026-01-15'),
      next_due_date: new Date('2027-01-15'),
      weight_kg:    4.2,
      vet_name:     '林醫師',
      clinic_name:  '毛孩寵物診所'
    }
  });

  const hr2 = await prisma.ownerHealthRecord.create({
    data: {
      cat_id:       cat1.id,
      user_id:      alice.id,
      record_type:  'deworming',
      description:  '體內驅蟲',
      date:         new Date('2026-02-20'),
      next_due_date: new Date('2026-08-20'),
      weight_kg:    4.3
    }
  });

  const hr3 = await prisma.ownerHealthRecord.create({
    data: {
      cat_id:       cat2.id,
      user_id:      alice.id,
      record_type:  'checkup',
      description:  '半年健康檢查，體重正常',
      date:         new Date('2026-03-01'),
      weight_kg:    5.1,
      vet_name:     '王醫師'
    }
  });

  console.log('✅ Owner health records:', hr1.id.slice(0, 8), '/', hr2.id.slice(0, 8), '/', hr3.id.slice(0, 8));

  // ── Health Share Permission ──
  const share1 = await prisma.healthSharePermission.create({
    data: {
      cat_id:     cat1.id,
      user_id:    alice.id,
      org_id:     clinic.id,
      is_allowed: true
    }
  });

  console.log('✅ Health share permission:', share1.id.slice(0, 8));

  // ── Clinic Report ──
  const cr1 = await prisma.clinicHealthReport.create({
    data: {
      cat_id:      cat1.id,
      org_id:      clinic.id,
      report_type: 'vaccination',
      description: '官方疫苗注射證明（狂犬病 + 貓三合一）',
      date:        new Date('2026-01-15')
    }
  });

  const cr2 = await prisma.clinicHealthReport.create({
    data: {
      cat_id:      cat2.id,
      org_id:      clinic.id,
      report_type: 'checkup',
      description: '血液檢查正常，無寄生蟲',
      date:        new Date('2026-03-01')
    }
  });

  console.log('✅ Clinic reports:', cr1.id.slice(0, 8), '/', cr2.id.slice(0, 8));

  // ── Adoption Events ──
  const evt = await prisma.adoptionEvent.create({
    data: {
      name:        '第3屆領養會',
      edition:     3,
      start_date:  new Date('2026-04-10'),
      end_date:    new Date('2026-04-12'),
      location:    '台北市動物之家',
      description: '春季流浪貓領養活動',
      org_id:      rescue.id
    }
  });

  console.log('✅ Adoption event:', evt.name);

  console.log('\n🎉 Seed 完成！');
  console.log('\n📋 測試帳號：');
  console.log('  普通用户:  alice@test.com              / test1234  (ID:', alice.id.slice(0, 8), ')');
  console.log('  诊所員工:  clinic@catface-test.com   / test1234  (ID:', vet.id.slice(0, 8), ')');
  console.log('  救助員工:  rescue@catface-test.com    / test1234  (ID:', staff.id.slice(0, 8), ')');
  console.log('\n🐱 測試貓咪：');
  console.log('  小花:', cat1.id, '(owner=alice)');
  console.log('  小黑:', cat2.id, '(owner=alice)');
  console.log('  小白:', cat3.id, '(org=rescue)');
  console.log('\n🏥 機構：');
  console.log('  愛貓救助站:', rescue.id);
  console.log('  毛孩寵物診所:', clinic.id);
}

main()
  .catch(e => { console.error('❌ Seed 失敗:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
