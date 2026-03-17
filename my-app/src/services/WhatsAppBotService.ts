// ─── WhatsAppBotService ────────────────────────────────────────────────────────
// Drives the WhatsApp onboarding conversation state machine.
// No JWT / OTP — trust is established via WhatsApp-verified phone number.

import { createClient } from "@supabase/supabase-js";
import { config } from "@/config";
import type { IWhatsAppSessionRepository } from "@/repositories/WhatsAppSessionRepository";
import type { IUserRepository } from "@/repositories/UserRepository";
import type { IOnboardingRepository } from "@/repositories/OnboardingRepository";
import type { InviteCodeService } from "@/services/InviteCodeService";
import type { WaMessage } from "@/services/WaInteractiveService";
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

// ─── Message builders ─────────────────────────────────────────────────────────
// Each returns a WaMessage (text, buttons, or list).

function txt(body: string): WaMessage {
  return { type: "text", body };
}

function btns(body: string, buttons: string[]): WaMessage {
  return { type: "buttons", body, buttons };
}

function list(body: string, items: string[], buttonLabel?: string): WaMessage {
  return { type: "list", body, items, buttonLabel };
}

const DIVIDER = "─────────────────";

const MSG = {
  ASK_NAME: txt(
    [
      `💙 *bluedate*`,
      ``,
      `Hi there! 👋 I'm here to help you set up your dating profile.`,
      ``,
      `Let's start — what's your *first name*?`,
    ].join("\n"),
  ),

  PROFILE_DOB: (name: string) =>
    txt(
      [
        `Great name, *${name}!* 🎉`,
        ``,
        `What's your *date of birth*?`,
        `Reply in *DD/MM/YYYY* format`,
        `_e.g. 14/03/1998_`,
        ``,
        `_Reply *0* to go back_`,
      ].join("\n"),
    ),

  GENDER: btns(
    [`💙 *Which best describes you?*`, ``, `_Type your own if not listed_`].join("\n"),
    ["Woman", "Man", "Non-binary"],
  ),

  INVITE_CODE: (gender: string): WaMessage => {
    const lower = gender.trim().toLowerCase();
    const isWoman = lower === "woman";
    const isMan = lower === "man";
    const from = isWoman ? "a *man*" : isMan ? "a *woman*" : "a *man* or *woman*";
    return txt(
      [
        `🔑 *Invite Code Required*`,
        DIVIDER,
        `To join bluedate, you need an invite code from ${from}.`,
        ``,
        `Ask them to send *invite code* on WhatsApp — they'll get a code to share with you.`,
        ``,
        `Enter your invite code:`,
        `_Reply *0* to go back_`,
      ].join("\n"),
    );
  },

  DATING_MODE: btns(
    [`💙 *What brings you here?*`, ``, `_Reply *0* to go back_`].join("\n"),
    ["Date", "BFF"],
  ),

  WHO_TO_MEET: btns(
    [`💙 *Who would you like to meet?*`, ``, `_Reply *0* to go back_`].join("\n"),
    ["Men", "Women", "Everyone"],
  ),

  RELATIONSHIP_GOALS: list(
    [`💙 *What are you looking for?*`, ``, `_Reply *0* to go back_`].join("\n"),
    ["Casual", "Long-term", "Marriage", "Open relationship"],
    "Choose a goal",
  ),

  INTERESTS: txt(
    [
      `💙 *Your Interests* 🎯`,
      DIVIDER,
      `Type up to 5 interests, separated by commas:`,
      `_e.g. Travel, Music, Gaming, Cooking, Hiking_`,
      ``,
      `Or reply *skip* to continue`,
      `_Reply *0* to go back_`,
    ].join("\n"),
  ),

  HABITS_DRINKING: list(
    [`💙 *Do you drink?*`, ``, `_Reply *0* to go back_`].join("\n"),
    ["Yes", "Sometimes", "Rarely", "No", "Sober"],
    "Choose one",
  ),

  HABITS_SMOKING: btns(
    [`💙 *Do you smoke?*`, ``, `_Reply *0* to go back_`].join("\n"),
    ["Yes", "Sometimes", "No"],
  ),

  PHOTOS: txt(
    [
      `📸 *Profile Photos*`,
      DIVIDER,
      `Almost done! Please send at least *2 photos* of yourself.`,
      `You can send them one by one.`,
      ``,
      `When you're finished, reply *done*`,
      `_Reply *0* to go back_`,
    ].join("\n"),
  ),

  PHOTOS_MORE: (count: number) =>
    txt(
      [
        `✅ *${count} photo${count !== 1 ? "s" : ""} received!*`,
        ``,
        `Send more, or reply *done* when finished.`,
      ].join("\n"),
    ),

  PHOTOS_NEED_MORE: (count: number) =>
    txt(
      [
        `You've sent *${count} photo${count !== 1 ? "s" : ""}* so far.`,
        `Please send at least *2* before replying done.`,
      ].join("\n"),
    ),

  WELCOME_BACK: (name: string) =>
    txt(
      [
        `👋 Welcome back, *${name}!*`,
        ``,
        `Your bluedate profile is all set.`,
        `Open the app to start matching 💙`,
      ].join("\n"),
    ),

  COMPLETE: txt(
    [
      `🎉 *You're all set!*`,
      DIVIDER,
      `Your bluedate profile is ready.`,
      `Open the app to start matching! 💙`,
    ].join("\n"),
  ),

  // ── Errors ────────────────────────────────────────────────────────────────

  ERROR_NAME: txt(`Please enter a valid first name _(letters only, at least 2 characters)_.`),
  ERROR_DOB: txt(
    [
      `That doesn't look right. Please reply with your date of birth in *DD/MM/YYYY* format.`,
      `_e.g. 14/03/1998_`,
    ].join("\n"),
  ),
  ERROR_DOB_AGE: txt(`You must be at least *18 years old* to join bluedate.`),
  ERROR_GENDER: txt(`Please reply *Woman*, *Man*, *Non-binary*, or type your own identity.`),
  ERROR_INVITE_CODE: txt(
    [
      `❌ That code isn't valid or has already been used.`,
      ``,
      `Ask for a new code and try again, or reply *0* to go back.`,
    ].join("\n"),
  ),
  ERROR_DATING_MODE: txt(`Please choose *Date* or *BFF*.`),
  ERROR_WHO_TO_MEET: txt(`Please choose *Men*, *Women*, or *Everyone*.`),
  ERROR_RELATIONSHIP_GOALS: txt(`Please choose one of the options above.`),
  ERROR_DRINKING: txt(`Please choose one of the options above.`),
  ERROR_SMOKING: txt(`Please choose *Yes*, *Sometimes*, or *No*.`),
  ERROR_NO_PHOTO: txt(`Please send a photo 📸, or reply *done* when you have at least 2.`),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalise(text: string): string {
  return text.trim().toLowerCase();
}

function isBack(text: string): boolean {
  const n = normalise(text);
  return n === "0" || n === "back";
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

/** Parse gender — accepts numbers, button tap labels, and free text */
function parseGenderChoice(text: string): string | null {
  const n = normalise(text);
  if (n === "1" || n === "woman") return "Woman";
  if (n === "2" || n === "man") return "Man";
  if (n === "3" || n === "non-binary" || n === "nonbinary") return "Non-binary";
  if (n === "4") return null; // user will type on next message
  if (text.trim().length >= 2) return text.trim();
  return null;
}

function mapGenderPreference(choice: string): string[] {
  const n = normalise(choice);
  if (n === "1" || n === "man" || n === "men") return ["Man"];
  if (n === "2" || n === "woman" || n === "women") return ["Woman"];
  return ["Man", "Woman", "Non-binary"];
}

// ─── Supabase photo upload ────────────────────────────────────────────────────

async function uploadBufferToSupabase(
  userId: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (!config.supabase.url || !config.supabase.anonKey) {
    throw new Error("Supabase URL or key not configured");
  }
  const mimeBase = contentType.split(";")[0].trim();
  const ext = mimeBase.split("/")[1] ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const supabase = createClient(config.supabase.url, config.supabase.anonKey);
  const { data: uploadData, error } = await supabase.storage
    .from(config.supabase.photoBucket)
    .upload(path, buffer, { contentType: mimeBase, upsert: true });
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);
  if (!uploadData?.path) throw new Error("Supabase upload returned no path — check bucket name and permissions");
  const { data } = supabase.storage.from(config.supabase.photoBucket).getPublicUrl(path);
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

  async handleMessage(
    from: string,
    body: string,
    mediaUrl?: string,
    mediaContentType?: string,
  ): Promise<WaMessage> {
    const phone = from.replace(/^whatsapp:/, "");
    const text = body?.trim() ?? "";

    // Global: reset session (dev/testing)
    const normalised = normalise(text).replace(/\s+/g, " ");
    if (normalised === "reset" || normalised === "/reset") {
      await this.sessionRepo.delete(phone);
      return txt("Session reset. Send any message to start over.");
    }

    // Global: request invite code (any step)
    if (normalised === "invite code" || normalised === "invitecode") {
      try {
        const msg = await this.inviteCodeService.requestCode(phone);
        return txt(msg);
      } catch (err) {
        log.error("Invite code request failed", { phone, err });
        return txt("Something went wrong. Please try again in a moment.");
      }
    }

    const session = await this.sessionRepo.findByPhone(phone);
    const step: Step = (session?.step as Step) ?? STEPS.WELCOME;
    const tempData: Record<string, unknown> = session?.tempData ?? {};

    try {
      return await this.dispatch(phone, step, tempData, text, mediaUrl, mediaContentType);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      log.error("WhatsApp bot error", { phone, step, err: errMsg });
      return txt(`Sorry, something went wrong (${errMsg}). Please try again.`);
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
  ): Promise<WaMessage> {
    // Global back command (except from terminal states)
    const terminal: Step[] = [STEPS.WELCOME, STEPS.COMPLETE, STEPS.REGISTERED];
    if (isBack(text) && !terminal.includes(step)) {
      return this.handleBack(phone, step, tempData);
    }

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
      case STEPS.REGISTERED: {
        // Re-check DB — user might have been deleted or reset
        const userId = tempData.userId as string | undefined;
        if (userId) {
          const user = await this.userRepo.findById(userId);
          if (!user || !user.onboardingCompleted) {
            // User deleted or incomplete — restart
            await this.sessionRepo.delete(phone);
            return this.handleWelcome(phone, {});
          }
        }
        const name = (tempData.fullName as string | undefined) ?? "";
        return MSG.WELCOME_BACK(name || phone);
      }
      default:
        await this.sessionRepo.upsert(phone, STEPS.WELCOME, {});
        return MSG.ASK_NAME;
    }
  }

  // ─── Back navigation ────────────────────────────────────────────────────────

  private async handleBack(
    phone: string,
    currentStep: Step,
    tempData: Record<string, unknown>,
  ): Promise<WaMessage> {
    const isWoman = normalise((tempData.genderIdentity as string) ?? "") === "woman";
    const datingMode = tempData.datingMode as string | undefined;

    type BackEntry = { step: Step; prompt: WaMessage; clearKeys?: string[] };

    const map: Partial<Record<Step, BackEntry>> = {
      [STEPS.PROFILE_DOB]: tempData.fullName
        ? { step: STEPS.PROFILE_DOB, prompt: MSG.ASK_NAME, clearKeys: ["fullName"] }
        : { step: STEPS.WELCOME, prompt: MSG.ASK_NAME },

      [STEPS.GENDER]: {
        step: STEPS.PROFILE_DOB,
        prompt: MSG.PROFILE_DOB(tempData.fullName as string),
      },

      [STEPS.INVITE_CODE]: {
        step: STEPS.GENDER,
        prompt: MSG.GENDER,
      },

      [STEPS.DATING_MODE]: isWoman
        ? { step: STEPS.GENDER, prompt: MSG.GENDER }
        : { step: STEPS.INVITE_CODE, prompt: MSG.INVITE_CODE(tempData.genderIdentity as string) },

      [STEPS.WHO_TO_MEET]: { step: STEPS.DATING_MODE, prompt: MSG.DATING_MODE },

      [STEPS.RELATIONSHIP_GOALS]: { step: STEPS.WHO_TO_MEET, prompt: MSG.WHO_TO_MEET },

      [STEPS.INTERESTS]: datingMode === "bff"
        ? { step: STEPS.WHO_TO_MEET, prompt: MSG.WHO_TO_MEET }
        : { step: STEPS.RELATIONSHIP_GOALS, prompt: MSG.RELATIONSHIP_GOALS },

      [STEPS.HABITS_DRINKING]: { step: STEPS.INTERESTS, prompt: MSG.INTERESTS },

      [STEPS.HABITS_SMOKING]: { step: STEPS.HABITS_DRINKING, prompt: MSG.HABITS_DRINKING },

      [STEPS.PHOTOS]: { step: STEPS.HABITS_SMOKING, prompt: MSG.HABITS_SMOKING },
    };

    const entry = map[currentStep];
    if (!entry) return MSG.ASK_NAME;

    const newData = { ...tempData };
    for (const k of entry.clearKeys ?? []) delete newData[k];

    await this.sessionRepo.upsert(phone, entry.step, newData);
    return entry.prompt;
  }

  // ─── Step handlers ───────────────────────────────────────────────────────────

  private async handleWelcome(phone: string, tempData: Record<string, unknown>): Promise<WaMessage> {
    const { user } = await this.userRepo.findOrCreate(phone);

    if (user.onboardingCompleted) {
      await this.sessionRepo.upsert(phone, STEPS.REGISTERED, { userId: user.id });
      const status = await this.onboardingRepo.getOnboardingStatus(user.id);
      return MSG.WELCOME_BACK(status.fullName ?? phone);
    }

    await this.sessionRepo.upsert(phone, STEPS.PROFILE_DOB, { userId: user.id });
    return MSG.ASK_NAME;
  }

  private async handleProfileDob(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<WaMessage> {
    // First sub-step: capture name
    if (!tempData.fullName) {
      const name = text.trim();
      if (!name || name.length < 2 || !/^[a-zA-Z\s'-]+$/.test(name)) {
        return MSG.ERROR_NAME;
      }
      await this.sessionRepo.upsert(phone, STEPS.PROFILE_DOB, { ...tempData, fullName: name });
      return MSG.PROFILE_DOB(name);
    }

    // Second sub-step: capture DOB
    const dateOfBirth = parseDOB(text);
    if (!dateOfBirth) return MSG.ERROR_DOB;
    if (computeAge(dateOfBirth) < 18) return MSG.ERROR_DOB_AGE;

    const userId = tempData.userId as string;
    await this.onboardingRepo.upsertProfile(userId, {
      fullName: tempData.fullName as string,
      dateOfBirth,
    });
    log.info("Profile saved", { userId, fullName: tempData.fullName, dateOfBirth });

    await this.sessionRepo.upsert(phone, STEPS.GENDER, { ...tempData, dateOfBirth });
    return MSG.GENDER;
  }

  private async handleGender(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<WaMessage> {
    const value = parseGenderChoice(text);
    if (!value) return MSG.ERROR_GENDER;

    const userId = tempData.userId as string;
    await this.onboardingRepo.upsertGenderIdentity(userId, { genderIdentity: value });
    log.info("Gender saved", { userId, genderIdentity: value });

    const isWoman = normalise(value) === "woman";
    if (isWoman) {
      await this.sessionRepo.upsert(phone, STEPS.DATING_MODE, {
        ...tempData,
        genderIdentity: value,
      });
      return MSG.DATING_MODE;
    }

    await this.sessionRepo.upsert(phone, STEPS.INVITE_CODE, {
      ...tempData,
      genderIdentity: value,
    });
    return MSG.INVITE_CODE(value);
  }

  private async handleInviteCode(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<WaMessage> {
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
  ): Promise<WaMessage> {
    const n = normalise(text);
    const modeMap: Record<string, "date" | "bff"> = {
      "1": "date", date: "date",
      "2": "bff", bff: "bff",
    };
    const datingMode = modeMap[n];
    if (!datingMode) return MSG.ERROR_DATING_MODE;

    const userId = tempData.userId as string;
    await this.onboardingRepo.upsertDatingMode(userId, datingMode);
    await this.sessionRepo.upsert(phone, STEPS.WHO_TO_MEET, { ...tempData, datingMode });
    return MSG.WHO_TO_MEET;
  }

  private async handleWhoToMeet(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<WaMessage> {
    const n = normalise(text);
    const valid = ["1", "2", "3", "man", "men", "woman", "women", "everyone", "both", "all"];
    if (!valid.includes(n)) return MSG.ERROR_WHO_TO_MEET;

    const genderPreference = mapGenderPreference(text);
    const userId = tempData.userId as string;
    const datingMode = tempData.datingMode as string;

    await this.onboardingRepo.upsertPreferences(userId, {
      genderIdentity: tempData.genderIdentity as string,
      genderPreference,
      ageRangeMin: 18,
      ageRangeMax: 60,
    });

    if (datingMode === "bff") {
      await this.sessionRepo.upsert(phone, STEPS.INTERESTS, { ...tempData, genderPreference });
      return MSG.INTERESTS;
    }

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
  ): Promise<WaMessage> {
    const intentMap: Record<string, string> = {
      "1": "Fun, casual dates",
      "2": "A long-term relationship",
      "3": "Marriage",
      "4": "Ethical non-monogamy",
      // button tap labels
      casual: "Fun, casual dates",
      "long-term": "A long-term relationship",
      "long term": "A long-term relationship",
      marriage: "Marriage",
      "open relationship": "Ethical non-monogamy",
      open: "Ethical non-monogamy",
    };
    const intent = intentMap[normalise(text)];
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

    await this.sessionRepo.upsert(phone, STEPS.INTERESTS, {
      ...tempData,
      relationshipIntent: intent,
    });
    return MSG.INTERESTS;
  }

  private async handleInterests(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<WaMessage> {
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
  ): Promise<WaMessage> {
    const drinkMap: Record<string, string> = {
      "1": "Yes, I drink",
      "2": "I drink sometimes",
      "3": "I rarely drink",
      "4": "No, I don't drink",
      "5": "I'm sober",
      // button/list tap labels
      yes: "Yes, I drink",
      sometimes: "I drink sometimes",
      rarely: "I rarely drink",
      no: "No, I don't drink",
      sober: "I'm sober",
    };
    const drinking = drinkMap[normalise(text)];
    if (!drinking) return MSG.ERROR_DRINKING;

    await this.sessionRepo.upsert(phone, STEPS.HABITS_SMOKING, { ...tempData, drinking });
    return MSG.HABITS_SMOKING;
  }

  private async handleHabitsSmoking(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<WaMessage> {
    const smokeMap: Record<string, string> = {
      "1": "Yes, I smoke",
      "2": "I smoke sometimes",
      "3": "No, I don't smoke",
      // button tap labels
      yes: "Yes, I smoke",
      sometimes: "I smoke sometimes",
      no: "No, I don't smoke",
    };
    const smoking = smokeMap[normalise(text)];
    if (!smoking) return MSG.ERROR_SMOKING;

    const userId = tempData.userId as string;
    await this.onboardingRepo.upsertPersonality(userId, {
      socialLevel: tempData.drinking as string,
      conversationStyle: smoking,
    });
    await this.onboardingRepo.upsertAvailability(userId, {
      days: ["fri", "sat", "sun"],
      times: ["evening"],
    });
    log.info("Personality & availability saved", { userId, drinking: tempData.drinking, smoking });

    await this.sessionRepo.upsert(phone, STEPS.PHOTOS, { ...tempData, smoking, photoCount: 0 });
    return MSG.PHOTOS;
  }

  private async handlePhotos(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
    mediaUrl?: string,
    mediaContentType?: string,
  ): Promise<WaMessage> {
    const userId = tempData.userId as string;
    let photoCount = (tempData.photoCount as number) ?? 0;

    if (mediaUrl) {
      const creds = Buffer.from(
        `${config.twilio.accountSid}:${config.twilio.authToken}`,
      ).toString("base64");

      const res = await fetch(mediaUrl, {
        headers: { Authorization: `Basic ${creds}` },
      });

      if (!res.ok) {
        log.error("Failed to download WhatsApp media", { mediaUrl, status: res.status });
        return txt("Sorry, I couldn't download your photo. Please try sending it again.");
      }

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = mediaContentType ?? "image/jpeg";

      try {
        const url = await uploadBufferToSupabase(userId, buffer, contentType);
        await this.onboardingRepo.addPhoto(userId, url, photoCount);
        photoCount += 1;
        await this.sessionRepo.upsert(phone, STEPS.PHOTOS, { ...tempData, photoCount });
        log.info("Photo uploaded", { userId, photoCount, url });
        return MSG.PHOTOS_MORE(photoCount);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        log.error("Photo upload failed", { userId, err: errMsg });
        return txt(`Sorry, photo upload failed: ${errMsg}. Please try again.`);
      }
    }

    if (normalise(text) === "done") {
      if (photoCount < 2) return MSG.PHOTOS_NEED_MORE(photoCount);
      await this.userRepo.completeOnboarding(userId);
      await this.sessionRepo.upsert(phone, STEPS.COMPLETE, tempData);
      log.info("Onboarding complete", { userId });
      return MSG.COMPLETE;
    }

    return MSG.ERROR_NO_PHOTO;
  }
}
