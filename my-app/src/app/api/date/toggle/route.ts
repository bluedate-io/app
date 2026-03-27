import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/withMiddleware";
import { container } from "@/lib/container";
import { parseDateToggleBody } from "@/validations/userApi.validation";

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const { wantDate } = parseDateToggleBody(await req.json());
  const data = await container.userSelfService.toggleWantDate(ctx.userId, wantDate);
  return NextResponse.json({ data });
});
