import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import db from "@/lib/db";

function verifyAdmin(req: NextRequest): boolean {
  try {
    const cookie = req.cookies.get("admin_token")?.value;
    if (!cookie) return false;
    const payload = jwt.verify(cookie, config.auth.jwtSecret) as { role?: string };
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await params;

  try {
    await db.match.delete({ where: { id } });
    return NextResponse.json({ data: { deleted: true } });
  } catch {
    return NextResponse.json({ error: { message: "Match not found" } }, { status: 404 });
  }
}
