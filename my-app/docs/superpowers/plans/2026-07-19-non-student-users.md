# Non-Student Users Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Tryren to support non-student (regular) users with email OTP sign-in, a location-based onboarding step, admin-managed location hierarchy, and location filter/display in the admin match-users view.

**Architecture:** Option A — single `OnboardingShell` with `userType` branching (mirrors existing Date/BFF branching). A new `Location` model owns city+subArea data; `Profile.locationId` FK references it with `onDelete: SetNull` so admin deletes/updates cascade automatically. All new server logic follows the existing Repository → Service → Controller → Route pattern.

**Tech Stack:** Next.js 14 (App Router), Prisma + Supabase PostgreSQL, TypeScript strict, Zod validation, DI container at `src/lib/container.ts`, Tailwind + custom admin theme.

## Global Constraints

- All working directory commands run from `my-app/` unless stated otherwise
- TypeScript strict mode — no `any` without explicit cast and comment
- Follow existing patterns: `successResponse`/`handleError` from `@/utils/response`, `requireAdminId` for admin routes, `withAuth` middleware for authenticated onboarding routes
- Admin UI uses `adminTheme` from `@/lib/adminTheme` and classes from `@/lib/adminChrome`
- No new npm packages — use only what's already installed
- After every task: run `npx tsc --noEmit` and fix any errors before committing

---

## File Map

### New files
| File | Purpose |
|------|---------|
| `src/repositories/LocationRepository.ts` | CRUD for `Location` table |
| `src/controllers/AdminLocationController.ts` | Admin location CRUD HTTP adapter |
| `src/app/api/admin/locations/route.ts` | GET + POST /api/admin/locations |
| `src/app/api/admin/locations/[id]/route.ts` | PUT + DELETE /api/admin/locations/[id] |
| `src/app/admin/locations/page.tsx` | Admin locations server page |
| `src/app/admin/locations/LocationsClient.tsx` | Admin locations client component |
| `src/app/api/onboarding/locations/route.ts` | GET /api/onboarding/locations (public) |
| `src/app/api/onboarding/location/route.ts` | POST /api/onboarding/location (auth) |

### Modified files
| File | What changes |
|------|-------------|
| `prisma/schema.prisma` | Add `UserType` enum, `User.userType`, `Profile.locationId`, `Location` model |
| `src/domains/User.ts` | Add `userType` to `User` interface |
| `src/repositories/UserRepository.ts` | Update `toDomain` and `findOrCreateByEmail` for `userType` |
| `src/validations/otp.validation.ts` | `collegeName` optional, add `userType` to both schemas |
| `src/services/AuthService.ts` | Skip domain check for `non_student` in `sendOtp`; pass `userType` in `verifyOtp` |
| `src/repositories/OnboardingRepository.ts` | Add `upsertLocation`, update `getOnboardingStatus` for `userType`+`hasLocation` |
| `src/services/OnboardingService.ts` | Add `saveLocation` and `getLocations` |
| `src/controllers/OnboardingController.ts` | Add `saveLocation` and `getLocations` handlers |
| `src/app/onboarding/page.tsx` | Add `userType` + `hasLocation` to `OnboardingStatus`; query from DB |
| `src/app/onboarding/OnboardingShell.tsx` | Add location subStep 2, branching after subStep 0 |
| `src/app/login/LoginForm.tsx` | Add `"role"` step; adapt email form for `userType` |
| `src/lib/container.ts` | Register `locationRepository` and `adminLocationController` |
| `src/app/admin/AdminShell.tsx` | Add Locations nav item |
| `src/repositories/AdminMatchUsersRepository.ts` | Add location join to candidate select; add filter params |
| `src/services/AdminMatchUsersService.ts` | Forward location filter params to repository |
| `src/controllers/AdminMatchUsersController.ts` | Parse `userType`, `city`, `subArea` query params |
| `src/app/admin/match-users/MatchUsersView.tsx` | Show location on cards; add filter UI |

---

## Task 1: Prisma Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `UserType` enum, `User.userType`, `Profile.locationId`, `Location` model — available to all subsequent tasks via Prisma generated client

- [ ] **Step 1: Edit schema.prisma**

Add the `UserType` enum after the existing `OptInStatus` enum (around line 42):

```prisma
enum UserType {
  student
  non_student
}
```

Add `userType` field to the `User` model after the `optedInAt` field (around line 54):

```prisma
  userType            UserType    @default(student)
```

Add `locationId` and `location` relation to the `Profile` model after the `bio` field (around line 133):

```prisma
  locationId  String?
  location    Location? @relation(fields: [locationId], references: [id], onDelete: SetNull)
```

Add the `Location` model after the `CollegeDomain` model (around line 108):

```prisma
// ─── Location — admin-managed city / sub-area hierarchy ──────────────────────

model Location {
  id        String    @id @default(cuid())
  city      String
  subArea   String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  profiles  Profile[]

  @@unique([city, subArea])
  @@index([city])
  @@map("locations")
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_user_type_and_locations
```

Expected output: `The following migration(s) have been created and applied: migrations/YYYYMMDD_add_user_type_and_locations`

- [ ] **Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client`

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add UserType enum, Location model, Profile.locationId"
```

---

## Task 2: LocationRepository

**Files:**
- Create: `src/repositories/LocationRepository.ts`

**Interfaces:**
- Consumes: `PrismaClient` from `@/generated/prisma/client`
- Produces:
  - `ILocationRepository` interface
  - `LocationRepository` class
  - `GroupedLocation` type: `{ city: string; subAreas: { id: string; name: string }[] }`

- [ ] **Step 1: Create the file**

```typescript
// src/repositories/LocationRepository.ts
import type { PrismaClient } from "@/generated/prisma/client";

export interface GroupedLocation {
  city: string;
  subAreas: { id: string; name: string }[];
}

export interface ILocationRepository {
  findAll(): Promise<GroupedLocation[]>;
  findById(id: string): Promise<{ id: string; city: string; subArea: string } | null>;
  create(city: string, subArea: string): Promise<{ id: string; city: string; subArea: string }>;
  update(id: string, city: string, subArea: string): Promise<{ id: string; city: string; subArea: string }>;
  updateCity(oldCity: string, newCity: string): Promise<void>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export class LocationRepository implements ILocationRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll(): Promise<GroupedLocation[]> {
    const rows = await this.db.location.findMany({
      orderBy: [{ city: "asc" }, { subArea: "asc" }],
      select: { id: true, city: true, subArea: true },
    });
    const map = new Map<string, { id: string; name: string }[]>();
    for (const row of rows) {
      if (!map.has(row.city)) map.set(row.city, []);
      map.get(row.city)!.push({ id: row.id, name: row.subArea });
    }
    return Array.from(map.entries()).map(([city, subAreas]) => ({ city, subAreas }));
  }

  async findById(id: string) {
    return this.db.location.findUnique({
      where: { id },
      select: { id: true, city: true, subArea: true },
    });
  }

  async create(city: string, subArea: string) {
    return this.db.location.create({
      data: { city: city.trim(), subArea: subArea.trim() },
      select: { id: true, city: true, subArea: true },
    });
  }

  async update(id: string, city: string, subArea: string) {
    return this.db.location.update({
      where: { id },
      data: { city: city.trim(), subArea: subArea.trim() },
      select: { id: true, city: true, subArea: true },
    });
  }

  async updateCity(oldCity: string, newCity: string): Promise<void> {
    await this.db.location.updateMany({
      where: { city: oldCity },
      data: { city: newCity.trim() },
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.location.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.db.location.findUnique({ where: { id }, select: { id: true } });
    return row !== null;
  }
}
```

