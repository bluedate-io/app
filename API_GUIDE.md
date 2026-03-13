# API Guide — bluedate.io

> This document explains how the backend API is structured and the exact steps
> to add any new resource, endpoint, or service without breaking existing patterns.

---

## Table of Contents

1. [Architecture at a Glance](#1-architecture-at-a-glance)
2. [Request Lifecycle](#2-request-lifecycle)
3. [Folder Structure Map](#3-folder-structure-map)
4. [How to Add a New API Resource](#4-how-to-add-a-new-api-resource)
5. [How to Add a New Endpoint to an Existing Resource](#5-how-to-add-a-new-endpoint-to-an-existing-resource)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Validation with Zod](#7-validation-with-zod)
8. [Error Handling](#8-error-handling)
9. [Response Envelope](#9-response-envelope)
10. [Dependency Injection Container](#10-dependency-injection-container)
11. [Existing API Reference](#11-existing-api-reference)

---

## 1. Architecture at a Glance

```
Client
  │
  ▼
src/middleware.ts          ← CORS, Request-ID injection (Next.js Edge)
  │
  ▼
app/api/**/route.ts        ← Route handler (HTTP verb exports)
  │
  ▼
middleware/withMiddleware   ← Auth guard + role guard
  │
  ▼
controllers/               ← Parse request body / query params
  │
  ▼
services/                  ← All business logic
  │
  ▼
repositories/              ← Database calls (Prisma / Drizzle)
  │
  ▼
domains/                   ← Pure TypeScript entity types
```

**Rules:**
- Routes contain **no logic** — they call a controller method and return.
- Controllers contain **no business logic** — they parse input, call service, return response.
- Services contain **no HTTP concepts** — they throw `AppError` subclasses, not `NextResponse`.
- Repositories contain **no business logic** — only raw DB operations.

---

## 2. Request Lifecycle

A `POST /api/users` request travels through these layers:

```
POST /api/users
  1. src/middleware.ts          → attaches x-request-id, sets CORS headers
  2. app/api/users/route.ts     → calls withHandler(...)
  3. withMiddleware.ts          → wraps error handling
  4. UserController.createUser  → req.json() → zod.parse() → userService.createUser()
  5. UserService.createUser     → checks duplicate email → bcrypt hash → repo.create()
  6. UserRepository.create      → INSERT into DB → returns User entity
  7. toUserResponseDTO()        → strips passwordHash, formats dates
  8. createdResponse(dto)       → { success: true, data: dto } with HTTP 201
```

---

## 3. Folder Structure Map

```
src/
├── app/
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts       POST /api/auth/login
│       │   ├── register/route.ts    POST /api/auth/register
│       │   └── refresh/route.ts     POST /api/auth/refresh
│       ├── users/
│       │   ├── route.ts             GET /api/users  |  POST /api/users
│       │   └── [id]/route.ts        GET | PATCH | DELETE /api/users/:id
│       └── matches/
│           └── route.ts             POST /api/matches  (swipe)
│
├── controllers/        ← Thin HTTP adapters
├── services/           ← Business logic
├── repositories/       ← Database access
│   └── base/           ← IBaseRepository interface
├── domains/            ← Pure entity types (no framework deps)
├── dto/                ← Request / response shapes
├── validations/        ← Zod schemas
├── middleware/         ← Auth guards, rate limiter, withMiddleware wrapper
├── lib/
│   ├── container.ts    ← Dependency injection wiring
│   └── db.ts           ← Database client singleton
├── api/
│   └── client.ts       ← Typed fetch client (for front-end / server actions)
├── types/              ← Global types: Result<T>, AppError, JwtPayload
├── utils/              ← response helpers, error classes, logger, pagination
├── config/             ← Centralised env config (never use process.env directly)
└── constants/          ← App-wide constants and error codes
```

---

## 4. How to Add a New API Resource

Follow these steps in order. Example: adding a **Profile** resource.

---

### Step 1 — Define the Domain Entity

**File:** `src/domains/Profile.ts`

```ts
// Pure entity — no framework, no DB types
export interface Profile {
  id: string;
  userId: string;
  headline: string;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

### Step 2 — Create DTOs

**File:** `src/dto/CreateProfileDTO.ts`

```ts
export interface CreateProfileDTO {
  headline: string;
  interests: string[];
}
```

**File:** `src/dto/ProfileResponseDTO.ts`

```ts
import type { Profile } from "@/domains/Profile";

export interface ProfileResponseDTO {
  id: string;
  userId: string;
  headline: string;
  interests: string[];
  createdAt: string;
}

export function toProfileResponseDTO(profile: Profile): ProfileResponseDTO {
  return {
    id: profile.id,
    userId: profile.userId,
    headline: profile.headline,
    interests: profile.interests,
    createdAt: profile.createdAt.toISOString(),
  };
}
```

---

### Step 3 — Write Zod Validation

**File:** `src/validations/profile.validation.ts`

```ts
import { z } from "zod";

export const createProfileSchema = z.object({
  headline: z.string().min(5).max(120).trim(),
  interests: z.array(z.string().min(1).max(40)).min(1).max(20),
});

export const updateProfileSchema = createProfileSchema.partial();

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
```

---

### Step 4 — Create the Repository

**File:** `src/repositories/ProfileRepository.ts`

```ts
import { v4 as uuidv4 } from "uuid";
import type { Profile } from "@/domains/Profile";
import type { CreateProfileInput, UpdateProfileInput } from "@/validations/profile.validation";
import type { PaginationParams, PaginatedResult } from "@/types";
import type { IBaseRepository } from "./base/BaseRepository";
import { buildPaginatedResult } from "@/utils/pagination";

export type CreateProfileRepositoryInput = CreateProfileInput & { userId: string };

export interface IProfileRepository
  extends IBaseRepository<Profile, CreateProfileRepositoryInput, UpdateProfileInput> {
  findByUserId(userId: string): Promise<Profile | null>;
}

// ── In-memory store (swap each method body for Prisma calls) ─────────────────
const store = new Map<string, Profile>();

export class ProfileRepository implements IProfileRepository {
  async findById(id: string) {
    // Prisma: return db.profile.findUnique({ where: { id } });
    return store.get(id) ?? null;
  }

  async findByUserId(userId: string) {
    // Prisma: return db.profile.findUnique({ where: { userId } });
    for (const p of store.values()) {
      if (p.userId === userId) return p;
    }
    return null;
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<Profile>> {
    const all = Array.from(store.values());
    const { page, limit } = params;
    const data = all.slice((page - 1) * limit, page * limit);
    return buildPaginatedResult(data, all.length, params);
  }

  async create(data: CreateProfileRepositoryInput): Promise<Profile> {
    // Prisma: return db.profile.create({ data: { ...data, id: uuidv4() } });
    const now = new Date();
    const profile: Profile = {
      id: uuidv4(),
      userId: data.userId,
      headline: data.headline,
      interests: data.interests,
      createdAt: now,
      updatedAt: now,
    };
    store.set(profile.id, profile);
    return profile;
  }

  async update(id: string, data: UpdateProfileInput): Promise<Profile> {
    // Prisma: return db.profile.update({ where: { id }, data });
    const existing = store.get(id);
    if (!existing) throw new Error(`Profile ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date() };
    store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    // Prisma: await db.profile.delete({ where: { id } });
    store.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return store.has(id);
  }
}
```

---

### Step 5 — Create the Service

**File:** `src/services/ProfileService.ts`

```ts
import type { IProfileRepository } from "@/repositories/ProfileRepository";
import type { CreateProfileInput, UpdateProfileInput } from "@/validations/profile.validation";
import type { ProfileResponseDTO } from "@/dto/ProfileResponseDTO";
import { toProfileResponseDTO } from "@/dto/ProfileResponseDTO";
import { NotFoundError, ConflictError } from "@/utils/errors";
import { logger } from "@/utils/logger";

const log = logger.child("ProfileService");

export class ProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async createProfile(userId: string, input: CreateProfileInput): Promise<ProfileResponseDTO> {
    const existing = await this.profileRepository.findByUserId(userId);
    if (existing) throw new ConflictError("Profile already exists for this user");

    const profile = await this.profileRepository.create({ ...input, userId });
    log.info("Profile created", { profileId: profile.id, userId });
    return toProfileResponseDTO(profile);
  }

  async getProfileByUserId(userId: string): Promise<ProfileResponseDTO> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError("Profile");
    return toProfileResponseDTO(profile);
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<ProfileResponseDTO> {
    const exists = await this.profileRepository.exists(id);
    if (!exists) throw new NotFoundError("Profile", id);
    const profile = await this.profileRepository.update(id, input);
    return toProfileResponseDTO(profile);
  }
}
```

---

### Step 6 — Create the Controller

**File:** `src/controllers/ProfileController.ts`

```ts
import { NextRequest } from "next/server";
import type { ProfileService } from "@/services/ProfileService";
import { createProfileSchema, updateProfileSchema } from "@/validations/profile.validation";
import { successResponse, createdResponse, handleError } from "@/utils/response";
import type { RequestContext } from "@/types";

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  async createProfile(req: NextRequest, ctx: RequestContext) {
    try {
      const body = await req.json();
      const input = createProfileSchema.parse(body);
      const profile = await this.profileService.createProfile(ctx.userId, input);
      return createdResponse(profile);
    } catch (error) {
      return handleError(error);
    }
  }

  async getMyProfile(_req: NextRequest, ctx: RequestContext) {
    try {
      const profile = await this.profileService.getProfileByUserId(ctx.userId);
      return successResponse(profile);
    } catch (error) {
      return handleError(error);
    }
  }

  async updateProfile(req: NextRequest, profileId: string) {
    try {
      const body = await req.json();
      const input = updateProfileSchema.parse(body);
      const profile = await this.profileService.updateProfile(profileId, input);
      return successResponse(profile);
    } catch (error) {
      return handleError(error);
    }
  }
}
```

---

### Step 7 — Register in the DI Container

**File:** `src/lib/container.ts` — add three lines:

```ts
// 1. import
import { ProfileRepository } from "@/repositories/ProfileRepository";
import { ProfileService } from "@/services/ProfileService";
import { ProfileController } from "@/controllers/ProfileController";

// 2. instantiate (after existing repositories)
const profileRepository = new ProfileRepository();
const profileService = new ProfileService(profileRepository);
const profileController = new ProfileController(profileService);

// 3. export
export const container = {
  // ... existing entries ...
  profileRepository,
  profileService,
  profileController,
} as const;
```

---

### Step 8 — Create the Route Handler

**File:** `src/app/api/profile/route.ts`

```ts
// GET  /api/profile   → get the authenticated user's profile
// POST /api/profile   → create a new profile

import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const GET = withAuth((req, ctx) =>
  container.profileController.getMyProfile(req, ctx),
);

export const POST = withAuth((req, ctx) =>
  container.profileController.createProfile(req, ctx),
);
```

**File:** `src/app/api/profile/[id]/route.ts`

```ts
// PATCH /api/profile/:id  → update a profile

import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return withAuth((_req) =>
    container.profileController.updateProfile(req, id),
  )(req);
}
```

---

## 5. How to Add a New Endpoint to an Existing Resource

Example: add `POST /api/users/:id/block` to the Users resource.

### Option A — Add a method to the existing controller

```ts
// src/controllers/UserController.ts
async blockUser(req: NextRequest, targetUserId: string, ctx: RequestContext) {
  try {
    await this.userService.blockUser(ctx.userId, targetUserId);
    return successResponse(null, { message: "User blocked" });
  } catch (error) {
    return handleError(error);
  }
}
```

### Option B — Create a nested route file

**File:** `src/app/api/users/[id]/block/route.ts`

```ts
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return withAuth((req, ctx) =>
    container.userController.blockUser(req, id, ctx),
  )(req);
}
```

---

## 6. Authentication & Authorization

### Protecting a route

```ts
// Requires a valid JWT — any role
export const GET = withAuth((req, ctx) => myController.action(req, ctx));

// Requires a specific role
import { requireRole } from "@/middleware/auth.middleware";

export const GET = withAuth(
  (req, ctx) => myController.action(req, ctx),
  requireRole("admin"),           // single role
);

export const DELETE = withAuth(
  (req, ctx) => myController.delete(req, ctx),
  requireRole("admin", "moderator"), // multiple roles accepted
);
```

### Public route (no auth required)

```ts
import { withHandler } from "@/middleware/withMiddleware";

export const POST = withHandler((req) => myController.publicAction(req));
```

### Accessing the authenticated user

`withAuth` passes a `RequestContext` as the second argument:

```ts
export const GET = withAuth(async (req, ctx) => {
  // ctx.userId   — authenticated user's ID
  // ctx.email    — authenticated user's email
  // ctx.role     — "user" | "admin" | "moderator"
  // ctx.requestId — unique ID for this request (for logging)
  return myController.doThing(req, ctx);
});
```

---

## 7. Validation with Zod

All input is validated using Zod schemas defined in `src/validations/`.

### Defining a schema

```ts
// src/validations/profile.validation.ts
import { z } from "zod";

export const createProfileSchema = z.object({
  headline: z.string().min(5).max(120).trim(),
  interests: z.array(z.string()).min(1).max(20),
});

// Infer the TypeScript type from the schema
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
```

### Parsing in a controller

```ts
const body = await req.json();
const input = createProfileSchema.parse(body); // throws ZodError on failure
```

### What happens on ZodError

`handleError` in `src/utils/response.ts` catches `ZodError` and returns:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "headline": ["String must contain at least 5 character(s)"]
    }
  }
}
```
HTTP status: **422**

---

## 8. Error Handling

### Throwing domain errors in a Service

Import the pre-built error classes from `src/utils/errors.ts`:

```ts
import { NotFoundError, ConflictError, ForbiddenError, BadRequestError } from "@/utils/errors";

// 404
throw new NotFoundError("Profile", id);

// 409
throw new ConflictError("Profile already exists");

// 403
throw new ForbiddenError("You cannot edit another user's profile");

// 400
throw new BadRequestError("Invalid date range");
```

### Custom error with a specific code

```ts
import { AppError } from "@/types";
import { ErrorCode } from "@/constants/errors";

throw new AppError("Profile incomplete", ErrorCode.PROFILE_INCOMPLETE, 403);
```

### Adding a new error code

1. Add the constant to `src/constants/errors.ts`:

```ts
export const ErrorCode = {
  // ...existing...
  SUBSCRIPTION_REQUIRED: "SUBSCRIPTION_REQUIRED",
} as const;
```

2. Create a typed error class in `src/utils/errors.ts` (optional):

```ts
export class SubscriptionRequiredError extends AppError {
  constructor() {
    super("This feature requires a subscription", ErrorCode.SUBSCRIPTION_REQUIRED, 402);
  }
}
```

### Catching errors in a Controller

Always use `handleError` — it handles `ZodError`, `AppError`, and unknown errors:

```ts
async myAction(req: NextRequest) {
  try {
    // ...
  } catch (error) {
    return handleError(error); // never re-throw in a controller
  }
}
```

---

## 9. Response Envelope

All API responses use this envelope shape.

### Success

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable message",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User with id 'abc' not found",
    "details": null
  },
  "requestId": "550e8400-e29b-41d4-a716..."
}
```

### Response helpers (`src/utils/response.ts`)

| Helper | HTTP Status | When to use |
|---|---|---|
| `successResponse(data)` | 200 | Standard GET / PATCH |
| `createdResponse(data)` | 201 | POST that creates a resource |
| `noContentResponse()` | 204 | DELETE with no body |
| `handleError(error)` | varies | Every catch block |

---

## 10. Dependency Injection Container

All instances are created once and reused. **Never `new` a service or repository inside a route file.**

```ts
// ✅ Correct — use the container
import { container } from "@/lib/container";
container.userController.createUser(req);

// ❌ Wrong — creates a new instance on every request
import { UserController } from "@/controllers/UserController";
import { UserService } from "@/services/UserService";
new UserController(new UserService(...));
```

### Adding a new entry to the container

```ts
// src/lib/container.ts
import { NotificationRepository } from "@/repositories/NotificationRepository";
import { NotificationService } from "@/services/NotificationService";
import { NotificationController } from "@/controllers/NotificationController";

const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService(notificationRepository);
const notificationController = new NotificationController(notificationService);

export const container = {
  // existing...
  notificationRepository,
  notificationService,
  notificationController,
} as const;
```

---

## 11. Existing API Reference

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login, returns JWT tokens |
| `POST` | `/api/auth/refresh` | Public | Exchange refresh token for new tokens |

**Register / Login response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "expiresIn": 604800
    }
  }
}
```

---

### Users

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/users` | Public | — | Create / register user |
| `GET` | `/api/users` | Required | `admin` | List all users (paginated) |
| `GET` | `/api/users/:id` | Required | any | Get user by ID |
| `PATCH` | `/api/users/:id` | Required | self or `admin` | Update user profile |
| `DELETE` | `/api/users/:id` | Required | self or `admin` | Delete user account |

**Query parameters for `GET /api/users`:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page (max 100) |

---

### Matches

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/matches` | Required | Swipe on a user |

**Swipe request body:**

```json
{
  "targetUserId": "uuid",
  "direction": "like"
}
```

`direction` values: `"like"` | `"dislike"` | `"super_like"`

**Response when it's a match:**

```json
{
  "success": true,
  "message": "It's a match!",
  "data": {
    "matched": true,
    "match": {
      "id": "uuid",
      "userId1": "uuid",
      "userId2": "uuid",
      "compatibilityScore": 0.84,
      "status": "pending"
    }
  }
}
```

---

## Quick Reference Checklist

When adding a new resource, tick off each step:

- [ ] `src/domains/MyEntity.ts` — pure entity interface
- [ ] `src/dto/CreateMyEntityDTO.ts` — request shape
- [ ] `src/dto/MyEntityResponseDTO.ts` — response shape + mapper function
- [ ] `src/validations/myEntity.validation.ts` — Zod schema + inferred types
- [ ] `src/repositories/MyEntityRepository.ts` — DB operations
- [ ] `src/services/MyEntityService.ts` — business logic
- [ ] `src/controllers/MyEntityController.ts` — HTTP adapter
- [ ] `src/lib/container.ts` — wire the new instances
- [ ] `src/app/api/my-entity/route.ts` — collection routes (GET, POST)
- [ ] `src/app/api/my-entity/[id]/route.ts` — item routes (GET, PATCH, DELETE)
- [ ] `src/constants/errors.ts` — any new error codes needed
