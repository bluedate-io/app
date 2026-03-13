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
    // Direct connection (port 5432) — required for schema push and migrations
    url: process.env.DIRECT_URL,
  },
});
