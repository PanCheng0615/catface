const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

const USER_COUNT = parsePositiveInt(process.env.BULK_SEED_USER_COUNT, 2000);
const ORG_COUNT = parsePositiveInt(process.env.BULK_SEED_ORG_COUNT, 60);
const CAT_COUNT = parsePositiveInt(process.env.BULK_SEED_CAT_COUNT, 3000);
const OWNER_RECORD_COUNT = parsePositiveInt(process.env.BULK_SEED_OWNER_RECORD_COUNT, 3000);
const SHARE_PERMISSION_COUNT = parsePositiveInt(process.env.BULK_SEED_SHARE_PERMISSION_COUNT, 1200);
const CLINIC_REPORT_COUNT = parsePositiveInt(process.env.BULK_SEED_CLINIC_REPORT_COUNT, 900);
const POST_COUNT = parsePositiveInt(process.env.BULK_SEED_POST_COUNT, 4000);
const COMMENT_COUNT = parsePositiveInt(process.env.BULK_SEED_COMMENT_COUNT, 6000);
const LIKE_COUNT = parsePositiveInt(process.env.BULK_SEED_LIKE_COUNT, 12000);
const TAGGED_AVAILABLE_CAT_COUNT = parsePositiveInt(process.env.BULK_SEED_TAGGED_AVAILABLE_CAT_COUNT, 50);

const USER_EMAIL_PREFIX = 'bulk-user-';
const USER_EMAIL_DOMAIN = '@seed.catface.local';
const ORG_EMAIL_PREFIX = 'bulk-org-';
const ORG_EMAIL_DOMAIN = '@seed.catface.local';
const FACE_CODE_PREFIX = 'BULK-';

