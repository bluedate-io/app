// POST /api/date/toggle — set wantDate on/off
import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/withMiddleware";
import { db } from "@/lib/db";

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const { wantDate } = await req.json();

  if (typeof wantDate !== "boolean") {
    return NextResponse.json({ error: "wantDate must be a boolean" }, { status: 400 });
  }

  await db.preferences.upsert({
    where: { userId: ctx.userId },
    create: { userId: ctx.userId, wantDate },
    update: { wantDate },
  });

  return NextResponse.json({ data: { wantDate } });
});
