# PayPal Subscription Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Basic/VIP plan tiers gated behind a PayPal ₹99/month subscription, with automatic upgrade/downgrade via webhooks.

**Architecture:** Prisma schema gets `PlanType` enum + `Subscription` model. A `PayPalService` wraps the PayPal REST API; a `PaymentService` orchestrates DB state. Four new API routes handle subscribe, PayPal redirects, and webhooks. Home screen and opt-in route are gated for Basic users.

**Tech Stack:** Next.js 16, Prisma 7, TypeScript, PayPal Subscriptions REST API v1, Tailwind CSS v4

## Global Constraints

- PayPal base URL: `https://api-m.paypal.com` (production — never sandbox)
- Currency: `INR`, amount: `99.00`, interval: `MONTH`
- All new backend files follow the controllers → services → repositories pattern already in the codebase
- All new API routes use `withAuth` or `withHandler` from `@/middleware/withMiddleware`
- All errors use classes from `@/utils/errors` and are caught with `handleError` from `@/utils/response`
- `config/index.ts` is the only place `process.env` is read — add all new env vars there
- Never run `prisma generate` alone — always follow with `npx prisma generate` inside `my-app/`
- Working directory for all commands: `my-app/`

---

### Task 1: Prisma Schema — Add PlanType enum, planType field, and Subscription model

**Files:**
- Modify: `my-app/prisma/schema.prisma`

**Interfaces:**
- Produces: `PlanType` enum (`basic | vip`), `SubscriptionStatus` enum, `Subscription` model, `planType` field on `User`

- [ ] **Step 1: Edit schema.prisma — add enums after the existing `UserType` enum (line ~48)**

Add immediately after the `UserType` enum block:

```prisma
enum PlanType {
  basic
  vip
}

enum SubscriptionStatus {
  pending
  active
  suspended
  cancelled
  expired
}
```

- [ ] **Step 2: Add `planType` field to the `User` model**

Inside the `User` model, after the `userType` line, add:

```prisma
  planType            PlanType    @default(basic)
```

- [ ] **Step 3: Add the `Subscription` model — insert after the `WeeklyOptIn` model at the bottom of the file**

```prisma
// ─── Subscription — PayPal recurring billing ──────────────────────────────────

model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  paypalSubscriptionId String             @unique
  status               SubscriptionStatus @default(pending)
  startedAt            DateTime?
  nextBillingAt        DateTime?
  cancelledAt          DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}
```

- [ ] **Step 4: Add the `subscription` back-relation to the `User` model**

Inside the `User` model relations block, add:

```prisma
  subscription         Subscription?
```

- [ ] **Step 5: Run migration**

```bash
cd my-app && npx prisma migrate dev --name add_plan_and_subscription
```

Expected: migration created and applied, no errors.

- [ ] **Step 6: Regenerate Prisma client**

```bash
cd my-app && npx prisma generate
```

- [ ] **Step 7: Commit**

```bash
git add my-app/prisma/schema.prisma my-app/prisma/migrations/
git commit -m "feat: add PlanType enum and Subscription model to schema"
```

---

### Task 2: Config + ErrorCode + PayPal env vars

**Files:**
- Modify: `my-app/src/config/index.ts`
- Modify: `my-app/src/constants/errors.ts`
- Modify: `my-app/.env` (document new keys; actual values set separately)

**Interfaces:**
- Produces: `config.paypal.{ clientId, clientSecret, planId, webhookId }`, `ErrorCode.PLAN_REQUIRED`

- [ ] **Step 1: Add PayPal section to `config/index.ts`**

After the `supabase` block and before the closing `} as const;`, add:

```ts
  paypal: {
    clientId: optionalEnv("PAYPAL_CLIENT_ID", ""),
    clientSecret: optionalEnv("PAYPAL_CLIENT_SECRET", ""),
    planId: optionalEnv("PAYPAL_PLAN_ID", ""),
    webhookId: optionalEnv("PAYPAL_WEBHOOK_ID", ""),
    baseUrl: "https://api-m.paypal.com",
  },
```

- [ ] **Step 2: Add production validation in the `if (config.isProd)` block at the bottom of `config/index.ts`**

```ts
  requireEnv("PAYPAL_CLIENT_ID");
  requireEnv("PAYPAL_CLIENT_SECRET");
  requireEnv("PAYPAL_PLAN_ID");
  requireEnv("PAYPAL_WEBHOOK_ID");
```

- [ ] **Step 3: Add `PLAN_REQUIRED` to `constants/errors.ts`**

Inside the `ErrorCode` object, after `ONBOARDING_STEP_MISSING`:

```ts
  // Payment
  PLAN_REQUIRED: "PLAN_REQUIRED",
```

- [ ] **Step 4: Add env var stubs to `my-app/.env`**

Append to `.env`:

```
# PayPal
PAYPAL_CLIENT_ID=BAAaXkE0MkuqRSnHAEZpVGuPtDG4j5pCiCOZX1CDLdzoyPAYX3nNZdPF9Uls2lGoMWSjVPzkgzNKU_cRcg
PAYPAL_CLIENT_SECRET=EMMpdE_73Jls08v1XzKrwMaRHCPwQA0G1Go6DKGZVoG8CaJLxzDA_DS615FnHVG1dLVR_-dpClN-SuAs
PAYPAL_PLAN_ID=
PAYPAL_WEBHOOK_ID=
```

(`PAYPAL_PLAN_ID` and `PAYPAL_WEBHOOK_ID` are filled after running the setup script in Task 3.)

- [ ] **Step 5: Commit**

