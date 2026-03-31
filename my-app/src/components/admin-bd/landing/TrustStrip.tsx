import BdCard from "../BdCard";

const items = [
  {
    label: "TRUST #1",
    title: "OTP + role verification",
    body: "Only approved admin emails receive a code. Every session is JWT-scoped to the admin role.",
  },
  {
    label: "TRUST #2",
    title: "Least exposure by design",
    body: "Student PII stays in your existing tools; the panel is for operations, not public browsing.",
  },
  {
    label: "TRUST #3",
    title: "Campus-aligned actions",
    body: "Matching and reminders respect college domains and the same verified meet ethos as the product.",
  },
];

export default function TrustStrip() {
  return (
    <section className="border-t border-bd-border-soft bg-bd-cream-alt px-4 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <p
          className="mb-2 text-center text-lg text-bd-orange md:text-xl"
          style={{ fontFamily: "var(--font-bd-script), cursive" }}
        >
          Why it&apos;s safe
        </p>
        <h2
          className="mb-14 text-center text-4xl font-black tracking-tight text-bd-ink md:text-5xl"
          style={{ fontFamily: "var(--font-bd-display), Georgia, serif" }}
        >
          Verified. Private. <span className="text-bd-orange-bright">Controlled.</span>
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <BdCard
              key={item.label}
              variant={i === 1 ? "featured" : "default"}
              className="flex flex-col items-center text-center"
            >
              <span className="mb-3 text-xs font-semibold uppercase tracking-widest text-bd-muted-label">
                {item.label}
              </span>
              <h3
                className="mb-3 text-lg font-bold text-bd-ink"
                style={{ fontFamily: "var(--font-bd-display), Georgia, serif" }}
              >
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-bd-text-secondary">{item.body}</p>
            </BdCard>
          ))}
        </div>
      </div>
    </section>
  );
}
