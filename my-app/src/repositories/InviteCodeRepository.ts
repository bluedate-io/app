// ─── InviteCodeRepository ─────────────────────────────────────────────────────
// Persistence for invite codes (creator, usedBy, status).

import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";

const ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O, 1/I

export interface InviteCodeRecord {
  id: string;
  code: string;
  createdById: string;
  usedById: string | null;
  status: "active" | "used";
  createdAt: Date;
  updatedAt: Date;
}

export interface IInviteCodeRepository {
  create(createdById: string, code: string): Promise<InviteCodeRecord>;
  findByCode(code: string): Promise<(InviteCodeRecord & { creatorGender: string | null }) | null>;
  findActiveByCreator(createdById: string): Promise<InviteCodeRecord | null>;
  countByCreator(createdById: string): Promise<number>;
  markUsed(id: string, usedById: string): Promise<InviteCodeRecord>;
  hasUsedInviteCode(userId: string): Promise<boolean>;
}

function toRecord(row: {
  id: string;
  code: string;
  createdById: string;
  usedById: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): InviteCodeRecord {
  return {
    id: row.id,
    code: row.code,
    createdById: row.createdById,
    usedById: row.usedById,
    status: row.status as "active" | "used",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class InviteCodeRepository implements IInviteCodeRepository {
  constructor(private readonly db: PrismaClient) {}

  private get inviteCode(): PrismaClient["inviteCode"] {
    const delegate = (this.db as Record<string, unknown>).inviteCode;
    if (!delegate) {
      throw new Error(
        "Prisma client missing inviteCode delegate. Run: npx prisma generate && restart the dev server (or delete .next and run again).",
      );
    }
    return delegate as PrismaClient["inviteCode"];
  }

  async create(createdById: string, code: string): Promise<InviteCodeRecord> {
    const normalized = code.trim().toUpperCase();
    const row = await this.inviteCode.create({
      data: { code: normalized, createdById, status: "active" },
    });
    return toRecord(row);
  }

  async findByCode(code: string): Promise<(InviteCodeRecord & { creatorGender: string | null }) | null> {
    const row = await this.inviteCode.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: {
        createdBy: {
          select: {
            preferences: { select: { genderIdentity: true } },
          },
        },
      },
    });
    if (!row) return null;
    const gender = row.createdBy?.preferences?.genderIdentity ?? null;
    return { ...toRecord(row), creatorGender: gender };
  }

  async findActiveByCreator(createdById: string): Promise<InviteCodeRecord | null> {
    const row = await this.inviteCode.findFirst({
      where: { createdById, status: "active", usedById: null },
      orderBy: { createdAt: "desc" },
    });
    return row ? toRecord(row) : null;
  }

  async countByCreator(createdById: string): Promise<number> {
    return this.inviteCode.count({ where: { createdById } });
  }

  async markUsed(id: string, usedById: string): Promise<InviteCodeRecord> {
    const row = await this.inviteCode.update({
      where: { id },
      data: { usedById, status: "used" },
    });
    return toRecord(row);
  }

  async hasUsedInviteCode(userId: string): Promise<boolean> {
    const count = await this.inviteCode.count({
      where: { usedById: userId },
    });
    return count > 0;
  }
}

export function generateInviteCode(length = 8): string {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ALPHANUM[bytes[i]! % ALPHANUM.length];
  }
  return result;
}