- [ ] **Step 2: Register in container**

In `src/lib/container.ts`, add after the existing repository imports:

```typescript
import { LocationRepository } from "@/repositories/LocationRepository";
```

Add after `const userSelfRepository = new UserSelfRepository(db);`:

```typescript
const locationRepository = new LocationRepository(db);
```

Add `locationRepository` to the exported `container` object (find the `export const container = {` block and add it):

```typescript
  locationRepository,
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/repositories/LocationRepository.ts src/lib/container.ts
git commit -m "feat: add LocationRepository and register in container"
```

---

## Task 3: User Domain + UserRepository + Auth Validation + AuthService

**Files:**
- Modify: `src/domains/User.ts`
- Modify: `src/repositories/UserRepository.ts`
- Modify: `src/validations/otp.validation.ts`
- Modify: `src/services/AuthService.ts`

**Interfaces:**
- Consumes: `UserType` from generated Prisma client (from Task 1)
- Produces:
  - `User.userType: "student" | "non_student"` — available to all code importing the domain
  - Updated `SendOtpInput`: `{ email, collegeName?, userType: "student"|"non_student" }`
  - Updated `VerifyOtpInput`: `{ email, code, userType?: "student"|"non_student" }`
  - `IUserRepository.findOrCreateByEmail(email, collegeName, userType?)` — third param optional, defaults to `"student"`

- [ ] **Step 1: Update User domain**

In `src/domains/User.ts`, add `userType` to the `User` interface after `collegeName`:

