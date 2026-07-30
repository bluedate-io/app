import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { ICollegeDomainRepository } from "@/repositories/CollegeDomainRepository";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import { NotFoundError } from "@/utils/errors";

const bodySchema = z.object({
  collegeName: z.string().trim().min(1, "College name is required"),
  domain: z
    .string()
    .trim()
    .min(1, "Domain is required")
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Enter a valid domain (e.g. iitb.ac.in)"),
});

export class AdminCollegeDomainController {
  constructor(private readonly repo: ICollegeDomainRepository) {}

  async getAll() {
    try {
      const data = await this.repo.findAll();
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async create(req: NextRequest) {
    try {
      const body = bodySchema.parse(await req.json());
      const data = await this.repo.create(body.collegeName, body.domain);
      return NextResponse.json({ data }, { status: 201 });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async update(req: NextRequest, id: string) {
    try {
      const body = bodySchema.parse(await req.json());
      const exists = await this.repo.exists(id);
      if (!exists) throw new NotFoundError("College domain not found");
      const data = await this.repo.update(id, body.collegeName, body.domain);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async deleteOne(_req: NextRequest, id: string) {
    try {
      const exists = await this.repo.exists(id);
      if (!exists) throw new NotFoundError("College domain not found");
      await this.repo.delete(id);
      return NextResponse.json({ success: true });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }
}
