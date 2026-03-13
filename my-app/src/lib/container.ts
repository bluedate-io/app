// ─── Dependency Injection Container ──────────────────────────────────────────
// All singletons are instantiated once and reused across requests.
// Import from this file in route handlers — never construct directly.

import { db } from "@/lib/db";
import { UserRepository } from "@/repositories/UserRepository";
import { OnboardingRepository } from "@/repositories/OnboardingRepository";
import { TwilioService } from "@/services/TwilioService";
import { AuthService } from "@/services/AuthService";
import { OnboardingService } from "@/services/OnboardingService";
import { AuthController } from "@/controllers/AuthController";
import { OnboardingController } from "@/controllers/OnboardingController";

// ─── Repositories ─────────────────────────────────────────────────────────────
const userRepository = new UserRepository(db);
const onboardingRepository = new OnboardingRepository(db);

// ─── Services ─────────────────────────────────────────────────────────────────
const twilioService = new TwilioService();
const authService = new AuthService(userRepository, twilioService);
const onboardingService = new OnboardingService(onboardingRepository, userRepository);

// ─── Controllers ──────────────────────────────────────────────────────────────
const authController = new AuthController(authService, userRepository);
const onboardingController = new OnboardingController(onboardingService);

export const container = {
  // Repositories
  userRepository,
  onboardingRepository,

  // Services
  twilioService,
  authService,
  onboardingService,

  // Controllers
  authController,
  onboardingController,
} as const;
