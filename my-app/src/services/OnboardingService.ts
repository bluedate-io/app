// ─── OnboardingService ────────────────────────────────────────────────────────
// Orchestrates all onboarding steps and tracks completion.

import { createClient } from "@supabase/supabase-js";
import { config } from "@/config";
import type { IOnboardingRepository } from "@/repositories/OnboardingRepository";
import type { IUserRepository } from "@/repositories/UserRepository";
import type { InviteCodeService } from "@/services/InviteCodeService";
import type {
  ProfileInput,
  GenderIdentityInput,
  PreferencesInput,
  GenderPreferenceInput,
  AgeRangeInput,
  RelationshipGoalsInput,
  InterestsInput,
  PersonalityInput,
  AvailabilityInput,
  AiSignalsInput,
} from "@/validations/onboarding.validation";
import type {
  ProfileResponseDTO,
  GenderResponseDTO,
  PreferencesResponseDTO,
  InterestsResponseDTO,
  PersonalityResponseDTO,
  AvailabilityResponseDTO,
  AiSignalsResponseDTO,
  PhotoResponseDTO,
} from "@/dto/OnboardingDTO";
import {
  toProfileDTO,
  toGenderDTO,
  toPreferencesDTO,
  toInterestsDTO,
  toPersonalityDTO,
  toAvailabilityDTO,
  toAiSignalsDTO,
  toPhotoDTO,
} from "@/dto/OnboardingDTO";
import { NotFoundError, BadRequestError, UnauthorizedError } from "@/utils/errors";
import { logger } from "@/utils/logger";

const log = logger.child("OnboardingService");

// Lazy Supabase storage client (only initialised when needed)
function getStorageClient() {
  return createClient(config.supabase.url, config.supabase.anonKey).storage;
}

export class OnboardingService {
  constructor(
    private readonly onboardingRepo: IOnboardingRepository,
    private readonly userRepo: IUserRepository,
    private readonly inviteCodeService: InviteCodeService,
  ) {}

  // ─── Profile ────────────────────────────────────────────────────────────────

