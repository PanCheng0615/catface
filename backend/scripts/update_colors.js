/**
 * 为已有数据补全 / 刷新品种（英文）、毛色与偏好颜色（英文枚举）
 *
 * 说明：
 * - cats.breed / adopter_preferences.preferred_breed：英文 slug（与 seed 一致）
 * - cats.color：毛色；adopter_preferences.preferred_color：领养人偏好颜色
 * - 匹配逻辑：normalizeText + includes（英文小写比较，如 orange、orange_white）
 *
 * 用法（在 backend 目录）：
 *   npm run update:colors
 *   node scripts/update_colors.js
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PALETTE = ['white', 'black', 'calico', 'orange', 'gray', 'orange_white', 'tabby'];

/** 历史中文品种 → 英文（与 seed 中 CATS / TEST_USERS 一致） */
const BREED_ZH_TO_EN = {
  橘猫: 'orange_tabby',
  狸花: 'tabby',
  橘白: 'orange_white',
  黑猫: 'black'
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 根据品种推断毛色（与 backend/prisma/seed.js 中 inferColorFromBreed 保持一致）
 */
function inferColorFromBreed(breed) {
  if (!breed || String(breed).trim() === '') {
    return pick(PALETTE);
  }
  const b = String(breed).toLowerCase();
  if (b.includes('orange_white')) return 'orange_white';
  if (b.includes('orange')) return 'orange';
  if (b.includes('black')) return 'black';
  if (b === 'white' || (b.includes('white') && !b.includes('orange'))) return 'white';
  if (b.includes('calico')) return 'calico';
  if (b.includes('tabby')) return 'tabby';
  if (b.includes('gray') || b.includes('grey')) return 'gray';
  return pick(PALETTE);
}

function normalizeBreedToEnglish(breed) {
  if (breed == null || String(breed).trim() === '') return null;
  const s = String(breed).trim();
  if (Object.prototype.hasOwnProperty.call(BREED_ZH_TO_EN, s)) {
    return BREED_ZH_TO_EN[s];
  }
  return s;
}

/** 对所有猫：品种改为英文 slug，并重写 color */
async function patchCats() {
  const cats = await prisma.cat.findMany({
    select: { id: true, breed: true, name: true }
  });

  let n = 0;
  for (const c of cats) {
    const breedNorm = normalizeBreedToEnglish(c.breed);
    const effectiveBreed = breedNorm ?? c.breed;
    const color = inferColorFromBreed(effectiveBreed);
    const data = { color };
    if (breedNorm != null && breedNorm !== c.breed) {
      data.breed = breedNorm;
    }
    await prisma.cat.update({
      where: { id: c.id },
      data
    });
    n += 1;
    const bOut = data.breed != null ? data.breed : c.breed;
    console.log(`  cat ${c.name || c.id.slice(0, 8)} → breed=${bOut} color=${color}`);
  }
  return n;
}

/** 对所有领养偏好：preferred_breed 改为英文，并重写 preferred_color */
async function patchAdopterPreferences() {
  const rows = await prisma.adopterPreference.findMany({
    select: { user_id: true, preferred_breed: true }
  });

  let n = 0;
  for (const r of rows) {
    const pbNorm =
      r.preferred_breed != null && String(r.preferred_breed).trim() !== ''
        ? normalizeBreedToEnglish(r.preferred_breed)
        : null;
    const preferred_color =
      pbNorm && String(pbNorm).trim() !== ''
        ? inferColorFromBreed(pbNorm)
        : pick(PALETTE);
    const data = { preferred_color };
    if (pbNorm != null && pbNorm !== r.preferred_breed) {
      data.preferred_breed = pbNorm;
    }
    await prisma.adopterPreference.update({
      where: { user_id: r.user_id },
      data
    });
    n += 1;
    const pbOut = data.preferred_breed != null ? data.preferred_breed : r.preferred_breed;
    console.log(
      `  adopter_pref user ${r.user_id.slice(0, 8)}… → preferred_breed=${pbOut} preferred_color=${preferred_color}`
    );
  }
  return n;
}

async function main() {
  console.log('🎨 Refresh cats.breed, cats.color & adopter_preferences (English) …\n');
  try {
    const nc = await patchCats();
    const np = await patchAdopterPreferences();
    console.log(`\n✅ Done: ${nc} cats, ${np} adopter preference rows.`);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
