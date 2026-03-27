import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/types";

export function adminRouteErrorResponse(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    const msg = err.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: { message: msg } }, { status: 400 });
  }
  if (err instanceof AppError) {
    return NextResponse.json({ error: { message: err.message } }, { status: err.statusCode });
  }
  throw err;
}
