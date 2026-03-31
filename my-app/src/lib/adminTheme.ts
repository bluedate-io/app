/**
 * Bluedate-style admin UI tokens. Mirrors CSS vars in globals.css (@theme bd-*).
 */
export const adminTheme = {
  cream: "#FEFCF0",
  creamAlt: "#FDFCF0",
  ink: "#2D1A0E",
  inkDark: "#23120B",
  orange: "#EF6820",
  orangeBright: "#FF6B2C",
  terracotta: "#D9774A",
  pink: "#E84E89",
  muted: "#6B7280",
  mutedLabel: "#9B9B9B",
  white: "#FFFFFF",
  borderSoft: "#E8E0D4",
  borderMuted: "#C9B8A8",
  navy: "#0A1B44",
  navyDeep: "#041644",
  skyHighlight: "#3B82F6",
  pageBg: "#FEFCF0",
  /** Main admin content well — warmer than cream so it reads clearly vs white cards/tables */
  mainCanvas: "#EAE2D4",
  /** Table “card” fill — warm white inside the bordered table frame */
  tableSurface: "#FFF9F2",
  /** Table header band */
  tableHeader: "#D9CFC2",
  /** Zebra striping */
  tableRow: "#FFF9F2",
  tableRowAlt: "#F2E9DD",
  tableRowHover: "#FFE4D0",
  /** Raised panels (page sections, filter islands) — warm off-white */
  elevated: "#FFFCF7",
  /** Sidebar gradient endpoints */
  sidebarTop: "#FFFDF9",
  sidebarBottom: "#F3EBE0",
  card: "#FFFFFF",
  accent: "#EF6820",
  accentHover: "#D95F1C",
  accentMutedBg: "#FFF0E8",
  accentMutedBorder: "#FFD4BF",
  textSecondary: "#6B5E55",
  textMuted: "#8B7355",
  shadowInk: "#23120B",
  error: "#C0392B",
  success: "#166534",
} as const;

export type AdminTheme = typeof adminTheme;
