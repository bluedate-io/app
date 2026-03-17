// POST /api/onboarding/prompt-image — upload image for a single prompt
import { type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { config } from "@/config";
import { withAuth } from "@/middleware/withMiddleware";
import { successResponse, handleError } from "@/utils/response";

const MAX_PROMPT_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB
const ALLOWED_IMAGE_TYPES = /^image\/(jpeg|jpg|png|gif|webp)$/i;

function getStorageClient() {
  return createClient(config.supabase.url, config.supabase.anonKey).storage;
}

export const POST = withAuth(async (req: NextRequest, ctx) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Error("Field 'file' must be a file.");
    }

    if (!ALLOWED_IMAGE_TYPES.test(file.type)) {
      throw new Error("Only image files are allowed (e.g. JPEG, PNG, GIF, WEBP).");
    }
    if (file.size > MAX_PROMPT_IMAGE_BYTES) {
      throw new Error("Image is too large. Please upload an image below 3MB.");
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `prompt-images/${ctx.userId}/${Date.now()}.${ext}`;

    const storage = getStorageClient();
    const { error } = await storage
      .from(config.supabase.photoBucket)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      throw new Error("Image upload failed. Please try again.");
    }

    const { data: publicUrlData } = storage
      .from(config.supabase.photoBucket)
      .getPublicUrl(path);

    return successResponse({ imageUrl: publicUrlData.publicUrl });
  } catch (error) {
    return handleError(error);
  }
});

