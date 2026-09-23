import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@safereport.app' },
    update: {},
    create: { name: 'Admin', email: 'admin@safereport.app', password, role: 'ADMIN' },
  });

  await prisma.user.upsert({
    where: { email: 'demo@safereport.app' },
    update: {},
    create: { name: 'Demo User', email: 'demo@safereport.app', password, role: 'USER' },
  });

  console.log('Seeded users:');
  console.log('  demo@safereport.app  / password123  (USER)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
