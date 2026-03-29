// ─── AdminOnboardingReminderController — `/api/admin/onboarding-incomplete/*`

import { NextRequest, NextResponse } from "next/server";
import type { AdminOnboardingReminderService } from "@/services/AdminOnboardingReminderService";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import {
  parseOnboardingIncompleteListQuery,
  parseOnboardingIncompleteSendBody,
} from "@/validations/adminOnboardingReminder.validation";

export class AdminOnboardingReminderController {
  constructor(private readonly service: AdminOnboardingReminderService) {}

  async list(req: NextRequest) {
    try {
      const q = parseOnboardingIncompleteListQuery(req.nextUrl.searchParams);
      const [list, lastSend, recentSends] = await Promise.all([
        this.service.listIncompleteUsers(q.page, q.pageSize, { q: q.q, sort: q.sort }),
        this.service.getLastSend(),
        this.service.getRecentSendsWithRecipients(),
      ]);
      return NextResponse.json({ data: { ...list, lastSend, recentSends } });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async send(req: NextRequest, adminUserId: string) {
    try {
      const body = await req.json();
      const { userIds } = parseOnboardingIncompleteSendBody(body);
      const result = await this.service.sendReminders(adminUserId, userIds);
      return NextResponse.json({ data: result });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async reminderHistory(_req: NextRequest, params: Promise<{ userId: string }>) {
    try {
      const { userId } = await params;
      const data = await this.service.getReminderHistoryForUser(userId);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }
}
