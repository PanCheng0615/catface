const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { ensureRescueStaffUserForOrganization } = require('../src/controllers/auth.controller');

const prisma = new PrismaClient();

const DEFAULT_ORG = {
  name: 'CatFace Rescue Center',
  type: 'rescue',
  email: 'rescue@catface.local',
  password: 'Rescue123!',
  phone: '1234 5678',
  address: 'Hong Kong CatFace Rescue Hub',
  description: 'Default rescue organization account for the CatFace dashboard.'
};

async function main() {
  try {
    const hashedPassword = await bcrypt.hash(DEFAULT_ORG.password, 10);

    const organization = await prisma.organization.upsert({
      where: {
        email: DEFAULT_ORG.email
      },
      update: {
        name: DEFAULT_ORG.name,
        type: DEFAULT_ORG.type,
        password: hashedPassword,
        phone: DEFAULT_ORG.phone,
        address: DEFAULT_ORG.address,
        description: DEFAULT_ORG.description
      },
      create: {
        name: DEFAULT_ORG.name,
        type: DEFAULT_ORG.type,
        email: DEFAULT_ORG.email,
        password: hashedPassword,
        phone: DEFAULT_ORG.phone,
        address: DEFAULT_ORG.address,
        description: DEFAULT_ORG.description
      }
    });

    const rescueStaffUser = await ensureRescueStaffUserForOrganization(organization);
    const claimedCats = await prisma.cat.updateMany({
      where: {
        org_id: null
      },
      data: {
        org_id: organization.id
      }
    });

    console.log(
      JSON.stringify(
        {
          organization: {
            id: organization.id,
            name: organization.name,
            email: organization.email,
            type: organization.type
          },
          rescue_staff_user: {
            id: rescueStaffUser.id,
            username: rescueStaffUser.username,
            email: rescueStaffUser.email,
            role: rescueStaffUser.role
          },
          claimed_unowned_cats: claimedCats.count,
          credentials: {
            email: DEFAULT_ORG.email,
            password: DEFAULT_ORG.password
          }
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error('Seed organization failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
