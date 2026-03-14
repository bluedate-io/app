import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { config } from "@/config";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || phone.replace(/\D/g, "") !== config.admin.phone) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 403 });
    }

    await container.twilioService.sendVerification(`+91${config.admin.phone}`);
    return NextResponse.json({ data: { message: "OTP sent", expiresInMinutes: 10 } });
  } catch {
    return NextResponse.json({ error: { message: "Failed to send OTP" } }, { status: 500 });
  }
}
