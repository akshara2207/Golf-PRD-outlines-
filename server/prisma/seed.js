const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@digitalheroes.com' },
    update: {},
    create: {
      email: 'admin@digitalheroes.com',
      password: adminPassword,
      fullName: 'Admin User',
      handicap: 5,
      role: 'ADMIN',
      subscription: {
        create: {
          planType: 'YEARLY',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      fullName: 'Demo Golfer',
      handicap: 12,
      role: 'USER',
      subscription: {
        create: {
          planType: 'MONTHLY',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const charityData = [
    {
      name: 'St. Andrews Junior Golf Foundation',
      registrationNumber: 'SC123456',
      description: 'Helping young golfers develop their skills and access facilities.',
      isVerified: true,
      isActive: true,
    },
    {
      name: 'Greens for Good',
      registrationNumber: 'GG789012',
      description: 'Sustainable golf course initiatives and environmental preservation.',
      isVerified: true,
      isActive: true,
    },
    {
      name: 'Fairway Futures',
      registrationNumber: 'FF345678',
      description: 'Providing golf scholarships to underprivileged youth.',
      isVerified: true,
      isActive: true,
    },
  ];

  for (const c of charityData) {
    const existing = await prisma.charity.findFirst({
      where: { registrationNumber: c.registrationNumber },
    });
    if (!existing) {
      await prisma.charity.create({ data: c });
    }
  }

  console.log('Seed data created:');
  console.log(`- Admin: ${admin.email} (password: admin123)`);
  console.log(`- Demo User: ${demoUser.email} (password: user123)`);
  console.log(`- Charities: 3 created`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
