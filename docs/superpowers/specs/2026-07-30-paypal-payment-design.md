# PayPal Subscription Payment — Design Spec
**Date:** 2026-07-30  
**Status:** Approved

---

## Overview

Add a two-tier plan system (Basic / VIP) to bluedate.io, gated behind a PayPal monthly subscription at ₹99/month.

- **Basic** (free, default): full app access — onboarding, profile, browsing — but **cannot opt in to weekly matchmaking**.
- **VIP** (₹99/month): everything in Basic + access to the weekly opt-in pool and priority matching.

PayPal's Subscriptions API handles all recurring billing. Lifecycle events (activation, cancellation, suspension, expiry) are received via webhook and automatically upgrade/downgrade the user's plan in the database.

---

## 1. Database Schema

### New Enums

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

### User Model — New Field

```prisma
planType  PlanType  @default(basic)
```

### New Model: Subscription

```prisma
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

`userId` is `@unique` — one row per user. Resubscription updates the existing row rather than creating a new one.

---

## 2. PayPal One-Time Setup

A setup script (`scripts/setup-paypal-plan.ts`) runs **once** to:
1. Create a PayPal Product (bluedate VIP)
2. Create a monthly billing Plan at ₹99 INR
3. Print the resulting `PAYPAL_PLAN_ID` to be stored in env

### Environment Variables

| Variable | Source |
|---|---|
| `PAYPAL_CLIENT_ID` | Provided by user |
| `PAYPAL_CLIENT_SECRET` | Provided by user |
| `PAYPAL_PLAN_ID` | Output of setup script |
| `PAYPAL_WEBHOOK_ID` | PayPal dashboard (after registering webhook URL) |
| `NEXT_PUBLIC_APP_URL` | Already exists or needs adding |

PayPal API base URL: `https://api-m.paypal.com` (live/production).

---

## 3. Backend Architecture

Follows the existing **controllers → services → repositories** pattern.

### 3a. SubscriptionRepository

```
upsert(userId, data)            — create or update the user's subscription row
findByUserId(userId)            — look up by user
findByPaypalId(subscriptionId)  — look up by PayPal subscription ID
```

### 3b. PayPalService

Thin wrapper around the PayPal REST API:

```
getAccessToken()
  → OAuth2 client_credentials grant → returns Bearer token

createSubscription(userId, returnUrl, cancelUrl)
  → POST /v1/billing/subscriptions with PAYPAL_PLAN_ID
  → returns { subscriptionId, approvalUrl }

verifyWebhookSignature(headers, rawBody)
  → POST /v1/notifications/verify-webhook-signature
  → uses PAYPAL_WEBHOOK_ID + 5 PayPal headers
  → throws if signature invalid
```

### 3c. PaymentService

Orchestration layer:

```
initiateSubscription(userId)
  → calls PayPalService.createSubscription
  → upserts Subscription row with status=pending
  → returns approvalUrl

handleWebhook(event)
  → routes by event_type:
    BILLING.SUBSCRIPTION.ACTIVATED    → status=active,    user.planType=vip
    BILLING.SUBSCRIPTION.RE-ACTIVATED → status=active,    user.planType=vip
    BILLING.SUBSCRIPTION.CANCELLED    → status=cancelled, user.planType=basic
    BILLING.SUBSCRIPTION.SUSPENDED    → status=suspended, user.planType=basic
    BILLING.SUBSCRIPTION.EXPIRED      → status=expired,   user.planType=basic
```

Both `Subscription.status` and `User.planType` are updated in a single Prisma transaction.

### 3d. PaymentController

```
subscribe(req, ctx)   → calls PaymentService.initiateSubscription, returns { approvalUrl }
webhook(req)          → verifies signature, calls PaymentService.handleWebhook, returns 200
```

---

## 4. API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/payment/subscribe` | Bearer JWT | Create PayPal subscription, return approval URL |
| GET | `/api/payment/success` | — | PayPal redirect after approval; calls PayPal GET subscription to confirm ACTIVE status, activates in DB (idempotent with webhook), then redirects browser to `/payment/success` UI page |
| GET | `/api/payment/cancel` | — | PayPal redirect on cancel; redirects browser to `/payment/cancel` UI page |
| POST | `/api/webhooks/paypal` | Webhook sig | PayPal lifecycle event handler |

### Opt-in Guard

`POST /api/home/opt-in` gains a plan check before processing:

```ts
if (user.planType !== 'vip') {
  return 403, { code: "PLAN_REQUIRED", message: "VIP plan required to opt in." }
}
```

---

## 5. UI

### New Pages

**`/upgrade`**
- Plan comparison: Basic (free) vs VIP (₹99/month)
- "Subscribe with PayPal" button → calls `POST /api/payment/subscribe`, redirects to returned `approvalUrl`
- Basic users can dismiss/skip this page and continue using the app
- Shown to users: (a) immediately after onboarding completes, (b) on-demand when a Basic user tries to opt in

**`/payment/success`**
- Shown after PayPal redirects back with approval
- Confirms VIP activation ("You're now VIP!")
- Auto-redirects to `/home` after 3 seconds

**`/payment/cancel`**
- Shown if user cancels on PayPal's page
- Friendly message + link back to `/upgrade`

### Changes to Existing Pages

**Post-onboarding redirect** (`/api/onboarding/complete`):
- Currently redirects to `/home`
- After this change: redirect new users to `/upgrade` (skippable)

**Home screen (`HomeView.tsx`)**:
- Basic user clicks "Opt In for This Week" → opt-in button is replaced with an inline upgrade prompt card linking to `/upgrade`
- VIP users see the opt-in flow unchanged
- The `HomeView` receives `planType` as a prop (passed from the server page component, which reads it from the DB — `planType` is **not** stored in the JWT and requires a DB lookup)

**Admin users table** (`/admin/users`):
- Add a `Plan` column showing `basic` or `vip` per user

---

## 6. Webhook Verification

PayPal sends 5 headers with each webhook:
- `PAYPAL-TRANSMISSION-ID`
- `PAYPAL-TRANSMISSION-TIME`
- `PAYPAL-CERT-URL`
- `PAYPAL-AUTH-ALGO`
- `PAYPAL-TRANSMISSION-SIG`

`PayPalService.verifyWebhookSignature` calls `POST /v1/notifications/verify-webhook-signature` with these headers, the raw request body, and `PAYPAL_WEBHOOK_ID`. Any non-`SUCCESS` verification result causes the webhook route to return 400 and skip processing.

The webhook endpoint reads the **raw body** (not parsed JSON) before verification, then parses after.

---

## 7. Out of Scope

- Cancelling a subscription from inside the app (users cancel via PayPal's portal; the webhook handles the result)
- Proration, trials, or coupons
- Multiple plan tiers beyond Basic / VIP
- Admin ability to manually grant/revoke VIP (can be added later)
