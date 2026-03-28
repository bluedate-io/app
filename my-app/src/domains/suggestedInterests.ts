// ─── Onboarding step 8 + profile interests — single source of truth ───────────

export const SUGGESTED_INTERESTS = [
  "Skiing", "Museums & galleries", "LGBTQ+ rights", "Wine", "Writing",
  "Horror", "Yoga", "Cats", "Dogs", "Crafts", "Festivals", "Coffee",
  "Art", "City breaks", "Camping", "Foodie", "R&B", "Tennis", "Dancing",
  "Vegetarian", "Gardening", "Baking", "Gigs", "Country", "Photography",
  "Travel", "Gaming", "Cooking", "Reading", "Hiking", "Fitness", "Movies",
] as const;

export type SuggestedInterest = (typeof SUGGESTED_INTERESTS)[number];

export const INTEREST_SYMBOLS: Record<SuggestedInterest, string> = {
  Skiing: "⛷️",
  "Museums & galleries": "🖼️",
  "LGBTQ+ rights": "🏳️‍🌈",
  Wine: "🍷",
  Writing: "✍️",
  Horror: "🎃",
  Yoga: "🧘",
  Cats: "🐱",
  Dogs: "🐕",
  Crafts: "🎨",
  Festivals: "🎪",
  Coffee: "☕",
  Art: "🖌️",
  "City breaks": "🌆",
  Camping: "⛺",
  Foodie: "🍽️",
  "R&B": "🎵",
  Tennis: "🎾",
  Dancing: "💃",
  Vegetarian: "🥬",
  Gardening: "🌱",
  Baking: "🧁",
  Gigs: "🎸",
  Country: "🤠",
  Photography: "📷",
  Travel: "✈️",
  Gaming: "🎮",
  Cooking: "👨‍🍳",
  Reading: "📚",
  Hiking: "🥾",
  Fitness: "💪",
  Movies: "🎬",
};

export const SUGGESTED_INTERESTS_SET = new Set<string>(SUGGESTED_INTERESTS);
