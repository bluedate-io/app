import { BottomNav } from "@/components/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ minHeight: "100dvh", paddingBottom: "calc(92px + env(safe-area-inset-bottom))" }}>
        {children}
      </div>
      <BottomNav />
    </>
  );
}
