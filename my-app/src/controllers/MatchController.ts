// ─── MatchController — `/api/matches`

import { NextRequest, NextResponse } from "next/server";
import type { MatchService } from "@/services/MatchService";
import { authenticate } from "@/middleware/auth.middleware";
import { UnauthorizedError } from "@/utils/errors";

export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  async getUserMatches(req: NextRequest) {
    try {
      const ctx = authenticate(req);
      const data = await this.matchService.getUserMatches(ctx.userId);
      return NextResponse.json({ data });
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
      }
      return NextResponse.json({ error: { message: "Failed to load matches" } }, { status: 500 });
    }
  }
}