```bash
git add my-app/src/config/index.ts my-app/src/constants/errors.ts my-app/.env
git commit -m "feat: add PayPal config and PLAN_REQUIRED error code"
```

---

### Task 3: PayPal Setup Script — create Product + Plan

**Files:**
- Create: `my-app/scripts/setup-paypal-plan.ts`

**Interfaces:**
- Produces: console output with `PAYPAL_PLAN_ID` value to paste into `.env`

- [ ] **Step 1: Create the setup script**

```ts
// my-app/scripts/setup-paypal-plan.ts
// Run once: npx tsx scripts/setup-paypal-plan.ts
// Prints the PAYPAL_PLAN_ID to add to your .env

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
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

async function main() {
  const token = await getToken();

  // 1. Create a product
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
  const product = await productRes.json() as { id: string };
  console.log("Product created:", product.id);

  // 2. Create a monthly ₹99 plan
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
            fixed_price: { value: "99", currency_code: "INR" },
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
  const plan = await planRes.json() as { id: string };
  console.log("\n✅ Plan created successfully!");
  console.log(`\nAdd this to your .env:\nPAYPAL_PLAN_ID=${plan.id}\n`);
}

main().catch(console.error);
```

- [ ] **Step 2: Run the script from inside `my-app/`**

```bash
cd my-app && npx tsx scripts/setup-paypal-plan.ts
```

Expected: prints `PAYPAL_PLAN_ID=P-XXXXXXXXXXXXXXXX`

- [ ] **Step 3: Paste the printed `PAYPAL_PLAN_ID` value into `my-app/.env`**

- [ ] **Step 4: Commit the script**

```bash
git add my-app/scripts/setup-paypal-plan.ts
git commit -m "feat: add PayPal product+plan setup script"
```

---

### Task 4: SubscriptionRepository

**Files:**
- Create: `my-app/src/repositories/SubscriptionRepository.ts`

**Interfaces:**
- Consumes: `PrismaClient` from `@/generated/prisma/client`, `PlanType` and `SubscriptionStatus` enums from generated Prisma client
- Produces:
  - `ISubscriptionRepository` interface
  - `SubscriptionRepository` class with methods:
    - `upsert(userId: string, data: UpsertSubscriptionData): Promise<SubscriptionRow>`
    - `findByUserId(userId: string): Promise<SubscriptionRow | null>`
    - `findByPaypalId(paypalSubscriptionId: string): Promise<SubscriptionRow | null>`

- [ ] **Step 1: Create `SubscriptionRepository.ts`**

```ts
// my-app/src/repositories/SubscriptionRepository.ts

import type { PrismaClient } from "@/generated/prisma/client";

export interface SubscriptionRow {
  id: string;
  userId: string;
  paypalSubscriptionId: string;
  status: string;
  startedAt: Date | null;
  nextBillingAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertSubscriptionData {
  paypalSubscriptionId: string;
  status: string;
  startedAt?: Date | null;
  nextBillingAt?: Date | null;
  cancelledAt?: Date | null;
}

export interface ISubscriptionRepository {
  upsert(userId: string, data: UpsertSubscriptionData): Promise<SubscriptionRow>;
  findByUserId(userId: string): Promise<SubscriptionRow | null>;
  findByPaypalId(paypalSubscriptionId: string): Promise<SubscriptionRow | null>;
}

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly db: PrismaClient) {}

  async upsert(userId: string, data: UpsertSubscriptionData): Promise<SubscriptionRow> {
    return this.db.subscription.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data },
    });
  }

  async findByUserId(userId: string): Promise<SubscriptionRow | null> {
    return this.db.subscription.findUnique({ where: { userId } });
  }

  async findByPaypalId(paypalSubscriptionId: string): Promise<SubscriptionRow | null> {
    return this.db.subscription.findUnique({ where: { paypalSubscriptionId } });
  }
}
```

- [ ] **Step 2: Register in container — open `my-app/src/lib/container.ts`**

Add import at top with other repository imports:

```ts
import { SubscriptionRepository } from "@/repositories/SubscriptionRepository";
```

Add instance after `locationRepository`:

```ts
const subscriptionRepository = new SubscriptionRepository(db);
```

Add to the exported `container` object under `// Repositories`:

```ts
  subscriptionRepository,
```

- [ ] **Step 3: Commit**

```bash
git add my-app/src/repositories/SubscriptionRepository.ts my-app/src/lib/container.ts
git commit -m "feat: add SubscriptionRepository"
```

---

### Task 5: PayPalService

**Files:**
- Create: `my-app/src/services/PayPalService.ts`

**Interfaces:**
- Consumes: `config.paypal` from `@/config`
- Produces:
  - `PayPalService` class with:
    - `getAccessToken(): Promise<string>`
    - `createSubscription(userId: string, returnUrl: string, cancelUrl: string): Promise<{ subscriptionId: string; approvalUrl: string }>`
    - `getSubscription(subscriptionId: string): Promise<PayPalSubscription>`
    - `verifyWebhookSignature(headers: Record<string, string>, rawBody: string, parsedBody: unknown): Promise<void>` — throws on failure

- [ ] **Step 1: Create `PayPalService.ts`**