const CAT_NAME_PARTS = [
  'Milo', 'Luna', 'Sunny', 'Coco', 'Mochi', 'Nori', 'Tofu', 'Pepper', 'Sesame', 'Mango',
  'Pixel', 'Nova', 'Maru', 'Pudding', 'Yuki', 'Biscuit', 'Ash', 'Tiger', 'Cloud', 'Snow'
];
const CAT_NAME_MIDDLES = [
  'Willow', 'Maple', 'Clover', 'Breeze', 'Hazel', 'Pebble', 'Daisy', 'River', 'Poppy', 'Juniper',
  'Cinnamon', 'Meadow', 'Echo', 'Velvet', 'Waffle', 'Blossom', 'Comet', 'Saffron', 'Bamboo', 'Skye'
];
const CAT_NAME_SUFFIXES = [
  'Bloom', 'Whisker', 'Paw', 'Light', 'Song', 'Mist', 'Dream', 'Spark', 'Bean', 'Belle',
  'Star', 'Moon', 'Joy', 'Dot', 'Puff', 'Pie', 'Pop', 'Wish', 'Dawn', 'Glow'
];
const FIRST_NAMES = [
  'Emma', 'Olivia', 'Ava', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn',
  'Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'William', 'Benjamin', 'Lucas', 'Henry', 'Alexander',
  'Grace', 'Ella', 'Scarlett', 'Chloe', 'Nora', 'Lily', 'Hannah', 'Aria', 'Zoey', 'Layla',
  'Jack', 'Leo', 'Ethan', 'Mason', 'Logan', 'Jacob', 'Daniel', 'Michael', 'Samuel', 'David',
  'Anna', 'Lucy', 'Claire', 'Audrey', 'Hazel', 'Ruby', 'Alice', 'Stella', 'Sadie', 'Violet'
];
const LAST_NAMES = [
  'Carter', 'Bennett', 'Hayes', 'Foster', 'Reed', 'Parker', 'Collins', 'Brooks', 'Kelly', 'Morgan',
  'Ward', 'Cooper', 'Bailey', 'Price', 'Ross', 'Powell', 'Simmons', 'Long', 'Perry', 'Jenkins',
  'Russell', 'Griffin', 'Diaz', 'Hayward', 'Bryant', 'Matthews', 'Hughes', 'Sanders', 'Coleman', 'Barnes',
  'Howard', 'Fisher', 'Ellis', 'Stone', 'West', 'Warren', 'Wells', 'Webb', 'Woods', 'Gibson',
  'Jordan', 'Hudson', 'Freeman', 'Porter', 'Hunter', 'Holland', 'Riley', 'Wallace', 'Mills', 'Palmer'
];
const CAT_BREEDS = [
  'domestic short hair',
  'british shorthair',
  'ragdoll',
  'persian',
  'tabby',
  'american shorthair',
  'mixed / rescue cat'
];
const CAT_COLORS = ['tabby', 'orange', 'orange_white', 'black', 'white', 'calico', 'gray'];
const CAT_GENDERS = ['male', 'female', 'unknown'];
const CAT_STATUSES = ['available', 'available', 'available', 'fostered', 'adopted'];
const OWNER_RECORD_TYPES = ['vaccine', 'deworming', 'checkup', 'treatment', 'surgery', 'other'];
const CLINIC_REPORT_TYPES = ['vaccination', 'deworming', 'checkup', 'blood_test', 'treatment', 'surgery', 'other'];
const CAT_TAG_SETS = [
  ['friendly', 'lap_cat', 'indoor_ready'],
  ['playful', 'curious', 'toy_lover'],
  ['gentle', 'good_with_humans', 'quiet'],
  ['active', 'smart', 'climber'],
  ['shy', 'needs_patience', 'sweet'],
  ['food_motivated', 'easy_to_handle', 'social'],
  ['calm', 'sunbathing', 'soft_fur'],
  ['kitten_energy', 'adorable', 'fast_learner']
];
const POST_TEMPLATES = [
  '{cat} spent the day {activity} and looked {mood} the whole time.',
  'Today I checked on {cat} near {setting}. The energy was {mood} and the appetite was good.',
  '{cat} made a lot of progress while {activity}. It feels like a great week for this cat.',
  'Sharing a fresh update on {cat}: {activity}, lots of {mood} vibes, and a really nice routine today.',
  '{cat} was photographed around {setting} after {activity}. Overall condition looks {mood}.',
  'Another adoption diary entry for {cat}. We saw {activity} and the personality was especially {mood}.'
];
const COMMENT_TEMPLATES = [
  'So cute. Hope this cat finds a home soon.',
  'This update makes the progress really clear.',
  'Looks like a great adoption candidate.',
  'Love the personality in this post.',
  'Thanks for sharing another rescue update.',
  'The health and mood both sound encouraging.'
];
const POST_ACTIVITIES = ['chasing a toy mouse', 'napping by the window', 'greeting volunteers', 'watching birds outside', 'exploring a new blanket', 'playing with a ribbon', 'stretching after breakfast', 'following people around the room'];
const POST_MOODS = ['calm', 'curious', 'playful', 'gentle', 'bright-eyed', 'relaxed', 'confident', 'sweet'];
const POST_SETTINGS = ['the adoption room', 'the sunny corner', 'the rescue lounge', 'the clinic waiting area', 'the play pen', 'the window seat', 'the soft blanket corner', 'the volunteer desk'];

