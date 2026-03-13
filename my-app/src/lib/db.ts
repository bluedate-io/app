// ─── Prisma client singleton (Prisma 7 + pg adapter) ─────────────────────────
// Prisma 7 requires a driver adapter instead of an inline connection string.
// Pass a PoolConfig to PrismaPg so it manages its own pg.Pool internally —
// this avoids @types/pg version conflicts between pg and @prisma/adapter-pg.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: process.env.NODE_ENV === "production" ? 5 : 2,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

export const db: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export default db;