  async saveProfile(userId: string, data: ProfileInput): Promise<ProfileResponseDTO> {
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) {
      log.warn("Profile save rejected: user not found", { userId });
      throw new UnauthorizedError("Your session is invalid or expired. Please log in again.");
    }
    const profile = await this.onboardingRepo.upsertProfile(userId, data);
    log.info("Profile saved", { userId });
    return toProfileDTO(profile);
  }

  // ─── Gender identity (step: which gender describes you) ──────────────────────

  async saveGenderIdentity(userId: string, data: GenderIdentityInput): Promise<GenderResponseDTO> {
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) {
      log.warn("Gender save rejected: user not found", { userId });
      throw new UnauthorizedError("Your session is invalid or expired. Please log in again.");
    }
    const prefs = await this.onboardingRepo.upsertGenderIdentity(userId, data);
    log.info("Gender identity saved", { userId });
    return toGenderDTO(prefs);
  }

  // ─── Dating mode only (Date vs BFF) ─────────────────────────────────────────

  async saveDatingMode(userId: string, mode: "date" | "bff"): Promise<PreferencesResponseDTO> {
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) {
      log.warn("Dating mode save rejected: user not found", { userId });
      throw new UnauthorizedError("Your session is invalid or expired. Please log in again.");
    }
    const prefs = await this.onboardingRepo.upsertDatingMode(userId, mode);
    log.info("Dating mode saved", { userId, mode });
    return toPreferencesDTO(prefs);
  }

  // ─── Who to meet (step 4) — only gender preference, no genderIdentity ───────────

  async saveGenderPreference(userId: string, data: GenderPreferenceInput): Promise<PreferencesResponseDTO> {
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) {
      log.warn("Gender preference save rejected: user not found", { userId });
      throw new UnauthorizedError("Your session is invalid or expired. Please log in again.");
    }
    const prefs = await this.onboardingRepo.upsertGenderPreference(userId, data);
    log.info("Who to meet saved", { userId });
    return toPreferencesDTO(prefs);
  }

  // ─── Age range only (step 5 — Date and BFF) ────────────────────────────────────────

  async saveAgeRange(userId: string, data: AgeRangeInput): Promise<PreferencesResponseDTO> {
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) {
      log.warn("Age range save rejected: user not found", { userId });
      throw new UnauthorizedError("Your session is invalid or expired. Please log in again.");
    }
    const prefs = await this.onboardingRepo.upsertAgeRange(userId, data);
    log.info("Age range saved", { userId });
    return toPreferencesDTO(prefs);
  }

  // ─── Relationship goals only (step 5) — no override of other preferences ─────────────

  async saveRelationshipGoals(userId: string, data: RelationshipGoalsInput): Promise<PreferencesResponseDTO> {
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) {
      log.warn("Relationship goals save rejected: user not found", { userId });
      throw new UnauthorizedError("Your session is invalid or expired. Please log in again.");
    }
    const prefs = await this.onboardingRepo.upsertRelationshipGoals(userId, data);
    log.info("Relationship goals saved", { userId });
    return toPreferencesDTO(prefs);
  }

  // ─── Preferences (full update: gender identity, who to meet, relationship goal) ─────────

  async savePreferences(userId: string, data: PreferencesInput): Promise<PreferencesResponseDTO> {
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) {
      log.warn("Preferences save rejected: user not found", { userId });
      throw new UnauthorizedError("Your session is invalid or expired. Please log in again.");
    }
    const prefs = await this.onboardingRepo.upsertPreferences(userId, data);
    log.info("Preferences saved", { userId });
    return toPreferencesDTO(prefs);
  }

  // ─── Interests ───────────────────────────────────────────────────────────────

  async saveInterests(userId: string, data: InterestsInput): Promise<InterestsResponseDTO> {
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) {
      log.warn("Interests save rejected: user not found", { userId });
      throw new UnauthorizedError("Your session is invalid or expired. Please log in again.");
    }
    const interests = await this.onboardingRepo.upsertInterests(userId, data);
    log.info("Interests saved", { userId });
    return toInterestsDTO(interests);
  }

  // ─── Personality ─────────────────────────────────────────────────────────────

  async savePersonality(userId: string, data: PersonalityInput): Promise<PersonalityResponseDTO> {
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) {
      log.warn("Personality save rejected: user not found", { userId });
      throw new UnauthorizedError("Your session is invalid or expired. Please log in again.");
    }
    const personality = await this.onboardingRepo.upsertPersonality(userId, data);
    log.info("Personality saved", { userId });
    return toPersonalityDTO(personality);
  }

  // ─── Availability ─────────────────────────────────────────────────────────────

  async saveAvailability(userId: string, data: AvailabilityInput): Promise<AvailabilityResponseDTO> {
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) {
      log.warn("Availability save rejected: user not found", { userId });
      throw new UnauthorizedError("Your session is invalid or expired. Please log in again.");
    }
    const availability = await this.onboardingRepo.upsertAvailability(userId, data);
    log.info("Availability saved", { userId });
    return toAvailabilityDTO(availability);
  }

  // ─── AI Signals ──────────────────────────────────────────────────────────────

  async saveAiSignals(userId: string, data: AiSignalsInput): Promise<AiSignalsResponseDTO> {
    const signals = await this.onboardingRepo.upsertAiSignals(userId, data);
    log.info("AI signals saved", { userId });
    return toAiSignalsDTO(signals);
  }

  // ─── Photos (Supabase Storage) ───────────────────────────────────────────────

  private static readonly MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_IMAGE_TYPES = /^image\/(jpeg|jpg|png|gif|webp)$/i;

  async uploadPhoto(
    userId: string,
    file: File,
    order: number,
  ): Promise<PhotoResponseDTO> {
    if (!OnboardingService.ALLOWED_IMAGE_TYPES.test(file.type)) {
      throw new BadRequestError("Only image files are allowed (e.g. JPEG, PNG).");
    }
    if (file.size > OnboardingService.MAX_PHOTO_SIZE_BYTES) {
      throw new BadRequestError("The size is too big. Please upload an image of size below 5MB.");
    }

    const photos = await this.onboardingRepo.getPhotos(userId);
    if (photos.length >= 4) {
      throw new BadRequestError("Maximum 4 photos allowed");
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;

    const storage = getStorageClient();
    const { error } = await storage
      .from(config.supabase.photoBucket)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      log.error("Supabase photo upload failed", { userId, error: error.message });
      throw new BadRequestError("Photo upload failed. Please try again.");
    }

    const { data: publicUrlData } = storage
      .from(config.supabase.photoBucket)
      .getPublicUrl(path);

    const photo = await this.onboardingRepo.addPhoto(userId, publicUrlData.publicUrl, order);
    log.info("Photo uploaded", { userId, photoId: photo.id });
    return toPhotoDTO(photo);
  }

  async deletePhoto(userId: string, photoId: string): Promise<void> {
    await this.onboardingRepo.deletePhoto(photoId, userId);
    log.info("Photo deleted", { userId, photoId });
  }

  async getPhotos(userId: string): Promise<PhotoResponseDTO[]> {
    const photos = await this.onboardingRepo.getPhotos(userId);
    return photos.map(toPhotoDTO);
  }

  // ─── Invite code ─────────────────────────────────────────────────────────────

  async validateInviteCode(userId: string, code: string): Promise<void> {
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) {
      throw new UnauthorizedError("Your session is invalid or expired. Please log in again.");
    }
    const gender = await this.onboardingRepo.getGenderIdentity(userId);
    if (!gender || !gender.trim()) {
      throw new BadRequestError("Please save your gender first, then enter your invite code.");
    }
    await this.inviteCodeService.validateAndUseCode(code, userId, gender);
  }

  // ─── Complete onboarding ─────────────────────────────────────────────────────

  async completeOnboarding(userId: string): Promise<void> {
    const status = await this.onboardingRepo.getOnboardingStatus(userId);

    const missing: string[] = [];
    if (!status.hasProfile) missing.push("profile");
    if (!status.hasPreferences) missing.push("preferences");
    if (!status.hasUsedInviteCode) missing.push("invite code");
    if (
      (status.relationshipIntent === "date" || status.relationshipIntent === "friendship") &&
      (status.ageRangeMin == null || status.ageRangeMax == null)
    ) {
      missing.push("age range");
    }
    if (!status.hasInterests) missing.push("interests");
    if (!status.hasPersonality) missing.push("personality");
    if (!status.hasAvailability) missing.push("availability");
    if (status.photoCount < 2) missing.push("at least 2 photos");

    if (missing.length > 0) {
      throw new BadRequestError(
        `Onboarding incomplete. Missing steps: ${missing.join(", ")}`,
      );
    }

    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError("User", userId);

    await this.userRepo.completeOnboarding(userId);
    log.info("Onboarding completed", { userId });
  }

  async getStatus(userId: string) {
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) {
      log.warn("Onboarding status rejected: user not found", { userId });
      throw new UnauthorizedError("Your session is invalid or expired. Please log in again.");
    }
    const [status, user] = await Promise.all([
      this.onboardingRepo.getOnboardingStatus(userId),
      this.userRepo.findById(userId),
    ]);
    return {
      ...status,
      completed: user?.onboardingCompleted ?? false,
    };
  }
}