function parsePositiveInt(raw, fallback) {
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function pad(num, width) {
  return String(num).padStart(width, '0');
}

function pick(list, index) {
  return list[index % list.length];
}

function randomBool(index, every) {
  return index % every !== 0;
}

function daysAgo(dayCount) {
  const now = new Date();
  return new Date(now.getTime() - dayCount * 24 * 60 * 60 * 1000);
}

function daysLater(dayCount) {
  const now = new Date();
  return new Date(now.getTime() + dayCount * 24 * 60 * 60 * 1000);
}

function buildBulkUserEmail(index) {
  return `${USER_EMAIL_PREFIX}${pad(index + 1, 4)}${USER_EMAIL_DOMAIN}`;
}

function buildBulkOrgEmail(index) {
  return `${ORG_EMAIL_PREFIX}${pad(index + 1, 3)}${ORG_EMAIL_DOMAIN}`;
}

function buildFaceCode(index) {
  return `${FACE_CODE_PREFIX}${pad(index + 1, 6)}`;
}

function buildHumanUserProfile(index) {
  const firstName = pick(FIRST_NAMES, index);
  const lastName = pick(LAST_NAMES, Math.floor(index / FIRST_NAMES.length) + index);
  const displayName = `${firstName} ${lastName}`;
  const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${pad(index + 1, 4)}`;
  return { displayName, username };
}

function buildPostImageUrl(index) {
  return `https://cataas.com/cat?width=900&height=900&seed=catface-post-${pad(index + 1, 5)}`;
}

function buildCatPhotoUrl(index) {
  return `https://cataas.com/cat?width=1200&height=1200&seed=catface-cat-${pad(index + 1, 5)}`;
}

function buildUniqueCatName(index) {
  const first = pick(CAT_NAME_PARTS, index);
  const middleIndex = Math.floor(index / CAT_NAME_PARTS.length);
  const middle = pick(CAT_NAME_MIDDLES, middleIndex);
  const suffixIndex = Math.floor(index / (CAT_NAME_PARTS.length * CAT_NAME_MIDDLES.length));
  const suffix = pick(CAT_NAME_SUFFIXES, suffixIndex);
  return [first, middle, suffix].filter(Boolean).join(' ');
}

function buildUniquePostContent(index, catName) {
  const template = pick(POST_TEMPLATES, index);
  const activity = pick(POST_ACTIVITIES, index);
  const mood = pick(POST_MOODS, Math.floor(index / POST_ACTIVITIES.length) + index);
  const setting = pick(POST_SETTINGS, Math.floor(index / POST_MOODS.length) + index);
  return template
    .replace(/\{cat\}/g, catName)
    .replace('{activity}', activity)
    .replace('{mood}', mood)
    .replace('{setting}', setting) + ` Post #${pad(index + 1, 3)}.`;
}

async function deleteExistingBulkData() {
  const bulkUsers = await prisma.user.findMany({
    where: { email: { startsWith: USER_EMAIL_PREFIX } },
    select: { id: true }
  });
  const bulkOrganizations = await prisma.organization.findMany({
    where: { email: { startsWith: ORG_EMAIL_PREFIX } },
    select: { id: true }
  });
  const bulkCats = await prisma.cat.findMany({
    where: { face_code: { startsWith: FACE_CODE_PREFIX } },
    select: { id: true }
  });

  const userIds = bulkUsers.map((item) => item.id);
  const orgIds = bulkOrganizations.map((item) => item.id);
  const catIds = bulkCats.map((item) => item.id);

  if (userIds.length) {
    await prisma.postLike.deleteMany({ where: { user_id: { in: userIds } } });
    await prisma.comment.deleteMany({ where: { user_id: { in: userIds } } });
    await prisma.post.deleteMany({ where: { user_id: { in: userIds } } });
  }

  if (catIds.length) {
    await prisma.clinicHealthReport.deleteMany({ where: { cat_id: { in: catIds } } });
    await prisma.healthSharePermission.deleteMany({ where: { cat_id: { in: catIds } } });
    await prisma.ownerHealthRecord.deleteMany({ where: { cat_id: { in: catIds } } });
    await prisma.cat.deleteMany({ where: { id: { in: catIds } } });
  }

  if (orgIds.length) {
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
  }

  if (userIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

async function createOrganizations(hashedPassword) {
  const clinicCount = Math.floor(ORG_COUNT / 2);
  const rescueCount = ORG_COUNT - clinicCount;
  const data = [];

  for (let i = 0; i < clinicCount; i += 1) {
    data.push({
      name: `Bulk Clinic ${pad(i + 1, 2)}`,
      type: 'clinic',
      email: buildBulkOrgEmail(i),
      password: hashedPassword,
      phone: `09${pad(i + 1, 8)}`,
      address: `Taipei Clinic District ${i + 1}`,
      description: `Bulk-generated clinic organization ${i + 1} for integration testing.`,
      license_number: `CLINIC-${pad(i + 1, 4)}`,
      is_verified: true
    });
  }

  for (let i = 0; i < rescueCount; i += 1) {
    data.push({
      name: `Bulk Rescue ${pad(i + 1, 2)}`,
      type: 'rescue',
      email: buildBulkOrgEmail(clinicCount + i),
      password: hashedPassword,
      phone: `08${pad(i + 1, 8)}`,
      address: `Taipei Rescue District ${i + 1}`,
      description: `Bulk-generated rescue organization ${i + 1} for integration testing.`,
      license_number: null,
      is_verified: true
    });
  }

  await prisma.organization.createMany({ data, skipDuplicates: true });

  return prisma.organization.findMany({
    where: { email: { startsWith: ORG_EMAIL_PREFIX } },
    orderBy: { email: 'asc' }
  });
}

async function createUsers(hashedPassword) {
  const data = Array.from({ length: USER_COUNT }, (_, index) => {
    const profile = buildHumanUserProfile(index);
    return {
      email: buildBulkUserEmail(index),
      password: hashedPassword,
      username: profile.username,
      display_name: profile.displayName,
      role: 'user',
      has_cat: true,
      bio: 'Bulk-generated user for large-scale testing.'
    };
  });

  await prisma.user.createMany({ data, skipDuplicates: true });

  return prisma.user.findMany({
    where: { email: { startsWith: USER_EMAIL_PREFIX } },
    orderBy: { email: 'asc' }
  });
}

async function createCats(users, rescueOrganizations) {
  const data = Array.from({ length: CAT_COUNT }, (_, index) => {
    const owner = users[index % users.length];
    const rescue = rescueOrganizations[index % rescueOrganizations.length];
    const ageMonths = 2 + (index % 96);
    const intakeOffset = (index % 240) + 7;
    const catName = buildUniqueCatName(index);

    return {
      name: catName,
      face_code: buildFaceCode(index),
      breed: pick(CAT_BREEDS, index),
      age_months: ageMonths,
      gender: pick(CAT_GENDERS, index),
      color: pick(CAT_COLORS, index + 2),
      description: `${catName} is an adoptable cat with a calm daily routine and clear personality tags for matching.`,
      photo_url: buildCatPhotoUrl(index),
      status: index < TAGGED_AVAILABLE_CAT_COUNT ? 'available' : pick(CAT_STATUSES, index),
      is_neutered: randomBool(index, 4),
      is_vaccinated: randomBool(index, 3),
      is_dewormed: randomBool(index, 5),
      intake_date: daysAgo(intakeOffset),
      found_location: `Taipei Area ${1 + (index % 18)}`,
      owner_id: owner.id,
      org_id: rescue.id
    };
  });

  await prisma.cat.createMany({ data, skipDuplicates: true });

  return prisma.cat.findMany({
    where: { face_code: { startsWith: FACE_CODE_PREFIX } },
    select: {
      id: true,
      name: true,
      owner_id: true,
      intake_date: true,
      face_code: true,
      photo_url: true,
      status: true
    },
    orderBy: { face_code: 'asc' }
  });
}

async function createCatTags(cats) {
  const taggedCats = cats.filter((cat) => cat.status === 'available').slice(0, TAGGED_AVAILABLE_CAT_COUNT);
  const data = [];

  taggedCats.forEach((cat, index) => {
    const tagSet = pick(CAT_TAG_SETS, index);
    tagSet.forEach((tag) => {
      data.push({
        cat_id: cat.id,
        tag
      });
    });
  });

  if (data.length) {
    await prisma.catTag.createMany({ data, skipDuplicates: false });
  }
}

async function createOwnerHealthRecords(cats) {
  const data = Array.from({ length: OWNER_RECORD_COUNT }, (_, index) => {
    const cat = cats[index % cats.length];
    const type = pick(OWNER_RECORD_TYPES, index);
    const baseDate = cat.intake_date || daysAgo((index % 180) + 5);
    const nextDue = type === 'vaccine' || type === 'deworming' ? daysLater((index % 120) + 15) : null;

    return {
      cat_id: cat.id,
      user_id: cat.owner_id,
      record_type: type,
      description: `Bulk owner health record ${index + 1} for ${cat.name}.`,
      date: baseDate,
      next_due_date: nextDue,
      weight_kg: Number((2.2 + (index % 35) * 0.12).toFixed(2)),
      vet_name: index % 2 === 0 ? `Dr. ${pick(['Lin', 'Wang', 'Chen', 'Tsai'], index)}` : null,
      clinic_name: index % 2 === 0 ? `Bulk Clinic ${pad((index % Math.max(1, Math.floor(ORG_COUNT / 2))) + 1, 2)}` : null,
      file_url: null
    };
  });

  await prisma.ownerHealthRecord.createMany({ data, skipDuplicates: false });
}

async function createSharePermissions(cats, clinicOrganizations) {
  const data = Array.from({ length: Math.min(SHARE_PERMISSION_COUNT, cats.length) }, (_, index) => {
    const cat = cats[index];
    const clinic = clinicOrganizations[index % clinicOrganizations.length];

    return {
      cat_id: cat.id,
      user_id: cat.owner_id,
      org_id: clinic.id,
      is_allowed: true
    };
  });

  await prisma.healthSharePermission.createMany({ data, skipDuplicates: true });

  return prisma.healthSharePermission.findMany({
    where: {
      cat: {
        face_code: { startsWith: FACE_CODE_PREFIX }
      }
    },
    orderBy: { created_at: 'asc' }
  });
}

async function createClinicReports(permissions, catsById) {
  const data = Array.from({ length: Math.min(CLINIC_REPORT_COUNT, permissions.length) }, (_, index) => {
    const permission = permissions[index];
    const cat = catsById.get(permission.cat_id);
    const reportType = pick(CLINIC_REPORT_TYPES, index);

    return {
      cat_id: permission.cat_id,
      org_id: permission.org_id,
      report_type: reportType,
      description: `Bulk clinic report ${index + 1} for ${cat ? cat.name : 'patient cat'}.`,
      file_url: null,
      date: cat && cat.intake_date ? cat.intake_date : daysAgo((index % 120) + 3)
    };
  });

  await prisma.clinicHealthReport.createMany({ data, skipDuplicates: false });
}

async function createCommunityData(users, cats) {
  const firstCatByOwnerId = new Map();
  for (const cat of cats) {
    if (cat.owner_id && !firstCatByOwnerId.has(cat.owner_id)) {
      firstCatByOwnerId.set(cat.owner_id, cat);
    }
  }

  const postData = Array.from({ length: POST_COUNT }, (_, index) => {
    const author = users[index % users.length];
    const cat = firstCatByOwnerId.get(author.id) || cats[index % cats.length];
    const createdAt = daysAgo(index % 45);
    const content = buildUniquePostContent(index, cat ? cat.name : 'this cat');

    return {
      user_id: author.id,
      content,
      image_url: cat && cat.photo_url ? cat.photo_url : buildPostImageUrl(index),
      created_at: createdAt
    };
  });

  await prisma.post.createMany({ data: postData, skipDuplicates: false });

  const posts = await prisma.post.findMany({
    where: {
      user: {
        email: { startsWith: USER_EMAIL_PREFIX }
      }
    },
    select: {
      id: true,
      user_id: true,
      created_at: true
    },
    orderBy: { created_at: 'desc' },
    take: POST_COUNT + Math.ceil(POST_COUNT * 0.05)
  });

  const commentData = Array.from({ length: COMMENT_COUNT }, (_, index) => {
    const post = posts[index % posts.length];
    const commenter = users[(index + 7) % users.length];
    const safeCommenter = commenter.id === post.user_id ? users[(index + 8) % users.length] : commenter;

    return {
      user_id: safeCommenter.id,
      post_id: post.id,
      content: `${pick(COMMENT_TEMPLATES, index)} [bulk-comment-${pad(index + 1, 5)}]`,
      created_at: new Date(post.created_at.getTime() + ((index % 180) + 1) * 60000)
    };
  });

  await prisma.comment.createMany({ data: commentData, skipDuplicates: false });

  const likePairs = new Set();
  const likeData = [];
  let cursor = 0;
  while (likeData.length < LIKE_COUNT && posts.length && users.length) {
    const post = posts[cursor % posts.length];
    const liker = users[(cursor * 5 + 11) % users.length];
    cursor += 1;

    if (liker.id === post.user_id) continue;

    const pairKey = `${liker.id}:${post.id}`;
    if (likePairs.has(pairKey)) continue;
    likePairs.add(pairKey);

    likeData.push({
      user_id: liker.id,
      post_id: post.id,
      created_at: new Date(post.created_at.getTime() + ((cursor % 240) + 1) * 30000)
    });
  }

  await prisma.postLike.createMany({ data: likeData, skipDuplicates: true });
}

async function main() {
  console.log('Starting bulk clinic + health seed...');
  console.log(`Target counts => users: ${USER_COUNT}, organizations: ${ORG_COUNT}, cats: ${CAT_COUNT}, owner_health_records: ${OWNER_RECORD_COUNT}, posts: ${POST_COUNT}`);

  const userPasswordHash = await bcrypt.hash('bulkuser123', 10);
  const orgPasswordHash = await bcrypt.hash('seed1234', 10);

  console.log('Removing previously generated bulk data...');
  await deleteExistingBulkData();

  console.log('Creating organizations...');
  const organizations = await createOrganizations(orgPasswordHash);
  const clinicOrganizations = organizations.filter((org) => org.type === 'clinic');
  const rescueOrganizations = organizations.filter((org) => org.type === 'rescue');

  console.log('Creating users...');
  const users = await createUsers(userPasswordHash);

  console.log('Creating cats...');
  const cats = await createCats(users, rescueOrganizations);
  const catsById = new Map(cats.map((cat) => [cat.id, cat]));

  console.log('Creating cat tags for featured available cats...');
  await createCatTags(cats);

  console.log('Creating owner health records...');
  await createOwnerHealthRecords(cats);

  console.log('Creating clinic share permissions...');
  const permissions = await createSharePermissions(cats, clinicOrganizations);

  console.log('Creating clinic reports...');
  await createClinicReports(permissions, catsById);

  console.log('Creating community posts, comments, and likes...');
  await createCommunityData(users, cats);

  const [
    finalUserCount,
    finalOrgCount,
    finalCatCount,
    finalOwnerRecordCount,
    finalPermissionCount,
    finalClinicReportCount,
    finalPostCount,
    finalCommentCount,
    finalLikeCount
  ] = await Promise.all([
    prisma.user.count({ where: { email: { startsWith: USER_EMAIL_PREFIX } } }),
    prisma.organization.count({ where: { email: { startsWith: ORG_EMAIL_PREFIX } } }),
    prisma.cat.count({ where: { face_code: { startsWith: FACE_CODE_PREFIX } } }),
    prisma.ownerHealthRecord.count({
      where: { cat: { face_code: { startsWith: FACE_CODE_PREFIX } } }
    }),
    prisma.healthSharePermission.count({
      where: { cat: { face_code: { startsWith: FACE_CODE_PREFIX } } }
    }),
    prisma.clinicHealthReport.count({
      where: { cat: { face_code: { startsWith: FACE_CODE_PREFIX } } }
    }),
    prisma.post.count({
      where: { user: { email: { startsWith: USER_EMAIL_PREFIX } } }
    }),
    prisma.comment.count({
      where: { user: { email: { startsWith: USER_EMAIL_PREFIX } } }
    }),
    prisma.postLike.count({
      where: { user: { email: { startsWith: USER_EMAIL_PREFIX } } }
    })
  ]);

  console.log('Bulk seed finished.');
  console.log(`Organizations: ${finalOrgCount} (${clinicOrganizations.length} clinics / ${rescueOrganizations.length} rescues)`);
  console.log(`Users: ${finalUserCount}`);
  console.log(`Cats: ${finalCatCount}`);
  console.log(`Owner health records: ${finalOwnerRecordCount}`);
  console.log(`Share permissions: ${finalPermissionCount}`);
  console.log(`Clinic reports: ${finalClinicReportCount}`);
  console.log(`Posts: ${finalPostCount}`);
  console.log(`Comments: ${finalCommentCount}`);
  console.log(`Likes: ${finalLikeCount}`);
  console.log('Bulk user password: bulkuser123');
  console.log('Bulk organization password: seed1234');
  console.log(`Example clinic login: ${clinicOrganizations[0] ? clinicOrganizations[0].email : 'N/A'}`);
}

main()
  .catch((error) => {
    console.error('Bulk seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
