import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    const data = await container.adminAuthService.verifyOtp(phone, code);
    return NextResponse.json({ data });
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
