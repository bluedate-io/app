import { Heart } from "lucide-react";

const BG = "#EDE8D5";
const DARK = "#2B1A07";
const ACCENT = "#E8622A";
const SERIF = "var(--font-playfair, Georgia, serif)";
const SANS = "var(--font-geist-sans, sans-serif)";

export default function MatchesPage() {
  return (
    <div style={{ minHeight: "100%", background: BG, fontFamily: SANS }}>
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "20px 20px 14px",
          borderBottom: `2px solid ${DARK}`,
        }}
      >
        <h1
          style={{
            fontFamily: SERIF,
            fontSize: 26,
            fontWeight: 800,
            color: DARK,
            letterSpacing: -0.5,
            margin: 0,
          }}
        >
          Matches
        </h1>
      </div>

      {/* Empty state */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 160px)",
          padding: "0 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            border: `2.5px solid ${DARK}`,
            boxShadow: `4px 4px 0 ${DARK}`,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Heart size={38} strokeWidth={1.8} color={ACCENT} fill={`${ACCENT}25`} />
        </div>

        <h2
          style={{
            fontFamily: SERIF,
            fontSize: 22,
            fontWeight: 800,
            color: DARK,
            lineHeight: 1.3,
            margin: "0 0 10px",
          }}
        >
          Your matches are on the way
        </h2>

        <p
          style={{
            fontSize: 14,
            color: "#7A6A54",
            lineHeight: 1.7,
            maxWidth: 260,
            margin: 0,
          }}
        >
          Our Bluedate AI agent is hand-picking one curated match for you — no swiping, just quality.
        </p>
      </div>
    </div>
    </div>
  );
}
