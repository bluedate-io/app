// ─── Dependency Injection Container ──────────────────────────────────────────
// All singletons are instantiated once and reused across requests.
// Import from this file in route handlers — never construct directly.

import { db } from "@/lib/db";
import { UserRepository } from "@/repositories/UserRepository";
import { OnboardingRepository } from "@/repositories/OnboardingRepository";
import { InviteCodeRepository } from "@/repositories/InviteCodeRepository";
import { WhatsAppSessionRepository } from "@/repositories/WhatsAppSessionRepository";
import { CollegeDomainRepository } from "@/repositories/CollegeDomainRepository";
import { TwilioService } from "@/services/TwilioService";
import { EmailService } from "@/services/EmailService";
import { AuthService } from "@/services/AuthService";
import { OnboardingService } from "@/services/OnboardingService";
import { InviteCodeService } from "@/services/InviteCodeService";
import { WhatsAppBotService } from "@/services/WhatsAppBotService";
import { WaInteractiveService } from "@/services/WaInteractiveService";
import { AuthController } from "@/controllers/AuthController";
import { OnboardingController } from "@/controllers/OnboardingController";

// ─── Repositories ─────────────────────────────────────────────────────────────
const userRepository = new UserRepository(db);
const onboardingRepository = new OnboardingRepository(db);
const inviteCodeRepository = new InviteCodeRepository(db);
const whatsAppSessionRepository = new WhatsAppSessionRepository(db);
const collegeDomainRepository = new CollegeDomainRepository(db);

// ─── Services ─────────────────────────────────────────────────────────────────
const twilioService = new TwilioService();
const emailService = new EmailService(db);
const authService = new AuthService(userRepository, emailService, collegeDomainRepository);
const inviteCodeService = new InviteCodeService(
  inviteCodeRepository,
  userRepository,
  onboardingRepository,
);
const onboardingService = new OnboardingService(
  onboardingRepository,
  userRepository,
  inviteCodeService,
);
const whatsAppBotService = new WhatsAppBotService(
  whatsAppSessionRepository,
  userRepository,
  onboardingRepository,
  inviteCodeService,
);
const waInteractiveService = new WaInteractiveService();

// ─── Controllers ──────────────────────────────────────────────────────────────
const authController = new AuthController(authService, userRepository, collegeDomainRepository);
const onboardingController = new OnboardingController(onboardingService);

export const container = {
  // Repositories
  userRepository,
  onboardingRepository,
  inviteCodeRepository,
  whatsAppSessionRepository,
  collegeDomainRepository,

  // Services
  twilioService,
  emailService,
  authService,
  onboardingService,
  whatsAppBotService,
  waInteractiveService,

  // Controllers
  authController,
  onboardingController,
} as const;
