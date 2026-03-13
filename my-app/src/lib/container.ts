// ─── Dependency Injection Container ──────────────────────────────────────────
// Lightweight manual DI — no framework needed.
// All singletons are lazily instantiated and cached here.
// Import from this file in route handlers instead of constructing directly.

import { UserRepository } from "@/repositories/UserRepository";
import { MatchRepository } from "@/repositories/MatchRepository";
import { UserService } from "@/services/UserService";
import { AuthService } from "@/services/AuthService";
import { MatchmakingService } from "@/services/MatchmakingService";
import { UserController } from "@/controllers/UserController";
import { AuthController } from "@/controllers/AuthController";

// ─── Repositories ─────────────────────────────────────────────────────────────
const userRepository = new UserRepository();
const matchRepository = new MatchRepository();

// ─── Services ─────────────────────────────────────────────────────────────────
const userService = new UserService(userRepository);
const authService = new AuthService(userRepository);
const matchmakingService = new MatchmakingService(matchRepository, userRepository);

// ─── Controllers ──────────────────────────────────────────────────────────────
const userController = new UserController(userService);
const authController = new AuthController(authService);

export const container = {
  // Repositories
  userRepository,
  matchRepository,

  // Services
  userService,
  authService,
  matchmakingService,

  // Controllers
  userController,
  authController,
} as const;
