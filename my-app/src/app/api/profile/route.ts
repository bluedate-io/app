import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/withMiddleware";
import { container } from "@/lib/container";

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const data = await container.userSelfService.getProfile(ctx.userId);
  return NextResponse.json({ data });
});
