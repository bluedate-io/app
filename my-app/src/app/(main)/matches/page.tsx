export default function MatchesPage() {
  return (
    <div
      style={{
        minHeight: "100%",
        background: "#F5F0FB",
        fontFamily: "var(--font-geist-sans, sans-serif)",
      }}
    >
      {/* Header */}
      <div className="px-4 pt-5 pb-2">
        <h1 className="text-lg font-bold" style={{ color: "#1A0A2E" }}>
          Matches
        </h1>
      </div>

      {/* Empty state */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          padding: "0 40px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: 20,
            fontWeight: 700,
            color: "#1A0A2E",
            lineHeight: 1.4,
            marginBottom: 12,
          }}
        >
          Your matches are on the way
        </p>
        <p
          style={{
            fontSize: 14,
            color: "#9B87B0",
            lineHeight: 1.6,
            maxWidth: 260,
            margin: "0 auto",
          }}
        >
          We will notify you as soon as our Bluedate AI agent finds a match for you.
        </p>
      </div>
    </div>
  );
}
