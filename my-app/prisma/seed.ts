import * as dotenv from "dotenv";
dotenv.config({ path: "../.env.local" });
dotenv.config({ path: ".env.local" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = new PrismaClient({ adapter } as any);

// ─── College domain seed data ─────────────────────────────────────────────────

const collegeDomains = [
  { collegeName: "VIT AP", domain: "vitap.ac.in" },
  { collegeName: "SRM AP", domain: "srmap.edu.in" },
  { collegeName: "KL University", domain: "kluniversity.in" },
];

// ─── Main seed function ───────────────────────────────────────────────────────

async function main() {
  console.log("Seeding college domains...");
  for (const c of collegeDomains) {
    await db.collegeDomain.upsert({
      where: { collegeName: c.collegeName },
      update: { domain: c.domain },
      create: c,
    });
    console.log(`  ✓ ${c.collegeName} (@${c.domain})`);
  }
  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