```ts
// my-app/src/services/PayPalService.ts

import { config } from "@/config";

export interface PayPalSubscription {
  id: string;
  status: string; // "APPROVAL_PENDING" | "APPROVED" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED"
  start_time?: string;
  billing_info?: {
    next_billing_time?: string;
  };
}

export class PayPalService {
  private readonly base = config.paypal.baseUrl;

  async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(
      `${config.paypal.clientId}:${config.paypal.clientSecret}`
    ).toString("base64");

    const res = await fetch(`${this.base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      throw new Error(`PayPal auth failed: ${res.status}`);
    }

    const data = await res.json() as { access_token: string };
    return data.access_token;
  }

  async createSubscription(
    userId: string,
    returnUrl: string,
    cancelUrl: string
  ): Promise<{ subscriptionId: string; approvalUrl: string }> {
    const token = await this.getAccessToken();

    const res = await fetch(`${this.base}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        plan_id: config.paypal.planId,
        subscriber: { custom_id: userId },
        application_context: {
          brand_name: "Bluedate",
          locale: "en-IN",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`PayPal createSubscription failed: ${res.status} ${err}`);
    }

    const data = await res.json() as {
      id: string;
      links: Array<{ rel: string; href: string }>;
    };

    const approvalLink = data.links.find((l) => l.rel === "approve");
    if (!approvalLink) {
      throw new Error("PayPal response missing approve link");
    }

    return { subscriptionId: data.id, approvalUrl: approvalLink.href };
  }

  async getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
    const token = await this.getAccessToken();

    const res = await fetch(
      `${this.base}/v1/billing/subscriptions/${subscriptionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      throw new Error(`PayPal getSubscription failed: ${res.status}`);
    }

    return res.json() as Promise<PayPalSubscription>;
  }

  async verifyWebhookSignature(
    headers: Record<string, string>,
    rawBody: string,
    parsedBody: unknown
  ): Promise<void> {
    const token = await this.getAccessToken();

    const res = await fetch(
      `${this.base}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          auth_algo: headers["paypal-auth-algo"],
          cert_url: headers["paypal-cert-url"],
          transmission_id: headers["paypal-transmission-id"],
          transmission_sig: headers["paypal-transmission-sig"],
          transmission_time: headers["paypal-transmission-time"],
          webhook_id: config.paypal.webhookId,
          webhook_event: parsedBody,
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`PayPal webhook verify request failed: ${res.status}`);
    }

    const data = await res.json() as { verification_status: string };
    if (data.verification_status !== "SUCCESS") {
      throw new Error(
        `Webhook signature invalid: ${data.verification_status}`
      );
    }
  }
}
```

- [ ] **Step 2: Register PayPalService in container — open `my-app/src/lib/container.ts`**

Add import with other service imports:

```ts
import { PayPalService } from "@/services/PayPalService";
```

Add instance after `twilioService`:

```ts
const payPalService = new PayPalService();
```

Add to `container` export under `// Services`:

```ts
  payPalService,
```

- [ ] **Step 3: Commit**

```bash
git add my-app/src/services/PayPalService.ts my-app/src/lib/container.ts
git commit -m "feat: add PayPalService (token, createSubscription, getSubscription, verifyWebhook)"
```

---

### Task 6: PaymentService

**Files:**
- Create: `my-app/src/services/PaymentService.ts`

**Interfaces:**
- Consumes:
  - `ISubscriptionRepository` (upsert, findByPaypalId) from Task 4
  - `PayPalService` (createSubscription, getSubscription) from Task 5
  - `PrismaClient` from `@/generated/prisma/client` (for transaction to update User.planType)
  - `config.app.url` from `@/config`
- Produces:
  - `PaymentService` class with:
    - `initiateSubscription(userId: string): Promise<{ approvalUrl: string }>`
    - `activateFromRedirect(paypalSubscriptionId: string): Promise<void>` — called by success redirect route
    - `handleWebhook(event: PayPalWebhookEvent): Promise<void>` — called by webhook route

- [ ] **Step 1: Create `PaymentService.ts`**

```ts
// my-app/src/services/PaymentService.ts

import type { PrismaClient } from "@/generated/prisma/client";
import type { ISubscriptionRepository } from "@/repositories/SubscriptionRepository";
import type { PayPalService } from "@/services/PayPalService";
import { config } from "@/config";
import { logger } from "@/utils/logger";

const log = logger.child("PaymentService");

export interface PayPalWebhookEvent {
  event_type: string;
  resource: {
    id: string;
    status?: string;
    start_time?: string;
    billing_info?: { next_billing_time?: string };
  };
}

const ACTIVATE_EVENTS = new Set([
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.RE-ACTIVATED",
]);

const DEACTIVATE_EVENTS = new Set([
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
  "BILLING.SUBSCRIPTION.EXPIRED",
]);

export class PaymentService {
  constructor(
    private readonly db: PrismaClient,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly payPalService: PayPalService,
  ) {}

  async initiateSubscription(userId: string): Promise<{ approvalUrl: string }> {
    const returnUrl = `${config.app.url}/api/payment/success`;
    const cancelUrl = `${config.app.url}/payment/cancel`;

    const { subscriptionId, approvalUrl } =
      await this.payPalService.createSubscription(userId, returnUrl, cancelUrl);

    await this.subscriptionRepository.upsert(userId, {
      paypalSubscriptionId: subscriptionId,
      status: "pending",
      startedAt: null,
      nextBillingAt: null,
      cancelledAt: null,
    });

    log.info("Subscription initiated", { userId, subscriptionId });
    return { approvalUrl };
  }

  async activateFromRedirect(paypalSubscriptionId: string): Promise<void> {
    const sub = await this.payPalService.getSubscription(paypalSubscriptionId);

    if (sub.status !== "ACTIVE") {
      log.info("Subscription not yet ACTIVE on redirect, skipping", {
        paypalSubscriptionId,
        status: sub.status,
      });
      return;
    }

    const row = await this.subscriptionRepository.findByPaypalId(paypalSubscriptionId);
    if (!row) {
      log.warn("Unknown subscription on success redirect", { paypalSubscriptionId });
      return;
    }

    await this.db.$transaction([
      this.db.subscription.update({
        where: { paypalSubscriptionId },
        data: {
          status: "active",
          startedAt: sub.start_time ? new Date(sub.start_time) : new Date(),
          nextBillingAt: sub.billing_info?.next_billing_time
            ? new Date(sub.billing_info.next_billing_time)
            : null,
        },
      }),
      this.db.user.update({
        where: { id: row.userId },
        data: { planType: "vip" },
      }),
    ]);

    log.info("User upgraded to VIP via redirect", { userId: row.userId, paypalSubscriptionId });
  }

  async handleWebhook(event: PayPalWebhookEvent): Promise<void> {
    const { event_type, resource } = event;
    const paypalSubscriptionId = resource.id;

    if (ACTIVATE_EVENTS.has(event_type)) {
      const row = await this.subscriptionRepository.findByPaypalId(paypalSubscriptionId);
      if (!row) {
        log.warn("Webhook: unknown subscription", { paypalSubscriptionId, event_type });
        return;
      }

      await this.db.$transaction([
        this.db.subscription.update({
          where: { paypalSubscriptionId },
          data: {
            status: "active",
            startedAt: resource.start_time ? new Date(resource.start_time) : new Date(),
            nextBillingAt: resource.billing_info?.next_billing_time
              ? new Date(resource.billing_info.next_billing_time)
              : null,
          },
        }),
        this.db.user.update({
          where: { id: row.userId },
          data: { planType: "vip" },
        }),
      ]);

      log.info("User upgraded to VIP via webhook", { userId: row.userId, event_type });
      return;
    }

    if (DEACTIVATE_EVENTS.has(event_type)) {
      const row = await this.subscriptionRepository.findByPaypalId(paypalSubscriptionId);
      if (!row) {
        log.warn("Webhook: unknown subscription on deactivate", { paypalSubscriptionId, event_type });
        return;
      }

      const statusMap: Record<string, string> = {
        "BILLING.SUBSCRIPTION.CANCELLED": "cancelled",
        "BILLING.SUBSCRIPTION.SUSPENDED": "suspended",
        "BILLING.SUBSCRIPTION.EXPIRED": "expired",
      };

      await this.db.$transaction([
        this.db.subscription.update({
          where: { paypalSubscriptionId },
          data: {
            status: statusMap[event_type] ?? "cancelled",
            cancelledAt: new Date(),
          },
        }),
        this.db.user.update({
          where: { id: row.userId },
          data: { planType: "basic" },
        }),
      ]);

      log.info("User downgraded to Basic via webhook", { userId: row.userId, event_type });
      return;
    }

    log.info("Webhook: unhandled event type, ignoring", { event_type });
  }
}
```

- [ ] **Step 2: Register PaymentService in container — open `my-app/src/lib/container.ts`**

Add import:

```ts
import { PaymentService } from "@/services/PaymentService";
```

Add instance after `userSelfService` (needs `db`, `subscriptionRepository`, `payPalService`):

```ts
const paymentService = new PaymentService(db, subscriptionRepository, payPalService);
```

Add to `container` export:

```ts
  paymentService,
```

- [ ] **Step 3: Commit**

```bash
git add my-app/src/services/PaymentService.ts my-app/src/lib/container.ts
git commit -m "feat: add PaymentService (initiate, activateFromRedirect, handleWebhook)"
```

---

### Task 7: PaymentController + four API routes

**Files:**
- Create: `my-app/src/controllers/PaymentController.ts`
- Create: `my-app/src/app/api/payment/subscribe/route.ts`
- Create: `my-app/src/app/api/payment/success/route.ts`
- Create: `my-app/src/app/api/payment/cancel/route.ts`
- Create: `my-app/src/app/api/webhooks/paypal/route.ts`

**Interfaces:**
- Consumes:
  - `PaymentService` (initiateSubscription, activateFromRedirect, handleWebhook) from Task 6
  - `PayPalService` (verifyWebhookSignature) from Task 5
  - `withAuth`, `withHandler` from `@/middleware/withMiddleware`
  - `successResponse`, `handleError` from `@/utils/response`
- Produces: HTTP handlers for the four routes

- [ ] **Step 1: Create `PaymentController.ts`**

```ts
// my-app/src/controllers/PaymentController.ts

import { NextRequest, NextResponse } from "next/server";
import type { RequestContext } from "@/types";
import type { PaymentService, PayPalWebhookEvent } from "@/services/PaymentService";
import type { PayPalService } from "@/services/PayPalService";
import { successResponse, handleError } from "@/utils/response";
import { config } from "@/config";
import { logger } from "@/utils/logger";

const log = logger.child("PaymentController");

export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly payPalService: PayPalService,
  ) {}

  // POST /api/payment/subscribe — authenticated; returns { approvalUrl }
  async subscribe(_req: NextRequest, ctx: RequestContext) {
    try {
      const result = await this.paymentService.initiateSubscription(ctx.userId);
      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  // GET /api/payment/success?subscription_id=I-XXX — PayPal redirect
  async successRedirect(req: NextRequest) {
    const subscriptionId = req.nextUrl.searchParams.get("subscription_id") ?? "";

    if (subscriptionId) {
      try {
        await this.paymentService.activateFromRedirect(subscriptionId);
      } catch (err) {
        log.error("Failed to activate subscription on redirect", { subscriptionId, err });
      }
    }

    return NextResponse.redirect(new URL("/payment/success", config.app.url));
  }

  // GET /api/payment/cancel — PayPal redirect when user cancels
  cancelRedirect(_req: NextRequest) {
    return NextResponse.redirect(new URL("/payment/cancel", config.app.url));
  }

  // POST /api/webhooks/paypal
  async paypalWebhook(req: NextRequest) {
    const rawBody = await req.text();
    let parsed: PayPalWebhookEvent;

    try {
      parsed = JSON.parse(rawBody) as PayPalWebhookEvent;
    } catch {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const headers: Record<string, string> = {
      "paypal-auth-algo": req.headers.get("paypal-auth-algo") ?? "",
      "paypal-cert-url": req.headers.get("paypal-cert-url") ?? "",
      "paypal-transmission-id": req.headers.get("paypal-transmission-id") ?? "",
      "paypal-transmission-sig": req.headers.get("paypal-transmission-sig") ?? "",
      "paypal-transmission-time": req.headers.get("paypal-transmission-time") ?? "",
    };

    try {
      await this.payPalService.verifyWebhookSignature(headers, rawBody, parsed);
    } catch (err) {
      log.warn("Webhook signature verification failed", { err });
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
    }

    try {
      await this.paymentService.handleWebhook(parsed);
    } catch (err) {
      log.error("Webhook processing error", { event_type: parsed.event_type, err });
      return NextResponse.json({ error: "processing failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }
}
```

- [ ] **Step 2: Register PaymentController in container**

Add import:

```ts
import { PaymentController } from "@/controllers/PaymentController";
```

Add instance after `matchController`:

```ts
const paymentController = new PaymentController(paymentService, payPalService);
```

Add to `container` export:

```ts
  paymentController,
```

- [ ] **Step 3: Create route `my-app/src/app/api/payment/subscribe/route.ts`**

```ts
import { type NextRequest } from "next/server";
import { withAuth } from "@/middleware/withMiddleware";
import { container } from "@/lib/container";

export const POST = withAuth((req: NextRequest, ctx) =>
  container.paymentController.subscribe(req, ctx)
);
```

- [ ] **Step 4: Create route `my-app/src/app/api/payment/success/route.ts`**

```ts
import { type NextRequest } from "next/server";
import { withHandler } from "@/middleware/withMiddleware";
import { container } from "@/lib/container";

export const GET = withHandler((req: NextRequest) =>
  container.paymentController.successRedirect(req)
);
```

- [ ] **Step 5: Create route `my-app/src/app/api/payment/cancel/route.ts`**

```ts
import { type NextRequest } from "next/server";
import { withHandler } from "@/middleware/withMiddleware";
import { container } from "@/lib/container";

export const GET = withHandler((req: NextRequest) =>
  container.paymentController.cancelRedirect(req)
);
```

- [ ] **Step 6: Create webhook route `my-app/src/app/api/webhooks/paypal/route.ts`**

```ts
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";

// No withHandler — we need raw body access (req.text()) before any wrapper parses it
export async function POST(req: NextRequest) {
  return container.paymentController.paypalWebhook(req);
}
```

- [ ] **Step 7: Commit**

```bash
git add my-app/src/controllers/PaymentController.ts \
  my-app/src/lib/container.ts \
  my-app/src/app/api/payment/subscribe/route.ts \
  my-app/src/app/api/payment/success/route.ts \
  my-app/src/app/api/payment/cancel/route.ts \
  my-app/src/app/api/webhooks/paypal/route.ts
git commit -m "feat: add PaymentController and payment/webhook API routes"
```

---

### Task 8: Opt-in guard — gate Basic users from weekly matchmaking

**Files:**
- Modify: `my-app/src/repositories/UserSelfRepository.ts`
- Modify: `my-app/src/services/UserSelfService.ts`

**Interfaces:**
- Consumes: `planType` field on `User` model from Task 1
- Produces: `UserSelfRepository.findPlanType(userId): Promise<'basic' | 'vip'>`, `postHomeOptIn` throws `ForbiddenError` with code `PLAN_REQUIRED` for Basic users

- [ ] **Step 1: Add `findPlanType` to `UserSelfRepository`**

In `my-app/src/repositories/UserSelfRepository.ts`, add after the `findUserBasic` method:

```ts
  findPlanType(userId: string): Promise<{ planType: string } | null> {
    return this.db.user.findUnique({
      where: { id: userId },
      select: { planType: true },
    });
  }
```

- [ ] **Step 2: Add plan check in `UserSelfService.postHomeOptIn`**

In `my-app/src/services/UserSelfService.ts`, add this import at the top:

```ts
import { BadRequestError, ForbiddenError } from "@/utils/errors";
```

(Replace any existing `BadRequestError` import line — keep `BadRequestError` if it's already imported.)

Then at the very start of `postHomeOptIn`, before the `now` check, add:

```ts
    const planRecord = await this.repo.findPlanType(userId);
    if (!planRecord || planRecord.planType !== "vip") {
      throw new ForbiddenError("VIP plan required to opt in to matchmaking.");
    }
```

The full updated method signature area:

```ts
  async postHomeOptIn(userId: string, description?: string) {
    const planRecord = await this.repo.findPlanType(userId);
    if (!planRecord || planRecord.planType !== "vip") {
      throw new ForbiddenError("VIP plan required to opt in to matchmaking.");
    }

    const now = new Date();
    // ... rest of method unchanged
```

- [ ] **Step 3: Verify the ForbiddenError is already in `errors.ts`**

Check that `ForbiddenError` exists in `my-app/src/utils/errors.ts`. It does — it uses `ErrorCode.FORBIDDEN` and status 403.

- [ ] **Step 4: Commit**

```bash
git add my-app/src/repositories/UserSelfRepository.ts my-app/src/services/UserSelfService.ts
git commit -m "feat: gate opt-in behind VIP plan check"
```

---

### Task 9: UI pages — /upgrade, /payment/success, /payment/cancel

**Files:**
- Create: `my-app/src/app/upgrade/page.tsx`
- Create: `my-app/src/app/upgrade/UpgradeView.tsx`
- Create: `my-app/src/app/payment/success/page.tsx`
- Create: `my-app/src/app/payment/cancel/page.tsx`

**Interfaces:**
- Consumes: `config.app.url` indirectly (PayPal redirects to `/api/payment/success` and `/payment/cancel`)
- Produces: three client-rendered pages following the app's visual style (`BG="#EDE8D5"`, `DARK="#2B1A07"`, `ACCENT="#E8622A"`, `MUTED="#7A6A54"`, `SERIF="'Playfair Display', Georgia, serif"`)

- [ ] **Step 1: Create `UpgradeView.tsx`**

```tsx
// my-app/src/app/upgrade/UpgradeView.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BG = "#EDE8D5";
const DARK = "#2B1A07";
const ACCENT = "#E8622A";
const MUTED = "#7A6A54";
const SERIF = "'Playfair Display', Georgia, serif";

export function UpgradeView() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payment/subscribe", { method: "POST" });
      const data = await res.json() as { success: boolean; data?: { approvalUrl: string }; error?: { message: string } };
      if (!data.success || !data.data?.approvalUrl) {
        setError(data.error?.message ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.href = data.data.approvalUrl;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG,
        paddingTop: "max(env(safe-area-inset-top), 24px)",
        paddingBottom: 32,
        display: "flex",
        flexDirection: "column",
        maxWidth: 480,
        margin: "0 auto",
        width: "100%",
        padding: "max(env(safe-area-inset-top), 24px) 20px 32px",
        boxSizing: "border-box",
      }}
    >
      <h1
        style={{
          fontFamily: SERIF,
          fontSize: 30,
          fontWeight: 800,
          color: DARK,
          margin: "0 0 6px",
          lineHeight: 1.2,
        }}
      >
        Choose your plan
      </h1>
      <p style={{ color: MUTED, fontSize: 14, margin: "0 0 32px" }}>
        Unlock weekly matchmaking with a VIP membership.
      </p>

      {/* Basic card */}
      <div
        style={{
          background: "#fff",
          border: `2px solid ${DARK}`,
          borderRadius: 18,
          padding: "20px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: DARK }}>Basic</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: DARK }}>Free</span>
        </div>
        <ul style={{ margin: 0, padding: "0 0 0 16px", color: MUTED, fontSize: 13, lineHeight: 1.7 }}>
          <li>Full profile & onboarding</li>
          <li>Browse the app</li>
          <li style={{ color: "#9ca3af", textDecoration: "line-through" }}>Weekly matchmaking opt-in</li>
          <li style={{ color: "#9ca3af", textDecoration: "line-through" }}>Priority matching</li>
        </ul>
        <button
          onClick={() => router.push("/home")}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "12px 0",
            border: `2px solid ${DARK}`,
            borderRadius: 999,
            background: "transparent",
            color: DARK,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Continue with Basic
        </button>
      </div>

      {/* VIP card */}
      <div
        style={{
          background: DARK,
          border: `2.5px solid ${DARK}`,
          boxShadow: `6px 6px 0 ${ACCENT}`,
          borderRadius: 18,
          padding: "20px",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: "#fff" }}>VIP</span>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>₹99</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginLeft: 4 }}>/month</span>
          </div>
        </div>
        <ul style={{ margin: 0, padding: "0 0 0 16px", color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 1.7 }}>
          <li>Everything in Basic</li>
          <li style={{ color: "#fff", fontWeight: 600 }}>Weekly matchmaking opt-in</li>
          <li style={{ color: "#fff", fontWeight: 600 }}>Priority matching</li>
        </ul>

        {error && (
          <p style={{ color: ACCENT, fontSize: 13, marginTop: 12, marginBottom: 0 }}>{error}</p>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "14px 0",
            border: "none",
            borderRadius: 999,
            background: loading ? MUTED : ACCENT,
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {loading ? "Redirecting to PayPal…" : "Subscribe with PayPal"}
        </button>
      </div>

      <p style={{ fontSize: 11, color: MUTED, textAlign: "center", margin: 0 }}>
        Cancel anytime via your PayPal account. No hidden fees.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create `my-app/src/app/upgrade/page.tsx`**

```tsx
// my-app/src/app/upgrade/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { config } from "@/config";
import { UpgradeView } from "./UpgradeView";

export default async function UpgradePage() {
  const jar = await cookies();
  const token = jar.get("access_token")?.value;
  if (!token) redirect("/login");

  try {
    const secret = new TextEncoder().encode(config.auth.jwtSecret);
    await jwtVerify(token, secret);
  } catch {
    redirect("/login");
  }

  return <UpgradeView />;
}
```

- [ ] **Step 3: Create `my-app/src/app/payment/success/page.tsx`**

```tsx
// my-app/src/app/payment/success/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const BG = "#EDE8D5";
const DARK = "#2B1A07";
const ACCENT = "#E8622A";
const SERIF = "'Playfair Display', Georgia, serif";

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push("/home"), 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: ACCENT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          marginBottom: 24,
        }}
      >
        ✓
      </div>
      <h1
        style={{
          fontFamily: SERIF,
          fontSize: 28,
          fontWeight: 800,
          color: DARK,
          margin: "0 0 12px",
        }}
      >
        You&apos;re now VIP!
      </h1>
      <p style={{ color: DARK, fontSize: 15, margin: "0 0 8px" }}>
        Your subscription is active. Welcome to weekly matchmaking.
      </p>
      <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
        Redirecting you home in a moment…
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Create `my-app/src/app/payment/cancel/page.tsx`**

```tsx
// my-app/src/app/payment/cancel/page.tsx
"use client";

import { useRouter } from "next/navigation";

const BG = "#EDE8D5";
const DARK = "#2B1A07";
const MUTED = "#7A6A54";
const SERIF = "'Playfair Display', Georgia, serif";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontFamily: SERIF,
          fontSize: 28,
          fontWeight: 800,
          color: DARK,
          margin: "0 0 12px",
        }}
      >
        No worries
      </h1>
      <p style={{ color: MUTED, fontSize: 15, margin: "0 0 28px", maxWidth: 320 }}>
        You haven&apos;t been charged. You can upgrade to VIP whenever you&apos;re ready.
      </p>
      <button
        onClick={() => router.push("/upgrade")}
        style={{
          padding: "13px 28px",
          background: DARK,
          color: "#fff",
          border: "none",
          borderRadius: 999,
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        View plans
      </button>
      <button
        onClick={() => router.push("/home")}
        style={{
          marginTop: 12,
          padding: "12px 28px",
          background: "transparent",
          color: MUTED,
          border: "none",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Go to home
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add my-app/src/app/upgrade/ my-app/src/app/payment/
git commit -m "feat: add upgrade, payment/success, and payment/cancel pages"
```

---

### Task 10: Home screen — upgrade prompt for Basic users

**Files:**
- Modify: `my-app/src/app/(main)/home/page.tsx`
- Modify: `my-app/src/app/(main)/home/HomeView.tsx`

**Interfaces:**
- Consumes: `planType` field on `User` model (from Task 1), `db.user.findUnique` in server page
- Produces: `HomeView` accepts `planType: "basic" | "vip"` prop; Basic users see upgrade prompt instead of opt-in button

- [ ] **Step 1: Update `home/page.tsx` to read `planType` from the DB and pass it as a prop**

After the `jwtVerify` block (where `userId` is set), add a DB query for planType. The file already imports `db` and `config`. Modify the page to also select `planType`:

Replace the `const record = await db.weeklyOptIn...` block and the `return` with:

```tsx
  const [record, userRow] = await Promise.all([
    db.weeklyOptIn.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
      select: { mode: true, description: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { planType: true },
    }),
  ]);

  const planType = (userRow?.planType ?? "basic") as "basic" | "vip";

  const initial = {
    optedIn: !!record,
    mode: (record?.mode ?? null) as "date" | "bff" | null,
    description: record?.description ?? null,
    weekStart: weekStart.toISOString(),
    deadline: deadline.toISOString(),
    windowOpen: now < deadline,
  };

  return <HomeView initial={initial} planType={planType} />;
```

- [ ] **Step 2: Update `HomeView.tsx` to accept and use `planType`**

Change the component signature from:

```tsx
export function HomeView({ initial }: { initial: OptInState }) {
```

to:

```tsx
export function HomeView({ initial, planType }: { initial: OptInState; planType: "basic" | "vip" }) {
```

Then find the `{!state.optedIn && (` block. Replace the `<button onClick={handleOptIn}...>` and the surrounding card with logic that shows an upgrade prompt for Basic users:

```tsx
      {!state.optedIn && (
        <div style={{ padding: "0 16px" }}>
          {planType === "vip" ? (
            <div
              style={{
                background: "#fff",
                border: `2.5px solid ${DARK}`,
                boxShadow: `4px 4px 0 ${DARK}`,
                borderRadius: 18,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <p style={{ margin: "0 0 4px", fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: DARK }}>
                  Want a match this week?
                </p>
                <p style={{ margin: 0, fontSize: 13, color: MUTED }}>
                  Opt in and we&apos;ll find you someone by the weekend.
                </p>
              </div>

              {!initial.description && (
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                    Describe your type <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                  </label>
                  <TypeTextarea
                    value={description}
                    onChange={setDescription}
                    disabled={!windowOpen}
                    placeholder="e.g. someone outdoorsy who loves films…"
                  />
                </div>
              )}

              <button
                onClick={handleOptIn}
                disabled={!windowOpen || optingIn}
                style={{
                  background: windowOpen ? DARK : MUTED,
                  color: "#fff",
                  border: `2.5px solid ${DARK}`,
                  boxShadow: windowOpen ? `4px 4px 0 ${DARK}` : "none",
                  borderRadius: 999,
                  padding: "14px 24px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: windowOpen ? "pointer" : "not-allowed",
                  width: "100%",
                  transition: "opacity 0.15s",
                  opacity: optingIn ? 0.7 : 1,
                }}
              >
                {optingIn ? "Opting in…" : windowOpen ? "Opt In for This Week" : "Window Closed"}
              </button>
            </div>
          ) : (
            <div
              style={{
                background: DARK,
                border: `2.5px solid ${DARK}`,
                boxShadow: `4px 4px 0 #E8622A`,
                borderRadius: 18,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div>
                <p style={{ margin: "0 0 4px", fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: "#fff" }}>
                  Upgrade to get matched
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                  VIP members get access to weekly matchmaking for ₹99/month.
                </p>
              </div>
              <a
                href="/upgrade"
                style={{
                  display: "block",
                  textAlign: "center",
                  background: "#E8622A",
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  padding: "14px 24px",
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                View VIP plans
              </a>
            </div>
          )}
        </div>
      )}
