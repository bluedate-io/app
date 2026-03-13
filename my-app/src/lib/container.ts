// ─── Dependency Injection Container ──────────────────────────────────────────
// Lightweight manual DI — no framework needed.
// All singletons are instantiated once and reused across requests.
// Import from this file in route handlers — never construct directly.

import { db } from "@/lib/db";
import { UserRepository } from "@/repositories/UserRepository";
import { UserService } from "@/services/UserService";
import { AuthService } from "@/services/AuthService";
import { UserController } from "@/controllers/UserController";
import { AuthController } from "@/controllers/AuthController";

// ─── Repositories ─────────────────────────────────────────────────────────────
const userRepository = new UserRepository(db);

// ─── Services ─────────────────────────────────────────────────────────────────
const userService = new UserService(userRepository);
const authService = new AuthService(userRepository);

// ─── Controllers ──────────────────────────────────────────────────────────────
const userController = new UserController(userService);
const authController = new AuthController(authService);

export const container = {
  // Repositories
  userRepository,

  // Services
  userService,
  authService,

  // Controllers
  userController,
  authController,
} as const;
