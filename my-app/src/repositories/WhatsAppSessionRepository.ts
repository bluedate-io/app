// ─── WhatsAppSessionRepository ────────────────────────────────────────────────
// Manages conversation state for the WhatsApp onboarding bot.

import type { PrismaClient, Prisma } from "@/generated/prisma/client";

export interface WhatsAppSession {
  id: string;
  phone: string;
  step: string;
  tempData: Record<string, unknown>;
  updatedAt: Date;
}

export interface IWhatsAppSessionRepository {
  findByPhone(phone: string): Promise<WhatsAppSession | null>;
  upsert(phone: string, step: string, tempData: Record<string, unknown>): Promise<WhatsAppSession>;
  delete(phone: string): Promise<void>;
}

function toDomain(row: {
  id: string;
  phone: string;
  step: string;
  tempData: unknown;
  updatedAt: Date;
}): WhatsAppSession {
  return {
    id: row.id,
    phone: row.phone,
    step: row.step,
    tempData: (row.tempData as Record<string, unknown>) ?? {},
    updatedAt: row.updatedAt,
  };
}

export class WhatsAppSessionRepository implements IWhatsAppSessionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByPhone(phone: string): Promise<WhatsAppSession | null> {
    const row = await this.db.whatsAppSession.findUnique({ where: { phone } });
    return row ? toDomain(row) : null;
  }

  async upsert(
    phone: string,
    step: string,
    tempData: Record<string, unknown>,
  ): Promise<WhatsAppSession> {
    const json = tempData as Prisma.InputJsonValue;
    const row = await this.db.whatsAppSession.upsert({
      where: { phone },
      create: { phone, step, tempData: json },
      update: { step, tempData: json },
    });
    return toDomain(row);
  }

  async delete(phone: string): Promise<void> {
    await this.db.whatsAppSession.deleteMany({ where: { phone } });
  }
}