```

- [ ] **Step 3: Commit**

```bash
git add my-app/src/app/\(main\)/home/page.tsx my-app/src/app/\(main\)/home/HomeView.tsx
git commit -m "feat: show upgrade prompt on home screen for Basic users"
```

---

### Task 11: Post-onboarding redirect to /upgrade

**Files:**
- Modify: `my-app/src/app/onboarding/OnboardingShell.tsx`

**Interfaces:**
- Consumes: the onboarding complete API response `{ data: { accessToken } }` (already returned by `OnboardingController.complete`)
- Produces: after successful onboarding completion, redirect to `/upgrade` instead of `/home`

- [ ] **Step 1: Change the redirect target from `/home` to `/upgrade` in `OnboardingShell.tsx` at line 901**

Replace (line 901):

```ts
window.location.assign("/home");
```

with:

```ts
window.location.assign("/upgrade");
```

This is inside the helper that runs after `POST /api/onboarding/complete` succeeds. No other navigation in the file should be changed.

- [ ] **Step 3: Commit**

```bash
git add my-app/src/app/onboarding/OnboardingShell.tsx
git commit -m "feat: redirect to /upgrade after onboarding completes"
```

---

### Task 12: Admin users table — Plan column

**Files:**
- Modify: `my-app/src/app/admin/users/page.tsx` (the `getUsers` function at line 114 builds rows inline — no repository/service involved)
- Modify: `my-app/src/app/admin/users/UsersTable.tsx`

**Interfaces:**
- Consumes: `planType` field on `User` from Task 1 (automatically available on Prisma user rows since the field is on the `User` model and the query uses `findMany` without a `select` on the user root)
- Produces: `UserRow` gains `planType: "basic" | "vip"` field; table gains a Plan column with a badge

- [ ] **Step 1: Add `planType` to the rows mapping in `page.tsx` at line ~124**

In `my-app/src/app/admin/users/page.tsx`, inside the `getUsers` function, find the `users.map((u) => ({...}))` block (lines 114–125). Add `planType` to the mapped object:

```ts
  const rows = users.map((u) => ({
    id: u.id,
    phone: u.phone,
    email: u.email,
    name: u.profile?.fullName ?? "—",
    city: u.profile?.city ?? "—",
    gender: u.preferences?.genderIdentity ?? "—",
    step: computeAdminUserStep(u),
    completed: u.onboardingCompleted,
    optInStatus: (u.optInStatus as string) ?? "opted_out",
    joinedAt: u.createdAt.toISOString(),
    planType: (u.planType as "basic" | "vip") ?? "basic",
  }));
