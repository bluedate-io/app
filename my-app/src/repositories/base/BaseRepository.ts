// ─── BaseRepository ───────────────────────────────────────────────────────────
// Defines the minimal CRUD contract all repositories must implement.

import type { PaginationParams, PaginatedResult } from "@/types";

export interface IBaseRepository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<T | null>;
  findAll(params: PaginationParams): Promise<PaginatedResult<T>>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
