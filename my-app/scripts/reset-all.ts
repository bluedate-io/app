/**
 * DESTRUCTIVE: Deletes all users (DB + Supabase Auth) and all storage files.
 * Run with: npx tsx scripts/reset-all.ts
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as dotenv } from "dotenv";

dotenv({ path: ".env.local" });

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const photoBucket = process.env.SUPABASE_PHOTO_BUCKET!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function deleteAllStorageFiles() {
  console.log("→ Listing storage files...");
  const { data: files, error } = await supabase.storage.from(photoBucket).list("", {
    limit: 10000,
    offset: 0,
  });
  if (error) { console.error("  Storage list error:", error.message); return; }
  if (!files?.length) { console.log("  No files found."); return; }

  // Recursively list all files including sub-folders
  const allPaths: string[] = [];
  async function listFolder(prefix: string) {
    const { data, error } = await supabase.storage.from(photoBucket).list(prefix, { limit: 10000 });
    if (error || !data) return;
    for (const item of data) {
      if (item.id === null) {
        // folder
        await listFolder(prefix ? `${prefix}/${item.name}` : item.name);
      } else {
        allPaths.push(prefix ? `${prefix}/${item.name}` : item.name);
      }
    }
  }

  for (const item of files) {
    if (item.id === null) {
      await listFolder(item.name);
    } else {
      allPaths.push(item.name);
    }
  }

  if (!allPaths.length) { console.log("  No files to delete."); return; }

  console.log(`  Deleting ${allPaths.length} file(s)...`);
  const chunkSize = 100;
  for (let i = 0; i < allPaths.length; i += chunkSize) {
    const chunk = allPaths.slice(i, i + chunkSize);
    const { error } = await supabase.storage.from(photoBucket).remove(chunk);
    if (error) console.error("  Delete chunk error:", error.message);
  }
  console.log("  Storage cleared.");
}

async function deleteAllAuthUsers() {
  console.log("→ Fetching Supabase auth users...");
  let page = 1;
  const allIds: string[] = [];

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) { console.error("  Auth list error:", error.message); break; }
    if (!data.users.length) break;
    allIds.push(...data.users.map((u) => u.id));
    if (data.users.length < 1000) break;
    page++;
  }

  console.log(`  Deleting ${allIds.length} auth user(s)...`);
  for (const id of allIds) {
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) console.error(`  Failed to delete auth user ${id}:`, error.message);
  }
  console.log("  Auth users cleared.");
}

async function deleteAllDbUsers() {
  console.log("→ Deleting all DB users (cascades to all related data)...");
  const { count } = await prisma.user.deleteMany({});
  console.log(`  Deleted ${count} user(s) from DB.`);
}

async function main() {
  console.log("\n⚠️  RESET STARTED — this is irreversible.\n");
  await deleteAllStorageFiles();
  await deleteAllDbUsers();
  await deleteAllAuthUsers();
  console.log("\n✅  Done. Database and storage are clean.\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
