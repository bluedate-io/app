// ─── SubscriptionRepository ───────────────────────────────────────────────────

import type { PrismaClient } from "@/generated/prisma/client";
import { SubscriptionStatus } from "@/generated/prisma/client";

export interface SubscriptionRow {
  id: string;
  userId: string;
  paypalSubscriptionId: string;
  status: SubscriptionStatus;
  startedAt: Date | null;
  nextBillingAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertSubscriptionData {
  paypalSubscriptionId: string;
  status: SubscriptionStatus;
  startedAt?: Date | null;
  nextBillingAt?: Date | null;
  cancelledAt?: Date | null;
}

export interface ISubscriptionRepository {
  upsert(userId: string, data: UpsertSubscriptionData): Promise<SubscriptionRow>;
  findByUserId(userId: string): Promise<SubscriptionRow | null>;
  findByPaypalId(paypalSubscriptionId: string): Promise<SubscriptionRow | null>;
}

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly db: PrismaClient) {}

  async upsert(userId: string, data: UpsertSubscriptionData): Promise<SubscriptionRow> {
    return this.db.subscription.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data },
    });
  }

  async findByUserId(userId: string): Promise<SubscriptionRow | null> {
    return this.db.subscription.findUnique({ where: { userId } });
  }

  async findByPaypalId(paypalSubscriptionId: string): Promise<SubscriptionRow | null> {
    return this.db.subscription.findUnique({ where: { paypalSubscriptionId } });
  }
}
