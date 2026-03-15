// ─── WhatsAppBotService ────────────────────────────────────────────────────────
// Drives the WhatsApp onboarding conversation state machine.
// No JWT / OTP — trust is established via WhatsApp-verified phone number.

import { createClient } from "@supabase/supabase-js";
import { config } from "@/config";
import type { IWhatsAppSessionRepository } from "@/repositories/WhatsAppSessionRepository";
import type { IUserRepository } from "@/repositories/UserRepository";
import type { IOnboardingRepository } from "@/repositories/OnboardingRepository";
import type { InviteCodeService } from "@/services/InviteCodeService";
import { logger } from "@/utils/logger";

const log = logger.child("WhatsAppBotService");

// ─── Step constants ────────────────────────────────────────────────────────────

const STEPS = {
  WELCOME: "WELCOME",
  PROFILE_DOB: "PROFILE_DOB",
  GENDER: "GENDER",
  INVITE_CODE: "INVITE_CODE",
  DATING_MODE: "DATING_MODE",
  WHO_TO_MEET: "WHO_TO_MEET",
  RELATIONSHIP_GOALS: "RELATIONSHIP_GOALS",
  INTERESTS: "INTERESTS",
  HABITS_DRINKING: "HABITS_DRINKING",
  HABITS_SMOKING: "HABITS_SMOKING",
  PHOTOS: "PHOTOS",
  COMPLETE: "COMPLETE",
  REGISTERED: "REGISTERED",
} as const;

type Step = (typeof STEPS)[keyof typeof STEPS];

// ─── Messages ─────────────────────────────────────────────────────────────────

const MSG = {
  WELCOME: (name?: string) =>
    name
      ? `👋 Welcome back, ${name}! Your profile is all set.\nOpen the app to start matching 💙`
      : `👋 Hi! I'm the bluedate bot.\nLet's set up your profile!\n\nWhat's your *first name*?`,
  PROFILE_DOB: (name: string) =>
    `Great name, ${name}! 🎉\n\nWhat's your *date of birth*?\nReply in DD/MM/YYYY format (e.g. 14/03/1998)`,
  GENDER: `Which *gender* best describes you?\n\nReply:\n• *Man*\n• *Woman*\n• *Non-binary*\n• Or type your own`,
  INVITE_CODE: (gender: string) => {
    const lower = gender.trim().toLowerCase();
    const isWoman = lower === "woman" || lower === "women";
    const isMan = lower === "man" || lower === "men";
    const opposite = isWoman ? "a *man*" : isMan ? "a *woman*" : "a *man* or *woman*";
    return `To continue, you need an invite code from ${opposite}.\n\nAsk them to message us *invite code* on WhatsApp. They'll get a code to share with you.\n\nReply with the *invite code* they give you:`;
  },
  DATING_MODE: `What are you looking for?\n\nReply:\n• *Date* — find a romantic partner\n• *BFF* — find a best friend`,
  WHO_TO_MEET_DATE: `Who would you like to meet?\n\nReply:\n• *Man*\n• *Woman*\n• *Everyone*`,
  WHO_TO_MEET_BFF: `Who would you like to meet?\n\nReply:\n• *Man*\n• *Woman*\n• *Everyone*`,
  RELATIONSHIP_GOALS: `What are you looking for in a relationship?\n\nReply:\n• *Casual* — something fun and light\n• *Long-term* — a serious relationship\n• *Marriage* — looking to settle down`,
  INTERESTS: `What are your *interests*? 🎯\n\nType up to 5, comma-separated:\n(e.g. Travel, Music, Cooking, Hiking, Movies)\n\nOr reply *skip* to continue`,
  HABITS_DRINKING: `Do you *drink*? 🍷\n\nReply:\n• *Yes*\n• *Sometimes*\n• *No*`,
  HABITS_SMOKING: `Do you *smoke*? 🚬\n\nReply:\n• *Yes*\n• *Sometimes*\n• *No*`,
  PHOTOS: `Almost done! 📸\n\nPlease send at least *2 profile photos*.\nWhen you're done, reply *done*.`,
  PHOTOS_MORE: (count: number) =>
    `Got it! ${count} photo${count !== 1 ? "s" : ""} received so far.\nSend more or reply *done* when finished.`,
  PHOTOS_NEED_MORE: (count: number) =>
    `You've sent ${count} photo${count !== 1 ? "s" : ""} so far. Please send at least *2* photos before replying done.`,
  COMPLETE: `🎉 You're all set!\n\nYour bluedate profile is ready. Open the app to start matching! 💙`,
  ERROR_NAME: `Please enter a valid first name (letters only, at least 2 characters).`,
  ERROR_DOB: `That doesn't look right. Please reply with your date of birth in *DD/MM/YYYY* format.`,
  ERROR_DOB_AGE: `You must be at least 18 years old to join bluedate.`,
  ERROR_GENDER: `Please reply with *Man*, *Woman*, *Non-binary* or type your own.`,
  ERROR_INVITE_CODE: `That code isn't valid or has already been used. Men need a code from a woman; women need a code from a man. Ask for a new code.`,
  ERROR_DATING_MODE: `Please reply *Date* or *BFF*.`,
  ERROR_WHO_TO_MEET: `Please reply *Man*, *Woman*, or *Everyone*.`,
  ERROR_RELATIONSHIP_GOALS: `Please reply *Casual*, *Long-term*, or *Marriage*.`,
  ERROR_DRINKING: `Please reply *Yes*, *Sometimes*, or *No*.`,
  ERROR_SMOKING: `Please reply *Yes*, *Sometimes*, or *No*.`,
  ERROR_NO_PHOTO: `Please send a photo image, or reply *done* when you have uploaded at least 2.`,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalise(text: string): string {
  return text.trim().toLowerCase();
}

/** Parse DD/MM/YYYY → YYYY-MM-DD, returns null on failure */
function parseDOB(raw: string): string | null {
  const match = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  if (month < 1 || month > 12) return null;
  const maxDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > maxDay) return null;
  if (year < 1920 || year > new Date().getFullYear()) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function computeAge(dateOfBirth: string): number {
  const d = new Date(dateOfBirth + "T00:00:00.000Z");
  const today = new Date();
  let age = today.getUTCFullYear() - d.getUTCFullYear();
  const m = today.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < d.getUTCDate())) age--;
  return age;
}

