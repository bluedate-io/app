// ─── OnboardingController ─────────────────────────────────────────────────────

import { NextRequest } from "next/server";
import type { OnboardingService } from "@/services/OnboardingService";
import {
  profileSchema,
  genderIdentitySchema,
  inviteCodeSchema,
  preferencesSchema,
  interestsSchema,
  personalitySchema,
  availabilitySchema,
  aiSignalsSchema,
} from "@/validations/onboarding.validation";
import { successResponse, createdResponse, noContentResponse, handleError } from "@/utils/response";
import type { RequestContext } from "@/types";

export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  // POST /api/onboarding/profile
  async saveProfile(req: NextRequest, ctx: RequestContext) {
    try {
      const body = await req.json();
      const input = profileSchema.parse(body);
      const result = await this.onboardingService.saveProfile(ctx.userId, input);
      return createdResponse(result, "Profile saved");
    } catch (error) {
      return handleError(error);
    }
  }

  // POST /api/onboarding/gender
  async saveGender(req: NextRequest, ctx: RequestContext) {
    try {
      const body = await req.json();
      const input = genderIdentitySchema.parse(body);
      const result = await this.onboardingService.saveGenderIdentity(ctx.userId, input);
      return createdResponse(result, "Gender saved");
    } catch (error) {
      return handleError(error);
    }
  }

  // POST /api/onboarding/invite-code
  async validateInviteCode(req: NextRequest, ctx: RequestContext) {
    try {
      const body = await req.json();
      const input = inviteCodeSchema.parse(body);
      await this.onboardingService.validateInviteCode(ctx.userId, input.code);
      return successResponse(null, { message: "Invite code accepted" });
    } catch (error) {
      return handleError(error);
    }
  }

  // POST /api/onboarding/preferences
  async savePreferences(req: NextRequest, ctx: RequestContext) {
    try {
      const body = await req.json();
      const input = preferencesSchema.parse(body);
      const result = await this.onboardingService.savePreferences(ctx.userId, input);
      return createdResponse(result, "Preferences saved");
    } catch (error) {
      return handleError(error);
    }
  }

  // POST /api/onboarding/interests
  async saveInterests(req: NextRequest, ctx: RequestContext) {
    try {
      const body = await req.json();
      const input = interestsSchema.parse(body);
      const result = await this.onboardingService.saveInterests(ctx.userId, input);
      return createdResponse(result, "Interests saved");
    } catch (error) {
      return handleError(error);
    }
  }

  // POST /api/onboarding/personality
  async savePersonality(req: NextRequest, ctx: RequestContext) {
    try {
      const body = await req.json();
      const input = personalitySchema.parse(body);
      const result = await this.onboardingService.savePersonality(ctx.userId, input);
      return createdResponse(result, "Personality saved");
    } catch (error) {
      return handleError(error);
    }
  }

  // POST /api/onboarding/availability
  async saveAvailability(req: NextRequest, ctx: RequestContext) {
    try {
      const body = await req.json();
      const input = availabilitySchema.parse(body);
      const result = await this.onboardingService.saveAvailability(ctx.userId, input);
      return createdResponse(result, "Availability saved");
    } catch (error) {
      return handleError(error);
    }
  }

  // POST /api/onboarding/ai-signals
  async saveAiSignals(req: NextRequest, ctx: RequestContext) {
    try {
      const body = await req.json();
      const input = aiSignalsSchema.parse(body);
      const result = await this.onboardingService.saveAiSignals(ctx.userId, input);
      return createdResponse(result, "AI signals saved");
    } catch (error) {
      return handleError(error);
    }
  }

  // GET /api/onboarding/photos
  async getPhotos(_req: NextRequest, ctx: RequestContext) {
    try {
      const photos = await this.onboardingService.getPhotos(ctx.userId);
      return successResponse(photos);
    } catch (error) {
      return handleError(error);
    }
  }

  // POST /api/onboarding/photos  (multipart/form-data)
  async uploadPhoto(req: NextRequest, ctx: RequestContext) {
    try {
      const formData = await req.formData();
      const file = formData.get("file");
      const orderRaw = formData.get("order");

      if (!(file instanceof File)) {
        return handleError(new Error("Field 'file' must be a file"));
      }
      const order = orderRaw ? parseInt(String(orderRaw), 10) : 0;
      const result = await this.onboardingService.uploadPhoto(ctx.userId, file, order);
      return createdResponse(result, "Photo uploaded");
    } catch (error) {
      return handleError(error);
    }
  }

  // DELETE /api/onboarding/photos/:id
  async deletePhoto(_req: NextRequest, ctx: RequestContext, photoId: string) {
    try {
      await this.onboardingService.deletePhoto(ctx.userId, photoId);
      return noContentResponse();
    } catch (error) {
      return handleError(error);
    }
  }

  // GET /api/onboarding/status
  async getStatus(_req: NextRequest, ctx: RequestContext) {
    try {
      const status = await this.onboardingService.getStatus(ctx.userId);
      return successResponse(status);
    } catch (error) {
      return handleError(error);
    }
  }

  // POST /api/onboarding/complete
  async complete(_req: NextRequest, ctx: RequestContext) {
    try {
      await this.onboardingService.completeOnboarding(ctx.userId);
      return successResponse(null, { message: "Onboarding complete! Welcome to bluedate." });
    } catch (error) {
      return handleError(error);
    }
  }
}
