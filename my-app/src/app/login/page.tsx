import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Tryren with your college email. Exclusive weekly matches for campus students.",
  robots: { index: true, follow: true },
};

export default function LoginPage() {
  return (
    <main
      className="min-h-screen flex flex-col p-6"
      style={{ backgroundColor: "#EDE8D5" }}
    >
      <LoginForm />
      <footer className="mx-auto mt-6 flex max-w-lg flex-wrap justify-center gap-x-4 gap-y-2 text-center text-xs text-[#6F604D]">
        <Link className="hover:underline" href="/terms-and-conditions">Terms &amp; Conditions</Link>
        <Link className="hover:underline" href="/privacy-policy">Privacy Policy</Link>
        <Link className="hover:underline" href="/cancellation-and-refund-policy">Cancellation &amp; Refunds</Link>
        <a className="hover:underline" href="mailto:admin@tryren.in">Contact</a>
      </footer>
    </main>
  );
}