```typescript
export interface User {
  id: string;
  phone?: string;
  email?: string;
  collegeName?: string;
  userType: "student" | "non_student";
  role: UserRole;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 2: Update UserRepository toDomain**

In `src/repositories/UserRepository.ts`, update the `toDomain` function:

```typescript
function toDomain(row: PrismaUser): User {
  return {
    id: row.id,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    collegeName: row.collegeName ?? undefined,
    userType: row.userType as "student" | "non_student",
    role: row.role as User["role"],
    onboardingCompleted: row.onboardingCompleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
```

- [ ] **Step 3: Update IUserRepository interface and findOrCreateByEmail**

In `src/repositories/UserRepository.ts`, update the interface:

```typescript
  findOrCreateByEmail(
    email: string,
    collegeName: string,
    userType?: "student" | "non_student",
  ): Promise<{ user: User; created: boolean }>;
```

Update the implementation:

```typescript
  async findOrCreateByEmail(
    email: string,
    collegeName: string,
    userType: "student" | "non_student" = "student",
  ): Promise<{ user: User; created: boolean }> {
    const existing = await this.db.user.findUnique({ where: { email } });
    if (existing) return { user: toDomain(existing), created: false };

    const row = await this.db.user.create({
      data: { email, collegeName: collegeName || null, userType },
    });
    return { user: toDomain(row), created: true };
  }
```

- [ ] **Step 4: Update OTP validation schemas**

Replace the entire content of `src/validations/otp.validation.ts`:

```typescript
import { z } from "zod";

export const sendOtpSchema = z.object({
  email: z.string().trim().email("Must be a valid email address"),
  collegeName: z.string().trim().optional(),
  userType: z.enum(["student", "non_student"]).default("student"),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().email("Must be a valid email address"),
  code: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must be numeric"),
  userType: z.enum(["student", "non_student"]).optional().default("student"),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
```

- [ ] **Step 5: Update AuthService.sendOtp**

In `src/services/AuthService.ts`, replace the `sendOtp` method:

```typescript
  async sendOtp(input: SendOtpInput): Promise<SendOtpResponseDTO> {
    if (input.userType === "student") {
      const emailDomain = input.email.split("@")[1]?.toLowerCase();
      if (!input.collegeName) {
        throw new BadRequestError("College name is required for student sign-in.");
      }
      const college = await this.collegeDomainRepository.findByCollegeName(input.collegeName);
      if (!college) {
        throw new BadRequestError(`College "${input.collegeName}" is not registered.`);
      }
      if (emailDomain !== college.domain.toLowerCase()) {
        throw new BadRequestError(
          `Email domain @${emailDomain} does not match ${input.collegeName}. Use your @${college.domain} email.`,
        );
      }
    }

    await this.emailService.sendOtp(input.email);
    log.info("Email OTP sent", { email: input.email, userType: input.userType });

    return {
      message: "Verification code sent to your email. Valid for 10 minutes.",
      expiresInMinutes: config.auth.otpTtlMinutes,
    };
  }
```

- [ ] **Step 6: Update AuthService.verifyOtp**

In `src/services/AuthService.ts`, replace the `verifyOtp` method:

```typescript
  async verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpResponseDTO> {
    await this.emailService.verifyOtp(input.email, input.code);

    const existingUser = await this.userRepository.findByEmail(input.email);
    const collegeName = existingUser?.collegeName ?? "";
    // Existing users keep their stored userType; new users get the one from the request
    const userType = existingUser?.userType ?? input.userType ?? "student";

    const { user, created } = await this.userRepository.findOrCreateByEmail(
      input.email,
      collegeName,
      userType,
    );

    if (created) log.info("New user created via email OTP", { userId: user.id, userType });
    else log.info("Existing user authenticated via email OTP", { userId: user.id });

    const token = this.issueToken(
      user.id,
      user.phone,
      user.email,
      user.role,
      user.onboardingCompleted,
    );

    return {
      user: toUserAuthDTO(user),
      token,
      onboardingCompleted: user.onboardingCompleted,
      redirectTo: user.onboardingCompleted ? "/home" : "/onboarding",
    };
  }
```

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. Fix any TypeScript errors before proceeding.

- [ ] **Step 8: Commit**

```bash
git add src/domains/User.ts src/repositories/UserRepository.ts src/validations/otp.validation.ts src/services/AuthService.ts
git commit -m "feat: add userType to User domain, update auth OTP flow for non-students"
```

---

## Task 4: Login — Role-Select Step

**Files:**
- Modify: `src/app/login/LoginForm.tsx`

**Interfaces:**
- Consumes: Updated `sendOtpSchema` with `userType` (Task 3)
- Produces: Login page now has 3 steps: `"role"` → `"email"` → `"otp"` (→ `"phone"` for new users)

- [ ] **Step 1: Add userType state and role step to LoginForm**

In `src/app/login/LoginForm.tsx`, make the following changes:

**a) Update the `Step` type** (line ~11):
```typescript
type Step = "role" | "email" | "otp" | "phone";
```

**b) Add `userType` state** and change `step` initial value (inside `LoginForm` function, after existing state declarations):
```typescript
  const [userType, setUserType] = useState<"student" | "non_student">("student");
```

Change:
```typescript
  const [step, setStep] = useState<Step>("email");
```
To:
```typescript
  const [step, setStep] = useState<Step>("role");
```

**c) Update `sendOtp` function** — include `userType` and make `collegeName` conditional:
```typescript
  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === "student" && !selectedCollege) {
      setError("Please select your college first.");
      return;
    }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          userType,
          ...(userType === "student" && selectedCollege
            ? { collegeName: selectedCollege.collegeName }
            : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed to send OTP");
      setStep("otp");
      setResendCooldown(60);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
```

**d) Update `verifyOtp` function** — include `userType`:
```typescript
      body: JSON.stringify({ email, code: otp, userType }),
```

**e) Update `resendOtp` function** — include `userType`:
```typescript
  const resendOtp = async () => {
    if (userType === "student" && !selectedCollege) return;
    if (resendCooldown > 0) return;
    setError(null); setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          userType,
          ...(userType === "student" && selectedCollege
            ? { collegeName: selectedCollege.collegeName }
            : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed to send OTP");
      setResendCooldown(60);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
```

**f) Add the role-select step UI** before the `{step === "email" && (` block inside the return:

```tsx
      {/* ── Role step ── */}
      {step === "role" && (
        <div className="flex flex-col flex-1">
          <div className="flex justify-start mb-6">
            <div
              style={{
                width: 56, height: 56, borderRadius: "50%",
                border: `2.5px solid ${DARK}`, boxShadow: `3px 3px 0 ${DARK}`,
                backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ShieldCheck size={26} strokeWidth={1.8} style={{ color: DARK }} />
            </div>
          </div>

          <h1
            className="text-3xl font-black mb-2 leading-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: DARK }}
          >
            Are you a student?
          </h1>
          <p className="text-sm mb-8" style={{ color: MUTED }}>
            This helps us show you the right sign-in flow.
          </p>

          <div className="flex flex-col gap-3">
            {[
              { id: "student" as const, label: "Student", sub: "I have a college email address" },
              { id: "non_student" as const, label: "Not a student", sub: "I'll use my personal email" },
            ].map(({ id, label, sub }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setUserType(id); setStep("email"); }}
                className="w-full flex items-center justify-between text-left transition-all"
                style={{
                  padding: "16px 18px",
                  background: "white",
                  border: `2px solid ${DARK}`,
                  borderRadius: 14,
                  boxShadow: `2px 2px 0 ${DARK}`,
                }}
              >
                <div>
                  <p className="text-base font-semibold" style={{ color: DARK }}>{label}</p>
                  <p className="text-sm mt-0.5" style={{ color: MUTED }}>{sub}</p>
                </div>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                  stroke={DARK} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 6l6 4-6 4" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}
```

**g) Update the email step heading and conditionally show the college picker**

Replace the `<h1>` in the email step:
```tsx
          <h1
            className="text-3xl font-black mb-8 leading-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: DARK }}
          >
            {userType === "student" ? "What's your college email?" : "What's your email?"}
          </h1>
```

Wrap the college selector block so it only renders for students. Find the `{/* College selector */}` comment and wrap it:
```tsx
          {/* College selector — students only */}
          {userType === "student" && (
            <div className="mb-5 relative">
              {/* ... existing college picker JSX unchanged ... */}
            </div>
          )}
```

Update the email input placeholder to handle non-student case:
```tsx
              placeholder={
                userType === "student"
                  ? (selectedCollege ? `you@${selectedCollege.domain}` : "Select college first")
                  : "your@email.com"
              }
              disabled={userType === "student" && !selectedCollege}
```

**h) Add a back button to the email step** (above the heading) so users can go back to the role screen:
```tsx
          <button
            type="button"
            onClick={() => setStep("role")}
            className="flex items-center gap-1 mb-6 text-sm font-medium"
            style={{ color: MUTED, background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </button>
```

**i) Add the `ShieldCheck` import** to the lucide import line:
```typescript
import { Mail, ShieldCheck, ChevronDown } from "lucide-react";
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual test in browser**

```bash
npm run dev
```

Open `http://localhost:3000/login`. Verify:
- Role screen appears first with two cards
- Clicking "Student" → email form with college picker (existing flow)
- Clicking "Not a student" → email form without college picker, placeholder "your@email.com"
- Back button on email step returns to role screen
- Student flow: OTP sends correctly with domain check
- Non-student flow: OTP sends to any email without domain validation

- [ ] **Step 4: Commit**

```bash
git add src/app/login/LoginForm.tsx
git commit -m "feat: add role-select step to login flow for non-students"
```

---

## Task 5: Admin Location Management

**Files:**
- Create: `src/controllers/AdminLocationController.ts`
- Create: `src/app/api/admin/locations/route.ts`
- Create: `src/app/api/admin/locations/[id]/route.ts`
- Create: `src/app/admin/locations/page.tsx`
- Create: `src/app/admin/locations/LocationsClient.tsx`
- Modify: `src/lib/container.ts`
- Modify: `src/app/admin/AdminShell.tsx`

**Interfaces:**
- Consumes: `ILocationRepository` / `LocationRepository` (Task 2); `requireAdminId`, `adminRouteErrorResponse`
- Produces:
  - `GET /api/admin/locations` → `{ data: GroupedLocation[] }`
  - `POST /api/admin/locations` → `{ data: { id, city, subArea } }` status 201
  - `PUT /api/admin/locations/[id]` with `{ city, subArea, renameCity?: boolean }` → `{ data: GroupedLocation[] }`
  - `DELETE /api/admin/locations/[id]` → `{ success: true }`

- [ ] **Step 1: Create AdminLocationController**

```typescript
// src/controllers/AdminLocationController.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { ILocationRepository } from "@/repositories/LocationRepository";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";

const createSchema = z.object({
  city: z.string().trim().min(1, "City is required"),
  subArea: z.string().trim().min(1, "Sub-area is required"),
});

const updateSchema = z.object({
  city: z.string().trim().min(1, "City is required"),
  subArea: z.string().trim().min(1, "Sub-area is required"),
  renameCity: z.boolean().optional().default(false),
});

export class AdminLocationController {
  constructor(private readonly locationRepository: ILocationRepository) {}

  async getAll() {
    try {
      const data = await this.locationRepository.findAll();
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async create(req: NextRequest) {
    try {
      const body = createSchema.parse(await req.json());
      const data = await this.locationRepository.create(body.city, body.subArea);
      return NextResponse.json({ data }, { status: 201 });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async update(req: NextRequest, id: string) {
    try {
      const body = updateSchema.parse(await req.json());
      const existing = await this.locationRepository.findById(id);
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

      if (body.renameCity && existing.city !== body.city) {
        // Rename city on all sub-area rows, then update this row's subArea
        await this.locationRepository.updateCity(existing.city, body.city);
        await this.locationRepository.update(id, body.city, body.subArea);
      } else {
        await this.locationRepository.update(id, body.city, body.subArea);
      }

      const data = await this.locationRepository.findAll();
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async deleteOne(_req: NextRequest, id: string) {
    try {
      const exists = await this.locationRepository.exists(id);
      if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await this.locationRepository.delete(id);
      return NextResponse.json({ success: true });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }
}
```

- [ ] **Step 2: Register in container**

In `src/lib/container.ts`, add after the LocationRepository import:

```typescript
import { AdminLocationController } from "@/controllers/AdminLocationController";
```

After `const locationRepository = new LocationRepository(db);`, add:

```typescript
const adminLocationController = new AdminLocationController(locationRepository);
```

Add to the exported `container` object:

```typescript
  adminLocationController,
```

- [ ] **Step 3: Create API routes**

```typescript
// src/app/api/admin/locations/route.ts
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";

export async function GET(req: NextRequest) {
  try {
    requireAdminId(req);
    return container.adminLocationController.getAll();
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdminId(req);
    return container.adminLocationController.create(req);
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
```

```typescript
// src/app/api/admin/locations/[id]/route.ts
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireAdminId(req);
    const { id } = await params;
    return container.adminLocationController.update(req, id);
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireAdminId(req);
    const { id } = await params;
    return container.adminLocationController.deleteOne(req, id);
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
```

- [ ] **Step 4: Create admin locations client component**

```tsx
// src/app/admin/locations/LocationsClient.tsx
"use client";

import { useEffect, useState } from "react";
import { MapPin, Trash2, Pencil, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { adminTheme } from "@/lib/adminTheme";
import { ADMIN_BTN_NEUTRAL_SM, ADMIN_BTN_PRIMARY_SM, ADMIN_INPUT } from "@/lib/adminChrome";
import type { GroupedLocation } from "@/repositories/LocationRepository";

export default function LocationsClient() {
  const [locations, setLocations] = useState<GroupedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());

  // Add form state
  const [addCity, setAddCity] = useState("");
  const [addSubArea, setAddSubArea] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editCity, setEditCity] = useState("");
  const [editSubArea, setEditSubArea] = useState("");
  const [editRenameCity, setEditRenameCity] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/locations");
      const { data } = await res.json();
      setLocations(data ?? []);
      setExpandedCities(new Set((data ?? []).map((l: GroupedLocation) => l.city)));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addCity.trim() || !addSubArea.trim()) {
      setAddError("Both city and sub-area are required.");
      return;
    }
    setAddLoading(true); setAddError(null);
    try {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: addCity.trim(), subArea: addSubArea.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add location");
      setAddCity(""); setAddSubArea("");
      await load();
    } catch (err) {
      setAddError((err as Error).message);
    } finally {
      setAddLoading(false);
    }
  }

  function startEdit(id: string, city: string, subArea: string) {
    setEditId(id);
    setEditCity(city);
    setEditSubArea(subArea);
    setEditRenameCity(false);
    setEditError(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setEditLoading(true); setEditError(null);
    try {
      const res = await fetch(`/api/admin/locations/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: editCity.trim(), subArea: editSubArea.trim(), renameCity: editRenameCity }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update");
      setEditId(null);
      await load();
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(id: string, subArea: string) {
    if (!confirm(`Delete "${subArea}"? Users with this location will need to re-assign.`)) return;
    await fetch(`/api/admin/locations/${id}`, { method: "DELETE" });
    await load();
  }

  function toggleCity(city: string) {
    setExpandedCities((prev) => {
      const next = new Set(prev);
      next.has(city) ? next.delete(city) : next.add(city);
      return next;
    });
  }

  if (loading) {
    return <p className="text-sm" style={{ color: adminTheme.mutedLabel }}>Loading locations…</p>;
  }

  return (
    <div className="max-w-2xl">
      {/* Add new location */}
      <form onSubmit={handleAdd} className="mb-8 p-5 rounded-xl border-2" style={{ borderColor: adminTheme.borderSoft, background: adminTheme.pageBg }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: adminTheme.ink }}>Add location</h3>
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: adminTheme.mutedLabel }}>City</label>
            <input className={ADMIN_INPUT} value={addCity} onChange={(e) => setAddCity(e.target.value)} placeholder="e.g. Hyderabad" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: adminTheme.mutedLabel }}>Sub-area</label>
            <input className={ADMIN_INPUT} value={addSubArea} onChange={(e) => setAddSubArea(e.target.value)} placeholder="e.g. Kondapur" />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={addLoading} className={ADMIN_BTN_PRIMARY_SM}>
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
        {addError && <p className="text-xs mt-1" style={{ color: "#C0392B" }}>{addError}</p>}
      </form>

      {/* Location list */}
      {locations.length === 0 ? (
        <p className="text-sm" style={{ color: adminTheme.mutedLabel }}>No locations yet. Add one above.</p>
      ) : (
        <div className="space-y-4">
          {locations.map((group) => {
            const expanded = expandedCities.has(group.city);
            return (
              <div key={group.city} className="rounded-xl border-2 overflow-hidden" style={{ borderColor: adminTheme.borderSoft }}>
                <button
                  type="button"
                  onClick={() => toggleCity(group.city)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  style={{ background: adminTheme.sidebarTop }}
                >
                  <div className="flex items-center gap-2">
                    <MapPin size={15} style={{ color: adminTheme.orange }} />
                    <span className="text-sm font-semibold" style={{ color: adminTheme.ink }}>{group.city}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: adminTheme.accentMutedBg, color: adminTheme.orange }}>
                      {group.subAreas.length}
                    </span>
                  </div>
                  {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>

                {expanded && (
                  <div className="divide-y" style={{ borderColor: adminTheme.borderSoft }}>
                    {group.subAreas.map((sa) => (
                      <div key={sa.id}>
                        {editId === sa.id ? (
                          <form onSubmit={handleSaveEdit} className="px-4 py-3 flex flex-col gap-2">
                            <div className="flex gap-2">
                              <input className={`${ADMIN_INPUT} flex-1`} value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="City" />
                              <input className={`${ADMIN_INPUT} flex-1`} value={editSubArea} onChange={(e) => setEditSubArea(e.target.value)} placeholder="Sub-area" />
                            </div>
                            <label className="flex items-center gap-2 text-xs" style={{ color: adminTheme.mutedLabel }}>
                              <input type="checkbox" checked={editRenameCity} onChange={(e) => setEditRenameCity(e.target.checked)} />
                              Rename all "{group.city}" entries to this city name
                            </label>
                            {editError && <p className="text-xs" style={{ color: "#C0392B" }}>{editError}</p>}
                            <div className="flex gap-2">
                              <button type="submit" disabled={editLoading} className={ADMIN_BTN_PRIMARY_SM}>Save</button>
                              <button type="button" onClick={() => setEditId(null)} className={ADMIN_BTN_NEUTRAL_SM}>Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "white" }}>
                            <span className="text-sm" style={{ color: adminTheme.textSecondary }}>{sa.name}</span>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => startEdit(sa.id, group.city, sa.name)} className={ADMIN_BTN_NEUTRAL_SM}>
                                <Pencil size={12} /> Edit
                              </button>
                              <button type="button" onClick={() => handleDelete(sa.id, sa.name)} className={ADMIN_BTN_NEUTRAL_SM}>
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Quick add sub-area inline */}
                    <QuickAddSubArea city={group.city} onAdded={load} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuickAddSubArea({ city, onAdded }: { city: string; onAdded: () => void }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, subArea: value.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setValue("");
      onAdded();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleAdd} className="px-4 py-2.5 flex items-center gap-2" style={{ background: "#FAFAFA" }}>
      <input
        className={`${ADMIN_INPUT} flex-1 text-xs`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`+ Add sub-area in ${city}`}
      />
      <button type="submit" disabled={loading || !value.trim()} className={ADMIN_BTN_NEUTRAL_SM}>
        <Plus size={12} /> Add
      </button>
      {error && <p className="text-xs" style={{ color: "#C0392B" }}>{error}</p>}
    </form>
  );
}
```

- [ ] **Step 5: Create admin locations page**

```tsx
// src/app/admin/locations/page.tsx
import LocationsClient from "./LocationsClient";

export default function LocationsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-bd-display), Georgia, serif" }}>
          Locations
        </h1>
        <p className="text-sm mt-1 text-gray-500">
          Manage city and sub-area options for non-student users.
        </p>
      </div>
      <LocationsClient />
    </div>
  );
}
```

- [ ] **Step 6: Add Locations to AdminShell nav**

In `src/app/admin/AdminShell.tsx`, add the import:

```typescript
import { Users, Heart, GitMerge, UserPlus, ShieldCheck, LogOut, Shuffle, MailWarning, MapPin } from "lucide-react";
```

Add to the `NAV` array after `"Onboarding reminders"`:

```typescript
  { label: "Locations", href: "/admin/locations", icon: MapPin },
```

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Manual test**

```bash
npm run dev
```

Open `/admin/locations`. Verify:
- "Locations" nav item appears in sidebar
- Add form creates a location; it appears grouped under city
- Edit sub-area renames just that entry
- Edit with "Rename all" checkbox renames the city across all sub-area rows
- Delete prompts confirmation, then removes row; reload shows it gone
- Adding a sub-area via "Add sub-area in [city]" row works

- [ ] **Step 9: Commit**

```bash
git add src/controllers/AdminLocationController.ts src/app/api/admin/locations/ src/app/admin/locations/ src/lib/container.ts src/app/admin/AdminShell.tsx
git commit -m "feat: admin location management — CRUD UI and API"
```

---

## Task 6: Onboarding Location APIs

**Files:**
- Modify: `src/repositories/OnboardingRepository.ts`
- Modify: `src/services/OnboardingService.ts`
- Modify: `src/controllers/OnboardingController.ts`
- Create: `src/app/api/onboarding/locations/route.ts`
- Create: `src/app/api/onboarding/location/route.ts`

**Interfaces:**
- Consumes: `ILocationRepository` (Task 2); `OnboardingRepository.upsertProfile` pattern
- Produces:
  - `OnboardingRepository.upsertLocation(userId, locationId)` — sets `Profile.locationId`
  - `OnboardingRepository.getOnboardingStatus` — gains `userType` and `hasLocation` fields
  - `GET /api/onboarding/locations` → `{ data: GroupedLocation[] }` (no auth required)
  - `POST /api/onboarding/location` with `{ locationId }` → `{ data: { locationId } }` (auth required)

- [ ] **Step 1: Add upsertLocation to OnboardingRepository**

In `src/repositories/OnboardingRepository.ts`, add to the `IOnboardingRepository` interface:

```typescript
  upsertLocation(userId: string, locationId: string): Promise<void>;
```

Add the implementation inside `OnboardingRepository`:

```typescript
  async upsertLocation(userId: string, locationId: string): Promise<void> {
    // Verify location exists before linking
    const loc = await this.db.location.findUnique({ where: { id: locationId }, select: { id: true } });
    if (!loc) throw new Error("Location not found");
    await this.db.profile.upsert({
      where: { userId },
      update: { locationId },
      create: { userId, locationId },
    });
  }
```

- [ ] **Step 2: Update getOnboardingStatus to include userType and hasLocation**

In `OnboardingRepository.getOnboardingStatus`, update the transaction to also select `userType` from user and `locationId` from profile:

Find the `this.db.$transaction([` block. Update the `user` select:
```typescript
        this.db.user.findUnique({
          where: { id: userId },
          select: { phone: true, userType: true },
        }),
```

Update the `profile` select:
```typescript
        this.db.profile.findUnique({
          where: { userId },
          select: { id: true, fullName: true, locationId: true },
        }),
```

Add to the return value (after `hasRelationshipStatus`):
```typescript
      userType: (user?.userType ?? "student") as "student" | "non_student",
      hasLocation: !!(profile?.locationId),
```

Also update the interface return type at the top of the file:
```typescript
  getOnboardingStatus(userId: string): Promise<{
    // ... existing fields ...
    hasRelationshipStatus: boolean;
    userType: "student" | "non_student";
    hasLocation: boolean;
  }>;
```

- [ ] **Step 3: Add saveLocation and getLocations to OnboardingService**

In `src/services/OnboardingService.ts`, add imports at the top:
```typescript
import type { ILocationRepository, GroupedLocation } from "@/repositories/LocationRepository";
```

Update the constructor to accept `locationRepository`:
```typescript
  constructor(
    private readonly onboardingRepo: IOnboardingRepository,
    private readonly userRepo: IUserRepository,
    private readonly locationRepository: ILocationRepository,
  ) {}
```

Add two new methods:

```typescript
  async saveLocation(userId: string, locationId: string): Promise<{ locationId: string }> {
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) throw new UnauthorizedError("Your session is invalid or expired. Please log in again.");
    await this.onboardingRepo.upsertLocation(userId, locationId);
    log.info("Location saved", { userId, locationId });
    return { locationId };
  }

  async getLocations(): Promise<GroupedLocation[]> {
    return this.locationRepository.findAll();
  }
```

- [ ] **Step 4: Update container to pass locationRepository to OnboardingService**

In `src/lib/container.ts`, find the line where `OnboardingService` is instantiated. It currently looks like:

```typescript
const onboardingService = new OnboardingService(onboardingRepository, userRepository);
```

Update it to:

```typescript
const onboardingService = new OnboardingService(onboardingRepository, userRepository, locationRepository);
```

- [ ] **Step 5: Add saveLocation and getLocations to OnboardingController**

In `src/controllers/OnboardingController.ts`, add these two methods:

```typescript
  // POST /api/onboarding/location
  async saveLocation(req: NextRequest, ctx: RequestContext) {
    try {
      const body = await req.json();
      const { locationId } = z.object({
        locationId: z.string().min(1, "locationId is required"),
      }).parse(body);
      const result = await this.onboardingService.saveLocation(ctx.userId, locationId);
      return createdResponse(result, "Location saved");
    } catch (error) {
      return handleError(error);
    }
  }

  // GET /api/onboarding/locations (no auth — needed before login for onboarding dropdowns)
  async getLocations(_req: NextRequest) {
    try {
      const data = await this.onboardingService.getLocations();
      return successResponse(data);
    } catch (error) {
      return handleError(error);
    }
  }
```

Add `z` import if not already present: `import { z } from "zod";`

- [ ] **Step 6: Create API routes**

```typescript
// src/app/api/onboarding/locations/route.ts
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";

export async function GET(req: NextRequest) {
  return container.onboardingController.getLocations(req);
}
```

```typescript
// src/app/api/onboarding/location/route.ts
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const POST = withAuth((req: NextRequest, ctx) =>
  container.onboardingController.saveLocation(req, ctx),
);
```

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/repositories/OnboardingRepository.ts src/services/OnboardingService.ts src/controllers/OnboardingController.ts src/lib/container.ts src/app/api/onboarding/locations/ src/app/api/onboarding/location/
git commit -m "feat: add location APIs to onboarding service and repository"
```

---

## Task 7: Onboarding Status Page + Shell Location Step

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/app/onboarding/OnboardingShell.tsx`

**Interfaces:**
- Consumes: `getOnboardingStatus` now returning `userType` + `hasLocation` (Task 6); `GET /api/onboarding/locations`; `POST /api/onboarding/location`
- Produces: Non-students see location step at subStep 2 after name/DOB; students skip it

- [ ] **Step 1: Update OnboardingStatus type in page.tsx**

In `src/app/onboarding/page.tsx`, add to the `OnboardingStatus` interface:

```typescript
  /** "student" or "non_student" */
  userType: "student" | "non_student";
  /** True once locationId is set on Profile (non-students only) */
  hasLocation: boolean;
```

Update the `status` object construction (around line ~74) to include the new fields:

```typescript
  const status: OnboardingStatus = {
    ...raw,
    completed: false,
    hasDatingMode: r.hasDatingMode ?? false,
    hasRelationshipStatus: r.hasRelationshipStatus ?? false,
    userType: r.userType ?? "student",
    hasLocation: r.hasLocation ?? false,
  };
```

- [ ] **Step 2: Update getInitialSubStep in OnboardingShell.tsx**

In `src/app/onboarding/OnboardingShell.tsx`, update the `getInitialSubStep` function. Change its signature to accept `userType`:

```typescript
function getInitialSubStep(status: OnboardingStatus): number {
  if (!status.hasProfile) return 0;
  // Non-student: location step is subStep 2, comes right after name/DOB
  if (status.userType === "non_student" && !status.hasLocation) return 2;
  if (!status.hasPreferences) return 1;
  if (!status.hasDatingMode) return 3;
  // ... rest of existing logic unchanged ...
}
```

- [ ] **Step 3: Add location state to OnboardingShell**

Inside `OnboardingShell`, after the existing state declarations, add:

```typescript
  const [locationGroups, setLocationGroups] = useState<{ city: string; subAreas: { id: string; name: string }[] }[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedSubAreaId, setSelectedSubAreaId] = useState("");
```

Add a `useEffect` to fetch locations when the shell mounts (for non-students):

```typescript
  useEffect(() => {
    if (status.userType !== "non_student") return;
    fetch("/api/onboarding/locations")
      .then((r) => r.json())
      .then((json) => { if (json?.data) setLocationGroups(json.data); })
      .catch(() => {});
  }, [status.userType]);
```

- [ ] **Step 4: Update handleNext to branch on userType after subStep 0**

In `OnboardingShell.handleNext`, find the section handling `subStep === 0`:

```typescript
      if (subStep === 0) {
        // ... existing profile save logic ...
        await apiPost("profile", { fullName: firstName.trim(), dateOfBirth });
      }
```

After the `await apiPost("profile", ...)` call, add branching:

```typescript
      if (subStep === 0) {
        // ... existing validation and apiPost logic ...
        await apiPost("profile", { fullName: firstName.trim(), dateOfBirth });
        // Non-students go to location step; students go to gender
        if (status.userType === "non_student") {
          setSubStep(2);
          setLoading(false);
          return;
        }
      }
```

Add handling for subStep 2 (location) in `handleNext`, before the final `setSubStep((s) => s + 1)`:

```typescript
      if (subStep === 2) {
        if (!selectedSubAreaId) {
          setStepError("Please select your location to continue.");
          setLoading(false);
          return;
        }
        const res = await fetch("/api/onboarding/location", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ locationId: selectedSubAreaId }),
        });
        if (res.status === 401) { router.push("/login"); return; }
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as { error?: { message?: string } }).error?.message ?? "Could not save location");
        }
        setSubStep(1);
        setLoading(false);
        return;
      }
```

- [ ] **Step 5: Update handleBack for subStep 2**

In `OnboardingShell.handleBack`, add:

```typescript
    // Location step: back goes to name/DOB (0)
    if (subStep === 2) {
      setSubStep(0);
      return;
    }
```

- [ ] **Step 6: Update canProceed for subStep 2**

In the `canProceed` computed value (`const canProceed = (() => {`), add:

```typescript
      case 2: return selectedCity !== "" && selectedSubAreaId !== "";
```

- [ ] **Step 7: Add subStep 2 UI (location step)**

In the JSX return, add the location step after the STEP 0 block and before the STEP 1 block:

```tsx
        {/* ── STEP 2: Location (non-students only) ──────────────────────── */}
        {subStep === 2 && (
          <div className="flex flex-col flex-1">
            <div className="flex justify-start mb-6">
              <svg className="w-12 h-12 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0z" />
              </svg>
            </div>
            <Heading>Where are you based?</Heading>
            <p className="text-sm mb-8" style={{ color: "#9B8B78" }}>
              We use your location to find matches near you.
            </p>

            {/* City dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: FAB_BG }}>City</label>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedSubAreaId("");
                  }}
                  className={inputCls}
                  style={{ appearance: "none" }}
                >
                  <option value="">Select your city</option>
                  {locationGroups.map((g) => (
                    <option key={g.city} value={g.city}>{g.city}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Sub-area dropdown — appears once city is selected */}
            {selectedCity && (
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2" style={{ color: FAB_BG }}>Area</label>
                <div className="relative">
                  <select
                    value={selectedSubAreaId}
                    onChange={(e) => setSelectedSubAreaId(e.target.value)}
                    className={inputCls}
                    style={{ appearance: "none" }}
                  >
                    <option value="">Select your area</option>
                    {(locationGroups.find((g) => g.city === selectedCity)?.subAreas ?? []).map((sa) => (
                      <option key={sa.id} value={sa.id}>{sa.name}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}

            {stepError && <InlineError message={stepError} />}

            <div className="mt-auto pt-8 flex items-end justify-end">
              <Fab onClick={handleNext} disabled={!canProceed} loading={loading} />
            </div>
          </div>
        )}
```

- [ ] **Step 8: Update progressPct to account for the extra step**

The total sub steps constant at the top currently is 12. Non-students have one extra step (location). This is fine to leave as-is since it's an approximation — the progress bar will still function correctly.

- [ ] **Step 9: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 10: Manual test in browser**

```bash
npm run dev
```

Sign in as a non-student user (use a Gmail or similar). After OTP verification and reaching onboarding:
- Step 0: Name/DOB → tap next → location step appears (subStep 2)
- Location step: city dropdown populated; selecting city reveals sub-area dropdown
- Selecting both city + sub-area enables FAB; tapping it saves and moves to gender step (subStep 1)
- Resuming onboarding as non-student with location already saved → goes directly to gender step
- Sign in as a student → location step never appears

- [ ] **Step 11: Commit**

```bash
git add src/app/onboarding/page.tsx src/app/onboarding/OnboardingShell.tsx
git commit -m "feat: add location step to onboarding for non-student users"
```

---

## Task 8: Admin Match-Users — Location Filter and Display

**Files:**
- Modify: `src/repositories/AdminMatchUsersRepository.ts`
- Modify: `src/services/AdminMatchUsersService.ts`
- Modify: `src/controllers/AdminMatchUsersController.ts`
- Modify: `src/app/admin/match-users/MatchUsersView.tsx`

**Interfaces:**
- Consumes: `Location` join on `Profile` (Task 1); `GroupedLocation` from LocationRepository
- Produces:
  - Candidate cards show `userType` badge and `📍 City · Sub-area` line
  - OptedIn list cards show the same info
  - `GET /api/admin/match-users/candidates?userType=&city=&subArea=` filters at DB level

- [ ] **Step 1: Update suggestionUserSelect in AdminMatchUsersRepository**

In `src/repositories/AdminMatchUsersRepository.ts`, find `const suggestionUserSelect = {` and add location to the profile select:

```typescript
  profile: {
    select: {
      fullName: true,
      age: true,
      city: true,
      bio: true,
      location: {
        select: { city: true, subArea: true },
      },
    },
  },
```

Also add `userType: true` to the top-level user select fields:

```typescript
const suggestionUserSelect = {
  id: true,
  collegeName: true,
  userType: true,           // ← add this
  onboardingCompleted: true,
  profile: { ... },         // updated above
  // ... rest unchanged
};
```

- [ ] **Step 2: Add getCandidatesFiltered to AdminMatchUsersRepository**

Find or add a `getCandidates` or `findCandidates` method. Look for where `getCandidates` is called from the service. Add optional filter params:

```typescript
  async getCandidatesForWeek(
    weekStart: Date,
    filters: { userType?: string; city?: string; subArea?: string } = {},
  ) {
    const where: Record<string, unknown> = { weekStart };
    const userWhere: Record<string, unknown> = {};
    const profileWhere: Record<string, unknown> = {};

    if (filters.userType) userWhere.userType = filters.userType;
    if (filters.city || filters.subArea) {
      const locationWhere: Record<string, unknown> = {};
      if (filters.city) locationWhere.city = filters.city;
      if (filters.subArea) locationWhere.subArea = filters.subArea;
      profileWhere.location = { is: locationWhere };
    }

    return this.db.weeklyOptIn.findMany({
      where: {
        ...where,
        user: {
          ...userWhere,
          ...(Object.keys(profileWhere).length > 0 ? { profile: profileWhere } : {}),
        },
      },
      select: {
        userId: true,
        mode: true,
        description: true,
        createdAt: true,
        user: { select: suggestionUserSelect },
      },
      orderBy: { createdAt: "asc" },
    });
  }
```

> **Note:** Check if the existing `findWeeklyOptInsForWeek` is what feeds `getCandidates` in the service. If so, update that method signature to accept optional filters, or add a new method — whichever matches the existing pattern. The key is that location and userType filters are applied in the `where` clause at DB level.

- [ ] **Step 3: Update AdminMatchUsersService.getCandidates**

In `src/services/AdminMatchUsersService.ts`, find `getCandidates()` and update it to accept and forward filters:

```typescript
  async getCandidates(filters: { userType?: string; city?: string; subArea?: string } = {}) {
    const weekStart = this.adminMatchUsersRepository.getCurrentWeekStart();
    // Use updated repo method that accepts filters
    const optIns = await this.adminMatchUsersRepository.getCandidatesForWeek(weekStart, filters);
    // ... map to response shape, unchanged ...
  }
```

- [ ] **Step 4: Update AdminMatchUsersController.getCandidates**

In `src/controllers/AdminMatchUsersController.ts`, update `getCandidates`:

```typescript
  async getCandidates(req: NextRequest) {
    try {
      const params = req.nextUrl.searchParams;
      const filters = {
        userType: params.get("userType") ?? undefined,
        city: params.get("city") ?? undefined,
        subArea: params.get("subArea") ?? undefined,
      };
      const data = await this.adminMatchUsersService.getCandidates(filters);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }
```

- [ ] **Step 5: Update types in MatchUsersView.tsx**

In `src/app/admin/match-users/MatchUsersView.tsx`, update `OptedInUser` type:

```typescript
type OptedInUser = {
  userId: string;
  name: string;
  age: number | null;
  city: string | null;
  locationCity: string | null;
  locationSubArea: string | null;
  userType: "student" | "non_student";
  photoUrl: string | null;
  collegeName: string | null;
  genderIdentity: string | null;
  genderPreference: string[];
  mode: string;
  description: string | null;
};
```

Update `Candidate` similarly (add `locationCity`, `locationSubArea`, `userType`).

- [ ] **Step 6: Add location display to OptedInCard**

In `OptedInCard`, add after the `{user.genderIdentity && ...}` line:

```tsx
        {(user.locationCity || user.userType === "non_student") && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: adminTheme.mutedLabel }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0z" />
            </svg>
            {user.locationCity
              ? `${user.locationCity}${user.locationSubArea ? ` · ${user.locationSubArea}` : ""}`
              : "Location not set"}
          </p>
        )}
        {user.userType === "non_student" && (
          <span className="inline-block mt-1 text-xs px-1.5 py-0.5 rounded" style={{ background: "#F0F0F0", color: adminTheme.textSecondary }}>
            Non-student
          </span>
        )}
```

- [ ] **Step 7: Add location filter UI to MatchPhase**

In `MatchPhase`, add filter state:

```typescript
  const [filterUserType, setFilterUserType] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterSubArea, setFilterSubArea] = useState("");
  const [locationGroups, setLocationGroups] = useState<{ city: string; subAreas: { id: string; name: string }[] }[]>([]);
```

Fetch location groups on mount:
```typescript
  useEffect(() => {
    fetch("/api/admin/locations")
      .then((r) => r.json())
      .then((json) => { if (json?.data) setLocationGroups(json.data); })
      .catch(() => {});
  }, []);
```

Update the `load` function to include filters:
```typescript
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ userId: selectedUser.userId });
      if (filterUserType) params.set("userType", filterUserType);
      if (filterCity) params.set("city", filterCity);
      if (filterSubArea) params.set("subArea", filterSubArea);
      const res = await fetch(`/api/admin/match-users/suggestions?${params}`);
      const { data } = await res.json();
      setCandidates(data.candidates ?? []);
    } finally {
      setLoading(false);
    }
  }, [selectedUser.userId, filterUserType, filterCity, filterSubArea]);
```

Add filter UI before the candidate grid:
```tsx
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={filterUserType}
          onChange={(e) => { setFilterUserType(e.target.value); setIdx(0); }}
          className={ADMIN_INPUT}
          style={{ width: "auto", minWidth: 140 }}
        >
          <option value="">All users</option>
          <option value="student">Students only</option>
          <option value="non_student">Non-students only</option>
        </select>

        <select
          value={filterCity}
          onChange={(e) => { setFilterCity(e.target.value); setFilterSubArea(""); setIdx(0); }}
          className={ADMIN_INPUT}
          style={{ width: "auto", minWidth: 140 }}
        >
          <option value="">All cities</option>
          {locationGroups.map((g) => (
            <option key={g.city} value={g.city}>{g.city}</option>
          ))}
        </select>

        {filterCity && (
          <select
            value={filterSubArea}
            onChange={(e) => { setFilterSubArea(e.target.value); setIdx(0); }}
            className={ADMIN_INPUT}
            style={{ width: "auto", minWidth: 140 }}
          >
            <option value="">All areas</option>
            {(locationGroups.find((g) => g.city === filterCity)?.subAreas ?? []).map((sa) => (
              <option key={sa.id} value={sa.name}>{sa.name}</option>
            ))}
          </select>
        )}

        {(filterUserType || filterCity || filterSubArea) && (
          <button
            type="button"
            onClick={() => { setFilterUserType(""); setFilterCity(""); setFilterSubArea(""); setIdx(0); }}
            className={ADMIN_BTN_NEUTRAL_SM}
          >
            Clear filters
          </button>
        )}
      </div>
```

Also add location display to candidate cards inside `MatchPhase` — find where candidate profile info is rendered and add:
```tsx
{candidate.locationCity && (
  <p className="text-xs mt-1" style={{ color: adminTheme.mutedLabel }}>
    📍 {candidate.locationCity}{candidate.locationSubArea ? ` · ${candidate.locationSubArea}` : ""}
  </p>
)}
```

- [ ] **Step 8: Update the data mapping in AdminMatchUsersService/Repository**

Wherever candidates/optedIn users are mapped to response DTOs, ensure `locationCity`, `locationSubArea`, and `userType` are included. The pattern will be something like:

```typescript
  userType: user.userType,
  locationCity: user.profile?.location?.city ?? null,
  locationSubArea: user.profile?.location?.subArea ?? null,
```

- [ ] **Step 9: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. Fix any issues before proceeding.

- [ ] **Step 10: Manual test in browser**

```bash
npm run dev
```

Go to `/admin/match-users`. Verify:
- Opted-in user cards show location and "Non-student" badge where applicable
- Selecting a user to match → candidate list shows location info on each card
- User type filter (All / Students / Non-students) filters the candidate list
- City filter populates sub-area dropdown; sub-area filter applies correctly
- "Clear filters" resets to full list
- Student candidates with no location show nothing (no `locationCity`)

- [ ] **Step 11: Commit**

```bash
git add src/repositories/AdminMatchUsersRepository.ts src/services/AdminMatchUsersService.ts src/controllers/AdminMatchUsersController.ts src/app/admin/match-users/MatchUsersView.tsx
git commit -m "feat: add location filter and display to admin match-users view"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ DB: UserType enum, User.userType, Profile.locationId FK, Location model (Task 1)
- ✅ Login: role-select screen before email form (Task 4)
- ✅ Student flow: unchanged, college picker + domain validation still active (Task 3 + 4)
- ✅ Non-student flow: OTP to any email, no domain check (Task 3)
- ✅ userType stored on User at first sign-in; existing users keep their type (Task 3)
- ✅ Onboarding status: userType + hasLocation returned (Task 6)
- ✅ Location step at subStep 2 for non-students, city → sub-area dropdowns (Task 7)
- ✅ Location step skipped for students (Task 7 getInitialSubStep)
- ✅ Admin panel: new Locations section with add/edit/delete (Task 5)
- ✅ Edit city renames all rows with that city; onDelete: SetNull cascades to profiles (Task 1 + 5)
- ✅ Admin match: location shown on candidate cards, location+userType filter (Task 8)
- ✅ Filter at DB level via Prisma where clause (Task 8)
