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
    // Runtime connection — goes through Supabase's connection pooler (PgBouncer)
    url: process.env.DATABASE_URL!,

    // Shadow database — used internally by prisma migrate dev
    // Point this to the same Supabase direct URL (port 5432)
    shadowDatabaseUrl: process.env.DIRECT_URL,
  },
});
