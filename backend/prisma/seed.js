/**
 * Prisma Seed Script — 全表覆盖版
 * 用途：向所有表填充真实/仿真测试数据，供全员开发使用
 * 执行：npm run seed
 * 重置：npx prisma db push --force-reset && npm run seed
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── 辅助函数 ────────────────────────────────────────────

function parseAge(str) {
  if (!str || str === 'N/A') return null;
  str = String(str).trim();
  let months = 0;
  const yearMatch  = str.match(/(\d+)\s*岁/);
  const monthMatch = str.match(/(\d+)\s*个月/);
  if (yearMatch)  months += parseInt(yearMatch[1]) * 12;
  if (monthMatch) months += parseInt(monthMatch[1]);
  return months || null;
}
function parseGender(g) {
  if (g === 'M') return 'male';
  if (g === 'F') return 'female';
  return 'unknown';
}
function parseStatus(adopted) {
  if (adopted === 1)    return 'adopted';
  if (adopted === '0*') return 'fostered';
  return 'available';
}
function parseBool(val) {
  if (!val || val === 'N/A') return null;
  return val.includes('完成');
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function range(n)  { return Array.from({ length: n }, (_, i) => i); }

// ─── 猫咪原始数据（来自 Excel）────────────────────────────

const CATS_2ND = [
  ['墨水',          1,    'M', '1个月',   '橘猫', '已完成', 'N/A',    'N/A',    ['可爱', '淘气'],           ''],
  ['墨纸',          1,    'M', '1个月',   '橘猫', '已完成', 'N/A',    'N/A',    ['可爱', '淘气'],           ''],
  ['墨布',          1,    'M', '1个月',   '橘猫', '已完成', 'N/A',    'N/A',    [],                       ''],
  ['豆豆',          0,    'M', '5个月',   '狸花', '已完成', 'N/A',    'N/A',    ['爱说话', '乖巧', '粘人'], ''],
  ['臭臭',          1,    'M', '2岁',     '黑猫', '已完成', 'N/A',    'N/A',    ['安静', '害羞', '慢热'],   ''],
  ['小笨笨',        0,    'M', '5个月',   '狸花', '已完成', 'N/A',    'N/A',    ['温顺', '乖巧', '爱吃'],   ''],
  ['招想',          0,    'F', '2岁',     '橘白', '已完成', 'N/A',    'N/A',    [],                       ''],
];
const CATS_3RD = [
  ['刷碟猫',        '0*', 'F', '1岁5个月','橘白', '已完成', 'N/A',    '已完成', [],                       ''],
  ['厕所仔(Lucky)', 1,    'M', '6个月',   '橘白', '已完成', 'N/A',    'N/A',    [],                       ''],
  ['洗手盆子',      1,    'M', '4个月',   '狸花', '已完成', 'N/A',    'N/A',    ['异瞳'],                 ''],
  ['Kiwi',          1,    'F', '4个月',   '狸花', '已完成', 'N/A',    'N/A',    [],                       ''],
  ['毛巾仔',        1,    'M', '4个月',   '狸花', '已完成', 'N/A',    'N/A',    [],                       ''],
  ['格格',          1,    'F', '3个月',   '狸花', '已完成', 'N/A',    'N/A',    [],                       ''],
  ['Luno',          '0*', 'M', '3个月',   '橘白', '已完成', 'N/A',    'N/A',    ['半异瞳'],               ''],
  ['探职仔(汤圆)',  1,    'M', '3个月',   '狸花', '已完成', 'N/A',    'N/A',    [],                       ''],
  ['豆豆',          0,    'M', '9个月',   '狸花', '已完成', '已完成', '已完成', [],                       '第二次来'],
  ['招想',          0,    'F', '2岁6个月','橘白', '已完成', '已完成', '已完成', [],                       '第二次来'],
  ['大B',           1,    'X', '3周',     '狸花', 'N/A',    'N/A',    'N/A',    [],                       ''],
  ['细B',           1,    'X', '3周',     '狸花', 'N/A',    'N/A',    'N/A',    [],                       ''],
  ['大小B姊姊',     0,    'F', '8个月',   '狸花', '已完成', 'N/A',    'N/A',    [],                       ''],
  ['虎纹仔(Yomi)', 1,    'M', '1个月',   '狸花', '已完成', 'N/A',    'N/A',    [],                       ''],
  ['小橘(Pika)',   1,    'F', '1个月',   '橘猫', '已完成', 'N/A',    'N/A',    [],                       ''],
  ['白果',          0,    'M', '1岁',     '橘白', '已完成', '已完成', '已完成', [],                       ''],
  ['大佬',          0,    'M', '1岁',     '橘白', '已完成', '已完成', '已完成', [],                       ''],
];
const CATS_4TH = [
  ['果妹',          1,    'F', '6个月',   '橘猫', '已完成', 'N/A',    'N/A',    [],  '2026.1提前上架'],
  ['救命',          0,    'F', '6个月',   '狸花', '已完成', 'N/A',    'N/A',    [],  ''],
  ['起司',          0,    'M', '6个月',   '狸花', '已完成', 'N/A',    'N/A',    [],  ''],
  ['乌云踏雪',      1,    'M', '7个月',   '狸花', '已完成', '已完成', 'N/A',    [],  ''],
  ['乌云燕雪',      1,    'M', '7个月',   '狸花', '已完成', '已完成', 'N/A',    [],  ''],
  ['赤绒趴雪',      0,    'M', '7个月',   '橘猫', '已完成', '已完成', 'N/A',    [],  ''],
  ['小橘',          1,    'M', '6个月',   '橘猫', '已完成', 'N/A',    'N/A',    [],  ''],
];

// ─── 测试用户（偏好多样，覆盖推荐算法各场景）────────────────

const TEST_USERS = [
  { email: 'alice@test.com',  username: 'alice',  display_name: '小艾',   role: 'user',
    pref: { preferred_age: 'kitten', preferred_gender: 'female',        preferred_breed: '橘猫', has_other_pets: false, has_children: false, home_type: 'apartment', accept_special_need: false } },
  { email: 'bob@test.com',    username: 'bob',    display_name: '阿伯',   role: 'user',
    pref: { preferred_age: 'adult',  preferred_gender: 'male',          preferred_breed: '狸花', has_other_pets: true,  has_children: false, home_type: 'house',     accept_special_need: false } },
  { email: 'carol@test.com',  username: 'carol',  display_name: '小玲',   role: 'user',
    pref: { preferred_age: 'kitten', preferred_gender: 'no_preference', preferred_breed: null,   has_other_pets: false, has_children: true,  home_type: 'apartment', accept_special_need: true  } },
  { email: 'david@test.com',  username: 'david',  display_name: '大卫',   role: 'user',
    pref: { preferred_age: 'adult',  preferred_gender: 'female',        preferred_breed: '橘白', has_other_pets: false, has_children: false, home_type: 'house',     accept_special_need: false } },
  { email: 'emma@test.com',   username: 'emma',   display_name: 'Emma',  role: 'user',
    pref: { preferred_age: 'kitten', preferred_gender: 'male',          preferred_breed: '橘猫', has_other_pets: true,  has_children: true,  home_type: 'house',     accept_special_need: false } },
  { email: 'frank@test.com',  username: 'frank',  display_name: '法兰克', role: 'user',
    pref: { preferred_age: 'senior', preferred_gender: 'no_preference', preferred_breed: '黑猫', has_other_pets: false, has_children: false, home_type: 'apartment', accept_special_need: true  } },
  { email: 'grace@test.com',  username: 'grace',  display_name: '阿雅',   role: 'user',
    pref: { preferred_age: 'kitten', preferred_gender: 'female',        preferred_breed: '狸花', has_other_pets: false, has_children: false, home_type: 'apartment', accept_special_need: false } },
  { email: 'henry@test.com',  username: 'henry',  display_name: '阿亨',   role: 'user',
    pref: { preferred_age: 'adult',  preferred_gender: 'male',          preferred_breed: null,   has_other_pets: true,  has_children: true,  home_type: 'house',     accept_special_need: false } },
  { email: 'iris@test.com',   username: 'iris',   display_name: '小欣',   role: 'user',
    pref: { preferred_age: 'kitten', preferred_gender: 'no_preference', preferred_breed: '橘白', has_other_pets: false, has_children: false, home_type: 'apartment', accept_special_need: false } },
  { email: 'jack@test.com',   username: 'jack',   display_name: '小杰',   role: 'user',
    pref: { preferred_age: 'adult',  preferred_gender: 'female',        preferred_breed: '狸花', has_other_pets: false, has_children: false, home_type: 'house',     accept_special_need: true  } },
  // 机构工作人员账号（供 Member 6 聊天测试用）
  { email: 'staff@rescue.com', username: 'rescue_staff', display_name: '救助站小陈', role: 'rescue_staff', pref: null },
  { email: 'vet@clinic.com',   username: 'clinic_vet',   display_name: '林医生',     role: 'clinic_staff', pref: null },
];

// ─── 社区帖子内容 ─────────────────────────────────────────

const POST_TEMPLATES = [
  '今天带{cat}去打疫苗，表现超乖，医生说身体很健康！',
  '{cat}最近爱上了纸箱，每天都要钻进去睡觉，太可爱了😂',
  '领养{cat}已经一个月了，从怕生到现在每天追着我要抱抱，真的变化好大！',
  '求推荐猫粮！{cat}最近不爱吃现在的，有没有好吃又不贵的选择？',
  '分享一下{cat}今天的日常照，窗台上晒太阳真的很享受~',
  '{cat}今天做了绝育手术，恢复得很好，明天就可以出院了！',
  '家里新添了一只小猫，和{cat}磨合中，希望它们能成为好朋友',
  '有没有人知道{cat}这个品种的护理要点？毛发打理太费劲了',
  '今天{cat}第一次出门探险，回来之后累到直接倒头就睡，太萌了',
  '推荐大家去参加领养会，我家{cat}就是从那里来的，真的很有缘分',
];

// ─── 主函数 ──────────────────────────────────────────────

async function main() {
  console.log('🌱 开始全表 Seed...\n');

  const hashedPw = await bcrypt.hash('test1234', 10);

  // ══════════════════════════════════════════
  // 1. 机构
  // ══════════════════════════════════════════
  console.log('📦 [1/10] 创建机构...');
  const rescueOrg = await prisma.organization.upsert({
    where:  { email: 'rescue@catface-seed.com' },
    update: {},
    create: {
      name: '流浪猫救助协会（测试）', type: 'rescue',
      email: 'rescue@catface-seed.com', password: await bcrypt.hash('seed1234', 10),
      phone: '0900000000', address: '台北市大安区', is_verified: true,
      description: '专注于流浪猫收容与送养的公益机构'
    }
  });
  const clinicOrg = await prisma.organization.upsert({
    where:  { email: 'clinic@catface-seed.com' },
    update: {},
    create: {
      name: '爱心动物诊所（测试）', type: 'clinic',
      email: 'clinic@catface-seed.com', password: await bcrypt.hash('seed1234', 10),
      phone: '0911111111', address: '台北市信义区', is_verified: true,
      license_number: 'VET-2024-0001',
      description: '提供猫咪专业健康检查与疫苗接种服务'
    }
  });
  console.log(`   ✅ 救助机构 ${rescueOrg.id.slice(0,8)}… | 诊所 ${clinicOrg.id.slice(0,8)}…`);

  // ══════════════════════════════════════════
  // 2. 用户
  // ══════════════════════════════════════════
  console.log('\n👤 [2/10] 创建用户...');
  const users = [];
  for (const u of TEST_USERS) {
    const user = await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: {
        email: u.email, password: hashedPw,
        username: u.username, display_name: u.display_name, role: u.role,
        adopter_preferences: u.pref ? { create: u.pref } : undefined
      }
    });
    users.push(user);
    console.log(`   👤 ${u.display_name.padEnd(8)} | ${u.role}`);
  }
  const normalUsers  = users.filter(u => u.role === 'user');
  const staffUser    = users.find(u => u.role === 'rescue_staff');
  const clinicUser   = users.find(u => u.role === 'clinic_staff');

  // ══════════════════════════════════════════
  // 3. 关注关系
  // ══════════════════════════════════════════
  console.log('\n🔗 [3/10] 创建关注关系...');
  const followPairs = [
    [0,1],[0,2],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],
    [1,0],[3,0],[4,1],[5,2],[6,3],[7,4],[9,0],
  ];
  let followCount = 0;
  for (const [a, b] of followPairs) {
    if (a >= normalUsers.length || b >= normalUsers.length) continue;
    await prisma.userFollow.upsert({
      where:  { follower_id_following_id: { follower_id: normalUsers[a].id, following_id: normalUsers[b].id } },
      update: {},
      create: { follower_id: normalUsers[a].id, following_id: normalUsers[b].id }
    });
    followCount++;
  }
  console.log(`   ✅ ${followCount} 条关注关系`);

  // ══════════════════════════════════════════
  // 4. 领养活动
  // ══════════════════════════════════════════
  console.log('\n📅 [4/10] 创建领养活动...');
  const [ev2, ev3, ev4] = await Promise.all([
    prisma.adoptionEvent.upsert({ where: { id: 'seed-event-2nd-00000000-0000' }, update: {},
      create: { id: 'seed-event-2nd-00000000-0000', name: '第2届领养会', edition: 2,
        start_date: new Date('2025-06-21'), end_date: new Date('2025-06-22'),
        location: '台北市大安区四维路', org_id: rescueOrg.id } }),
    prisma.adoptionEvent.upsert({ where: { id: 'seed-event-3rd-00000000-0000' }, update: {},
      create: { id: 'seed-event-3rd-00000000-0000', name: '第3届领养会', edition: 3,
        start_date: new Date('2025-09-20'), end_date: new Date('2025-09-21'),
        location: '台北市信义区松仁路', org_id: rescueOrg.id } }),
    prisma.adoptionEvent.upsert({ where: { id: 'seed-event-4th-00000000-0000' }, update: {},
      create: { id: 'seed-event-4th-00000000-0000', name: '第4届领养会', edition: 4,
        start_date: new Date('2026-01-24'), end_date: new Date('2026-01-25'),
        location: '台北市中山区民生东路', org_id: rescueOrg.id } }),
  ]);
  console.log('   ✅ 第2、3、4届领养活动');

  // ══════════════════════════════════════════
  // 5. 猫咪 + 标签 + 要求 + 动态
  // ══════════════════════════════════════════
  console.log('\n🐱 [5/10] 创建猫咪档案...');
  const allCatRows = [
    ...CATS_2ND.map(r => ({ row: r, event: ev2, date: new Date('2025-06-21') })),
    ...CATS_3RD.map(r => ({ row: r, event: ev3, date: new Date('2025-09-20') })),
    ...CATS_4TH.map(r => ({ row: r, event: ev4, date: new Date('2026-01-24') })),
  ];

  const createdCats = [];
  for (const { row, event, date } of allCatRows) {
    const [name, adopted, gender, ageStr, breed, dewormed, vaccinated, neutered, tags] = row;
    const g = gender === 'X' ? 'unknown' : parseGender(gender);
    const cat = await prisma.cat.create({
      data: {
        name, breed,
        age_months:    parseAge(ageStr),
        gender:        g,
        status:        parseStatus(adopted),
        is_neutered:   parseBool(neutered),
        is_vaccinated: parseBool(vaccinated),
        is_dewormed:   parseBool(dewormed),
        intake_date:   date,
        org_id:        rescueOrg.id,
        event_id:      event.id,
        tags: tags.length ? { create: tags.map(tag => ({ tag })) } : undefined,
        // 可领养的猫加领养要求
        requirements: parseStatus(adopted) === 'available' ? {
          create: [
            { description: '领养前需填写领养申请表并通过审核' },
            { description: '需提供稳定的居住环境，不可频繁搬家' },
            ...(parseBool(neutered) ? [] : [{ description: '领养后须在三个月内完成绝育手术' }])
          ]
        } : undefined,
        // 所有猫加一条动态
        updates: {
          create: [{
            content: `${name} 于 ${date.toISOString().slice(0,10)} 参加${event.name}，已完成健康检查。`,
          }]
        }
      }
    });
    createdCats.push({ cat, adopted });
  }
  console.log(`   ✅ ${createdCats.length} 只猫咪（含标签、要求、动态）`);

  // ══════════════════════════════════════════
  // 6. 领养申请
  // ══════════════════════════════════════════
  console.log('\n📝 [6/10] 创建领养申请...');
  const adoptedCats    = createdCats.filter(c => c.adopted === 1);
  const availableCats  = createdCats.filter(c => c.adopted === 0);
  let appCount = 0;

  // 已领养的猫 → approved 申请
  for (let i = 0; i < adoptedCats.length; i++) {
    const { cat } = adoptedCats[i];
    const user    = normalUsers[i % normalUsers.length];
    await prisma.adoptionApplication.create({
      data: {
        user_id: user.id, cat_id: cat.id,
        status: 'approved',
        message: `我非常喜欢${cat.name}，家里环境适合养猫，请审核通过。`,
        reviewed_by: staffUser?.id,
        reviewed_at: cat.intake_date
      }
    });
    appCount++;
  }

  // 可领养的猫 → pending 申请（多人申请同一只）
  for (let i = 0; i < availableCats.length; i++) {
    const { cat } = availableCats[i];
    const applicants = [normalUsers[i % normalUsers.length], normalUsers[(i + 1) % normalUsers.length]];
    for (const user of applicants) {
      await prisma.adoptionApplication.create({
        data: {
          user_id: user.id, cat_id: cat.id,
          status: 'pending',
          message: `${cat.name}的性格很适合我，希望能给它一个温暖的家。`
        }
      });
      appCount++;
    }
  }

  // 一条 rejected 示例
  if (availableCats.length && normalUsers.length) {
    await prisma.adoptionApplication.create({
      data: {
        user_id: normalUsers[0].id, cat_id: availableCats[0].cat.id,
        status: 'rejected',
        message: '申请测试。',
        reviewed_by: staffUser?.id,
        reviewed_at: new Date(),
        reject_note: '申请人居住环境不符合本次领养要求，建议改善后再申请。'
      }
    });
    appCount++;
  }
  console.log(`   ✅ ${appCount} 条领养申请（approved / pending / rejected 各有）`);

  // ══════════════════════════════════════════
  // 7. 社区帖子 + 点赞 + 评论
  // ══════════════════════════════════════════
  console.log('\n💬 [7/10] 创建社区内容...');
  const posts = [];
  for (let i = 0; i < normalUsers.length; i++) {
    const user    = normalUsers[i];
    const catName = createdCats[i % createdCats.length].cat.name;
    const content = POST_TEMPLATES[i % POST_TEMPLATES.length].replace('{cat}', catName);
    const post = await prisma.post.create({
      data: { user_id: user.id, content }
    });
    posts.push(post);
  }

  // 每篇帖子被随机 3-5 人点赞
  let likeCount = 0, commentCount = 0;
  for (const post of posts) {
    const likers = normalUsers.filter(u => u.id !== post.user_id).slice(0, 4);
    for (const liker of likers) {
      await prisma.postLike.upsert({
        where:  { user_id_post_id: { user_id: liker.id, post_id: post.id } },
        update: {},
        create: { user_id: liker.id, post_id: post.id }
      });
      likeCount++;
    }
    // 每篇帖子 1-2 条评论
    const commenter = normalUsers.find(u => u.id !== post.user_id);
    if (commenter) {
      await prisma.comment.create({
        data: { user_id: commenter.id, post_id: post.id,
          content: pick(['太可爱了！', '谢谢分享～', '好羡慕你有这么乖的猫！', '请问是什么品种？', '看了好想养猫哦']) }
      });
      commentCount++;
    }
  }
  console.log(`   ✅ ${posts.length} 篇帖子 | ${likeCount} 个点赞 | ${commentCount} 条评论`);

  // ══════════════════════════════════════════
  // 8. 健康记录 + 诊所报告 + 授权
  // ══════════════════════════════════════════
  console.log('\n🏥 [8/10] 创建健康数据...');
  // 取前5只猫，为它们建立完整健康档案
  const healthCats   = createdCats.slice(0, 5);
  let   hrCount = 0, crCount = 0, spCount = 0;

  for (let i = 0; i < healthCats.length; i++) {
    const { cat } = healthCats[i];
    const owner   = normalUsers[i % normalUsers.length];

    // 主人健康记录（每只猫 2-3 条）
    const records = [
      { record_type: 'vaccine',    description: '接种三联疫苗第一针，反应正常', date: cat.intake_date,
        next_due_date: new Date(cat.intake_date.getTime() + 30 * 86400000), weight_kg: 2.5 + i * 0.3,
        vet_name: '林医生', clinic_name: '爱心动物诊所' },
      { record_type: 'deworming',  description: '体内外驱虫处理完成', date: cat.intake_date,
        next_due_date: new Date(cat.intake_date.getTime() + 90 * 86400000), weight_kg: 2.5 + i * 0.3 },
      { record_type: 'checkup',    description: '常规体检，一切正常，体重达标', date: new Date(),
        weight_kg: 3.0 + i * 0.4, vet_name: '王医生', clinic_name: '爱心动物诊所' },
    ];

    for (const rec of records) {
      await prisma.ownerHealthRecord.create({
        data: { cat_id: cat.id, user_id: owner.id, ...rec }
      });
      hrCount++;
    }

    // 授权诊所查看
    await prisma.healthSharePermission.upsert({
      where:  { cat_id_org_id: { cat_id: cat.id, org_id: clinicOrg.id } },
      update: {},
      create: { cat_id: cat.id, user_id: owner.id, org_id: clinicOrg.id, is_allowed: true }
    });
    spCount++;

    // 诊所上传官方报告（需有授权）
    await prisma.clinicHealthReport.create({
      data: {
        cat_id: cat.id, org_id: clinicOrg.id,
        report_type: 'vaccination',
        description: `${cat.name} 已完成三联疫苗接种，健康状况良好，建议一个月后补打第二针。`,
        date: cat.intake_date
      }
    });
    crCount++;
  }
  console.log(`   ✅ ${hrCount} 条主人记录 | ${crCount} 份诊所报告 | ${spCount} 条授权`);

  // ══════════════════════════════════════════
  // 9. 聊天会话 + 消息
  // ══════════════════════════════════════════
  console.log('\n💌 [9/10] 创建聊天数据...');
  // Conversation 的 org_id 指向 User 表中的机构工作人员账号
  let convCount = 0, msgCount = 0;
  if (staffUser) {
    const chatUsers = normalUsers.slice(0, 4);
    for (const user of chatUsers) {
      const conv = await prisma.conversation.upsert({
        where:  { user_id_org_id: { user_id: user.id, org_id: staffUser.id } },
        update: {},
        create: { user_id: user.id, org_id: staffUser.id }
      });
      convCount++;

      const dialogues = [
        { sender_id: user.id,     content: '你好，请问现在还有可以领养的猫咪吗？' },
        { sender_id: staffUser.id, content: '您好！目前还有几只可以领养，欢迎来参加我们的领养活动～' },
        { sender_id: user.id,     content: '太好了！请问需要准备什么材料？' },
        { sender_id: staffUser.id, content: '需要填写领养申请表，并提供身份证明即可，现场审核当天出结果。' },
      ];
      for (const msg of dialogues) {
        await prisma.message.create({
          data: { conversation_id: conv.id, ...msg, content: msg.content }
        });
        msgCount++;
      }
    }
  }
  console.log(`   ✅ ${convCount} 条会话 | ${msgCount} 条消息`);

  // ══════════════════════════════════════════
  // 10. 汇总
  // ══════════════════════════════════════════
  console.log('\n─────────────────────────────────────────');
  console.log('🎉 全表 Seed 完成！数据汇总：');
  console.log(`
   表名                      条数
   ──────────────────────────────
   organizations              2  （1救助 + 1诊所）
   users                     ${users.length}  （10普通 + 1救助员 + 1诊所员）
   user_follows              ${followCount}
   adoption_events            3  （第2、3、4届）
   cats                      ${createdCats.length}
   cat_tags                  （含于猫咪创建中）
   cat_requirements          （含于猫咪创建中）
   cat_updates               ${createdCats.length}  （每猫1条）
   adopter_preferences       10
   adoption_applications     ${appCount}
   posts                     ${posts.length}
   post_likes                ${likeCount}
   comments                  ${commentCount}
   owner_health_records      ${hrCount}
   clinic_health_reports     ${crCount}
   health_share_permissions  ${spCount}
   conversations             ${convCount}
   messages                  ${msgCount}
  `);
  console.log('所有测试账号密码均为：test1234');
  console.log('机构账号密码：seed1234');
}

main()
  .catch(e => { console.error('\n❌ Seed 失败：', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
