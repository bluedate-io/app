# Non-Student Users — Design Spec

**Date:** 2026-07-19
**Status:** Approved

## Summary

Expand Tryren from a student-only platform to include regular (non-student) users. Non-students sign in via email OTP (no college domain check), select a location during onboarding, and are matched by admin using location as a filter signal. Admin manages the location hierarchy (city → sub-area) through a new admin panel section.

---

## 1. Database

### 1.1 `UserType` enum + field on `User`

```prisma
enum UserType {
  student
  non_student
}

model User {
  // existing fields ...
  userType  UserType  @default(student)
}
```

- Existing users default to `student` — no data migration needed.
- Drives auth behaviour (domain validation) and onboarding branching.

### 1.2 Location reference on `Profile`

```prisma
model Profile {
  // existing fields ...
  locationId  String?
  location    Location? @relation(fields: [locationId], references: [id], onDelete: SetNull)
}
```

- `onDelete: SetNull` — deleting a Location row automatically nulls `locationId` on all referencing profiles. Affected users must re-assign their location.
- Admin updating a Location row's text cascades to all profiles automatically (they reference the same row).

### 1.3 New `Location` model

```prisma
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

- One row per city + sub-area pair (e.g. "Hyderabad" / "Kondapur").
- City grouping is derived by querying distinct `city` values — no separate city table needed.
- Deleting all sub-areas of a city removes that city from the dropdown implicitly.

---

## 2. Login Flow

### 2.1 New role-select screen

`LoginForm.tsx` gains a new step `"role"` inserted before `"email"`:

```
Step 0 (role):  "Are you a student or a non-student?" — two radio cards
Step 1 (email): Student   → college picker + email field (existing behaviour)
                Non-student → email field only (no college picker)
Step 2 (otp):   Same OTP screen for both
```

### 2.2 `sendOtp` API changes

- `sendOtpSchema`: `collegeName` becomes optional; new required field `userType: "student" | "non_student"`.
- `AuthService.sendOtp`:
  - `student` → validate that email domain matches the selected college (existing logic).
  - `non_student` → skip domain validation; send OTP directly to any email.

### 2.3 `verifyOtp` API changes

- `verifyOtpSchema`: adds optional `userType` (defaults to `"student"` for backward compatibility).
- `AuthService.verifyOtp`: passes `userType` to `userRepository.findOrCreateByEmail` so it is stored on the `User` record at first sign-in. Subsequent logins for existing users retain their stored `userType`.
- `collegeName` remains `null` for non-student users.

---

## 3. Onboarding Flow

### 3.1 Status API additions

`GET /api/onboarding/status` response adds:

```ts
userType: "student" | "non_student"
hasLocation: boolean  // true once locationId is set on Profile
```

### 3.2 New APIs

**`GET /api/onboarding/locations`** — public, returns locations grouped by city:
```json
[
  { "city": "Hyderabad", "subAreas": [{ "id": "...", "name": "Kondapur" }, ...] },
  { "city": "Vijayawada", "subAreas": [{ "id": "...", "name": "Madhu Gardens" }, ...] }
]
```

**`POST /api/onboarding/location`** — saves `locationId` to the user's `Profile`.
```json
{ "locationId": "<Location.id>" }
```

### 3.3 `OnboardingShell` changes

SubStep 2 (currently an unused gap in the numbering) becomes the **location step** for non-students:

| subStep | Who sees it | What |
|---------|-------------|------|
| 0 | All | Name / DOB |
| 2 | Non-students only | Location (city → sub-area) |
| 1 | All | Gender identity |
| 3 | All | Dating mode (Date / BFF) |
| 4 | Date only | Gender preference |
| 7 | Date only | Height |
| 8 | All | Interests |
| 9 | All | Habits |
| 11 | Date only | Religion / Politics |
| 12 | All | Photos |
| 13 | BFF only | Life experiences |
| 14 | BFF only | BFF interests |
| 15 | BFF only | Relationship status |

**Navigation logic:**
- After subStep 0: if `non_student` → go to subStep 2; if `student` → go to subStep 1.
- After subStep 2 (location saved): go to subStep 1.

**`getInitialSubStep` update:** if `userType === "non_student" && !status.hasLocation` → return `2`.

**Location step UI:**
1. City dropdown populated from `/api/onboarding/locations`.
2. Once city is selected, sub-area dropdown appears filtered to that city.
3. FAB enabled once both city and sub-area are selected.
4. On submit → POST `/api/onboarding/location` with `locationId` → advance to subStep 1.

---

## 4. Admin Panel — Location Management

### 4.1 New page: `/admin/locations`

Added to `AdminShell` nav. Allows admin to create, rename, and delete location entries.

**UI layout:**
```
Locations                              [+ Add Location]
──────────────────────────────────────────────────────
▼ Hyderabad
    Kondapur          [Edit]  [Delete]
    Gachibowli        [Edit]  [Delete]
                      [+ Add Sub-area]

▼ Vijayawada
    Madhu Gardens     [Edit]  [Delete]
    Jamjit Center     [Edit]  [Delete]
                      [+ Add Sub-area]
──────────────────────────────────────────────────────
```

- "Add Location" opens a form: city name + sub-area name → creates one `Location` row.
- "Add Sub-area" under an existing city pre-fills the city name.
- "Edit" on a sub-area renames only that sub-area (updates that single row).
- "Edit" on a city renames the city across **all** its sub-area rows (`UPDATE locations SET city = newName WHERE city = oldName`) — profiles referencing any of those rows immediately reflect the new city name.
- "Delete" removes the row — Prisma's `onDelete: SetNull` nulls `locationId` on affected profiles; those users must re-assign their location.

### 4.2 Admin APIs

All routes require admin auth.

| Method | Route | Action |
|--------|-------|--------|
| GET | `/api/admin/locations` | List all, grouped by city |
| POST | `/api/admin/locations` | Create `{ city, subArea }` — error on duplicate |
| PUT | `/api/admin/locations/[id]` | Update city/subArea text |
| DELETE | `/api/admin/locations/[id]` | Delete row; profiles nulled by DB cascade |

---

## 5. Admin Match-making

### 5.1 Candidate card additions

Each candidate card in the match-users view gains:

- **User type badge:** "Student" or "Non-student"
- **Location line:** `📍 Hyderabad · Kondapur` (joined from Location table). Shows "Location not set" if `locationId` is null.

### 5.2 Filter panel additions

New filters added above the existing gender/dating-mode filters:

| Filter | Options |
|--------|---------|
| User type | All / Student / Non-student |
| City | All / Hyderabad / Vijayawada / … (from Location table) |
| Sub-area | All / (filtered to selected city) |

Sub-area dropdown resets when city changes.

### 5.3 Candidates API changes

`GET /api/admin/match-users/candidates` gains optional query params:

- `?userType=non_student`
- `?city=Hyderabad`
- `?subArea=Kondapur`

Filters applied at DB level via join on `Profile → Location`.

---

## Out of scope

- Automatic matching for non-students (matching remains admin-curated).
- Location on student profiles (location is non-student only during onboarding).
- Age-range or distance-based matching.
