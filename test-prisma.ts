import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function startConnection(): Promise<void> {
  try {
    const response = await prisma.$queryRaw`SELECT 1 AS result`;

    console.log('Prisma database connection established successfully!');
    console.log(response);
  } catch (error) {
    console.error('Unable to connect with database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

startConnection();