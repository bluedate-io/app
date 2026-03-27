import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth.middleware";
import { container } from "@/lib/container";
import { UnauthorizedError } from "@/utils/errors";

export async function GET(req: NextRequest) {
  try {
    const ctx = authenticate(req);
    const data = await container.matchService.getUserMatches(ctx.userId);
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }
    return NextResponse.json({ error: { message: "Failed to load matches" } }, { status: 500 });
  }
}
