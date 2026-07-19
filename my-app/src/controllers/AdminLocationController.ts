import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { ILocationRepository } from "@/repositories/LocationRepository";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import { NotFoundError } from "@/utils/errors";

const createSchema = z.object({
  city: z.string().trim().min(1, "City is required"),
  subArea: z.string().trim().min(1, "Sub-area is required"),
});

const updateSchema = z.object({
  city: z.string().trim().min(1, "City is required"),
  subArea: z.string().trim().min(1, "Sub-area is required"),
  renameCity: z.boolean().optional().default(false),
});

export class AdminLocationController {
  constructor(private readonly locationRepository: ILocationRepository) {}

  async getAll() {
    try {
      const data = await this.locationRepository.findAll();
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async create(req: NextRequest) {
    try {
      const body = createSchema.parse(await req.json());
      const data = await this.locationRepository.create(body.city, body.subArea);
      return NextResponse.json({ data }, { status: 201 });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async update(req: NextRequest, id: string) {
    try {
      const body = updateSchema.parse(await req.json());
      const existing = await this.locationRepository.findById(id);
      if (!existing) throw new NotFoundError("Location not found");

      if (body.renameCity && existing.city !== body.city) {
        // Rename city on all sub-area rows, then update this row's subArea
        await this.locationRepository.updateCity(existing.city, body.city);
        await this.locationRepository.update(id, body.city, body.subArea);
      } else {
        await this.locationRepository.update(id, body.city, body.subArea);
      }

      const data = await this.locationRepository.findAll();
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async deleteOne(_req: NextRequest, id: string) {
    try {
      const exists = await this.locationRepository.exists(id);
      if (!exists) throw new NotFoundError("Location not found");
      await this.locationRepository.delete(id);
      return NextResponse.json({ success: true });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }
}
