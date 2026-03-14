import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { container } from "@/lib/container";
import { config } from "@/config";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();

    if (!phone || phone.replace(/\D/g, "") !== config.admin.phone) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 403 });
    }

    const fullPhone = `+91${config.admin.phone}`;
    await container.twilioService.checkVerification(fullPhone, code);

    // Find or create admin user and ensure role is admin
    const { user } = await container.userRepository.findOrCreate(fullPhone);
    if (user.role !== "admin") {
      await db.user.update({ where: { id: user.id }, data: { role: "admin" } });
    }

    const token = jwt.sign(
      { sub: user.id, phone: user.phone, role: "admin", onboardingCompleted: true },
      config.auth.jwtSecret,
      { expiresIn: "24h" },
    );

    return NextResponse.json({ data: { token } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid OTP";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
}
