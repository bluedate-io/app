// ─── UserController ───────────────────────────────────────────────────────────
// Thin layer: parse request → call service → shape response.
// Zero business logic lives here.

import { NextRequest } from "next/server";
import { createUserSchema, updateUserSchema } from "@/validations/user.validation";
import type { UserService } from "@/services/UserService";
import {
  successResponse,
  createdResponse,
  noContentResponse,
  handleError,
} from "@/utils/response";
import { parsePaginationParams } from "@/utils/pagination";

export class UserController {
  constructor(private readonly userService: UserService) {}

  async createUser(req: NextRequest) {
    try {
      const body = await req.json();
      const input = createUserSchema.parse(body);
      const user = await this.userService.createUser(input);
      return createdResponse(user, "User created successfully");
    } catch (error) {
      return handleError(error);
    }
  }

  async getUserById(req: NextRequest, userId: string) {
    try {
      const user = await this.userService.getUserById(userId);
      return successResponse(user);
    } catch (error) {
      return handleError(error);
    }
  }

  async updateUser(req: NextRequest, userId: string) {
    try {
      const body = await req.json();
      const input = updateUserSchema.parse(body);
      const user = await this.userService.updateUser(userId, input);
      return successResponse(user, { message: "User updated successfully" });
    } catch (error) {
      return handleError(error);
    }
  }

  async deleteUser(_req: NextRequest, userId: string) {
    try {
      await this.userService.deleteUser(userId);
      return noContentResponse();
    } catch (error) {
      return handleError(error);
    }
  }

  async listUsers(req: NextRequest) {
    try {
      const params = parsePaginationParams(req.nextUrl.searchParams);
      const result = await this.userService.listUsers(params);
      return successResponse(result.data, {
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      return handleError(error);
    }
  }
}
