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
  create(collegeName: string, domain: string): Promise<CollegeDomain>;
  update(id: string, collegeName: string, domain: string): Promise<CollegeDomain>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
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

  async create(collegeName: string, domain: string): Promise<CollegeDomain> {
    return this.db.collegeDomain.create({ data: { collegeName, domain } });
  }

  async update(id: string, collegeName: string, domain: string): Promise<CollegeDomain> {
    return this.db.collegeDomain.update({ where: { id }, data: { collegeName, domain } });
  }

  async delete(id: string): Promise<void> {
    await this.db.collegeDomain.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.db.collegeDomain.findUnique({ where: { id }, select: { id: true } });
    return row !== null;
  }
}