function mapGenderPreference(raw: string): string[] {
  const n = normalise(raw);
  if (n === "man" || n === "men") return ["Man"];
  if (n === "woman" || n === "women") return ["Woman"];
  if (n === "everyone" || n === "both" || n === "all") return ["Man", "Woman", "Non-binary"];
  return [raw.trim()];
}

// ─── Supabase photo upload ────────────────────────────────────────────────────

async function uploadBufferToSupabase(
  userId: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  // Strip parameters like "image/jpeg; name=photo.jpg" → "jpeg"
  const mimeBase = contentType.split(";")[0].trim();
  const ext = mimeBase.split("/")[1] ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const storage = createClient(config.supabase.url, config.supabase.anonKey).storage;
  const { error } = await storage
    .from(config.supabase.photoBucket)
    .upload(path, buffer, { contentType: mimeBase, upsert: false });
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);
  const { data } = storage.from(config.supabase.photoBucket).getPublicUrl(path);
  return data.publicUrl;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class WhatsAppBotService {
  constructor(
    private readonly sessionRepo: IWhatsAppSessionRepository,
    private readonly userRepo: IUserRepository,
    private readonly onboardingRepo: IOnboardingRepository,
    private readonly inviteCodeService: InviteCodeService,
  ) {}

  /**
   * Main entry point called from the webhook route.
   * @param from       Raw Twilio "From" field, e.g. "whatsapp:+919876543210"
   * @param body       Text content of the message
   * @param mediaUrl   First media URL if the message contains an image
   * @param mediaContentType  MIME type of the media
   * @returns          Plain text reply to send back via TwiML
   */
  async handleMessage(
    from: string,
    body: string,
    mediaUrl?: string,
    mediaContentType?: string,
  ): Promise<string> {
    const phone = from.replace(/^whatsapp:/, "");
    const text = body?.trim() ?? "";

    // Global intent: request invite code (any step)
    const inviteCodeRequest = normalise(text).replace(/\s+/g, " ");
    if (inviteCodeRequest === "invite code" || inviteCodeRequest === "invitecode") {
      try {
        return await this.inviteCodeService.requestCode(phone);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        log.error("Invite code request failed", { phone, message, stack });
        return "Something went wrong. Please try again in a moment.";
      }
    }

    // Load or initialise session
    let session = await this.sessionRepo.findByPhone(phone);
    const step: Step = (session?.step as Step) ?? STEPS.WELCOME;
    const tempData: Record<string, unknown> = session?.tempData ?? {};

    try {
      return await this.dispatch(phone, step, tempData, text, mediaUrl, mediaContentType);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      log.error("WhatsApp bot error", { phone, step, message, stack });
      return "Sorry, something went wrong. Please try again in a moment.";
    }
  }

  // ─── Dispatcher ─────────────────────────────────────────────────────────────

  private async dispatch(
    phone: string,
    step: Step,
    tempData: Record<string, unknown>,
    text: string,
    mediaUrl?: string,
    mediaContentType?: string,
  ): Promise<string> {
    switch (step) {
      case STEPS.WELCOME:
        return this.handleWelcome(phone, tempData);
      case STEPS.PROFILE_DOB:
        return this.handleProfileDob(phone, tempData, text);
      case STEPS.GENDER:
        return this.handleGender(phone, tempData, text);
      case STEPS.INVITE_CODE:
        return this.handleInviteCode(phone, tempData, text);
      case STEPS.DATING_MODE:
        return this.handleDatingMode(phone, tempData, text);
      case STEPS.WHO_TO_MEET:
        return this.handleWhoToMeet(phone, tempData, text);
      case STEPS.RELATIONSHIP_GOALS:
        return this.handleRelationshipGoals(phone, tempData, text);
      case STEPS.INTERESTS:
        return this.handleInterests(phone, tempData, text);
      case STEPS.HABITS_DRINKING:
        return this.handleHabitsDrinking(phone, tempData, text);
      case STEPS.HABITS_SMOKING:
        return this.handleHabitsSmoking(phone, tempData, text);
      case STEPS.PHOTOS:
        return this.handlePhotos(phone, tempData, text, mediaUrl, mediaContentType);
      case STEPS.COMPLETE:
      case STEPS.REGISTERED:
        return MSG.COMPLETE;
      default:
        // Unknown step — reset
        await this.sessionRepo.upsert(phone, STEPS.WELCOME, {});
        return MSG.WELCOME();
    }
  }

  // ─── Step handlers ───────────────────────────────────────────────────────────

  private async handleWelcome(phone: string, tempData: Record<string, unknown>): Promise<string> {
    const { user } = await this.userRepo.findOrCreate(phone);

    if (user.onboardingCompleted) {
      await this.sessionRepo.upsert(phone, STEPS.REGISTERED, { userId: user.id });
      const profile = await this.onboardingRepo.getOnboardingStatus(user.id);
      return MSG.WELCOME(profile.fullName ?? user.phone);
    }

    // Advance to name capture — reply asks for name
    await this.sessionRepo.upsert(phone, STEPS.PROFILE_DOB, { userId: user.id });
    return MSG.WELCOME();
  }

  private async handleProfileName(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<string> {
    const name = text.trim();
    if (!name || name.length < 2 || !/^[a-zA-Z\s'-]+$/.test(name)) {
      return MSG.ERROR_NAME;
    }
    await this.sessionRepo.upsert(phone, STEPS.PROFILE_DOB, { ...tempData, fullName: name });
    return MSG.PROFILE_DOB(name);
  }

  private async handleProfileDob(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<string> {
    // If no name captured yet (first real message after WELCOME prompt), capture name
    if (!tempData.fullName) {
      return this.handleProfileName(phone, tempData, text);
    }

    const dateOfBirth = parseDOB(text);
    if (!dateOfBirth) return MSG.ERROR_DOB;
    if (computeAge(dateOfBirth) < 18) return MSG.ERROR_DOB_AGE;

    const userId = tempData.userId as string;
    await this.onboardingRepo.upsertProfile(userId, {
      fullName: tempData.fullName as string,
      dateOfBirth,
    });

    await this.sessionRepo.upsert(phone, STEPS.GENDER, { ...tempData, dateOfBirth });
    return MSG.GENDER;
  }

  private async handleGender(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<string> {
    const value = text.trim();
    if (!value || value.length < 1) return MSG.ERROR_GENDER;

    const userId = tempData.userId as string;
    await this.onboardingRepo.upsertGenderIdentity(userId, { genderIdentity: value });

    await this.sessionRepo.upsert(phone, STEPS.INVITE_CODE, { ...tempData, genderIdentity: value });
    return MSG.INVITE_CODE(value);
  }

  private async handleInviteCode(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<string> {
    const code = text.trim();
    if (!code) return MSG.ERROR_INVITE_CODE;

    const userId = tempData.userId as string;
    const userGender = (tempData.genderIdentity as string) ?? "";
    try {
      await this.inviteCodeService.validateAndUseCode(code, userId, userGender);
    } catch {
      return MSG.ERROR_INVITE_CODE;
    }

    await this.sessionRepo.upsert(phone, STEPS.DATING_MODE, tempData);
    return MSG.DATING_MODE;
  }

  private async handleDatingMode(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<string> {
    const n = normalise(text);
    if (n !== "date" && n !== "bff") return MSG.ERROR_DATING_MODE;

    const datingMode = n as "date" | "bff";
    const userId = tempData.userId as string;
    await this.onboardingRepo.upsertDatingMode(userId, datingMode);
    await this.sessionRepo.upsert(phone, STEPS.WHO_TO_MEET, { ...tempData, datingMode });
    return datingMode === "bff" ? MSG.WHO_TO_MEET_BFF : MSG.WHO_TO_MEET_DATE;
  }

  private async handleWhoToMeet(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<string> {
    const n = normalise(text);
    const valid = ["man", "men", "woman", "women", "everyone", "both", "all"];
    if (!valid.includes(n)) return MSG.ERROR_WHO_TO_MEET;

    const genderPreference = mapGenderPreference(text);
    const userId = tempData.userId as string;
    const datingMode = tempData.datingMode as string;

    if (datingMode === "bff") {
      // Skip relationship goals — update who-to-meet only (relationshipIntent already "friendship" from dating-mode step)
      await this.onboardingRepo.upsertPreferences(userId, {
        genderIdentity: tempData.genderIdentity as string,
        genderPreference,
        ageRangeMin: 18,
        ageRangeMax: 60,
      });
      await this.sessionRepo.upsert(phone, STEPS.INTERESTS, { ...tempData, genderPreference });
      return MSG.INTERESTS;
    }

    // Date mode: save who-to-meet without overwriting relationshipIntent ("date")
    await this.onboardingRepo.upsertPreferences(userId, {
      genderIdentity: tempData.genderIdentity as string,
      genderPreference,
      ageRangeMin: 18,
      ageRangeMax: 60,
    });
    await this.sessionRepo.upsert(phone, STEPS.RELATIONSHIP_GOALS, {
      ...tempData,
      genderPreference,
    });
    return MSG.RELATIONSHIP_GOALS;
  }

  private async handleRelationshipGoals(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<string> {
    const n = normalise(text);
    const map: Record<string, string> = {
      casual: "Fun, casual dates",
      "long-term": "A long-term relationship",
      "long term": "A long-term relationship",
      marriage: "Marriage",
    };
    const intent = map[n];
    if (!intent) return MSG.ERROR_RELATIONSHIP_GOALS;

    const userId = tempData.userId as string;
    await this.onboardingRepo.upsertPreferences(userId, {
      genderIdentity: tempData.genderIdentity as string,
      genderPreference: tempData.genderPreference as string[],
      ageRangeMin: 18,
      ageRangeMax: 60,
      relationshipIntent: intent,
      relationshipGoals: [intent],
    });

    await this.sessionRepo.upsert(phone, STEPS.INTERESTS, { ...tempData, relationshipIntent: intent });
    return MSG.INTERESTS;
  }

  private async handleInterests(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<string> {
    const userId = tempData.userId as string;
    const hobbies =
      normalise(text) === "skip"
        ? ["Not specified"]
        : [...new Set(text.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 5);

    if (hobbies.length === 0) hobbies.push("Not specified");

    await this.onboardingRepo.upsertInterests(userId, {
      hobbies,
      favouriteActivities: [],
      musicTaste: [],
      foodTaste: [],
    });

    await this.sessionRepo.upsert(phone, STEPS.HABITS_DRINKING, { ...tempData, hobbies });
    return MSG.HABITS_DRINKING;
  }

  private async handleHabitsDrinking(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<string> {
    const n = normalise(text);
    if (!["yes", "sometimes", "no"].includes(n)) return MSG.ERROR_DRINKING;

    const drinkMap: Record<string, string> = { yes: "Yes, I drink", sometimes: "Sometimes", no: "Non-drinker" };
    const drinking = drinkMap[n];

    await this.sessionRepo.upsert(phone, STEPS.HABITS_SMOKING, { ...tempData, drinking });
    return MSG.HABITS_SMOKING;
  }

  private async handleHabitsSmoking(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<string> {
    const n = normalise(text);
    if (!["yes", "sometimes", "no"].includes(n)) return MSG.ERROR_SMOKING;

    const smokeMap: Record<string, string> = { yes: "Yes, I smoke", sometimes: "Sometimes", no: "Non-smoker" };
    const smoking = smokeMap[n];
    const drinking = tempData.drinking as string;
    const userId = tempData.userId as string;

    await this.onboardingRepo.upsertPersonality(userId, {
      socialLevel: drinking,
      conversationStyle: smoking,
    });
    await this.onboardingRepo.upsertAvailability(userId, {
      days: ["fri", "sat", "sun"],
      times: ["evening"],
    });

    await this.sessionRepo.upsert(phone, STEPS.PHOTOS, { ...tempData, smoking, photoCount: 0 });
    return MSG.PHOTOS;
  }

  private async handlePhotos(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
    mediaUrl?: string,
    mediaContentType?: string,
  ): Promise<string> {
    const userId = tempData.userId as string;
    let photoCount = (tempData.photoCount as number) ?? 0;

    if (mediaUrl) {
      // Download from Twilio (requires Basic Auth)
      const creds = Buffer.from(
        `${config.twilio.accountSid}:${config.twilio.authToken}`,
      ).toString("base64");

      const res = await fetch(mediaUrl, {
        headers: { Authorization: `Basic ${creds}` },
      });

      if (!res.ok) {
        log.error("Failed to download WhatsApp media", { mediaUrl, status: res.status });
        return "Sorry, I couldn't download your photo. Please try sending it again.";
      }

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = mediaContentType ?? "image/jpeg";

      try {
        const url = await uploadBufferToSupabase(userId, buffer, contentType);
        await this.onboardingRepo.addPhoto(userId, url, photoCount);
        photoCount += 1;
        await this.sessionRepo.upsert(phone, STEPS.PHOTOS, { ...tempData, photoCount });
        return MSG.PHOTOS_MORE(photoCount);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log.error("Photo upload failed", { userId, message });
        return "Sorry, photo upload failed. Please try again.";
      }
    }

    if (normalise(text) === "done") {
      if (photoCount < 2) return MSG.PHOTOS_NEED_MORE(photoCount);

      await this.userRepo.completeOnboarding(userId);
      await this.sessionRepo.upsert(phone, STEPS.COMPLETE, tempData);
      return MSG.COMPLETE;
    }

    return MSG.ERROR_NO_PHOTO;
  }
}
