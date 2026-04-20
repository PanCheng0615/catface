/**
 * CatFace 真实场景数据生成脚本
 * 使用: node seed_data.js
 *
 * 生成数据量概览：
 *   - 用户: ~2000
 *   - 机构: ~60 (30 救助站 + 30 诊所)
 *   - 猫咪档案: ~3000
 *   - 领养滑动记录: ~30000
 *   - 社区帖子: ~2000
 *   - 帖子点赞: ~15000
 *   - 评论: ~8000
 *   - 健康档案: ~3000
 *   - 诊所报告: ~2000
 *   - 关注关系: ~8000
 *   - 领养申请: ~3000
 *   - 对话 & 消息: ~2000 对话 / ~15000 消息
 */

require('dotenv').config({ path: './.env' });
const { PrismaClient, Role, OrgType, CatGender, CatStatus, ApplicationStatus,
  HealthRecordType, ClinicReportType, SharePermissionType } = require('@prisma/client');

const prisma = new PrismaClient();

// ── 辅助函数 ────────────────────────────────────────────────────────────────

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randDate(startDaysAgo, endDaysAgo = 0) {
  const now = Date.now();
  const ms = randInt(startDaysAgo * 86400000, endDaysAgo * 86400000);
  return new Date(now - ms);
}

function randBool(probTrue = 0.5) {
  return Math.random() < probTrue;
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 哈希密码（bcrypt 模拟 — 实际项目请用 bcrypt）
function hashPw(pw) {
  // 仅用于种子数据，不做真实加密
  return `hashed_${pw}_${Math.random().toString(36).slice(2)}`;
}

// ── 预生成数据池（避免每次重复生成）────────────────────────────────────────

const BREEDS = [
  '中华田园橘', '中华田园狸花', '中华田园白', '中华田园黑白', '中华田园三花',
  '英国短毛猫', '美国短毛猫', '波斯猫', '暹罗猫', '布偶猫',
  '缅因猫', '苏格兰折耳猫', '俄罗斯蓝猫', '阿比西尼亚猫', '斯芬克斯猫',
  '孟加拉豹猫', '缅甸猫', '土耳其梵猫', '埃及猫', '挪威森林猫',
  '金吉拉', '高地猫', '塞尔柯克卷毛猫', '德文卷毛猫', '柯尼斯卷毛猫',
  '无毛猫', '美卷', '英长', '渐层', '银渐层',
  '金渐层', '蓝猫', '蓝白', '乳色', '奶油色',
];

const GENDERS = [CatGender.male, CatGender.female, CatGender.unknown];
const STATUSES = [CatStatus.available, CatStatus.available, CatStatus.available,
  CatStatus.adopted, CatStatus.fostered];

const CAT_NAMES = [
  '橘子', '小白', '小黑', '咪咪', '团子', '年糕', '布丁', '豆花', '奶茶', '咖啡',
  '糖糖', '果冻', '毛球', '绒绒', '雪球', '炭球', '花卷', '蛋卷', '春卷', '薯条',
  '薯片', '薯饼', '土豆', '地瓜', '玉米', '南瓜', '西瓜', '哈密瓜', '苹果', '梨子',
  '橙子', '柠檬', '柚子', '草莓', '蓝莓', '葡萄', '樱桃', '桃子', '杏子', '荔枝',
  '旺财', '来福', '阿福', '大壮', '二狗', '三胖', '四喜', '五毛', '六六', '七七',
  '小橘', '大橘', '橘右京', '橘左隐', '橘皮', '橘络', '橘核', '橘灯', '橘井',
  '小花', '大花', '花花', '朵朵', '苗苗', '苗条', '肉肉', '胖胖', '圆圆', '方方',
  '喵呜', '喵喵', '喵子', '喵呜', '喵呜喵', '喵哈哈', '喵喵喵', '喵呜喵呜',
  '饺子', '包子', '馒头', '花卷', '烧麦', '蒸饺', '水饺', '煎饺', '肉包', '菜包',
  '拿铁', '摩卡', '卡布', '美式', '浓缩', '玛奇', '布雷', '焦糖', '榛果', '香草',
  ' luna', 'Leo', 'Milo', 'Oliver', 'Simba', 'Nala', 'Cleo', 'Bella', 'Charlie', 'Lucy',
];

const COLORS = [
  '橘白', '黑白', '狸花', '三花', '纯橘', '纯白', '纯黑', '灰白', '虎斑',
  '奶油色', '蓝灰', '玳瑁', '喜马拉雅', '重点色', '烟色', '银色', '金色',
];

const PERSONALITY_TAGS = [
  '亲人', '黏人', '活泼好动', '安静乖巧', '调皮捣蛋', '高冷傲娇', '贪吃', '爱撒娇',
  '爱撒娇', '胆小型', '勇敢', '好奇心强', '爱晒太阳', '爱纸箱', '爱逗猫棒',
  '会握手', '会击掌', '会用猫砂', '不挑食', '爱干净', '话唠', '沉默寡言',
  '夜猫子', '爱鸟', '爱鱼', '爱爬高', '爱磨爪', '爱蹭腿', '爱踩奶',
];

const ADOPTION_REQUIREMENTS = [
  '领养人需年满18周岁，有稳定住所',
  '家人一致同意领养，不因结婚/怀孕/搬家等原因遗弃',
  '接受定期回访（首月1次，此后每季度1次），提供猫咪近照',
  '不笼养、不绑养，保证猫咪自由活动空间',
  '不喂劣质猫粮，主食需为正规品牌（渴望/爱肯拿/rawz等）',
  '有独立经济能力承担医疗费用（疫苗、绝育、突发疾病）',
  '有其他宠物需隔离观察至少两周，确认相处融洽',
  '家里有纱窗/金刚网，防止猫咪坠楼或走失',
  '同意签署领养协议，交付适量押金（绝育后全额退还）',
  '学生在校期间不建议领养，除非家人代为抚养',
  '接受猫咪可能有的坏习惯，有耐心纠正',
  '领养后不得转让、贩卖或用于繁殖',
  '承诺绝育（若未绝育，领养后30天内完成）',
  '不喂食人类食物（巧克力/洋葱/葡萄等对猫有毒）',
  '接受猫咪天性，不因抓沙发/半夜跑酷等行为弃养',
];

const CITIES = [
  '北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市', '武汉市',
  '成都市', '重庆市', '西安市', '苏州市', '天津市', '长沙市', '郑州市',
  '青岛市', '济南市', '石家庄市', '合肥市', '福州市', '厦门市', '昆明市',
  '贵阳市', '南宁市', '南昌市', '太原市', '兰州市', '哈尔滨市', '长春市',
  '沈阳市', '大连市', '东莞市', '佛山市', '珠海市', '中山市', '惠州市',
];

const STREETS = [
  '人民路', '中山路', '建设路', '解放路', '和平路', '幸福路', '友谊路',
  '光明路', '前进路', '胜利路', '文化路', '工业路', '商业街', '学府路',
  '大学城', '科技园', '创业园', '文创园', '软件园', '工业园', '生活区',
];

const VET_NAMES = [
  '张医生', '李医生', '王医生', '刘医生', '陈医生', '杨医生', '黄医生',
  '赵医生', '周医生', '吴医生', '徐医生', '孙医生', '马医生', '朱医生',
  '林医生', '何医生', '郭医生', '罗医生', '高医生', '梁医生',
];

const CLINIC_NAMES = [
  '爱心宠物医院', '阳光宠物诊所', '康乐宠物医院', '福乐宠物中心',
  '友爱动物医院', '天使宠物诊所', '安心宠物医疗中心', '乐宠宠物医院',
  '宠物家动物医院', '毛孩子宠物诊所', '萌宠汇医疗中心', '爱宠之家医院',
  '宠康动物医院', '宠爱有家诊所', '仁仁宠物医疗中心', '乖乖宠物医院',
  '萌爪医疗中心', '猫专科宠物医院', '犬猫中心医院', '珍爱宠物诊所',
];

const HEALTH_RECORD_TYPES = [
  HealthRecordType.vaccine, HealthRecordType.deworming, HealthRecordType.checkup,
  HealthRecordType.treatment, HealthRecordType.surgery, HealthRecordType.other,
];

const CLINIC_REPORT_TYPES = [
  ClinicReportType.vaccination, ClinicReportType.deworming, ClinicReportType.checkup,
  ClinicReportType.blood_test, ClinicReportType.treatment, ClinicReportType.surgery,
];

const POST_CONTENTS = [
  '今天带我家猫咪去打了疫苗，表现得很乖！医生都夸它乖。',
  '我家猫主子今天终于肯用新买的猫窝了，老母亲流下了激动的泪水！',
  '橘猫真的太能吃了，吃完自己的猫粮还去偷狗的饭……',
  '分享一下我家猫咪的日常，每天早上6点准时叫我起床，比闹钟还准。',
  '猫咪突然开始乱尿是怎么回事啊？已经带去检查了身体没问题……',
  '推荐一下这款猫砂，真的除臭效果很好，家里再也闻不到味道了！',
  '有没有人知道猫咪黑下巴怎么治？试了很多方法都不管用……',
  '我家猫居然会开柜子门！从此家里所有柜子都要上儿童锁……',
  '今天猫咪第一次出门，表现得超级紧张，以后还是在家待着吧。',
  '收养了一只流浪猫，这是它到家第一天的样子，现在已经是一只幸福的小胖橘了。',
  '布偶猫的颜值真的太高了，每天看着都觉得心情好！',
  '我家猫咪超级爱爬窗台看鸟，趴在那里能看一整天。',
  '给猫咪做了自制猫饭，第一次尝试居然成功了，猫咪吃得很开心！',
  '分享一下猫咪的各种睡姿，你们家的也是这样睡吗？',
  '猫咪突然开始呕吐，紧急送医，医生说是毛球太多，要注意化毛。',
  '养猫真的改变了我很多，变得更细心更有耐心了。',
  '我家猫超级爱喝马桶水，怎么拦都拦不住，头疼……',
  '第一次养猫，有什么需要注意的吗？求各位铲屎官指点！',
  '猫咪终于学会用自动饮水机了，不用每天换水真的太方便了。',
  '分享一下我家猫咪的玩具收纳，自制的猫爬架经济实惠又好用！',
  '我家猫超级怕水，每次洗澡都像杀猪一样，求安抚技巧！',
  '今天带猫咪去做了体检，一切正常，医生说可以再活15年，开心！',
  '有没有推荐的低敏猫粮？我家猫对鸡肉过敏……',
  '我家狸花猫超级聪明，已经学会开门、开抽屉、还会按灯开关了。',
  '猫咪喜欢睡在我头上，这是爱我的表现吧？',
  '第一次带猫咪去宠物店洗澡，店员说它很乖，我都不敢相信！',
  '分享一下猫咪的表情包素材，每天看到都忍不住笑。',
  '我家两只猫天天打架，但是睡觉又要挤在一起，这是什么猫际关系？',
  '猫咪多大开始做绝育比较好？我家猫咪6个月了。',
  '三花猫真的是猫中女神，颜值和性格都是满分！',
];

const COMMENT_CONTENTS = [
  '太可爱了！',
  '好萌啊！',
  '我家猫也是这样！',
  '哈哈哈太搞笑了',
  '好羡慕你家的猫这么乖',
  '这个颜色好好看',
  '请问用的什么猫粮？',
  '好可爱的橘猫！',
  '这是哪里的猫呀？',
  '想rua！',
  '点赞！',
  '我家猫比你家的还能吃',
  '恭喜恭喜！',
  '真的好可爱',
  '这睡姿绝了',
  '好温馨的场景',
  '猫奴表示羡慕',
  '求猫粮品牌',
  '真的很有爱',
  '太幸福了',
  '这个品种好漂亮',
  '请问多大啦？',
  '好乖的小猫咪',
  '爱了爱了',
  '这是什么神仙猫咪',
  '太可爱了吧',
  '想领养一只同款',
  '我家猫完全相反',
  '真的很有爱',
  '恭喜！',
];

// ── 主生成逻辑 ────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║   CatFace 真实场景数据生成脚本       ║');
  console.log('╚══════════════════════════════════════╝\n');

  // 确认清理
  const confirmClear = process.argv.includes('--clear');
  if (confirmClear) {
    console.log('⚠  正在清理所有表数据...');
    await prisma.notificationRead.deleteMany();
    await prisma.messageAttachment.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.healthSharePermission.deleteMany();
    await prisma.clinicRecordEndorsement.deleteMany();
    await prisma.clinicHealthReport.deleteMany();
    await prisma.ownerHealthRecord.deleteMany();
    await prisma.postModeration.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.postLike.deleteMany();
    await prisma.post.deleteMany();
    await prisma.adoptionApplication.deleteMany();
    await prisma.adopterPreference.deleteMany();
    await prisma.adoptionSwipe.deleteMany();
    await prisma.catUpdate.deleteMany();
    await prisma.catRequirement.deleteMany();
    await prisma.catTag.deleteMany();
    await prisma.catFaceEmbedding.deleteMany();
    await prisma.cat.deleteMany();
    await prisma.userFollow.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ 清理完成\n');
  }

  const BATCH_SIZE = 200;

  // ══════════════════════════════════════════════
  // 1. 生成 Organization（机构）
  // ══════════════════════════════════════════════
  console.log('📦 [1/20] 生成机构数据...');
  const orgCount = 60;
  const orgs = [];
  const rescueOrgs = [];
  const clinicOrgs = [];

  for (let i = 0; i < orgCount; i++) {
    const type = i < 30 ? OrgType.rescue : OrgType.clinic;
    const city = randPick(CITIES);
    const street = randPick(STREETS);
    const nameBase = type === OrgType.rescue
      ? ['爱心', '阳光', '希望', '温暖', '幸福', '关怀', '守护', '同行', '友爱', '慈悲'][i % 10]
      : CLINIC_NAMES[i % CLINIC_NAMES.length];
    const suffix = type === OrgType.rescue ? '救助站' : '宠物医院';

    const org = await prisma.organization.create({
      data: {
        name: `${city}${nameBase}${suffix}`,
        type,
        email: `org_${uuid().slice(0, 8)}@catface.test`,
        password: hashPw('password123'),
        phone: `1${randInt(3, 9)}${randInt(100000000, 999999999)}`,
        address: `${city}${street}${randInt(1, 999)}号`,
        description: type === OrgType.rescue
          ? `位于${city}的流浪动物救助机构，致力于帮助流浪猫找到温暖的家。`
          : `位于${city}的专业宠物医疗机构，提供疫苗、体检、手术等全方位服务。`,
        license_number: `LICENSE${String(i + 1).padStart(6, '0')}`,
        is_verified: randBool(0.8),
        created_at: randDate(365, 30),
      },
    });
    orgs.push(org);
    if (type === OrgType.rescue) rescueOrgs.push(org);
    else clinicOrgs.push(org);
  }
  console.log(`   ✅ 创建了 ${orgs.length} 个机构（${rescueOrgs.length} 救助站 + ${clinicOrgs.length} 诊所）\n`);

  // ══════════════════════════════════════════════
  // 2. 生成 User（用户）
  // ══════════════════════════════════════════════
  console.log('📦 [2/20] 生成用户数据...');
  const userCount = 2000;
  const userBatch = [];

  const firstNames = ['小', '大', '阿', '老', ''];
  const lastNames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
    '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '高', '罗',
    '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹'];
  const activities = ['撸猫', '吸猫', '云养猫', '救助', '摄影', '画画', '写文', '烹饪', '健身', '旅行'];

  for (let i = 0; i < userCount; i++) {
    const ln = randPick(lastNames);
    const fn = randPick(firstNames);
    const display = randPick(activities);
    const role = i < 5 ? Role.admin : (i < 50 ? Role.rescue_staff : Role.user);
    const createdAt = randDate(300, 1);

    userBatch.push({
      email: `user_${uuid().slice(0, 12)}@catface.test`,
      password: hashPw('password123'),
      username: `user_${String(i + 1).padStart(5, '0')}`,
      display_name: `${ln}${fn}${display}`,
      has_cat: randBool(0.6),
      bio: randPick([
        `爱猫人士，养了${randInt(1, 4)}只猫🐱`,
        '救助过几十只流浪猫，希望能帮更多猫咪找到家',
        '摄影师，专门拍猫片',
        '猫粮测评博主',
        '云养猫爱好者，每天吸猫续命',
        '兽医学生，对猫咪健康很有研究',
        '自由职业者，有大量时间陪伴猫咪',
        null,
        null,
      ]),
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
      role,
      created_at: createdAt,
    });
  }

  // 批量插入
  for (let i = 0; i < userBatch.length; i += BATCH_SIZE) {
    await prisma.user.createMany({ data: userBatch.slice(i, i + BATCH_SIZE) });
  }

  const allUsers = await prisma.user.findMany({ select: { id: true } });
  console.log(`   ✅ 创建了 ${allUsers.length} 个用户\n`);

  // ══════════════════════════════════════════════
  // 3. 生成 UserFollow（关注关系）
  // ══════════════════════════════════════════════
  console.log('📦 [3/20] 生成关注关系...');
  const followCount = 8000;
  const followBatch = [];
  const userIds = allUsers.map(u => u.id);
  const followSet = new Set();

  while (followBatch.length < followCount) {
    const f = userIds[randInt(0, userIds.length - 1)];
    const t = userIds[randInt(0, userIds.length - 1)];
    if (f === t) continue;
    const key = `${f}_${t}`;
    if (followSet.has(key)) continue;
    followSet.add(key);
    followBatch.push({
      follower_id: f,
      following_id: t,
      created_at: randDate(200, 1),
    });
  }

  for (let i = 0; i < followBatch.length; i += BATCH_SIZE) {
    await prisma.userFollow.createMany({ data: followBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`   ✅ 创建了 ${followBatch.length} 条关注关系\n`);

  // ══════════════════════════════════════════════
  // 4. 生成 Cat（猫咪档案）
  // ══════════════════════════════════════════════
  console.log('📦 [4/20] 生成猫咪档案...');
  const catCount = 3000;
  const catBatch = [];
  const usedNames = new Set();

  for (let i = 0; i < catCount; i++) {
    let name = randPick(CAT_NAMES);
    let attempts = 0;
    while (usedNames.has(name) && attempts < 10) {
      name = randPick(CAT_NAMES) + randInt(1, 99);
      attempts++;
    }
    usedNames.add(name);

    const org = randPick(rescueOrgs);
    const ageMonths = randInt(1, 120);
    const status = randPick(STATUSES);
    const createdAt = randDate(365, 1);

    catBatch.push({
      name,
      breed: randPick(BREEDS),
      age_months: ageMonths,
      gender: randPick(GENDERS),
      color: randPick(COLORS),
      description: `${name}是一只${randPick(['可爱', '粘人', '活泼', '安静', '调皮', '高冷'])}的${randPick(BREEDS).replace(/^中华田园/, '中华田园')}`,
      photo_url: `https://cataas.com/cat?width=400&height=300&r=${i}`,
      status,
      is_neutered: randBool(0.7) ? true : null,
      is_vaccinated: randBool(0.75) ? true : null,
      is_dewormed: randBool(0.65) ? true : null,
      intake_date: randDate(365, 7),
      found_location: `${randPick(CITIES)}${randPick(STREETS)}`,
      org_id: org.id,
      created_at: createdAt,
    });
  }

  for (let i = 0; i < catBatch.length; i += BATCH_SIZE) {
    await prisma.cat.createMany({ data: catBatch.slice(i, i + BATCH_SIZE) });
  }

  const allCats = await prisma.cat.findMany({ select: { id: true, org_id: true } });
  const catByOrg = {};
  for (const c of allCats) {
    if (!catByOrg[c.org_id]) catByOrg[c.org_id] = [];
    catByOrg[c.org_id].push(c.id);
  }
  console.log(`   ✅ 创建了 ${allCats.length} 只猫咪档案\n`);

  // ══════════════════════════════════════════════
  // 5. 生成 CatTag（猫咪标签）
  // ══════════════════════════════════════════════
  console.log('📦 [5/20] 生成猫咪标签...');
  const tagCount = 8000;
  const tagBatch = [];
  for (let i = 0; i < tagCount; i++) {
    const cat = randPick(allCats);
    tagBatch.push({
      cat_id: cat.id,
      tag: randPick(PERSONALITY_TAGS),
      created_at: cat.created_at,
    });
  }
  for (let i = 0; i < tagBatch.length; i += BATCH_SIZE) {
    await prisma.catTag.createMany({ data: tagBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`   ✅ 创建了 ${tagBatch.length} 条猫咪标签\n`);

  // ══════════════════════════════════════════════
  // 6. 生成 CatRequirement（领养要求）
  // ══════════════════════════════════════════════
  console.log('📦 [6/20] 生成领养要求...');
  const reqCount = 4000;
  const reqBatch = [];
  for (let i = 0; i < reqCount; i++) {
    const cat = randPick(allCats);
    reqBatch.push({
      cat_id: cat.id,
      description: randPick(ADOPTION_REQUIREMENTS),
      created_at: cat.created_at,
    });
  }
  for (let i = 0; i < reqBatch.length; i += BATCH_SIZE) {
    await prisma.catRequirement.createMany({ data: reqBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`   ✅ 创建了 ${reqBatch.length} 条领养要求\n`);

  // ══════════════════════════════════════════════
  // 7. 生成 CatUpdate（猫咪动态）
  // ══════════════════════════════════════════════
  console.log('📦 [7/20] 生成猫咪动态...');
  const updateCount = 3000;
  const updateBatch = [];
  const updateContents = [
    '今天打了第一针疫苗，表现得很乖！',
    '又长胖了300克，医生说体重很健康。',
    '今天学会了用自动猫砂盆，太棒了！',
    '做了体外驱虫，这周要戴着伊丽莎白圈。',
    '找到了第一个领养人，希望一切顺利！',
    '今天带去洗澡了，毛发蓬松了很多。',
    '做了全面体检，一切指标正常。',
    '换了新猫粮，适口性不错。',
    '今天和另一只猫初次见面，互相闻了闻。',
    '终于适应了新环境，开始到处探索了。',
  ];
  for (let i = 0; i < updateCount; i++) {
    const cat = randPick(allCats);
    updateBatch.push({
      cat_id: cat.id,
      content: randPick(updateContents),
      photo_url: randBool(0.3) ? `https://cataas.com/cat?width=300&height=300&u=${i}` : null,
      created_at: randDate(180, 1),
    });
  }
  for (let i = 0; i < updateBatch.length; i += BATCH_SIZE) {
    await prisma.catUpdate.createMany({ data: updateBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`   ✅ 创建了 ${updateBatch.length} 条猫咪动态\n`);

  // ══════════════════════════════════════════════
  // 8. 生成 CatFaceEmbedding（猫脸特征向量）
  // ══════════════════════════════════════════════
  console.log('📦 [8/20] 生成猫脸特征向量...');
  const embeddingCount = 3000;
  const embeddingBatch = [];
  for (let i = 0; i < embeddingCount; i++) {
    const cat = randPick(allCats);
    const embedding = Array.from({ length: 128 }, () => randFloat(-1, 1, 4));
    embeddingBatch.push({
      cat_id: cat.id,
      embedding_json: embedding,
      source_photo_url: `https://cataas.com/cat?width=224&height=224&e=${i}`,
      provider: 'kam_face_pipeline_v1',
      similarity_threshold: randFloat(0.6, 0.85),
      created_at: cat.created_at,
    });
  }
  for (let i = 0; i < embeddingBatch.length; i += BATCH_SIZE) {
    await prisma.catFaceEmbedding.createMany({ data: embeddingBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`   ✅ 创建了 ${embeddingBatch.length} 条猫脸特征向量\n`);

  // ══════════════════════════════════════════════
  // 9. 生成 AdopterPreference（领养偏好）
  // ══════════════════════════════════════════════
  console.log('📦 [9/20] 生成领养偏好...');
  const prefCount = 1500;
  const prefBatch = [];
  const prefUserPool = [...allUsers].sort(() => Math.random() - 0.5).slice(0, prefCount);
  for (let i = 0; i < prefUserPool.length; i++) {
    const user = prefUserPool[i];
    prefBatch.push({
      user_id: user.id,
      preferred_age: randPick(['幼猫', '成猫', '老猫', '不限', null]),
      preferred_gender: randPick(['male', 'female', '不限', null]),
      preferred_breed: randPick([...BREEDS, null, null, null]),
      preferred_color: randPick([...COLORS, null, null]),
      accept_special_need: randBool(0.4) ? true : false,
      home_type: randPick(['公寓', '独栋', '透天', '宿舍', null]),
      has_other_pets: randBool(0.5) ? true : false,
      has_children: randBool(0.3) ? true : false,
      personality_tags: JSON.stringify(randPick([
        ['亲人', '黏人'], ['安静', '乖巧'], ['活泼', '好动'], ['高冷', '独立'], null,
      ])),
      created_at: randDate(200, 1),
    });
  }
  for (let i = 0; i < prefBatch.length; i += BATCH_SIZE) {
    await prisma.adopterPreference.createMany({ data: prefBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`   ✅ 创建了 ${prefBatch.length} 条领养偏好\n`);

  // ══════════════════════════════════════════════
  // 10. 生成 AdoptionSwipe（领养滑动记录）
  // ══════════════════════════════════════════════
  console.log('📦 [10/20] 生成领养滑动记录...');
  const swipeCount = 30000;
  const swipeBatch = [];
  const swipeSet = new Set();

  while (swipeBatch.length < swipeCount) {
    const user = randPick(allUsers);
    const cat = randPick(allCats);
    const key = `${user.id}_${cat.id}`;
    if (swipeSet.has(key)) continue;
    swipeSet.add(key);
    swipeBatch.push({
      user_id: user.id,
      cat_id: cat.id,
      liked: randBool(0.45),
      created_at: randDate(180, 1),
    });
  }
  for (let i = 0; i < swipeBatch.length; i += BATCH_SIZE) {
    await prisma.adoptionSwipe.createMany({ data: swipeBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`   ✅ 创建了 ${swipeBatch.length} 条领养滑动记录\n`);

  // ══════════════════════════════════════════════
  // 11. 生成 AdoptionApplication（领养申请）
  // ══════════════════════════════════════════════
  console.log('📦 [11/20] 生成领养申请...');
  const appCount = 3000;
  const appBatch = [];

  for (let i = 0; i < appCount; i++) {
    const user = randPick(allUsers);
    const cat = randPick(allCats);
    const status = randPick([
      ApplicationStatus.pending, ApplicationStatus.pending,
      ApplicationStatus.approved, ApplicationStatus.rejected,
    ]);
    const reviewedBy = status !== ApplicationStatus.pending
      ? randPick(allUsers).id : null;
    appBatch.push({
      user_id: user.id,
      cat_id: cat.id,
      status,
      message: randPick([
        '我非常喜欢这只猫咪，希望能给它一个温暖的家。我有稳定工作和住所，可以给它最好的照顾。',
        '我一直想领养一只猫咪，看到这只猫的第一眼就爱上了，希望能够领养它。',
        '家里已经有一只猫了，想给它找个伴，这只猫的性格正好和我家猫匹配。',
        '我是学生，但家人非常支持我养猫，愿意帮助我一起照顾。',
        null,
      ]),
      reviewed_by: reviewedBy,
      reviewed_at: reviewedBy ? randDate(90, 1) : null,
      created_at: randDate(120, 1),
    });
  }
  for (let i = 0; i < appBatch.length; i += BATCH_SIZE) {
    await prisma.adoptionApplication.createMany({ data: appBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`   ✅ 创建了 ${appBatch.length} 条领养申请\n`);

  // ══════════════════════════════════════════════
  // 12. 生成 AdoptionEvent（领养活动）
  // ══════════════════════════════════════════════
  console.log('📦 [12/20] 生成领养活动...');
  const eventCount = 50;
  const eventBatch = [];
  for (let i = 0; i < eventCount; i++) {
    const org = randPick(rescueOrgs);
    const startDate = randDate(180, 7);
    eventBatch.push({
      name: `${randPick(CITIES)}第${i + 1}届流浪猫领养日`,
      edition: i + 1,
      start_date: startDate,
      end_date: new Date(startDate.getTime() + randInt(1, 3) * 86400000),
      location: `${randPick(CITIES)}${randPick(STREETS)}${randInt(1, 200)}号`,
      description: `由${org.name}举办的年度领养活动，欢迎各界爱心人士参与！`,
      org_id: org.id,
      created_at: randDate(200, 30),
    });
  }
  for (let i = 0; i < eventBatch.length; i += BATCH_SIZE) {
    await prisma.adoptionEvent.createMany({ data: eventBatch.slice(i, i + BATCH_SIZE) });
  }
  const allEvents = await prisma.adoptionEvent.findMany({ select: { id: true } });
  console.log(`   ✅ 创建了 ${allEvents.length} 个领养活动\n`);

  // ══════════════════════════════════════════════
  // 13. 生成 Post（社区帖子）
  // ══════════════════════════════════════════════
  console.log('📦 [13/20] 生成社区帖子...');
  const postCount = 2000;
  const postBatch = [];
  for (let i = 0; i < postCount; i++) {
    const user = randPick(allUsers);
    postBatch.push({
      user_id: user.id,
      content: randPick(POST_CONTENTS),
      image_url: randBool(0.6) ? `https://cataas.com/cat?width=600&height=400&p=${i}` : null,
      created_at: randDate(180, 1),
    });
  }
  for (let i = 0; i < postBatch.length; i += BATCH_SIZE) {
    await prisma.post.createMany({ data: postBatch.slice(i, i + BATCH_SIZE) });
  }
  const allPosts = await prisma.post.findMany({ select: { id: true } });
  console.log(`   ✅ 创建了 ${allPosts.length} 条社区帖子\n`);

  // ══════════════════════════════════════════════
  // 14. 生成 PostLike（帖子点赞）
  // ══════════════════════════════════════════════
  console.log('📦 [14/20] 生成帖子点赞...');
  const likeCount = 15000;
  const likeBatch = [];
  const likeSet = new Set();
  while (likeBatch.length < likeCount) {
    const user = randPick(allUsers);
    const post = randPick(allPosts);
    const key = `${user.id}_${post.id}`;
    if (likeSet.has(key)) continue;
    likeSet.add(key);
    likeBatch.push({
      user_id: user.id,
      post_id: post.id,
      created_at: randDate(150, 1),
    });
  }
  for (let i = 0; i < likeBatch.length; i += BATCH_SIZE) {
    await prisma.postLike.createMany({ data: likeBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`   ✅ 创建了 ${likeBatch.length} 条帖子点赞\n`);

  // ══════════════════════════════════════════════
  // 15. 生成 Comment（评论）
  // ══════════════════════════════════════════════
  console.log('📦 [15/20] 生成评论...');
  const commentCount = 8000;
  const commentBatch = [];
  for (let i = 0; i < commentCount; i++) {
    const user = randPick(allUsers);
    const post = randPick(allPosts);
    commentBatch.push({
      user_id: user.id,
      post_id: post.id,
      content: randPick(COMMENT_CONTENTS),
      created_at: randDate(150, 1),
    });
  }
  for (let i = 0; i < commentBatch.length; i += BATCH_SIZE) {
    await prisma.comment.createMany({ data: commentBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`   ✅ 创建了 ${commentBatch.length} 条评论\n`);

  // ══════════════════════════════════════════════
  // 16. 生成 PostModeration（帖子审核）
  // ══════════════════════════════════════════════
  console.log('📦 [16/20] 生成帖子审核记录...');
  const modCount = 1500;
  const modBatch = [];
  const modSet = new Set();
  for (let i = 0; i < modCount; i++) {
    const post = randPick(allPosts);
    if (modSet.has(post.id)) { i--; continue; }
    modSet.add(post.id);
    modBatch.push({
      post_id: post.id,
      final_decision: randPick(['approved', 'approved', 'approved', 'rejected']),
      final_primary_label: randPick(['normal', 'cute_cat', 'adoption_post', 'spam']),
      final_secondary_label: randPick(['indoor', 'outdoor', 'kittens', 'adult_cat']),
      created_at: randDate(150, 1),
    });
  }
  for (let i = 0; i < modBatch.length; i += BATCH_SIZE) {
    await prisma.postModeration.createMany({ data: modBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`   ✅ 创建了 ${modBatch.length} 条帖子审核记录\n`);

  // ══════════════════════════════════════════════
  // 17. 生成 OwnerHealthRecord（用户健康档案）
  // ══════════════════════════════════════════════
  console.log('📦 [17/20] 生成用户健康档案...');
  const healthCount = 3000;
  const healthBatch = [];
  for (let i = 0; i < healthCount; i++) {
    const cat = randPick(allCats);
    const recordType = randPick(HEALTH_RECORD_TYPES);
    const recordDate = randDate(365, 1);
    healthBatch.push({
      cat_id: cat.id,
      user_id: cat.org_id ? randPick(allUsers).id : randPick(allUsers).id,
      record_type: recordType,
      description: recordType === HealthRecordType.vaccine
        ? '妙三多疫苗（第三针）'
        : recordType === HealthRecordType.deworming
        ? '体内驱虫（海乐妙）'
        : recordType === HealthRecordType.checkup
        ? '年度体检，各项指标正常'
        : recordType === HealthRecordType.treatment
        ? '口炎治疗，拔牙手术'
        : recordType === HealthRecordType.surgery
        ? '绝育手术（母猫）'
        : '常规护理',
      date: recordDate,
      next_due_date: recordType === HealthRecordType.vaccine
        ? new Date(recordDate.getTime() + 365 * 86400000)
        : recordType === HealthRecordType.deworming
        ? new Date(recordDate.getTime() + 90 * 86400000)
        : null,
      weight_kg: randFloat(2.0, 9.5),
      vet_name: randPick(VET_NAMES),
      clinic_name: randPick(CLINIC_NAMES),
      created_at: recordDate,
    });
  }
  for (let i = 0; i < healthBatch.length; i += BATCH_SIZE) {
    await prisma.ownerHealthRecord.createMany({ data: healthBatch.slice(i, i + BATCH_SIZE) });
  }
  const allHealthRecords = await prisma.ownerHealthRecord.findMany({ select: { id: true } });
  console.log(`   ✅ 创建了 ${allHealthRecords.length} 条用户健康档案\n`);

  // ══════════════════════════════════════════════
  // 18. 生成 ClinicHealthReport（诊所报告）
  // ══════════════════════════════════════════════
  console.log('📦 [18/20] 生成诊所报告...');
  const clinicReportCount = 2000;
  const clinicReportBatch = [];
  for (let i = 0; i < clinicReportCount; i++) {
    const cat = randPick(allCats);
    const org = randPick(clinicOrgs);
    const reportType = randPick(CLINIC_REPORT_TYPES);
    const reportDate = randDate(365, 1);
    clinicReportBatch.push({
      cat_id: cat.id,
      org_id: org.id,
      report_type: reportType,
      description: reportType === ClinicReportType.vaccination
        ? '猫三联疫苗接种记录'
        : reportType === ClinicReportType.deworming
        ? '体内外驱虫记录'
        : reportType === ClinicReportType.checkup
        ? '年度健康检查'
        : reportType === ClinicReportType.blood_test
        ? '血液常规及生化检查'
        : reportType === ClinicReportType.treatment
        ? '皮肤病治疗方案'
        : reportType === ClinicReportType.surgery
        ? '绝育手术记录'
        : '其他医疗记录',
      findings: randPick([
        '体温正常，心肺功能良好，牙齿略有牙结石，建议定期清洁',
        '血常规正常，肝肾功能指标在正常范围内',
        '轻度脱水，已补充液体治疗',
        '皮肤检查发现少量跳蚤，已做体外驱虫',
        '耳朵有轻微耳螨，已清洁并上药',
        '体重偏轻，建议增加营养摄入',
        '疫苗抗体水平良好，无需加强',
        '牙齿健康，无明显异常',
        '眼睛清澈，无结膜炎症状',
        null,
      ]),
      recommendations: randPick([
        '建议每月做一次体外驱虫',
        '增加饮水量，可考虑使用流动饮水机',
        '建议在2周后复查',
        '控制饮食，避免过度肥胖',
        '定期清洁牙齿，预防牙周病',
        '保持室内环境干燥，减少皮肤病复发',
        '继续观察食欲及排便情况',
        '建议3个月后复查血液指标',
        null,
      ]),
      vet_name: randPick(VET_NAMES),
      vet_license: `VET${String(randInt(1, 999)).padStart(5, '0')}`,
      org_name: org.name,
      date: reportDate,
      created_at: reportDate,
    });
  }
  for (let i = 0; i < clinicReportBatch.length; i += BATCH_SIZE) {
    await prisma.clinicHealthReport.createMany({ data: clinicReportBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`   ✅ 创建了 ${clinicReportBatch.length} 条诊所报告\n`);

  // ══════════════════════════════════════════════
  // 19. 生成 ClinicRecordEndorsement & HealthSharePermission
  // ══════════════════════════════════════════════
  console.log('📦 [19/20] 生成诊所背书 & 健康数据授权...');

  // 19a 诊所背书（record_id + org_id 唯一）
  const endorsementCount = 2000;
  const endorsementBatch = [];
  const endorsementSet = new Set();
  for (let i = 0; i < endorsementCount; i++) {
    const record = randPick(allHealthRecords);
    const org = randPick(clinicOrgs);
    const key = `${record.id}_${org.id}`;
    if (endorsementSet.has(key)) { i--; continue; }
    endorsementSet.add(key);
    endorsementBatch.push({
      record_id: record.id,
      org_id: org.id,
      endorsement: randPick([
        '已确认此记录真实有效',
        '经核实，该健康档案信息准确',
        '本诊所确认此疫苗记录',
        '已审核，健康状况良好',
      ]),
      note: randPick([
        '建议定期体检',
        '疫苗接种记录完整',
        null, null, null,
      ]),
      created_at: randDate(180, 1),
    });
  }
  for (let i = 0; i < endorsementBatch.length; i += BATCH_SIZE) {
    await prisma.clinicRecordEndorsement.createMany({ data: endorsementBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`   ✅ 创建了 ${endorsementBatch.length} 条诊所背书`);

  // 19b 健康数据授权
  const shareCount = 3000;
  const shareBatch = [];
  const shareSet = new Set();
  while (shareBatch.length < shareCount) {
    const cat = randPick(allCats);
    const org = randPick(clinicOrgs);
    const user = randPick(allUsers);
    const key = `${cat.id}_${org.id}`;
    if (shareSet.has(key)) continue;
    shareSet.add(key);
    shareBatch.push({
      cat_id: cat.id,
      user_id: user.id,
      org_id: org.id,
      permission_type: randPick([SharePermissionType.full, SharePermissionType.read_only]),
      is_allowed: randBool(0.75),
      expires_at: randBool(0.5) ? randDate(365, 30) : null,
      note: randPick([
        '用于日常健康追踪',
        '方便诊所调取历史记录',
        '方便机构了解猫咪健康史',
        null,
      ]),
      created_at: randDate(180, 1),
    });
  }
  for (let i = 0; i < shareBatch.length; i += BATCH_SIZE) {
    await prisma.healthSharePermission.createMany({ data: shareBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`   ✅ 创建了 ${shareBatch.length} 条健康数据授权\n`);

  // ══════════════════════════════════════════════
  // 20. 生成 Conversation / Message / MessageAttachment
  // ══════════════════════════════════════════════
  console.log('📦 [20/20] 生成聊天对话和消息...');

  // 20a 对话（user_id + org_id 唯一，且 org_id 需是机构账号的 user_id）
  const allStaffUsers = await prisma.user.findMany({
    where: { role: { in: [Role.rescue_staff, Role.clinic_staff] } },
    select: { id: true },
  });
  const convCount = 2000;
  const convBatch = [];
  const convSet = new Set();
  let attempts = 0;
  while (convBatch.length < convCount && attempts < convCount * 3) {
    attempts++;
    const user = randPick(allUsers);
    const orgUser = randPick(allStaffUsers);
    const key = `${user.id}_${orgUser.id}`;
    if (convSet.has(key)) continue;
    convSet.add(key);
    convBatch.push({
      user_id: user.id,
      org_id: orgUser.id,
      created_at: randDate(180, 1),
    });
  }
  for (let i = 0; i < convBatch.length; i += BATCH_SIZE) {
    await prisma.conversation.createMany({ data: convBatch.slice(i, i + BATCH_SIZE) });
  }
  const allConversations = await prisma.conversation.findMany({ select: { id: true, user_id: true, org_id: true } });
  console.log(`   ✅ 创建了 ${allConversations.length} 个对话`);

  // 20b 消息
  const msgCount = 15000;
  const msgBatch = [];
  const msgContents = [
    '您好，请问这只猫还在吗？',
    '您好，我对这只猫咪很感兴趣，能介绍一下它的性格吗？',
    '请问领养需要什么条件？',
    '我可以去看看猫咪吗？',
    '请问有疫苗记录吗？',
    '这只猫多大了？',
    '请问领养费用是多少？',
    '我家里有一只狗，不知道能不能和猫相处',
    '请问可以预约周末去看猫吗？',
    '好的，我明白了，感谢您的回复',
    '请问猫咪已经绝育了吗？',
    '好的，我考虑一下，感谢您的解答',
    '我非常想领养它，能不能再给我介绍一下？',
    '请问有什么需要注意的事项吗？',
    '好的，周六下午我有空，能去看看吗？',
    '请问领养协议在哪里签署？',
    '押金是多少？绝育后会退还吗？',
    '感谢您的耐心解答！',
    '好的，我准备好了，什么时候方便？',
    '好的，那我们周六见！',
  ];
  for (let i = 0; i < msgCount; i++) {
    const conv = randPick(allConversations);
    const senderId = randBool(0.5) ? conv.user_id : conv.org_id;
    msgBatch.push({
      conversation_id: conv.id,
      sender_id: senderId,
      content: randPick(msgContents),
      created_at: randDate(150, 1),
    });
  }
  for (let i = 0; i < msgBatch.length; i += BATCH_SIZE) {
    await prisma.message.createMany({ data: msgBatch.slice(i, i + BATCH_SIZE) });
  }
  const allMessages = await prisma.message.findMany({ select: { id: true } });
  console.log(`   ✅ 创建了 ${allMessages.length} 条消息`);

  // 20c 消息附件
  const attCount = 3000;
  const attBatch = [];
  for (let i = 0; i < attCount; i++) {
    const msg = randPick(allMessages);
    attBatch.push({
      message_id: msg.id,
      file_url: `https://cdn.catface.test/attachments/${uuid().slice(0, 8)}.jpg`,
      file_type: randPick(['image/jpeg', 'image/png', 'application/pdf']),
      created_at: randDate(150, 1),
    });
  }
  for (let i = 0; i < attBatch.length; i += BATCH_SIZE) {
    await prisma.messageAttachment.createMany({ data: attBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`   ✅ 创建了 ${attBatch.length} 条消息附件\n`);

  // ══════════════════════════════════════════════
  // 21. 生成 NotificationRead（通知已读记录）
  // ══════════════════════════════════════════════
  console.log('📦 [Bonus] 生成通知已读记录...');
  const notifCount = 5000;
  const notifBatch = [];
  const notifSet = new Set();
  const fakeNotifIds = Array.from({ length: 500 }, (_, i) => `notif_${i}_${uuid().slice(0, 8)}`);

  while (notifBatch.length < notifCount) {
    const user = randPick(allUsers);
    const notifId = randPick(fakeNotifIds);
    const key = `${user.id}_${notifId}`;
    if (notifSet.has(key)) continue;
    notifSet.add(key);
    notifBatch.push({
      user_id: user.id,
      notif_id: notifId,
      created_at: randDate(90, 1),
    });
  }
  for (let i = 0; i < notifBatch.length; i += BATCH_SIZE) {
    await prisma.notificationRead.createMany({ data: notifBatch.slice(i, i + BATCH_SIZE) });
  }
  console.log(`   ✅ 创建了 ${notifBatch.length} 条通知已读记录\n`);

  // ─── 完成 ────────────────────────────────────────────────
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🎉 数据生成完成！                           ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('📊 数据汇总：');
  console.log(`   用户         :  ${userCount}`);
  console.log(`   机构         :  ${orgs.length}`);
  console.log(`   猫咪         :  ${allCats.length}`);
  console.log(`   猫咪标签     :  ${tagBatch.length}`);
  console.log(`   领养要求     :  ${reqBatch.length}`);
  console.log(`   猫咪动态     :  ${updateBatch.length}`);
  console.log(`   猫脸特征向量 :  ${embeddingBatch.length}`);
  console.log(`   关注关系     :  ${followBatch.length}`);
  console.log(`   领养偏好     :  ${prefBatch.length}`);
  console.log(`   领养滑动记录 :  ${swipeBatch.length}`);
  console.log(`   领养申请     :  ${appBatch.length}`);
  console.log(`   领养活动     :  ${allEvents.length}`);
  console.log(`   社区帖子     :  ${allPosts.length}`);
  console.log(`   帖子点赞     :  ${likeBatch.length}`);
  console.log(`   评论         :  ${commentBatch.length}`);
  console.log(`   帖子审核     :  ${modBatch.length}`);
  console.log(`   用户健康档案 :  ${allHealthRecords.length}`);
  console.log(`   诊所报告     :  ${clinicReportBatch.length}`);
  console.log(`   诊所背书     :  ${endorsementBatch.length}`);
  console.log(`   健康数据授权 :  ${shareBatch.length}`);
  console.log(`   对话         :  ${allConversations.length}`);
  console.log(`   消息         :  ${allMessages.length}`);
  console.log(`   消息附件     :  ${attBatch.length}`);
  console.log(`   通知已读记录 :  ${notifBatch.length}`);
  console.log('');
  console.log('💡 运行以下命令重新生成（会清空所有表）：');
  console.log('   node seed_data.js --clear');
}

main()
  .catch(e => { console.error('❌ 错误:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
