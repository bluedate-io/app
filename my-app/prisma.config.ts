// ─── Prisma Config — bluedate.io ─────────────────────────────────────────────
// Prisma 7+ requires connection URLs here, not in schema.prisma.
//
// Supabase connection strings (get these from your Supabase project dashboard):
//   Settings → Database → Connection string
//
//   DATABASE_URL  → "Transaction" pooler  (port 6543) — used by the app at runtime
//   DIRECT_URL    → "Direct" connection   (port 5432) — used by prisma migrate only

import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI does not automatically load Next's `.env.local`.
// Load `.env.local` first, then fall back to `.env`.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    // Prefer DIRECT_URL (Supabase direct :5432) for migrations. On Vercel, some projects
    // only set DATABASE_URL — fall back so `prisma migrate deploy` in `npm run build` does not fail.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
