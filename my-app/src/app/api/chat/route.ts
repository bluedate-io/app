// GET /api/chat — list conversations (matches) for the current user
import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/withMiddleware";
import db from "@/lib/db";

export const GET = withAuth(async (_req, ctx) => {
  const userId = ctx.userId;

  const matches = await db.match.findMany({
    where: {
      status: "active",
      OR: [{ userId1: userId }, { userId2: userId }],
    },
    include: {
      user1: {
        include: {
          profile: { select: { fullName: true } },
          photos: { orderBy: { order: "asc" }, take: 1 },
        },
      },
      user2: {
        include: {
          profile: { select: { fullName: true } },
          photos: { orderBy: { order: "asc" }, take: 1 },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { matchedAt: "desc" },
  });

  const data = matches.map((m) => {
    const other = m.userId1 === userId ? m.user2 : m.user1;
    const lastMsg = m.messages[0] ?? null;
    const unread = lastMsg && lastMsg.senderId !== userId && !lastMsg.readAt;
    return {
      matchId: m.id,
      name: other.profile?.fullName ?? "Unknown",
      photoUrl: other.photos[0]?.url ?? null,
      lastMessage: lastMsg?.content ?? null,
      lastMessageAt: lastMsg?.createdAt?.toISOString() ?? m.matchedAt.toISOString(),
      unread: !!unread,
    };
  });

  return NextResponse.json({ data });
});