```

- [ ] **Step 2: Add `planType: "basic" | "vip"` to the `UserRow` type in `UsersTable.tsx`**

Change the `type UserRow` definition (near the top of `UsersTable.tsx`) to include:

```ts
type UserRow = {
  id: string;
  phone: string | null;
  email: string | null;
  name: string;
  city: string;
  gender: string;
  step: string;
  completed: boolean;
  optInStatus: string;
  joinedAt: string;
  planType: "basic" | "vip";
};
```

- [ ] **Step 3: Add the Plan column header in `UsersTable.tsx`**

After the `Joined` `<th>` cell and before the actions `<th>`, add:

```tsx
<th className={plainThClass} style={{ color: HEADER_TEXT }}>
  Plan
</th>
```

Also update the empty state `colSpan` from `8` to `9`.

- [ ] **Step 4: Add the Plan badge in each `<tr>` of the body**

After the `Joined` `<td>` cell and before the actions `<td>`, add:

```tsx
<td className="px-4 py-3">
  {u.planType === "vip" ? (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: "#7c3aed", backgroundColor: "#7c3aed18" }}
    >
      VIP
    </span>
  ) : (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: "#6b7280", backgroundColor: "#6b728018" }}
    >
      Basic
    </span>
  )}
</td>
```

- [ ] **Step 5: Commit**

```bash
git add my-app/src/app/admin/users/page.tsx \
  my-app/src/app/admin/users/UsersTable.tsx
