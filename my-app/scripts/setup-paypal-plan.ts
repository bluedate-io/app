// Run once: npx tsx scripts/setup-paypal-plan.ts
// Creates a PayPal Product + monthly ₹99 Plan and prints the PAYPAL_PLAN_ID to add to .env

import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const BASE = "https://api-m.paypal.com";

async function getToken(): Promise<string> {
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status} ${await res.text()}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set in .env");
  }

  console.log("Authenticating with PayPal...");
  const token = await getToken();

  // 1. Create a product
  console.log("Creating product...");
  const productRes = await fetch(`${BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: "Bluedate VIP",
      description: "Priority matchmaking and weekly opt-in access",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
  if (!productRes.ok) throw new Error(`Product creation failed: ${productRes.status} ${await productRes.text()}`);
  const product = await productRes.json() as { id: string };
  console.log("Product created:", product.id);

  // 2. Create a monthly ₹99 plan
  console.log("Creating billing plan...");
  const planRes = await fetch(`${BASE}/v1/billing/plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      product_id: product.id,
      name: "VIP Monthly",
      description: "₹99/month — priority matchmaking",
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: "1.20", currency_code: "USD" },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }),
  });
  if (!planRes.ok) throw new Error(`Plan creation failed: ${planRes.status} ${await planRes.text()}`);
  const plan = await planRes.json() as { id: string };

  console.log("\n✅ Plan created successfully!");
  console.log(`\nAdd this to your .env and Vercel environment variables:\nPAYPAL_PLAN_ID=${plan.id}\n`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
