/**
 * 临时脚本：为已有数据补全毛色 / 偏好颜色（不重置整库）
 *
 * 说明：
 * - 猫咪表字段名为 color（毛色）；preferred_color 仅在 adopter_preferences（领养人偏好）。
 * - 匹配逻辑：adoptionRecommendScore 使用 pref.preferred_color 与 cat.color 做 includes 匹配。
 *
 * 用法（在 backend 目录）：
 *   node scripts/update_colors.js
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PALETTE = ['白色', '黑色', '三花', '橘色', '灰色', '橘白', '狸花'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function inferColorFromBreed(breed) {
  if (!breed || String(breed).trim() === '') {
    return pick(PALETTE);
  }
  const b = String(breed);
  if (b.includes('橘白')) return '橘白';
  if (b.includes('橘')) return '橘色';
  if (b.includes('黑')) return '黑色';
  if (b.includes('白')) return '白色';
  if (b.includes('三花')) return '三花';
  if (b.includes('狸花')) return '狸花';
  if (b.includes('灰')) return '灰色';
  return pick(PALETTE);
}

async function patchCats() {
  const cats = await prisma.cat.findMany({
    where: {
      OR: [{ color: null }, { color: '' }]
    },
    select: { id: true, breed: true, name: true }
  });

  let n = 0;
  for (const c of cats) {
    const color = inferColorFromBreed(c.breed);
    await prisma.cat.update({
      where: { id: c.id },
      data: { color }
    });
    n += 1;
    console.log(`  cat ${c.name || c.id.slice(0, 8)} → color=${color}`);
  }
  return n;
}

async function patchAdopterPreferences() {
  const rows = await prisma.adopterPreference.findMany({
    where: {
      OR: [{ preferred_color: null }, { preferred_color: '' }]
    },
    select: { user_id: true, preferred_breed: true }
  });

  let n = 0;
  for (const r of rows) {
    const preferred_color =
      r.preferred_breed && String(r.preferred_breed).trim() !== ''
        ? inferColorFromBreed(r.preferred_breed)
        : pick(PALETTE);
    await prisma.adopterPreference.update({
      where: { user_id: r.user_id },
      data: { preferred_color }
    });
    n += 1;
    console.log(`  adopter_pref user ${r.user_id.slice(0, 8)}… → preferred_color=${preferred_color}`);
  }
  return n;
}

async function main() {
  console.log('🎨 补全 cats.color 与 adopter_preferences.preferred_color …\n');
  try {
    const nc = await patchCats();
    const np = await patchAdopterPreferences();
    console.log(`\n✅ 完成：更新猫咪 ${nc} 条，更新领养偏好 ${np} 条。`);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