git commit -m "feat: add Plan column to admin users table"
```

---

### Task 13: Register PayPal webhook in PayPal dashboard

**Files:** None (configuration step, no code)

- [ ] **Step 1: Log into the PayPal developer dashboard at developer.paypal.com**

- [ ] **Step 2: Go to Apps & Credentials → select your live app → Webhooks → Add Webhook**

- [ ] **Step 3: Set the webhook URL to: `https://<your-production-domain>/api/webhooks/paypal`**

- [ ] **Step 4: Select these event types:**
  - `BILLING.SUBSCRIPTION.ACTIVATED`
  - `BILLING.SUBSCRIPTION.RE-ACTIVATED`
  - `BILLING.SUBSCRIPTION.CANCELLED`
  - `BILLING.SUBSCRIPTION.SUSPENDED`
  - `BILLING.SUBSCRIPTION.EXPIRED`

- [ ] **Step 5: Copy the Webhook ID from the dashboard**

- [ ] **Step 6: Set `PAYPAL_WEBHOOK_ID=<copied-id>` in `.env` and in your Vercel/production environment**

---

### Task 14: Build check

- [ ] **Step 1: Run the TypeScript build from inside `my-app/`**

```bash
cd my-app && npx tsc --noEmit
```

Expected: zero type errors.

- [ ] **Step 2: If there are type errors, fix them and re-run until clean**

- [ ] **Step 3: Run the Next.js build**

```bash
cd my-app && npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit any type fixes**

```bash
git add -A
git commit -m "fix: resolve type errors from PayPal payment integration"
```
