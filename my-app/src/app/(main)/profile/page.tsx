export default function ProfilePage() {
  return (
    <main
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#FBF8F6",
        padding: "24px",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 48 }}>👤</span>
      <h1
        style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          fontSize: 28,
          fontWeight: 700,
          color: "#1a1a1a",
          textAlign: "center",
        }}
      >
        Profile
      </h1>
      <p style={{ color: "#777", fontSize: 15, textAlign: "center", maxWidth: 280 }}>
        Your bluedate profile will appear here.
      </p>
    </main>
  );
}
