/**
 * CatFace Database Seed Script
 * Generates realistic large-scale test data across all tables.
 *
 * Usage:
 *   cd backend
 *   node prisma/seed.js
 *
 * This script will CLEAR all existing data first, then generate:
 *   ~500 users, 20 organizations, 350 cats, 1000 posts,
 *   ~3000 likes, ~2000 comments, ~800 health records,
 *   ~400 clinic reports, ~2500 adoption swipes, etc.
 *
 * Total records: ~10,000+
 *
 * Test accounts (all use password: password123):
 *   Regular user:  user_1@catface.test
 *   Clinic staff:  staff_clinic_1@catface.test
 *   Rescue staff:  rescuer_0_rescue_1@catface.test
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randDate(daysBack, daysForward = 0) {
  const now = Date.now();
  const msBack = (daysBack || 0) * 86400000;
  const msForward = (daysForward || 0) * 86400000;
  return new Date(now - msBack + Math.random() * (msBack + msForward));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function uuid() {
  return require('crypto').randomUUID();
}

// ─── Reference Data ────────────────────────────────────────

const CAT_NAMES = [
  'Biscuit', 'Luna', 'Mochi', 'Whiskers', 'Shadow', 'Ginger', 'Smokey',
  'Duchess', 'Mittens', 'Felix', 'Cleo', 'Simba', 'Nala', 'Tigger',
  'Oreo', 'Salem', 'Charlie', 'Lucy', 'Leo', 'Milo', 'Lily', 'Bella',
  'Coco', 'Pepper', 'Daisy', 'Peanut', 'Noodle', 'Mocha', 'Maple',
  'Olive', 'Hazel', 'Willow', 'Jasper', 'Finnegan', 'Oscar', 'Loki',
  'Chester', 'Buddy', 'Oliver', 'Winston', 'Theo', 'Pippin', 'Mango',
  'Tofu', 'Boba', 'Dumpling', 'Sushi', 'Nori', 'Wasabi', 'Gyoza',
  'Tempura', 'Katsu', 'Sakura', 'Yuki', 'Hana', 'Kuro', 'Shiro'
];

const CAT_BREEDS = [
  'Domestic Shorthair', 'Domestic Longhair', 'Tabby', 'Maine Coon',
  'Siamese', 'British Shorthair', 'Persian', 'Ragdoll', 'Bengal',
  'Scottish Fold', 'Sphynx', 'Abyssinian', 'Russian Blue', 'Birman',
  'Norwegian Forest Cat', 'Devon Rex', 'Burmese', 'Exotic Shorthair',
  'Turkish Angora', 'Japanese Bobtail'
];

const CAT_COLORS = [
  'Orange Tabby', 'Gray Tabby', 'Black and White', 'Calico',
  'Tortoiseshell', 'Solid Black', 'Solid White', 'Gray',
  'Ginger/Orange', 'Cream', 'Blue/Gray', 'Brown Tabby',
  'Seal Point', 'Chocolate Point', 'Blue Point', 'Flame Point',
  'Tuxedo', 'Van Pattern', 'Bi-Color'
];

const USER_FIRST = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kelly', 'Leo', 'Mia', 'Noah', 'Olivia', 'Peter', 'Quinn', 'Ryan', 'Sara', 'Tom', 'Uma', 'Victor', 'Wendy', 'Xavier', 'Yuki', 'Zara', 'Amber', 'Brian', 'Cindy', 'Derek', 'Emily', 'Freddie', 'Hugo', 'Isla', 'Jason', 'Kara', 'Liam', 'Maya', 'Neil', 'Annie', 'Benny', 'Cathy', 'Daniel', 'Elaine', 'Grace', 'Felix', 'Gigi', 'Hugo', 'Iris', 'Luna', 'Mark'];
const USER_LAST = ['Chen', 'Wang', 'Liu', 'Zhang', 'Wu', 'Lin', 'Huang', 'Chang', 'Ko', 'Su', 'Hsieh', 'Fang', 'Guo', 'Tseng', 'Yeh', 'Hsu', 'Chang', 'Lo', 'Chen', 'Yang', 'Lu', 'Cheng', 'Peng', 'Tanaka', 'Ahmed', 'Kim', 'Park', 'Lee', 'Ho', 'Wong', 'Chu', 'Bao', 'Lu', 'Jin', 'Guo', 'Ng', 'Sun', 'Kao', 'Chen', 'Lau', 'Mao', 'Wu', 'Ting', 'Zhao', 'Xie', 'Jin', 'Lin'];

const CLINIC_NAMES = [
  'Happy Paws Animal Hospital', 'Meow Medical Center', 'Whiskers Vet Clinic',
  'Purr-fect Pet Care', 'Feline Health Partners', 'Cat Care Specialists',
  'Whisker Wellness Center', 'Pawsitive Vet Hospital', 'The Cat Clinic',
  'Four Paws Medical', 'City Animal Hospital', 'Sunshine Vet Clinic',
  'Premier Pet Care', 'Animal Care Associates', 'Companion Animal Hospital'
];

const RESCUE_NAMES = [
  'Second Chance Rescue', 'Forever Home Foundation', 'Kitten Rescue Network',
  'Street Cat Alliance', 'Feline Freedom Rescue', 'Lucky Paws Sanctuary',
  'Purr Project', 'Community Cat Coalition', 'Safe Haven Animal Rescue',
  'Tiny Paws Rescue', 'Second Life Rescue', 'Fur & Feathers Haven',
  'Hope for Animals', 'City Paws Rescue', 'Guardian Angels Pet Rescue'
];

const VET_NAMES = [
  'Dr. Sarah Johnson', 'Dr. Michael Chen', 'Dr. Emily Rodriguez',
  'Dr. James Park', 'Dr. Lisa Wang', 'Dr. David Kim',
  'Dr. Amanda Lee', 'Dr. Robert Zhang', 'Dr. Michelle Wu',
  'Dr. Christopher Lin', 'Dr. Jessica Huang', 'Dr. Brian Chang'
];

const ORG_ADDRESSES = [
  '123 Main Street, Taipei', '456 Zhongshan Road, Taichung',
  '789 Xinyi District, Taipei', '321 Gongguan Road, Taipei',
  '654 Renai Road, Taichung', '987 Fuxing South Road, Kaohsiung',
  '147 Nanjing East Road, Taipei', '258 Dinghao Road, Tainan',
  '369 Zhongxiao East Road, Taipei', '741 Guangfu Road, Hsinchu',
  '852 Songshan Road, Taipei', '963 Dihua Street, Taipei',
  '159 Zhongshan North Road, Taipei', '267 Wenhua Road, Taoyuan',
  '378 Jinguo North Road, Taipei'
];

const HEALTH_RECORD_DESCS = {
  vaccine: [
    'Completed FVRCP vaccination. Cat showed no adverse reactions after 30-minute observation.',
    'Rabies vaccine administered. Vaccine lot number recorded. Next due in 1 year.',
    'First dose of FVRCP vaccine completed. Mild soreness at injection site expected.',
    'Annual core vaccine completed. No complications observed.',
    ' booster shot given. Cat tolerated well. Appointment scheduled for next year.'
  ],
  deworming: [
    'Applied broad-spectrum dewormer. Fecal test negative for parasites.',
    'Deworming treatment completed. Follow-up recommended in 2 weeks.',
    'Monthly heartworm/flea prevention administered. No side effects noted.',
    'Routine deworming. Treatment effective. No signs of intestinal parasites.'
  ],
  checkup: [
    'Annual wellness exam. Overall condition: excellent. Weight stable.',
    'Senior wellness checkup. Bloodwork ordered. Teeth condition: good.',
    'Routine physical examination. No abnormalities detected.',
    'Wellness visit. Heart and lungs clear. Weight within healthy range.',
    'General health assessment. All vitals normal.'
  ],
  treatment: [
    'Treated for mild upper respiratory infection. Antibiotics prescribed for 7 days.',
    'Ear infection diagnosed. Medicated ear drops prescribed. Follow-up in 1 week.',
    'Skin condition treated. Environmental allergen suspected. Diet recommended.',
    'Minor wound cleaned and treated. Monitor for signs of infection.',
    'Treated for FLUTD symptoms. Dietary changes recommended.'
  ],
  surgery: [
    'Spay surgery completed. Recovery going well. Pain management provided.',
    'Neuter procedure performed. Cat recovered from anesthesia smoothly.',
    'Dental cleaning and extraction completed. Cat awake and alert after procedure.',
    'Surgery went smoothly. Cat is resting comfortably.',
    'Minor lump removed. Cat recovering well.'
  ],
  other: [
    'Nail trim completed. Grooming session included coat brushing.',
    'Microchip implanted. Registration information provided to owner.',
    'Blood sample collected for wellness panel. Results reviewed.',
    'Anal gland expression performed. No issues found.',
    'Ear cleaning done. Sedation used for thorough cleaning.'
  ]
};

const CLINIC_REPORT_DESCS = {
  vaccination: [
    'Official vaccination certificate issued. All core vaccines up to date.',
    'Rabies vaccination completed per local regulations. Certificate provided.'
  ],
  blood_test: [
    'Complete blood count (CBC) performed. All values within normal range.',
    'Blood chemistry panel run. Kidney and liver function: normal.',
    'Feline leukemia (FeLV) and FIV test: negative. Cat is healthy.'
  ],
  checkup: [
    'Comprehensive wellness examination. No health concerns identified.',
    'Annual health check completed. Weight and body condition score: good.',
    'Senior cat wellness exam. Recommended twice-yearly visits.'
  ],
  deworming: [
    'Intestinal parasite screening: negative. Routine deworming completed.',
    'Fecal floatation test: no parasites detected. Heartworm test: negative.'
  ],
  treatment: [
    'Follow-up for ongoing treatment. Condition improving with current medications.',
    'Prescription diet and medication provided for chronic condition management.'
  ],
  surgery: [
    'Surgery completed successfully. Pain management plan in place.',
    'Post-operative check. Healing progressing well. Sutures intact.'
  ],
  other: [
    'Dental assessment and professional cleaning completed. Oral health: good.',
    'Diagnostic imaging performed. No abnormalities found.'
  ]
};

const POST_CONTENTS = [
  'My cat just knocked over my coffee for the third time this week.',
  'Found this stray cat outside my apartment. Going to the vet tomorrow.',
  'Adopted a new kitten today! She is already ruling the house.',
  'Anyone have recommendations for hypoallergenic cat food?',
  'My senior cat turned 15 today! Still going strong.',
  'Spent the morning watching my cats zoom around the house at 3am.',
  'Finally got my cat to use the new scratching post. Victory!',
  'My cat is obsessed with the crinkle sound of chip bags.',
  'Three years ago today I adopted my best friend. Happy anniversary!',
  'Tip: if you want your cat to ignore the expensive toys, buy them a box.',
  'My cat has claimed my laptop keyboard as her personal heating pad.',
  'Took my cat to the groomer today. Silent treatment for 6 hours.',
  'My orange tabby is exactly as dumb as the stereotype says.',
  'Any recommendations for cat-friendly plants?',
  'My cat sits in front of the mirror and hisses at himself.',
  'Just adopted two kittens. My older cat is NOT pleased.',
  'Annual vet checkup went great! All vaccines up to date.',
  'My cat makes this weird chirping sound when she sees birds.',
  'Does anyone elses cat do that slow blink thing?',
  'Cats recognize their names. My cat knows her name. She simply chooses not to respond.',
  'My void cat photobombs every Zoom call I have ever been on.',
  'Just donated to a local rescue. If you can, please support local shelters!',
  'My cat waits outside the bathroom door. Every. Single. Time.',
  'The foster kittens I raised have all been adopted! Bittersweet.',
  'My senior cat and the new puppy are best friends now.',
  'Cat tax: here is my void doing his daily impression of a loaf.',
  'My cat sleeps exactly 16 hours a day. Goals honestly.',
  'Cat saved my life by waking me up during a fire alarm. True story.',
  'New catio built! My indoor cats are so happy to have outdoor access safely.',
  'Just completed a 5K with my cat in a backpack carrier. He loved it!'
];

const CAT_PERSONALITY_TAGS = [
  'Playful', 'Lazy', 'Cuddly', 'Independent', 'Vocal', 'Shy',
  'Curious', 'Social', 'Affectionate', 'Energetic', 'Calm', 'Mischievous',
  'Lap Cat', 'Good with kids', 'Good with dogs', 'Good with other cats',
  'Indoor only', 'Senior cat', 'Kitten', 'Special needs', 'FIV+',
  'Special diet required', 'Daily medication', 'Blind', 'Deaf'
];

const CAT_REQUIREMENTS = [
  'Must have outdoor access or catio', 'No other cats in household',
  'Must be the only pet', 'Experienced cat owner preferred',
  'No children under age 5', 'Quiet household required',
  'Must have spare room for introduction period',
  'Previous cat ownership required', 'Willing to do daily medication if needed',
  'Strictly indoor home required', 'Regular vet checkups required',
  'Must agree to follow-up visits', 'Willing to sign adoption contract'
];

const CAT_UPDATES = [
  'Made great progress with socialization this week!',
  'Finally got neutered today. Recovery going well.',
  'Has been playfully chasing toys all morning.',
  'Discovered a love for catnip. Very entertaining.',
  'Starting to accept treats from staff. Huge milestone.',
  'Sharing a room with another cat now. Doing well!',
  'Has found her favorite sunny spot by the window.',
  'Gained 0.2kg since intake. Health is improving.',
  'Learned to use the scratching post! Small victories.',
  'Successfully transitioned to wet food diet.',
  'Very cuddly today. Asking for head scratches.',
  'Playing fetch with a crumpled paper ball. So smart!',
  'Full health exam completed. Ready for adoption.',
  'Showing signs of readiness for adoption. More social.'
];

const COMMENT_CONTENTS = [
  'So cute!', 'Love this!', 'Adorable!', 'What a sweetie!',
  'Same here lol', 'Goals!', 'My cat does the same thing!',
  'Beautiful kitty!', 'Proud cat parent!', 'This made my day!',
  'Sending good vibes!', 'Aww so precious!', 'You are so lucky!',
  'Welcome to the club!', 'Classic cat behavior!', 'So relatable!',
  'Such a good kitty!', 'Love the name!', 'What breed is this?',
  'Need more pics!', 'This is everything!', 'So fluffy!'
];

// ─── Seed Functions ────────────────────────────────────────

async function clearAll() {
  console.log('Clearing all existing data...');
  await prisma.notificationRead.deleteMany();
  await prisma.messageAttachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.clinicRecordEndorsement.deleteMany();
  await prisma.healthSharePermission.deleteMany();
  await prisma.clinicHealthReport.deleteMany();
  await prisma.ownerHealthRecord.deleteMany();
  await prisma.adoptionApplication.deleteMany();
  await prisma.catUpdate.deleteMany();
  await prisma.catRequirement.deleteMany();
  await prisma.catTag.deleteMany();
  await prisma.adoptionSwipe.deleteMany();
  await prisma.catFaceEmbedding.deleteMany();
  await prisma.adopterPreference.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postModeration.deleteMany();
  await prisma.post.deleteMany();
  await prisma.cat.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.adoptionEvent.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
  console.log('All data cleared.\n');
}

async function seedOrganizations() {
  console.log('Seeding organizations...');
  const hashed = await bcrypt.hash('password123', 10);
  const allOrgs = [];

  // 15 clinics
  for (let i = 0; i < 15; i++) {
    const org = await prisma.organization.create({
      data: {
        name: CLINIC_NAMES[i % CLINIC_NAMES.length] + (i >= CLINIC_NAMES.length ? ' ' + (i + 1) : ''),
        type: 'clinic',
        email: `clinic_${i + 1}@catface.test`,
        password: hashed,
        phone: `+886-2-${String(2000 + i).padStart(4, '0')}`,
        address: ORG_ADDRESSES[i % ORG_ADDRESSES.length],
        description: 'A full-service veterinary hospital providing comprehensive care for cats.',
        is_verified: i < 12,
        license_number: `VET-LIC-${String(1000 + i)}`
      }
    });
    allOrgs.push(org);
  }

  // 15 rescue orgs
  for (let i = 0; i < 15; i++) {
    const org = await prisma.organization.create({
      data: {
        name: RESCUE_NAMES[i % RESCUE_NAMES.length] + (i >= RESCUE_NAMES.length ? ' ' + (i + 1) : ''),
        type: 'rescue',
        email: `rescue_${i + 1}@catface.test`,
        password: hashed,
        phone: `+886-2-${String(3000 + i).padStart(4, '0')}`,
        address: ORG_ADDRESSES[(i + 5) % ORG_ADDRESSES.length],
        description: 'Dedicated to rescuing and rehoming stray and abandoned cats.',
        is_verified: i < 10
      }
    });
    allOrgs.push(org);
  }

  console.log(`  Created ${allOrgs.length} organizations`);
  return allOrgs;
}

async function seedUsers(orgs) {
  console.log('Seeding users...');
  const clinics = orgs.filter(o => o.type === 'clinic');
  const rescues = orgs.filter(o => o.type === 'rescue');
  const hashed = await bcrypt.hash('password123', 10);
  const users = [];

  // 500 regular users (10 batches of 50)
  for (let batch = 0; batch < 10; batch++) {
    const batchData = [];
    for (let i = 0; i < 50; i++) {
      const idx = batch * 50 + i;
      const firstName = USER_FIRST[idx % USER_FIRST.length];
      const lastName = USER_LAST[idx % USER_LAST.length];
      batchData.push({
        email: `user_${idx + 1}@catface.test`,
        username: `catlover${idx + 1}`,
        password: hashed,
        display_name: `${firstName} ${lastName}`,
        has_cat: Math.random() > 0.3,
        bio: `Cat enthusiast. ${randInt(1, 5)} cats and counting!`,
        role: 'user'
      });
    }
    const created = await prisma.user.createMany({ data: batchData });
    users.push(...batchData);
  }
  console.log(`  Created ${users.length} regular users`);

  // 1 clinic staff per clinic
  for (const clinic of clinics) {
    await prisma.user.create({
      data: {
        email: clinic.email.replace('clinic_', 'staff_'),
        username: `staff_${clinic.id.slice(0, 8)}`,
        password: hashed,
        display_name: pick(VET_NAMES),
        role: 'clinic_staff'
      }
    });
  }
  console.log(`  Created ${clinics.length} clinic staff users`);

  // 2 rescue staff per rescue org
  const rescuerNames = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey'];
  for (const rescue of rescues) {
    for (let j = 0; j < 2; j++) {
      await prisma.user.create({
        data: {
          email: rescue.email.replace('rescue_', `rescuer_${j}_`),
          username: `rescuer_${rescue.id.slice(0, 8)}_${j}`,
          password: hashed,
          display_name: `${pick(rescuerNames)} ${rescue.name.split(' ')[0]}`,
          role: 'rescue_staff'
        }
      });
    }
  }
  console.log(`  Created ${rescues.length * 2} rescue staff users`);

  return users;
}

async function seedCats(users, orgs) {
  console.log('Seeding cats...');
  const rescues = orgs.filter(o => o.type === 'rescue');
  const catOwners = users.filter(() => Math.random() > 0.3); // 70% have cats
  const cats = [];

  // 200 user-owned cats
  for (let i = 0; i < 200; i++) {
    const owner = pick(catOwners);
    const ownerRec = await prisma.user.findUnique({ where: { email: owner.email } });
    if (!ownerRec) continue;
    cats.push(await prisma.cat.create({
      data: {
        name: pick(CAT_NAMES),
        face_code: `CF${String(i + 1).padStart(6, '0')}`,
        breed: pick(CAT_BREEDS),
        age_months: randInt(3, 180),
        gender: pick(['male', 'female', 'unknown']),
        color: pick(CAT_COLORS),
        description: `Friendly ${pick(CAT_BREEDS)} with a ${pick(['playful', 'calm', 'curious', 'mischievous'])} personality.`,
        status: pick(['available', 'available', 'available', 'adopted', 'fostered']),
        is_neutered: Math.random() > 0.3,
        is_vaccinated: Math.random() > 0.2,
        is_dewormed: Math.random() > 0.25,
        intake_date: randDate(730, 0),
        found_location: Math.random() > 0.5 ? pick(ORG_ADDRESSES) : null,
        owner_id: ownerRec.id,
        created_at: randDate(365, 0)
      }
    }));
  }

  // 150 rescue cats
  for (let i = 0; i < 150; i++) {
    const rescue = pick(rescues);
    cats.push(await prisma.cat.create({
      data: {
        name: pick(CAT_NAMES),
        face_code: `CF${String(1000 + i).padStart(6, '0')}`,
        breed: pick(CAT_BREEDS),
        age_months: randInt(1, 120),
        gender: pick(['male', 'female', 'unknown']),
        color: pick(CAT_COLORS),
        description: `Rescued ${pick(CAT_BREEDS)} found ${pick(['injured', 'abandoned', 'stray', 'surrendered'])}. ${pick(['Friendly', 'Shy', 'Needs time', 'Good with cats'])}.`,
        status: pick(['available', 'available', 'available', 'fostered', 'adopted']),
        is_neutered: Math.random() > 0.5,
        is_vaccinated: Math.random() > 0.4,
        is_dewormed: Math.random() > 0.4,
        intake_date: randDate(180, 0),
        found_location: pick(ORG_ADDRESSES),
        org_id: rescue.id,
        created_at: randDate(365, 0)
      }
    }));
  }

  console.log(`  Created ${cats.length} cats`);
  return cats;
}

async function seedCatRelations(cats) {
  console.log('Seeding cat relations (tags, requirements, updates, embeddings)...');

  // 300 tags
  for (let i = 0; i < 300; i++) {
    await prisma.catTag.create({ data: { cat_id: pick(cats).id, tag: pick(CAT_PERSONALITY_TAGS) } });
  }
  console.log('  Created 300 cat tags');

  // 200 requirements
  for (let i = 0; i < 200; i++) {
    await prisma.catRequirement.create({ data: { cat_id: pick(cats).id, description: pick(CAT_REQUIREMENTS) } });
  }
  console.log('  Created 200 cat requirements');

  // 250 cat updates
  for (let i = 0; i < 250; i++) {
    await prisma.catUpdate.create({
      data: { cat_id: pick(cats).id, content: pick(CAT_UPDATES), created_at: randDate(90, 0) }
    });
  }
  console.log('  Created 250 cat updates');

  // 100 face embeddings
  for (let i = 0; i < 100; i++) {
    const dim = 512;
    const embedding = Array.from({ length: dim }, () => parseFloat((Math.random() * 2 - 1).toFixed(6)));
    await prisma.catFaceEmbedding.create({
      data: {
        cat_id: pick(cats).id,
        embedding_json: embedding,
        provider: pick(['yolov7', 'resnet', 'face_net', 'catface_v1']),
        similarity_threshold: randFloat(0.6, 0.85)
      }
    });
  }
  console.log('  Created 100 face embeddings');
}

async function seedPosts(users) {
  console.log('Seeding posts...');
  let totalCount = 0;

  // 20 batches of 50 = 1000 posts
  for (let batch = 0; batch < 20; batch++) {
    const batchData = [];
    for (let i = 0; i < 50; i++) {
      const user = pick(users);
      const userRec = await prisma.user.findUnique({ where: { email: user.email } });
      if (!userRec) continue;
      batchData.push({
        user_id: userRec.id,
        content: pick(POST_CONTENTS),
        created_at: randDate(180, 0)
      });
    }
    if (batchData.length > 0) {
      await prisma.post.createMany({ data: batchData });
      totalCount += batchData.length;
    }
  }
  console.log(`  Created ${totalCount} posts`);
}

async function seedLikesAndComments(users) {
  console.log('Seeding post likes and comments...');
  const posts = await prisma.post.findMany({ select: { id: true } });
  if (!posts.length) return;

  // 3000 likes
  const likeSet = new Set();
  let likesCreated = 0;
  while (likesCreated < 3000) {
    const post = pick(posts);
    const user = pick(users);
    const userRec = await prisma.user.findUnique({ where: { email: user.email } });
    if (!userRec) continue;
    const key = `${userRec.id}-${post.id}`;
    if (!likeSet.has(key)) {
      await prisma.postLike.create({
        data: { user_id: userRec.id, post_id: post.id, created_at: randDate(180, 0) }
      });
      likeSet.add(key);
      likesCreated++;
    }
  }
  console.log(`  Created ${likesCreated} post likes`);

  // 2000 comments
  let commentsCreated = 0;
  for (let i = 0; i < 2000; i++) {
    const post = pick(posts);
    const user = pick(users);
    const userRec = await prisma.user.findUnique({ where: { email: user.email } });
    if (!userRec) continue;
    await prisma.comment.create({
      data: { user_id: userRec.id, post_id: post.id, content: pick(COMMENT_CONTENTS), created_at: randDate(180, 0) }
    });
    commentsCreated++;
  }
  console.log(`  Created ${commentsCreated} comments`);

  // 50 post moderations (deduplicated)
  const modSet = new Set();
  const samplePosts = [];
  while (samplePosts.length < 50 && samplePosts.length < posts.length) {
    const p = pick(posts);
    if (!modSet.has(p.id)) {
      modSet.add(p.id);
      samplePosts.push(p);
    }
  }
  for (const post of samplePosts) {
    await prisma.postModeration.create({
      data: {
        post_id: post.id,
        final_decision: pick(['approved', 'approved', 'approved', 'flagged', 'removed']),
        final_primary_label: pick(['cat', 'food', 'accessory', 'health', 'general']),
        final_secondary_label: pick(['indoor', 'product', 'tip', 'advice', 'discussion'])
      }
    });
  }
  console.log('  Created 50 post moderations');
}

async function seedFollows() {
  console.log('Seeding user follows...');
  const allUserRecs = await prisma.user.findMany({ where: { role: 'user' }, take: 200 });
  const followSet = new Set();
  let followsCreated = 0;
  while (followsCreated < 500) {
    const a = pick(allUserRecs);
    const b = pick(allUserRecs);
    if (a.id !== b.id) {
      const key = `${a.id}-${b.id}`;
      if (!followSet.has(key)) {
        await prisma.userFollow.create({
          data: { follower_id: a.id, following_id: b.id, created_at: randDate(180, 0) }
        });
        followSet.add(key);
        followsCreated++;
      }
    }
  }
  console.log(`  Created ${followsCreated} user follows`);
}

async function seedAdoptionEvents(orgs) {
  console.log('Seeding adoption events...');
  const rescues = orgs.filter(o => o.type === 'rescue');
  const events = [];
  for (let i = 0; i < 20; i++) {
    const ev = await prisma.adoptionEvent.create({
      data: {
        name: `${randInt(2023, 2026)} ${pick(['Spring', 'Summer', 'Autumn', 'Winter', 'Holiday'])} ${pick(['Cat', 'Kitten', 'Feline'])} Adoption Day`,
        edition: i + 1,
        start_date: randDate(365, -30),
        end_date: randDate(0, 60),
        location: pick(ORG_ADDRESSES),
        description: 'A community adoption event organized to find forever homes for rescued cats and kittens.',
        org_id: pick(rescues).id
      }
    });
    events.push(ev);
  }
  console.log('  Created 20 adoption events');
  return events;
}

async function seedAdoptionSwipes() {
  console.log('Seeding adoption swipes...');
  const cats = await prisma.cat.findMany({ select: { id: true, status: true } });
  const availableCats = cats.filter(c => c.status === 'available');
  const userRecs = await prisma.user.findMany({ where: { role: 'user' }, take: 200 });
  const swipeSet = new Set();
  let swipesCreated = 0;
  while (swipesCreated < 2500) {
    const user = pick(userRecs);
    const cat = pick(availableCats);
    const key = `${user.id}-${cat.id}`;
    if (!swipeSet.has(key)) {
      await prisma.adoptionSwipe.create({
        data: { user_id: user.id, cat_id: cat.id, liked: Math.random() > 0.4, created_at: randDate(90, 0) }
      });
      swipeSet.add(key);
      swipesCreated++;
    }
  }
  console.log(`  Created ${swipesCreated} adoption swipes`);
}

async function seedAdopterPreferences() {
  console.log('Seeding adopter preferences...');
  const userRecs = await prisma.user.findMany({ where: { role: 'user' }, take: 200 });
  let count = 0;
  for (const user of userRecs) {
    if (Math.random() > 0.4) {
      await prisma.adopterPreference.create({
        data: {
          user_id: user.id,
          preferred_age: pick(['kitten', 'young', 'adult', 'senior', 'any']),
          preferred_gender: pick(['male', 'female', 'no_preference']),
          preferred_breed: Math.random() > 0.6 ? pick(CAT_BREEDS) : null,
          preferred_color: Math.random() > 0.7 ? pick(CAT_COLORS) : null,
          accept_special_need: Math.random() > 0.7,
          home_type: pick(['apartment', 'house', 'any']),
          has_other_pets: Math.random() > 0.5 ? null : pick([true, false]),
          has_children: Math.random() > 0.6 ? null : pick([true, false]),
          personality_tags: JSON.stringify([pick(CAT_PERSONALITY_TAGS), pick(CAT_PERSONALITY_TAGS)]),
          created_at: randDate(180, 0)
        }
      });
      count++;
    }
  }
  console.log(`  Created ${count} adopter preferences`);
}

async function seedAdoptionApplications(cats, events) {
  console.log('Seeding adoption applications...');
  const userRecs = await prisma.user.findMany({ where: { role: 'user' }, take: 150 });
  let count = 0;
  for (let i = 0; i < 150; i++) {
    const user = pick(userRecs);
    const cat = pick(cats);
    const existing = await prisma.adoptionApplication.findFirst({
      where: { user_id: user.id, cat_id: cat.id }
    });
    if (existing) continue;
    const status = pick(['pending', 'pending', 'approved', 'rejected']);
    await prisma.adoptionApplication.create({
      data: {
        user_id: user.id,
        cat_id: cat.id,
        event_id: Math.random() > 0.7 && events.length ? pick(events).id : null,
        status,
        message: `Hi, I am very interested in adopting ${cat.name}! I have had cats before and understand the commitment. Please consider my application.`,
        reviewed_by: status !== 'pending' ? user.id : null,
        reviewed_at: status !== 'pending' ? randDate(30, 0) : null,
        reject_note: status === 'rejected' ? pick(['Home visit did not pass requirements.', 'Too many pets already.', 'Applicant withdrew.']) : null,
        created_at: randDate(60, 0)
      }
    });
    count++;
  }
  console.log(`  Created ${count} adoption applications`);
}

async function seedHealthRecords(cats) {
  console.log('Seeding health records...');
  const ownerCats = cats.filter(c => c.owner_id);
  if (!ownerCats.length) return;

  const userRecs = await prisma.user.findMany({ where: { role: 'user' }, take: 200 });
  const orgRecs = await prisma.organization.findMany({ where: { type: 'clinic' } });
  const TYPES = ['vaccine', 'deworming', 'checkup', 'treatment', 'surgery', 'other'];
  const RPT_TYPES = ['vaccination', 'blood_test', 'checkup', 'deworming', 'treatment', 'surgery', 'other'];

  // Owner health records
  let ownerCount = 0;
  for (const cat of ownerCats) {
    const owner = pick(userRecs);
    const numRecords = randInt(1, 6);
    for (let i = 0; i < numRecords; i++) {
      const type = pick(TYPES);
      const date = randDate(730, 0);
      const nextDue = (type === 'vaccine' || type === 'deworming')
        ? new Date(date.getTime() + randInt(30, 365) * 86400000)
        : null;
      await prisma.ownerHealthRecord.create({
        data: {
          cat_id: cat.id,
          user_id: owner.id,
          record_type: type,
          description: pick(HEALTH_RECORD_DESCS[type] || HEALTH_RECORD_DESCS.other),
          date,
          next_due_date: nextDue,
          weight_kg: Math.random() > 0.3 ? randFloat(2.0, 8.5) : null,
          vet_name: Math.random() > 0.5 ? pick(VET_NAMES) : null,
          clinic_name: Math.random() > 0.5 ? pick(CLINIC_NAMES) : null,
          file_url: Math.random() > 0.85 ? `https://example.com/attachments/${uuid()}.pdf` : null,
          created_at: date
        }
      });
      ownerCount++;
    }
  }
  console.log(`  Created ${ownerCount} owner health records`);

  // Clinic reports
  let reportCount = 0;
  for (const cat of ownerCats) {
    if (Math.random() > 0.6) continue;
    const org = pick(orgRecs);
    const numReports = randInt(1, 4);
    for (let i = 0; i < numReports; i++) {
      const type = pick(RPT_TYPES);
      const date = randDate(365, 0);
      await prisma.clinicHealthReport.create({
        data: {
          cat_id: cat.id,
          org_id: org.id,
          report_type: type,
          description: pick(CLINIC_REPORT_DESCS[type] || CLINIC_REPORT_DESCS.other),
          findings: Math.random() > 0.5
            ? `Patient presented for ${type}. ${pick(['No abnormalities found.', 'Vital signs normal.', 'Weight stable.', 'Coat condition: good.'])}`
            : null,
          recommendations: Math.random() > 0.5
            ? pick(['Continue current diet.', 'Schedule follow-up in 6 months.', 'Monitor weight weekly.', 'Return if symptoms persist.'])
            : null,
          vet_name: pick(VET_NAMES),
          vet_license: Math.random() > 0.5 ? `VET-${randInt(10000, 99999)}` : null,
          org_name: org.name,
          date,
          file_url: Math.random() > 0.8 ? `https://example.com/reports/${uuid()}.pdf` : null,
          created_at: date
        }
      });
      reportCount++;
    }
  }
  console.log(`  Created ${reportCount} clinic reports`);

  // Health share permissions
  let permCount = 0;
  for (const cat of ownerCats) {
    if (Math.random() > 0.5) continue;
    const org = pick(orgRecs);
    const existing = await prisma.healthSharePermission.findUnique({
      where: { cat_id_org_id: { cat_id: cat.id, org_id: org.id } }
    });
    if (existing) continue;
    await prisma.healthSharePermission.create({
      data: {
        cat_id: cat.id,
        user_id: cat.owner_id,
        org_id: org.id,
        is_allowed: Math.random() > 0.15,
        permission_type: Math.random() > 0.7 ? 'read_only' : 'full',
        expires_at: Math.random() > 0.6 ? randDate(-30, 180) : null,
        note: Math.random() > 0.7 ? pick(['For vet consultation', 'Second opinion', 'Emergency access', null]) : null,
        created_at: randDate(180, 0)
      }
    });
    permCount++;
  }
  console.log(`  Created ${permCount} health share permissions`);

  // Clinic endorsements
  const orgs = await prisma.organization.findMany({ where: { type: 'clinic' } });
  const ownerRecs = await prisma.ownerHealthRecord.findMany({ take: 300 });
  let endorseCount = 0;
  for (const rec of ownerRecs) {
    if (Math.random() > 0.4) continue;
    const org = pick(orgs);
    const existing = await prisma.clinicRecordEndorsement.findUnique({
      where: { record_id_org_id: { record_id: rec.id, org_id: org.id } }
    });
    if (existing) continue;
    await prisma.clinicRecordEndorsement.create({
      data: {
        record_id: rec.id,
        org_id: org.id,
        endorsement: pick([
          'Verified against clinic records. Accurate and complete.',
          'This vaccination was performed at our clinic. Record confirmed.',
          'Independently verified by our veterinary team.',
          'Cross-referenced with clinic database. Correct.',
          'Diagnosis consistent with our examination findings.',
          'Treatment plan aligns with standard veterinary guidelines.'
        ]),
        note: Math.random() > 0.7 ? pick(['Verified', 'Confirmed', 'Cross-checked']) : null,
        created_at: randDate(60, 0)
      }
    });
    endorseCount++;
  }
  console.log(`  Created ${endorseCount} clinic endorsements`);
}

async function seedConversationsAndMessages(orgs) {
  console.log('Seeding conversations and messages...');
  const clinicStaffRecs = await prisma.user.findMany({ where: { role: 'clinic_staff' } });
  const rescueStaffRecs = await prisma.user.findMany({ where: { role: 'rescue_staff' } });
  const userRecs = await prisma.user.findMany({ where: { role: 'user' }, take: 100 });

  const CONV_MSGS = [
    'Hello, I would like to inquire about the health records.',
    'Thank you for your message. How can I help?',
    'My cat has been showing some unusual symptoms lately.',
    'Could you recommend a suitable time for the checkup?',
    'I have uploaded the vaccination certificate.',
    'Great, see you then!', 'Is the clinic open on weekends?',
    'We are closed on public holidays.',
    'Thank you for the update on the test results.',
    'Everything looks normal. No concerns.',
    'Please bring your cat in for the follow-up visit.',
    'The prescription is ready for pickup.',
    'Do you accept walk-in appointments?',
    'Yes, we accept walk-ins but appointments are preferred.',
    'Looking forward to meeting the team!'
  ];

  const RESCUE_MSGS = [
    'I am interested in adopting one of your cats.',
    'Which cats are currently available for adoption?',
    'Can I schedule a visit to meet the cats?',
    'Of course! We have several available right now.',
    'Do you have any requirements for adopters?',
    'We require a home visit and an adoption contract.',
    'I understand. I am very excited!',
    'Great! I will send you the adoption form.',
    'When can I come to meet the cats?',
    'We are open every Saturday from 10am to 4pm.'
  ];

  let convCount = 0, msgCount = 0, attachCount = 0;

  // User <-> Clinic conversations
  for (let i = 0; i < 80; i++) {
    const user = pick(userRecs);
    const staff = pick(clinicStaffRecs);
    const existing = await prisma.conversation.findUnique({
      where: { user_id_org_id: { user_id: user.id, org_id: staff.id } }
    });
    if (existing) continue;
    const conv = await prisma.conversation.create({
      data: { user_id: user.id, org_id: staff.id, created_at: randDate(90, 0) }
    });
    convCount++;
    for (let j = 0; j < randInt(2, 15); j++) {
      const sender = Math.random() > 0.5 ? user.id : staff.id;
      const msg = await prisma.message.create({
        data: { conversation_id: conv.id, sender_id: sender, content: pick(CONV_MSGS), created_at: randDate(60, 0) }
      });
      msgCount++;
      if (Math.random() > 0.85) {
        await prisma.messageAttachment.create({
          data: {
            message_id: msg.id,
            file_url: `https://example.com/attachments/${uuid()}.jpg`,
            file_type: pick(['image/jpeg', 'image/png', 'application/pdf'])
          }
        });
        attachCount++;
      }
    }
  }

  // User <-> Rescue conversations
  for (let i = 0; i < 60; i++) {
    const user = pick(userRecs);
    const rescuer = pick(rescueStaffRecs);
    const existing = await prisma.conversation.findUnique({
      where: { user_id_org_id: { user_id: user.id, org_id: rescuer.id } }
    });
    if (existing) continue;
    const conv = await prisma.conversation.create({
      data: { user_id: user.id, org_id: rescuer.id, created_at: randDate(90, 0) }
    });
    convCount++;
    for (let j = 0; j < randInt(2, 10); j++) {
      await prisma.message.create({
        data: { conversation_id: conv.id, sender_id: pick([user.id, rescuer.id]), content: pick(RESCUE_MSGS), created_at: randDate(60, 0) }
      });
      msgCount++;
    }
  }

  console.log(`  Created ${convCount} conversations, ${msgCount} messages, ${attachCount} attachments`);
}

async function seedNotificationReads() {
  console.log('Seeding notification read records...');
  const userRecs = await prisma.user.findMany({ where: { role: 'user' }, take: 100 });
  let count = 0;
  for (const user of userRecs) {
    const numReads = randInt(0, 20);
    const readIds = new Set();
    for (let i = 0; i < numReads; i++) {
      const notifId = `notif_${uuid()}`;
      if (!readIds.has(notifId)) {
        await prisma.notificationRead.create({
          data: { user_id: user.id, notif_id: notifId, created_at: randDate(30, 0) }
        });
        readIds.add(notifId);
        count++;
      }
    }
  }
  console.log(`  Created ${count} notification read records`);
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  CatFace Database Seeder — Realistic Large-Scale Data');
  console.log('═══════════════════════════════════════════════════════\n');

  const start = Date.now();

  try {
    await clearAll();
    const orgs = await seedOrganizations();
    const users = await seedUsers(orgs);
    const cats = await seedCats(users, orgs);
    await seedCatRelations(cats);
    await seedPosts(users);
    await seedLikesAndComments(users);
    await seedFollows();
    const events = await seedAdoptionEvents(orgs);
    await seedAdoptionSwipes();
    await seedAdopterPreferences();
    await seedAdoptionApplications(cats, events);
    await seedHealthRecords(cats);
    await seedConversationsAndMessages(orgs);
    await seedNotificationReads();

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`  ✅ Seeding complete in ${elapsed}s`);
    console.log('  ─────────────────────────────────────────────────');
    console.log('  Test accounts (password: password123)');
    console.log('  ─────────────────────────────────────────────────');
    console.log('  Regular user:  user_1@catface.test');
    console.log('  Clinic staff:  staff_clinic_1@catface.test');
    console.log('  Rescue staff:  rescuer_0_rescue_1@catface.test');
    console.log('  ─────────────────────────────────────────────────');
    console.log('  Run `npx prisma studio` to browse data');
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
