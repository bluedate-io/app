// Conversation screen takes full viewport — no bottom nav, no padding
export default function ConversationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
      }}
    >
      {children}
    </div>
  );
}
