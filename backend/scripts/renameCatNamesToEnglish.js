const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CAT_NAME_MAP = {
  '格格': 'Gege',
  '格格 Gege': 'Gege',
  '蜘蛛猫': 'Spider Cat',
  '蜘蛛貓': 'Spider Cat',
  '探头仔': 'Peekaboo',
  '探頭仔': 'Peekaboo',
  '毛巾仔': 'Towel Boy',
  '毛巾仔 Towel Boy': 'Towel Boy',
  '厕所仔': 'Lucky',
  '廁所仔': 'Lucky',
  '厕所仔(Lucky)': 'Lucky',
  '廁所仔 Toilet Boy': 'Lucky',
  '墨水': 'Inky',
  '墨纸': 'Paper',
  '墨布': 'Canvas',
  '豆豆': 'Dodo',
  '臭臭': 'Coco',
  '小笨笨': 'Bobo',
  '招想': 'Zaza',
  '刷碟猫': 'Dishy',
  '洗手盆子': 'Basin',
  '探职仔(汤圆)': 'Tangyuan',
  '大B': 'Big B',
  '细B': 'Little B',
  '大小B姊姊': 'Big Sis B',
  '虎纹仔(Yomi)': 'Yomi',
  '小橘(Pika)': 'Pika',
  '小橘': 'Little Orange',
  '白果': 'Ginkgo',
  '大佬': 'Boss',
  '果妹': 'Fruity',
  '救命': 'Rescue',
  '起司': 'Cheese',
  '乌云踏雪': 'Cloudstep',
  '乌云燕雪': 'Cloudwing',
  '赤绒趴雪': 'Rustysnow'
};

const DEMO_USER_DISPLAY_NAME_MAP = {
  gege_um: 'Gege',
  spider_cat_um: 'Spider Cat',
  tantou_um: 'Peekaboo',
  maojin_um: 'Towel Boy',
  cesuo_um: 'Lucky'
};

async function renameCatNames() {
  let updated = 0;
  for (const [fromName, toName] of Object.entries(CAT_NAME_MAP)) {
    const result = await prisma.cat.updateMany({
      where: { name: fromName },
      data: { name: toName }
    });
    updated += result.count || 0;
  }
  return updated;
}

async function renameDemoDisplayNames() {
  let updated = 0;
  for (const [username, displayName] of Object.entries(DEMO_USER_DISPLAY_NAME_MAP)) {
    const result = await prisma.user.updateMany({
      where: { username },
      data: { display_name: displayName }
    });
    updated += result.count || 0;
  }
  return updated;
}

async function main() {
  const catUpdates = await renameCatNames();
  const userUpdates = await renameDemoDisplayNames();
  console.log(
    `[rename-cat-names] Updated cat names: ${catUpdates}, updated demo display names: ${userUpdates}`
  );
}

main()
  .catch((error) => {
    console.error('[rename-cat-names] failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
