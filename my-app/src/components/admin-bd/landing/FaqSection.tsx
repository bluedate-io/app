"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Who can access this admin panel?",
    a: "Only email addresses that your team has authorised receive an OTP. Successful verification issues a short-lived admin JWT.",
  },
  {
    q: "How does this relate to student safety?",
    a: "The same principles as the product: verified domains, curated operations, and no public directory browsing from here.",
  },
  {
    q: "Where is data processed?",
    a: "In your deployed app environment and database — this UI is a thin layer over your existing Prisma-backed APIs.",
  },
  {
    q: "Can I revoke access?",
    a: "Yes. Rotate JWT secrets and remove admin rows in your database; OTP is re-issued only to allowed emails.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="border-t border-bd-border-soft bg-[#FEFBEA] px-4 py-20 md:py-24">
      <div className="mx-auto max-w-3xl">
        <h2
          className="mb-12 text-center text-3xl font-black tracking-tight text-bd-ink md:mb-16 md:text-4xl"
          style={{ fontFamily: "var(--font-bd-display), Georgia, serif" }}
        >
          Questions you might have
        </h2>
        <ul className="divide-y divide-dashed divide-bd-border-muted border-t border-dashed border-bd-border-muted">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q} className="border-b border-dashed border-bd-border-muted">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-7 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-bd-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEFBEA]"
                  aria-expanded={isOpen}
                >
                  <span className="text-lg font-bold text-bd-ink">{item.q}</span>
                  <span className="shrink-0 text-bd-orange tabular-nums" aria-hidden>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen ? (
                  <p className="pb-7 text-base leading-relaxed text-bd-text-secondary">{item.a}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
