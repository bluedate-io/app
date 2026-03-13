// ─── Database client singleton ────────────────────────────────────────────────
// Currently wired for Prisma. Swap the import/client if you change ORMs.
//
// To use Prisma:  npm install prisma @prisma/client && npx prisma init
// To use Drizzle: replace PrismaClient with your Drizzle db instance.

// import { PrismaClient } from "@prisma/client";

// Prevent multiple Prisma Client instances in development (hot-reload safe)
// declare global {
//   // eslint-disable-next-line no-var
//   var __prisma: PrismaClient | undefined;
// }
//
// export const db: PrismaClient =
//   global.__prisma ??
//   new PrismaClient({
//     log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
//   });
//
// if (process.env.NODE_ENV !== "production") {
//   global.__prisma = db;
// }
//
// export default db;

// ─── Placeholder until Prisma is wired up ────────────────────────────────────
// Replace this with the real db export above once you run `npx prisma init`.

// Replace `unknown` with your actual DB client type once Prisma is installed.
export const db = null as unknown;
