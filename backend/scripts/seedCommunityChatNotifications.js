const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { ensureRescueStaffUserForOrganization } = require('../src/controllers/auth.controller');

const prisma = new PrismaClient();

const DEMO_USER = {
  email: 'community.chat.user@catface.demo',
  username: 'community_chat_user',
  display_name: 'Community Chat User',
  password: 'DemoChat123!'
};

const DEMO_ORG = {
  name: 'CatFace Demo Rescue',
  type: 'rescue',
  email: 'community.chat.rescue@catface.demo',
  password: 'DemoRescue123!',
  phone: '1234 0000',
  address: 'CatFace Demo Shelter',
  description: 'Demo rescue organization for chat and notification testing.'
};

const DEMO_CAT = {
  name: 'Notification Mochi',
  breed: 'Domestic short hair',
  color: 'Cream',
  age_months: 10,
  gender: 'female',
  description: 'Demo rescue cat used for chat and notification testing.',
  photo_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
  status: 'available'
};

async function upsertDemoUser() {
  const hashedPassword = await bcrypt.hash(DEMO_USER.password, 10);
  return prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: {
      username: DEMO_USER.username,
      display_name: DEMO_USER.display_name,
      password: hashedPassword
    },
    create: {
      email: DEMO_USER.email,
      username: DEMO_USER.username,
      display_name: DEMO_USER.display_name,
      password: hashedPassword
    }
  });
}

async function upsertDemoOrganization() {
  const hashedPassword = await bcrypt.hash(DEMO_ORG.password, 10);
  const organization = await prisma.organization.upsert({
    where: { email: DEMO_ORG.email },
    update: {
      name: DEMO_ORG.name,
      type: DEMO_ORG.type,
      password: hashedPassword,
      phone: DEMO_ORG.phone,
      address: DEMO_ORG.address,
      description: DEMO_ORG.description
    },
    create: {
      name: DEMO_ORG.name,
      type: DEMO_ORG.type,
      email: DEMO_ORG.email,
      password: hashedPassword,
      phone: DEMO_ORG.phone,
      address: DEMO_ORG.address,
      description: DEMO_ORG.description
    }
  });

  const rescueStaffUser = await ensureRescueStaffUserForOrganization(organization);
  return { organization, rescueStaffUser };
}

async function upsertDemoCat(orgId) {
  const existing = await prisma.cat.findFirst({
    where: {
      org_id: orgId,
      name: DEMO_CAT.name
    }
  });

  if (existing) {
    return prisma.cat.update({
      where: { id: existing.id },
      data: {
        breed: DEMO_CAT.breed,
        color: DEMO_CAT.color,
        age_months: DEMO_CAT.age_months,
        gender: DEMO_CAT.gender,
        description: DEMO_CAT.description,
        photo_url: DEMO_CAT.photo_url,
        status: DEMO_CAT.status,
        org_id: orgId
      }
    });
  }

  return prisma.cat.create({
    data: {
      name: DEMO_CAT.name,
      breed: DEMO_CAT.breed,
      color: DEMO_CAT.color,
      age_months: DEMO_CAT.age_months,
      gender: DEMO_CAT.gender,
      description: DEMO_CAT.description,
      photo_url: DEMO_CAT.photo_url,
      status: DEMO_CAT.status,
      org_id: orgId
    }
  });
}

async function ensureConversation(userId, orgId) {
  return prisma.conversation.upsert({
    where: {
      user_id_org_id: {
        user_id: userId,
        org_id: orgId
      }
    },
    update: {},
    create: {
      user_id: userId,
      org_id: orgId
    }
  });
}

async function ensureDemoMessages(conversationId, userId, orgId) {
  const existingCount = await prisma.message.count({
    where: { conversation_id: conversationId }
  });

  if (existingCount > 0) return existingCount;

  await prisma.message.createMany({
    data: [
      {
        conversation_id: conversationId,
        sender_id: userId,
        content: 'Hello! I would like to ask about Notification Mochi.'
      },
      {
        conversation_id: conversationId,
        sender_id: orgId,
        content: 'Thanks for your interest. Mochi is available and friendly with people.'
      }
    ]
  });

  return 2;
}

async function main() {
  const user = await upsertDemoUser();
  const { organization, rescueStaffUser } = await upsertDemoOrganization();
  const cat = await upsertDemoCat(organization.id);
  const conversation = await ensureConversation(user.id, rescueStaffUser.id);
  const messageCount = await ensureDemoMessages(conversation.id, user.id, rescueStaffUser.id);

  console.log(
    JSON.stringify(
      {
        user: {
          id: user.id,
          email: DEMO_USER.email,
          password: DEMO_USER.password
        },
        organization: {
          id: organization.id,
          email: DEMO_ORG.email,
          password: DEMO_ORG.password
        },
        rescue_staff_user: {
          id: rescueStaffUser.id,
          username: rescueStaffUser.username
        },
        cat: {
          id: cat.id,
          name: cat.name
        },
        conversation: {
          id: conversation.id,
          seeded_messages: messageCount
        }
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error('Seed community chat notifications failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
