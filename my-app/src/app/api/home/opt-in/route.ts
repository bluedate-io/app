// GET  /api/home/opt-in — fetch current week's opt-in status
// POST /api/home/opt-in — opt in (or update description) for current week

import { type NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/middleware/withMiddleware";
import { db } from "@/lib/db";
import { successResponse, handleError } from "@/utils/response";
import type { RequestContext } from "@/types";

// ─── Week helpers (IST = UTC+5:30) ────────────────────────────────────────────

const IST_MS = 5.5 * 60 * 60 * 1000; // 19 800 000 ms

/** Returns Monday 00:00:00.000 IST (as UTC Date) for the week containing `now`. */
function getWeekStart(now = new Date()): Date {
  const ist = new Date(now.getTime() + IST_MS);
  const day = ist.getUTCDay(); // day-of-week in IST
  const daysToMonday = day === 0 ? -6 : 1 - day;
  const mondayIST = new Date(ist);
  mondayIST.setUTCDate(ist.getUTCDate() + daysToMonday);
  mondayIST.setUTCHours(0, 0, 0, 0);
  return new Date(mondayIST.getTime() - IST_MS);
}

/** Returns Friday 00:00:00.000 IST (as UTC Date) — opt-in deadline. */
function getFridayMidnight(now = new Date()): Date {
  const weekStart = getWeekStart(now);
  return new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000);
}

// ─── GET ──────────────────────────────────────────────────────────────────────

async function getOptIn(_req: NextRequest, ctx: RequestContext) {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const deadline = getFridayMidnight(now);

  const record = await db.weeklyOptIn.findUnique({
    where: { userId_weekStart: { userId: ctx.userId, weekStart } },
    select: { mode: true, description: true, createdAt: true },
  });

  return successResponse({
    optedIn: !!record,
    mode: record?.mode ?? null,
    description: record?.description ?? null,
    weekStart: weekStart.toISOString(),
    deadline: deadline.toISOString(),
    windowOpen: now < deadline,
  });
}

// ─── POST ─────────────────────────────────────────────────────────────────────

const postSchema = z.object({
  description: z.string().max(500).optional(),
});

async function postOptIn(req: NextRequest, ctx: RequestContext) {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const deadline = getFridayMidnight(now);

  if (now >= deadline) {
    return handleError(Object.assign(new Error("Opt-in window is closed for this week"), { statusCode: 400, code: "WINDOW_CLOSED" }));
  }

  // Resolve mode from preferences
  const prefs = await db.preferences.findUnique({
    where: { userId: ctx.userId },
    select: { relationshipIntent: true },
  });
  const mode = prefs?.relationshipIntent === "friendship" ? "bff" : "date";

  const body = await req.json().catch(() => ({}));
  const { description } = postSchema.parse(body);

  const record = await db.weeklyOptIn.upsert({
    where: { userId_weekStart: { userId: ctx.userId, weekStart } },
    create: { userId: ctx.userId, weekStart, mode, description: description ?? null },
    update: { description: description ?? undefined },
    select: { mode: true, description: true },
  });

  return successResponse({
    optedIn: true,
    mode: record.mode,
    description: record.description,
    weekStart: weekStart.toISOString(),
    deadline: deadline.toISOString(),
    windowOpen: true,
  });
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const GET = withAuth(getOptIn);
export const POST = withAuth(postOptIn);
