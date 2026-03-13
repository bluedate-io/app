// ─── /api/users/[id] ──────────────────────────────────────────────────────────
//  GET    /api/users/:id  → get user by id
//  PATCH  /api/users/:id  → update user (self or admin)
//  DELETE /api/users/:id  → delete user (self or admin)

import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";
import { ForbiddenError } from "@/utils/errors";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return withAuth((_req, _ctx) => container.userController.getUserById(req, id))(req);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return withAuth((req, ctx) => {
    // Users can only update themselves; admins can update anyone
    if (ctx.userId !== id && ctx.role !== "admin") {
      throw new ForbiddenError("You can only update your own profile");
    }
    return container.userController.updateUser(req, id);
  })(req);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return withAuth((req, ctx) => {
    if (ctx.userId !== id && ctx.role !== "admin") {
      throw new ForbiddenError("You can only delete your own account");
    }
    return container.userController.deleteUser(req, id);
  })(req);
}
