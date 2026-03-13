import { z } from "zod";

export const swipeSchema = z.object({
  targetUserId: z.string().uuid("Invalid user ID"),
  direction: z.enum(["like", "dislike", "super_like"]),
});

export type SwipeInput = z.infer<typeof swipeSchema>;
