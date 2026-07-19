// ─── LocationRepository ───────────────────────────────────────────────────────
// Manages location data: cities and sub-areas used during non-student user onboarding.

import type { PrismaClient } from "@/generated/prisma/client";

export interface GroupedLocation {
  city: string;
  subAreas: { id: string; name: string }[];
}

export interface ILocationRepository {
  findAll(): Promise<GroupedLocation[]>;
  findById(id: string): Promise<{ id: string; city: string; subArea: string } | null>;
  create(city: string, subArea: string): Promise<{ id: string; city: string; subArea: string }>;
  update(id: string, city: string, subArea: string): Promise<{ id: string; city: string; subArea: string }>;
  updateCity(oldCity: string, newCity: string): Promise<void>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export class LocationRepository implements ILocationRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll(): Promise<GroupedLocation[]> {
    const rows = await this.db.location.findMany({
      orderBy: [{ city: "asc" }, { subArea: "asc" }],
      select: { id: true, city: true, subArea: true },
    });
    const map = new Map<string, { id: string; name: string }[]>();
    for (const row of rows) {
      if (!map.has(row.city)) map.set(row.city, []);
      map.get(row.city)!.push({ id: row.id, name: row.subArea });
    }
    return Array.from(map.entries()).map(([city, subAreas]) => ({ city, subAreas }));
  }

  async findById(id: string) {
    return this.db.location.findUnique({
      where: { id },
      select: { id: true, city: true, subArea: true },
    });
  }

  async create(city: string, subArea: string) {
    return this.db.location.create({
      data: { city: city.trim(), subArea: subArea.trim() },
      select: { id: true, city: true, subArea: true },
    });
  }

  async update(id: string, city: string, subArea: string) {
    return this.db.location.update({
      where: { id },
      data: { city: city.trim(), subArea: subArea.trim() },
      select: { id: true, city: true, subArea: true },
    });
  }

  async updateCity(oldCity: string, newCity: string): Promise<void> {
    await this.db.location.updateMany({
      where: { city: oldCity },
      data: { city: newCity.trim() },
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.location.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.db.location.findUnique({ where: { id }, select: { id: true } });
    return row !== null;
  }
}
