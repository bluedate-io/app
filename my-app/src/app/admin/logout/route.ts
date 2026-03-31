import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const loginUrl = new URL("/admin/login", request.url);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("admin_token");
  return response;
}
