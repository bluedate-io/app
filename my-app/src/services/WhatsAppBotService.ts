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
  CHANNEL_CHOICE: "CHANNEL_CHOICE",
  PROFILE_DOB: "PROFILE_DOB",
  GENDER: "GENDER",
  INVITE_CODE: "INVITE_CODE",
  DATING_MODE: "DATING_MODE",
  WHO_TO_MEET: "WHO_TO_MEET",
  AGE_RANGE: "AGE_RANGE",
  RELATIONSHIP_GOALS: "RELATIONSHIP_GOALS",
  HEIGHT: "HEIGHT",
  INTERESTS: "INTERESTS",
  HABITS_DRINKING: "HABITS_DRINKING",
  HABITS_SMOKING: "HABITS_SMOKING",
  RELIGION: "RELIGION",
  KIDS: "KIDS",
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

const BACK_HINT = `_Type *0* to go back_`;

const MSG = {
  // ── Onboarding prompts ────────────────────────────────────────────────────

  CHANNEL_CHOICE: btns(
    [
      `💙 *Welcome to bluedate!*`,
      ``,
      `Where would you like to set up your profile?`,
      ``,
      `• *WhatsApp* — continue right here in this chat`,
      `• *Web App* — get a link to set up on the app`,
    ].join("\n"),
    ["WhatsApp", "Web App"],
  ),

  WEB_APP_LINK: (url: string) =>
    txt(
      [
        `🔗 *Here's your link to set up on bluedate:*`,
        ``,
        url,
        ``,
        `Open the link on your phone to get started.`,
        ``,
        `_Changed your mind? Reply *WhatsApp* to continue here instead._`,
      ].join("\n"),
    ),

  ASK_NAME: txt(
    [
      `💙 *Let's set up your profile!*`,
      ``,
      `I'll guide you through a few quick steps.`,
      ``,
      `First — what's your *first name*?`,
    ].join("\n"),
  ),

  PROFILE_DOB: (name: string) =>
    txt(
      [
        `Nice to meet you, *${name}!* 👋`,
        ``,
        `What is your *date of birth?*`,
        ``,
        `Format: *DD/MM/YYYY*`,
        `Example: _14/03/1998_`,
        ``,
        BACK_HINT,
      ].join("\n"),
    ),

  GENDER: btns(
    [
      `💙 *How do you identify?*`,
      ``,
      `Tap a button below, or type your own gender identity.`,
    ].join("\n"),
    ["Woman", "Man", "Non-binary"],
  ),

  INVITE_CODE: (gender: string): WaMessage => {
    const lower = gender.trim().toLowerCase();
    const isMan = lower === "man";
    const from = isMan ? "a *woman* already on bluedate" : "a *woman* or *man* already on bluedate";
    return txt(
      [
        `🔑 *Invite Code Required*`,
        ``,
        `bluedate is invite-only — you need a code from ${from}.`,
        ``,
        `*How to get a code:*`,
        `Ask someone on bluedate to send *invite code* on WhatsApp — they'll receive a unique code to share with you.`,
        ``,
        `Enter your invite code below:`,
        BACK_HINT,
      ].join("\n"),
    );
  },

  DATING_MODE: btns(
    [
      `💙 *What are you here for?*`,
      ``,
      `Choose the option that best describes you.`,
      BACK_HINT,
    ].join("\n"),
    ["Dating", "Friendship"],
  ),

  WHO_TO_MEET: btns(
    [
      `💙 *Who would you like to meet?*`,
      ``,
      `We'll show you people who match your preference.`,
      BACK_HINT,
    ].join("\n"),
    ["Men", "Women", "Everyone"],
  ),

  RELATIONSHIP_GOALS: list(
    [
      `💙 *What kind of relationship are you looking for?*`,
      ``,
      `Choose the option that fits you best.`,
      BACK_HINT,
    ].join("\n"),
    ["Casual dates", "Long-term", "Marriage", "Open relationship"],
    "Select a goal",
  ),

  AGE_RANGE: txt(
    [
      `📅 *Age Preference*`,
      ``,
      `What age range would you like to match with?`,
      ``,
      `Reply in *MIN-MAX* format:`,
      `_e.g. 22-35_`,
      ``,
      `Or reply *skip* to use the default (18–60).`,
      BACK_HINT,
    ].join("\n"),
  ),

  HEIGHT: txt(
    [
      `📏 *Your Height*`,
      ``,
      `What is your height in centimetres?`,
      ``,
      `_e.g. 175_`,
      ``,
      `Or reply *skip* to leave this blank.`,
      BACK_HINT,
    ].join("\n"),
  ),

  RELIGION: list(
    [
      `🙏 *Religion / Beliefs*`,
      ``,
      `Which best describes your beliefs?`,
      BACK_HINT,
    ].join("\n"),
    ["Agnostic", "Atheist", "Christian", "Muslim", "Hindu", "Buddhist", "Sikh", "Jewish", "Spiritual", "Other"],
    "Select one",
  ),

  KIDS_HAVE: btns(
    [
      `👶 *Do you have children?*`,
      BACK_HINT,
    ].join("\n"),
    ["Have kids", "No kids"],
  ),

  KIDS_PLANS: list(
    [
      `👶 *Do you want children in the future?*`,
      BACK_HINT,
    ].join("\n"),
    ["Don't want kids", "Open to kids", "Want kids", "Not sure"],
    "Select one",
  ),

  INTERESTS: txt(
    [
      `🎯 *Your Interests*`,
      ``,
      `Tell us what you enjoy — this helps us find better matches for you.`,
      ``,
      `Type up to *5 interests*, separated by commas:`,
      `_e.g. Travel, Music, Yoga, Movies, Cooking_`,
      ``,
      `Or reply *skip* to move on.`,
      BACK_HINT,
    ].join("\n"),
  ),

  HABITS_DRINKING: list(
    [
      `🍹 *Do you drink alcohol?*`,
      ``,
      `Select the option that best describes you.`,
      BACK_HINT,
    ].join("\n"),
    ["Yes", "Sometimes", "Rarely", "No", "I'm sober"],
    "Select one",
  ),

  HABITS_SMOKING: btns(
    [
      `🚬 *Do you smoke?*`,
      ``,
      `Select the option that best describes you.`,
      BACK_HINT,
    ].join("\n"),
    ["Yes", "Sometimes", "No"],
  ),

  PHOTOS: txt(
    [
      `📸 *Profile Photos*`,
      ``,
      `Almost there! Add at least *2 photos* of yourself to complete your profile.`,
      ``,
      `*Tips for great photos:*`,
      `• Use a clear, recent photo of your face`,
      `• Natural lighting looks best`,
      `• Avoid group photos or sunglasses`,
      ``,
      `Send your photos one at a time. When you're done, reply *done*.`,
      BACK_HINT,
    ].join("\n"),
  ),

  PHOTOS_MORE: (count: number) =>
    txt(
      [
        `✅ *${count} photo${count !== 1 ? "s" : ""} added!*`,
        ``,
        count >= 2
          ? `You can add more, or reply *done* to finish.`
          : `Please send at least ${2 - count} more photo${2 - count !== 1 ? "s" : ""}.`,
      ].join("\n"),
    ),

  PHOTOS_NEED_MORE: (count: number) =>
    txt(
      [
        `You've added *${count} photo${count !== 1 ? "s" : ""}* so far.`,
        ``,
        `Please send at least *${2 - count} more photo${2 - count !== 1 ? "s" : ""}* before finishing.`,
      ].join("\n"),
    ),

  WELCOME_BACK: (name: string) =>
    txt(
      [
        `👋 *Welcome back, ${name}!*`,
        ``,
        `Your bluedate profile is all set.`,
        `Open the app to start matching. 💙`,
      ].join("\n"),
    ),

  COMPLETE: (name: string) =>
    txt(
      [
        `🎉 *You're all set, ${name}!*`,
        ``,
        `Your bluedate profile is live.`,
        `Open the app to start matching. 💙`,
      ].join("\n"),
    ),

  // ── Errors ────────────────────────────────────────────────────────────────

  ERROR_NAME: txt(
    [
      `That doesn't look like a valid name.`,
      ``,
      `Please enter your *first name* using letters only (at least 2 characters).`,
    ].join("\n"),
  ),

  ERROR_DOB: txt(
    [
      `I couldn't read that date. Please use *DD/MM/YYYY* format.`,
      ``,
      `Example: _14/03/1998_`,
    ].join("\n"),
  ),

  ERROR_DOB_AGE: txt(
    `Sorry, you must be at least *18 years old* to join bluedate.`,
  ),

  ERROR_GENDER: txt(
    `Please tap one of the buttons, or type your own gender identity.`,
  ),

  ERROR_INVITE_CODE: txt(
    [
      `❌ *Invalid or already used code.*`,
      ``,
      `Please ask for a new invite code and try again.`,
      BACK_HINT,
    ].join("\n"),
  ),

  ERROR_DATING_MODE: txt(
    `Please tap *Dating* or *Friendship* to continue.`,
  ),

  ERROR_WHO_TO_MEET: txt(
    `Please tap *Men*, *Women*, or *Everyone* to continue.`,
  ),

  ERROR_RELATIONSHIP_GOALS: txt(
    `Please tap one of the options in the list to continue.`,
  ),

  ERROR_DRINKING: txt(
    `Please tap one of the options in the list to continue.`,
  ),

  ERROR_SMOKING: txt(
    `Please tap *Yes*, *Sometimes*, or *No* to continue.`,
  ),

  ERROR_AGE_RANGE: txt(
    [
      `I couldn't read that. Please reply with an age range like *22-35*.`,
      `Or reply *skip* to use the default (18–60).`,
    ].join("\n"),
  ),

  ERROR_HEIGHT: txt(
    [
      `Please enter your height as a number in centimetres, e.g. *175*.`,
      `Or reply *skip* to leave this blank.`,
    ].join("\n"),
  ),

  ERROR_RELIGION: txt(
    `Please tap one of the options in the list to continue.`,
  ),

  ERROR_KIDS_HAVE: txt(
    `Please tap *Have kids* or *No kids* to continue.`,
  ),

  ERROR_KIDS_PLANS: txt(
    `Please tap one of the options in the list to continue.`,
  ),

  ERROR_NO_PHOTO: txt(
    `Please *send a photo* 📸, or reply *done* once you've added at least 2.`,
  ),
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
    const terminal: Step[] = [STEPS.WELCOME, STEPS.CHANNEL_CHOICE, STEPS.COMPLETE, STEPS.REGISTERED];
    if (isBack(text) && !terminal.includes(step)) {
      return this.handleBack(phone, step, tempData);
    }

    switch (step) {
      case STEPS.WELCOME:
        return this.handleWelcome(phone, tempData);
      case STEPS.CHANNEL_CHOICE:
        return this.handleChannelChoice(phone, tempData, text);
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
      case STEPS.AGE_RANGE:
        return this.handleAgeRange(phone, tempData, text);
      case STEPS.RELATIONSHIP_GOALS:
        return this.handleRelationshipGoals(phone, tempData, text);
      case STEPS.HEIGHT:
        return this.handleHeight(phone, tempData, text);
      case STEPS.INTERESTS:
        return this.handleInterests(phone, tempData, text);
      case STEPS.HABITS_DRINKING:
        return this.handleHabitsDrinking(phone, tempData, text);
      case STEPS.HABITS_SMOKING:
        return this.handleHabitsSmoking(phone, tempData, text);
      case STEPS.RELIGION:
        return this.handleReligion(phone, tempData, text);
      case STEPS.KIDS:
        return this.handleKids(phone, tempData, text);
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
        : { step: STEPS.CHANNEL_CHOICE, prompt: MSG.CHANNEL_CHOICE },

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

      [STEPS.AGE_RANGE]: { step: STEPS.WHO_TO_MEET, prompt: MSG.WHO_TO_MEET },

      [STEPS.RELATIONSHIP_GOALS]: { step: STEPS.AGE_RANGE, prompt: MSG.AGE_RANGE },

      [STEPS.HEIGHT]: { step: STEPS.RELATIONSHIP_GOALS, prompt: MSG.RELATIONSHIP_GOALS },

      [STEPS.INTERESTS]: datingMode === "bff"
        ? { step: STEPS.WHO_TO_MEET, prompt: MSG.WHO_TO_MEET }
        : { step: STEPS.HEIGHT, prompt: MSG.HEIGHT },

      [STEPS.HABITS_DRINKING]: { step: STEPS.INTERESTS, prompt: MSG.INTERESTS },

      [STEPS.HABITS_SMOKING]: { step: STEPS.HABITS_DRINKING, prompt: MSG.HABITS_DRINKING },

      [STEPS.RELIGION]: { step: STEPS.HABITS_SMOKING, prompt: MSG.HABITS_SMOKING },

      [STEPS.KIDS]: { step: STEPS.RELIGION, prompt: MSG.RELIGION },

      [STEPS.PHOTOS]: { step: STEPS.KIDS, prompt: MSG.KIDS_HAVE },
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

    // First-time: ask whether they want to continue on WhatsApp or on the web app
    await this.sessionRepo.upsert(phone, STEPS.CHANNEL_CHOICE, { userId: user.id });
    return MSG.CHANNEL_CHOICE;
  }

  private async handleChannelChoice(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<WaMessage> {
    const n = normalise(text);

    // User chose the web app
    if (n === "web app" || n === "web" || n === "app" || n === "2") {
      const webUrl =
        config.twilio.webOnboardingUrl ||
        `${config.app.url}/onboarding`;
      return MSG.WEB_APP_LINK(webUrl);
    }

    // User chose WhatsApp (or sent any other message — nudge them forward)
    if (n === "whatsapp" || n === "1" || n === "here" || n === "continue") {
      await this.sessionRepo.upsert(phone, STEPS.PROFILE_DOB, tempData);
      return MSG.ASK_NAME;
    }

    // Ambiguous — re-show the choice
    return MSG.CHANNEL_CHOICE;
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
      "1": "date", date: "date", dating: "date",
      "2": "bff", bff: "bff", friendship: "bff", friend: "bff",
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

    // Save gender preference now (age range will be updated in AGE_RANGE step)
    await this.onboardingRepo.upsertPreferences(userId, {
      genderIdentity: tempData.genderIdentity as string,
      genderPreference,
      ageRangeMin: 18,
      ageRangeMax: 60,
    });

    if (datingMode === "bff") {
      // BFF: skip age range / relationship goals / height, go straight to interests
      await this.sessionRepo.upsert(phone, STEPS.INTERESTS, { ...tempData, genderPreference });
      return MSG.INTERESTS;
    }

    await this.sessionRepo.upsert(phone, STEPS.AGE_RANGE, { ...tempData, genderPreference });
    return MSG.AGE_RANGE;
  }

  private async handleAgeRange(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<WaMessage> {
    const n = normalise(text);
    let ageRangeMin = 18;
    let ageRangeMax = 60;

    if (n !== "skip") {
      const match = n.match(/^(\d+)\s*[-–to]+\s*(\d+)$/);
      if (!match) return MSG.ERROR_AGE_RANGE;
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      if (min < 18 || max > 100 || min >= max) return MSG.ERROR_AGE_RANGE;
      ageRangeMin = min;
      ageRangeMax = max;
    }

    const userId = tempData.userId as string;
    await this.onboardingRepo.upsertPreferences(userId, {
      genderIdentity: tempData.genderIdentity as string,
      genderPreference: tempData.genderPreference as string[],
      ageRangeMin,
      ageRangeMax,
    });

    await this.sessionRepo.upsert(phone, STEPS.RELATIONSHIP_GOALS, {
      ...tempData,
      ageRangeMin,
      ageRangeMax,
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
      // button/list tap labels
      casual: "Fun, casual dates",
      "casual dates": "Fun, casual dates",
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
      ageRangeMin: (tempData.ageRangeMin as number) ?? 18,
      ageRangeMax: (tempData.ageRangeMax as number) ?? 60,
      relationshipIntent: intent,
      relationshipGoals: [intent],
    });

    await this.sessionRepo.upsert(phone, STEPS.HEIGHT, {
      ...tempData,
      relationshipIntent: intent,
    });
    return MSG.HEIGHT;
  }

  private async handleHeight(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<WaMessage> {
    const n = normalise(text);

    if (n !== "skip") {
      const raw = n.replace(/\s*cm\s*$/, "").trim();
      const heightCm = parseInt(raw, 10);
      if (isNaN(heightCm) || heightCm < 91 || heightCm > 220) return MSG.ERROR_HEIGHT;
      const userId = tempData.userId as string;
      await this.onboardingRepo.upsertHeight(userId, { heightCm });
      log.info("Height saved", { userId, heightCm });
      await this.sessionRepo.upsert(phone, STEPS.INTERESTS, { ...tempData, heightCm });
      return MSG.INTERESTS;
    }

    await this.sessionRepo.upsert(phone, STEPS.INTERESTS, tempData);
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
      "i'm sober": "I'm sober",
      "im sober": "I'm sober",
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
      drinkingHabit: tempData.drinking as string,
      smokingHabit: smoking,
    });
    await this.onboardingRepo.upsertAvailability(userId, {
      days: ["fri", "sat", "sun"],
      times: ["evening"],
    });
    log.info("Personality & availability saved", { userId, drinking: tempData.drinking, smoking });

    await this.sessionRepo.upsert(phone, STEPS.RELIGION, { ...tempData, smoking });
    return MSG.RELIGION;
  }

  private async handleReligion(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<WaMessage> {
    const VALID_RELIGIONS = [
      "agnostic", "atheist", "christian", "muslim", "hindu",
      "buddhist", "sikh", "jewish", "spiritual", "other",
    ];
    const n = normalise(text);
    const idx = parseInt(n, 10);

    let religion: string;
    if (!isNaN(idx) && idx >= 1 && idx <= VALID_RELIGIONS.length) {
      religion = VALID_RELIGIONS[idx - 1];
    } else if (VALID_RELIGIONS.includes(n)) {
      religion = n;
    } else {
      return MSG.ERROR_RELIGION;
    }

    // Capitalise first letter to match web onboarding values
    const formatted = religion.charAt(0).toUpperCase() + religion.slice(1);

    const userId = tempData.userId as string;
    await this.onboardingRepo.upsertImportantLife(userId, [formatted], []);
    log.info("Religion saved", { userId, religion: formatted });

    await this.sessionRepo.upsert(phone, STEPS.KIDS, { ...tempData, religion: formatted });
    return MSG.KIDS_HAVE;
  }

  private async handleKids(
    phone: string,
    tempData: Record<string, unknown>,
    text: string,
  ): Promise<WaMessage> {
    const n = normalise(text);

    // Sub-step 1: do they have kids?
    if (!tempData.kidsHave) {
      const haveMap: Record<string, string> = {
        "1": "Have kids",
        "2": "Don't have kids",
        "have kids": "Have kids",
        "no kids": "Don't have kids",
        yes: "Have kids",
        no: "Don't have kids",
      };
      const kidsHave = haveMap[n];
      if (!kidsHave) return MSG.ERROR_KIDS_HAVE;
      await this.sessionRepo.upsert(phone, STEPS.KIDS, { ...tempData, kidsHave });
      return MSG.KIDS_PLANS;
    }

    // Sub-step 2: kids plans
    const plansMap: Record<string, string> = {
      "1": "Don't want kids",
      "2": "Open to kids",
      "3": "Want kids",
      "4": "Not sure",
      "don't want kids": "Don't want kids",
      "dont want kids": "Don't want kids",
      "open to kids": "Open to kids",
      open: "Open to kids",
      "want kids": "Want kids",
      want: "Want kids",
      "not sure": "Not sure",
      unsure: "Not sure",
    };
    const kidsPlans = plansMap[n];
    if (!kidsPlans) return MSG.ERROR_KIDS_PLANS;

    const userId = tempData.userId as string;
    await this.onboardingRepo.upsertFamilyPlans(userId, {
      kidsStatus: tempData.kidsHave as "Have kids" | "Don't have kids",
      kidsPreference: kidsPlans as "Don't want kids" | "Open to kids" | "Want kids" | "Not sure",
    });
    log.info("Family plans saved", { userId, kidsHave: tempData.kidsHave, kidsPlans });

    await this.sessionRepo.upsert(phone, STEPS.PHOTOS, { ...tempData, kidsPlans, photoCount: 0 });
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
      return MSG.COMPLETE((tempData.fullName as string | undefined) ?? "");
    }

    return MSG.ERROR_NO_PHOTO;
  }
}
