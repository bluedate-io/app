// ─── Dependency Injection Container ──────────────────────────────────────────
// All singletons are instantiated once and reused across requests.
// Import from this file in route handlers — never construct directly.

import { db } from "@/lib/db";
import { AdminAuthController } from "@/controllers/AdminAuthController";
import { AdminMatchesController } from "@/controllers/AdminMatchesController";
import { AdminMatchmakingController } from "@/controllers/AdminMatchmakingController";
import { AdminMatchUsersController } from "@/controllers/AdminMatchUsersController";
import { AdminOnboardingReminderController } from "@/controllers/AdminOnboardingReminderController";
import { AdminUsersController } from "@/controllers/AdminUsersController";
import { AuthController } from "@/controllers/AuthController";
import { MatchController } from "@/controllers/MatchController";
import { OnboardingController } from "@/controllers/OnboardingController";
import { UserApiController } from "@/controllers/UserApiController";
import { InviteCodeRepository } from "@/repositories/InviteCodeRepository";
import { AdminMatchesRepository } from "@/repositories/AdminMatchesRepository";
import { AdminMatchmakingRepository } from "@/repositories/AdminMatchmakingRepository";
import { AdminMatchUsersRepository } from "@/repositories/AdminMatchUsersRepository";
import { AdminUsersRepository } from "@/repositories/AdminUsersRepository";
import { CollegeDomainRepository } from "@/repositories/CollegeDomainRepository";
import { MatchRepository } from "@/repositories/MatchRepository";
import { OnboardingRepository } from "@/repositories/OnboardingRepository";
import { UserSelfRepository } from "@/repositories/UserSelfRepository";
import { UserRepository } from "@/repositories/UserRepository";
import { WhatsAppSessionRepository } from "@/repositories/WhatsAppSessionRepository";
import { AdminAuthService } from "@/services/AdminAuthService";
import { AdminMatchesService } from "@/services/AdminMatchesService";
import { AdminMatchmakingService } from "@/services/AdminMatchmakingService";
import { AdminMatchUsersService } from "@/services/AdminMatchUsersService";
import { AdminOnboardingReminderService } from "@/services/AdminOnboardingReminderService";
import { AdminUsersService } from "@/services/AdminUsersService";
import { AuthService } from "@/services/AuthService";
import { EmailService } from "@/services/EmailService";
import { InviteCodeService } from "@/services/InviteCodeService";
import { MatchService } from "@/services/MatchService";
import { MatchEmailService } from "@/services/MatchEmailService";
import { OnboardingService } from "@/services/OnboardingService";
import { TwilioService } from "@/services/TwilioService";
import { UserSelfService } from "@/services/UserSelfService";
import { WaInteractiveService } from "@/services/WaInteractiveService";
import { WhatsAppBotService } from "@/services/WhatsAppBotService";

// ─── Repositories ─────────────────────────────────────────────────────────────
const userRepository = new UserRepository(db);
const onboardingRepository = new OnboardingRepository(db);
const inviteCodeRepository = new InviteCodeRepository(db);
const whatsAppSessionRepository = new WhatsAppSessionRepository(db);
const collegeDomainRepository = new CollegeDomainRepository(db);
const matchRepository = new MatchRepository(db);
const adminMatchmakingRepository = new AdminMatchmakingRepository(db);
const adminMatchUsersRepository = new AdminMatchUsersRepository(db);
const adminUsersRepository = new AdminUsersRepository(db);
const adminMatchesRepository = new AdminMatchesRepository(db);
const userSelfRepository = new UserSelfRepository(db);

// ─── Services ─────────────────────────────────────────────────────────────────
const twilioService = new TwilioService();
const matchEmailService = new MatchEmailService();
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
);
const whatsAppBotService = new WhatsAppBotService(
  whatsAppSessionRepository,
  userRepository,
  onboardingRepository,
  inviteCodeService,
);
const waInteractiveService = new WaInteractiveService();
const matchService = new MatchService(matchRepository, collegeDomainRepository);
const adminMatchmakingService = new AdminMatchmakingService(
  adminMatchmakingRepository,
  matchEmailService,
);
const adminMatchUsersService = new AdminMatchUsersService(
  adminMatchUsersRepository,
  matchEmailService,
);
const adminUsersService = new AdminUsersService(adminUsersRepository);
const adminOnboardingReminderService = new AdminOnboardingReminderService(db);
const adminMatchesService = new AdminMatchesService(adminMatchesRepository);
const userSelfService = new UserSelfService(userSelfRepository, matchEmailService);
const adminAuthService = new AdminAuthService(twilioService, userRepository, userSelfRepository);

// ─── Controllers ──────────────────────────────────────────────────────────────
const authController = new AuthController(authService, userRepository, collegeDomainRepository);
const onboardingController = new OnboardingController(onboardingService, authService);
const userApiController = new UserApiController(userSelfService, authService);
const adminMatchmakingController = new AdminMatchmakingController(adminMatchmakingService);
const adminMatchUsersController = new AdminMatchUsersController(adminMatchUsersService);
const adminUsersController = new AdminUsersController(adminUsersService);
const adminOnboardingReminderController = new AdminOnboardingReminderController(
  adminOnboardingReminderService,
);
const adminMatchesController = new AdminMatchesController(adminMatchesService);
const adminAuthController = new AdminAuthController(twilioService, adminAuthService);
const matchController = new MatchController(matchService);

export const container = {
  // Repositories
  userRepository,
  onboardingRepository,
  inviteCodeRepository,
  whatsAppSessionRepository,
  collegeDomainRepository,
  matchRepository,
  adminMatchmakingRepository,
  adminMatchUsersRepository,
  adminUsersRepository,
  adminMatchesRepository,
  userSelfRepository,

  // Services
  twilioService,
  emailService,
  matchEmailService,
  authService,
  onboardingService,
  whatsAppBotService,
  waInteractiveService,
  matchService,
  adminMatchmakingService,
  adminMatchUsersService,
  adminUsersService,
  adminOnboardingReminderService,
  adminMatchesService,
  userSelfService,
  adminAuthService,

  // Controllers
  authController,
  onboardingController,
  userApiController,
  adminMatchmakingController,
  adminMatchUsersController,
  adminUsersController,
  adminOnboardingReminderController,
  adminMatchesController,
  adminAuthController,
  matchController,
} as const;
