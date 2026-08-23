// Run once: npx tsx scripts/setup-razorpay-plan.ts
// Creates a Razorpay monthly ₹99 Plan and writes RAZORPAY_PLAN_ID into .env/.env.local

import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const KEY_ID = process.env.RAZORPAY_KEY_ID!;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
const BASE = "https://api.razorpay.com/v1";

async function main() {
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env");
  }

  console.log("Creating Razorpay subscription plan...");
  const res = await fetch(`${BASE}/plans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`,
    },
    body: JSON.stringify({
      period: "monthly",
      interval: 1,
      item: {
        name: "Tryren VIP",
        amount: 9900,
        currency: "INR",
        description: "VIP membership — weekly matchmaking opt-in & priority matching",
      },
      notes: { app: "tryren", plan: "vip-monthly" },
    }),
  });
  if (!res.ok) {
    throw new Error(`Plan creation failed: ${res.status} ${await res.text()}`);
  }
  const plan = (await res.json()) as { id: string };

  for (const file of [".env.local", ".env"]) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, "utf8");
    const line = `RAZORPAY_PLAN_ID=${plan.id}`;
    if (/^RAZORPAY_PLAN_ID=.*$/m.test(content)) {
      content = content.replace(/^RAZORPAY_PLAN_ID=.*$/m, line);
    } else {
      content = `${content.trimEnd()}\n${line}\n`;
    }
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }

  console.log(`\n✅ Plan created: ${plan.id}`);
  console.log("Restart your dev server so the new env value is picked up.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
