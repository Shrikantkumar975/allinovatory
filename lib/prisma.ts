import { PrismaClient } from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import {Pool} from 'pg';

const globalPrisma = globalThis as unknown as {prisma: PrismaClient | undefined};

if(!globalPrisma.prisma){
  const connString = `${process.env.DATABASE_URL}`;
  const pool = new Pool({connectionString: connString});
  const adapter = new PrismaPg(pool);
  globalPrisma.prisma = new PrismaClient({adapter});
}

export const prisma = globalPrisma.prisma;

