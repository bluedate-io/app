// ─── Prisma Config — bluedate.io ─────────────────────────────────────────────
// Prisma 7+ requires connection URLs here, not in schema.prisma.
//
// Supabase connection strings (get these from your Supabase project dashboard):
//   Settings → Database → Connection string
//
//   DATABASE_URL  → "Transaction" pooler  (port 6543) — used by the app at runtime
//   DIRECT_URL    → "Direct" connection   (port 5432) — used by prisma migrate only

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    // Direct connection (port 5432) — required for schema push and migrations
    url: process.env.DIRECT_URL!,
  },
});
