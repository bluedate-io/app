// GET  /api/chat/[matchId] — fetch messages
// POST /api/chat/[matchId] — send a message
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/withMiddleware";
import db from "@/lib/db";

async function getMatch(matchId: string, userId: string) {
  return db.match.findFirst({
    where: {
      id: matchId,
      status: "active",
      OR: [{ userId1: userId }, { userId2: userId }],
    },
  });
}

export const GET = withAuth(async (_req, ctx, params) => {
  const matchId = params!.matchId;
  const userId = ctx.userId;

  const match = await getMatch(matchId, userId);
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await db.message.findMany({
    where: { matchId },
    orderBy: { createdAt: "asc" },
    select: { id: true, senderId: true, content: true, createdAt: true, readAt: true },
  });

  // Mark received unread messages as read
  const unreadIds = messages
    .filter((m) => m.senderId !== userId && !m.readAt)
    .map((m) => m.id);
  if (unreadIds.length > 0) {
    await db.message.updateMany({
      where: { id: { in: unreadIds } },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json({
    data: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      mine: m.senderId === userId,
    })),
  });
});

export const POST = withAuth(async (req: NextRequest, ctx, params) => {
  const matchId = params!.matchId;
  const userId = ctx.userId;

  const match = await getMatch(matchId, userId);
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const content: string = (body.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const message = await db.message.create({
    data: { matchId, senderId: userId, content },
  });

  return NextResponse.json({
    data: {
      id: message.id,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      mine: true,
    },
  });
});
