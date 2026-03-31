import Link from "next/link";

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-50 flex justify-center px-4 pt-6 pb-2 md:pt-8">
      <nav
        className="flex w-full max-w-[36rem] md:max-w-[40rem] items-center gap-2 md:gap-4 rounded-full border border-bd-ink-dark/20 bg-[#1A110A] px-3 py-2 pl-4 text-white shadow-lg md:px-5"
        aria-label="Admin landing"
      >
        <Link href="/admin/login" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
            B
          </span>
          <span className="hidden font-semibold text-white sm:inline text-sm">BlueDate</span>
        </Link>
        <span className="hidden h-6 w-px shrink-0 bg-white/25 md:block" aria-hidden />
        <p className="min-w-0 flex-1 text-center text-[11px] leading-snug text-white/90 sm:text-left sm:text-xs md:text-sm">
          <span className="hidden sm:inline">Role-verified admin tools for campus operations.</span>
          <span className="sm:hidden">Admin tools</span>
        </p>
        <a
          href="#sign-in"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-bd-orange px-4 py-2 text-sm font-medium text-white transition hover:bg-[#D95F1C] focus:outline-none focus-visible:ring-2 focus-visible:ring-bd-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A110A]"
        >
          Sign in
        </a>
      </nav>
    </header>
  );
}
