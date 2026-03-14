// ─── InviteCodeService ───────────────────────────────────────────────────────
// Request invite codes via WhatsApp; validate and consume codes during onboarding.

import type { IInviteCodeRepository } from "@/repositories/InviteCodeRepository";
import {
  generateInviteCode,
  type InviteCodeRecord,
} from "@/repositories/InviteCodeRepository";
import type { IUserRepository } from "@/repositories/UserRepository";
import type { IOnboardingRepository } from "@/repositories/OnboardingRepository";
import { BadRequestError } from "@/utils/errors";
import { logger } from "@/utils/logger";

const log = logger.child("InviteCodeService");

const MAX_CODES_PER_USER = 3;

/** Normalize gender for matching (Man/Woman/Nonbinary etc.) */
function normalizeGender(g: string | null): string {
  if (!g || !g.trim()) return "";
  const lower = g.trim().toLowerCase();
  if (lower === "man" || lower === "men") return "man";
  if (lower === "woman" || lower === "women") return "woman";
  if (lower.includes("non") || lower === "nb" || lower === "nonbinary" || lower === "non-binary")
    return "nonbinary";
  return lower;
}

/** Creator can be Woman (-> Man/Nonbinary), Man (-> Woman/Nonbinary), Nonbinary (-> Man/Woman). */
function canUseCode(creatorGender: string | null, userGender: string): boolean {
  const c = normalizeGender(creatorGender);
  const u = normalizeGender(userGender);
  if (!c || !u) return false;
  if (c === "woman" && (u === "man" || u === "nonbinary")) return true;
  if (c === "man" && (u === "woman" || u === "nonbinary")) return true;
  if (c === "nonbinary" && (u === "man" || u === "woman")) return true;
  return false;
}

export class InviteCodeService {
  constructor(
    private readonly inviteCodeRepo: IInviteCodeRepository,
    private readonly userRepo: IUserRepository,
    private readonly onboardingRepo: IOnboardingRepository,
  ) {}

  /**
   * Normalize phone for DB lookup: try as-is, then with/without leading +.
   */
  private async findUserByPhone(phone: string) {
    let user = await this.userRepo.findByPhone(phone);
    if (user) return user;
    const normalized = phone.startsWith("+") ? phone.slice(1) : `+${phone}`;
    user = await this.userRepo.findByPhone(normalized);
    return user ?? null;
  }

  /**
   * Handle "invite code" request from WhatsApp. Returns reply message.
   * User must have profile with gender. Max 3 codes per user; reuse unused or create new.
   */
  async requestCode(phone: string): Promise<string> {
    const user = await this.findUserByPhone(phone);
    if (!user) {
      return "You need to sign up first. Open the app and log in with this number, then complete your profile.";
    }

    const gender = await this.onboardingRepo.getGenderIdentity(user.id);
    if (!gender || !gender.trim()) {
      return "Please complete your profile in the app (including your gender) before requesting an invite code.";
    }

    const count = await this.inviteCodeRepo.countByCreator(user.id);
    if (count >= MAX_CODES_PER_USER) {
      return "You've reached the maximum of 3 invite codes. Share your existing code(s) with friends.";
    }

    let codeRecord: InviteCodeRecord | null = await this.inviteCodeRepo.findActiveByCreator(user.id);
    if (!codeRecord) {
      let code = generateInviteCode(8);
      let attempts = 0;
      const maxAttempts = 5;
      while (attempts < maxAttempts) {
        try {
          codeRecord = await this.inviteCodeRepo.create(user.id, code);
          break;
        } catch (err: unknown) {
          const isUniqueError =
            err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002";
          if (isUniqueError) {
            code = generateInviteCode(8);
            attempts++;
            continue;
          }
          throw err;
        }
      }
      if (!codeRecord) {
        log.error("Failed to create invite code after retries", { userId: user.id });
        return "Something went wrong. Please try again in a moment.";
      }
    }

    const codeToSend = codeRecord.code;
    return `Your bluedate invite code is: *${codeToSend}*\n\nShare it with a friend so they can join. They'll need to enter it when creating their profile.`;
  }

  /**
   * Validate invite code and mark it as used by the given user.
   * Throws BadRequestError if code invalid or gender mismatch.
   */
  async validateAndUseCode(code: string, userId: string, userGender: string): Promise<void> {
    const trimmed = code.trim();
    if (!trimmed) {
      throw new BadRequestError("Please enter an invite code.");
    }

    const record = await this.inviteCodeRepo.findByCode(trimmed);
    if (!record) {
      throw new BadRequestError("Invalid or unknown invite code.");
    }
    if (record.status !== "active" || record.usedById) {
      throw new BadRequestError("This invite code has already been used.");
    }

    if (!canUseCode(record.creatorGender, userGender)) {
      throw new BadRequestError(
        "This code isn't valid for your profile. Men need a code from a woman; women need a code from a man.",
      );
    }

    await this.inviteCodeRepo.markUsed(record.id, userId);
    log.info("Invite code used", { codeId: record.id, usedById: userId });
  }
}
