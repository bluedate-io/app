// /optin/confirmed?status=in | late | invalid
// Standalone page — no auth required, no bottom nav.
import type { Metadata } from "next";

export const metadata: Metadata = { title: "bluedate — opt-in confirmed" };

const BG = "#EDE8D5";
const DARK = "#2B1A07";
const ACCENT = "#E8622A";
const MUTED = "#7A6A54";
const SERIF = "Georgia, serif";
const SANS = "system-ui, sans-serif";

const MESSAGES = {
  in: {
    emoji: "🎯",
    heading: "You're in for this week!",
    body: "We've got you on the list for this Friday's matching round. Sit tight — we'll email you when your match is ready.",
  },
  late: {
    emoji: "🎯",
    heading: "Chances are slim for this Friday, but you're first in line next week!",
    body: "You opted in after this week's cutoff, so we've prioritised you for next Friday's round. No further action needed.",
  },
  invalid: {
    emoji: "🚫",
    heading: "That link doesn't look right.",
    body: "The opt-in link may be malformed or already used. If you received it from a bluedate email, try clicking it again or contact support.",
  },
} as const;

type Status = keyof typeof MESSAGES;

export default async function OptInConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const status: Status =
    rawStatus === "in" || rawStatus === "late" || rawStatus === "invalid"
      ? rawStatus
      : "invalid";

  const { emoji, heading, body } = MESSAGES[status];
  const isError = status === "invalid";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: "100%",
          background: "#fff",
          border: `2.5px solid ${DARK}`,
          borderRadius: 20,
          boxShadow: `6px 6px 0 ${DARK}`,
          overflow: "hidden",
        }}
      >
        {/* Brand bar */}
        <div style={{ background: DARK, padding: "22px 28px" }}>
          <p
            style={{
              margin: 0,
              fontFamily: SERIF,
              fontSize: 20,
              fontWeight: 800,
              color: BG,
              letterSpacing: -0.5,
            }}
          >
            bluedate
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: "36px 28px 40px", textAlign: "center" }}>
          <p style={{ fontSize: 52, margin: "0 0 20px" }}>{emoji}</p>

          <h1
            style={{
              fontFamily: SERIF,
              fontSize: 22,
              fontWeight: 800,
              color: isError ? "#C0392B" : DARK,
              margin: "0 0 16px",
              lineHeight: 1.3,
            }}
          >
            {heading}
          </h1>

          <p
            style={{
              fontSize: 14,
              color: MUTED,
              lineHeight: 1.7,
              margin: "0 0 32px",
            }}
          >
            {body}
          </p>

          {/* "Go to app" only for successful opt-ins */}
          {!isError && (
            <a
              href="/home"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                background: ACCENT,
                color: "#fff",
                fontFamily: SERIF,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                borderRadius: 12,
                border: `2px solid ${DARK}`,
                boxShadow: `3px 3px 0 ${DARK}`,
              }}
            >
              Open the app
            </a>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: `1.5px solid ${DARK}15`,
            padding: "14px 28px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: "#9B8B78" }}>
            © bluedate · campus dating, thoughtfully done
          </p>
        </div>
      </div>
    </div>
  );
}
