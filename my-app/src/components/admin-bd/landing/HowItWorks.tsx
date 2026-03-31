import BdCard from "../BdCard";

const steps = [
  {
    n: "01",
    title: "Open the admin panel",
    body: "Sign in with your authorised email. OTP lands in your inbox — no shared passwords.",
    icon: UserIcon,
    variant: "default" as const,
  },
  {
    n: "02",
    title: "Review students & opt-ins",
    body: "Filter by domain, onboarding step, and weekly opt-in status to see who needs attention.",
    icon: CalendarIcon,
    variant: "featured" as const,
  },
  {
    n: "03",
    title: "Run curated matches",
    body: "Use match tools to pair students with intent — same one-match-at-a-time philosophy.",
    icon: ChatIcon,
    variant: "default" as const,
  },
  {
    n: "04",
    title: "Send reminders when needed",
    body: "Nudge incomplete onboarding with templated outreach, tracked per cohort.",
    icon: MugIcon,
    variant: "default" as const,
  },
  {
    n: "05",
    title: "Iterate from feedback",
    body: "Export and audit actions so the next week’s operations stay sharp.",
    icon: StarIcon,
    variant: "default" as const,
  },
];

function UserIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-bd-ink" aria-hidden>
      <circle cx="24" cy="18" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M12 40c0-8 6-12 12-12s12 4 12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 14l4 4" stroke="#EF6820" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-bd-ink" aria-hidden>
      <rect x="10" y="12" width="28" height="26" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M10 20h28M18 8v6M30 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="16" y="26" width="6" height="5" rx="1" fill="#EF6820" opacity="0.85" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-bd-ink" aria-hidden>
      <path
        d="M10 14h28a2 2 0 012 2v14a2 2 0 01-2 2H18l-8 6v-6h-2a2 2 0 01-2-2V16a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M16 22h16M16 26h10" stroke="#EF6820" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function MugIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-bd-ink" aria-hidden>
      <path d="M12 18h18v14a4 4 0 01-4 4H16a4 4 0 01-4-4V18z" stroke="currentColor" strokeWidth="2" />
      <path d="M30 22h4a3 3 0 010 6h-4M14 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 10v-2M22 10v-2" stroke="#EF6820" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M24 8l4 10 10 1-8 7 3 10-9-5-9 5 3-10-8-7 10-1z"
        stroke="#2D1A0E"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="24" cy="26" r="3" fill="#EF6820" />
    </svg>
  );
}

function StepCard({
  n,
  title,
  body,
  icon: Icon,
  variant,
}: (typeof steps)[number]) {
  return (
    <BdCard variant={variant} className="relative flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-bd-muted">{n}</span>
        <Icon />
      </div>
      <h3
        className="mb-2 text-xl font-bold text-bd-ink"
        style={{ fontFamily: "var(--font-bd-display), Georgia, serif" }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-bd-text-secondary">{body}</p>
    </BdCard>
  );
}

export default function HowItWorks() {
  return (
    <section className="px-4 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <p
          className="mb-2 text-center text-lg text-bd-orange md:text-xl"
          style={{ fontFamily: "var(--font-bd-script), cursive" }}
        >
          The process
        </p>
        <h2
          className="mb-14 text-center text-4xl font-black tracking-tight text-bd-ink md:text-5xl"
          style={{ fontFamily: "var(--font-bd-display), Georgia, serif" }}
        >
          How it <span className="text-bd-orange-bright">actually</span> works
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.slice(0, 3).map((s) => (
            <StepCard key={s.n} {...s} />
          ))}
        </div>
        <div className="mt-6 flex flex-col items-center gap-6 md:flex-row md:flex-wrap md:justify-center">
          {steps.slice(3).map((s) => (
            <div key={s.n} className="w-full md:w-[min(100%,22rem)] md:max-w-sm">
              <StepCard {...s} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
