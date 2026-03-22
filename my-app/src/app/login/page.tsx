import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to bluedate with your college email. Exclusive weekly matches for campus students.",
  robots: { index: true, follow: true },
};

export default function LoginPage() {
  return (
    <main
      className="min-h-screen flex flex-col p-6"
      style={{ backgroundColor: "#EDE8D5" }}
    >
      <LoginForm />
    </main>
  );
}
