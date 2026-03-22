// ─── CollegeDomainRepository ──────────────────────────────────────────────────
// Lookups for college → email domain mapping used during email OTP auth.

import type { PrismaClient } from "@/generated/prisma/client";

export interface CollegeDomain {
  id: string;
  collegeName: string;
  domain: string;
}

export interface ICollegeDomainRepository {
  findAll(): Promise<CollegeDomain[]>;
  findByCollegeName(collegeName: string): Promise<CollegeDomain | null>;
  findByDomain(domain: string): Promise<CollegeDomain | null>;
}

export class CollegeDomainRepository implements ICollegeDomainRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll(): Promise<CollegeDomain[]> {
    return this.db.collegeDomain.findMany({ orderBy: { collegeName: "asc" } });
  }

  async findByCollegeName(collegeName: string): Promise<CollegeDomain | null> {
    return this.db.collegeDomain.findUnique({ where: { collegeName } });
  }

  async findByDomain(domain: string): Promise<CollegeDomain | null> {
    return this.db.collegeDomain.findUnique({ where: { domain } });
  }
}
