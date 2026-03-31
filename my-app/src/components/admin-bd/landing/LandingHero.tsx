import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function LandingHero({ children }: Props) {
  return (
    <section className="relative px-4 pb-16 pt-6 md:pb-24 md:pt-10">
      {/* Decorative stamps — hidden on small screens */}
      <div
        className="pointer-events-none absolute left-[4%] top-24 hidden rotate-[-8deg] md:block lg:left-[8%]"
        aria-hidden
      >
        <div className="flex h-20 w-16 items-center justify-center rounded border-2 border-dashed border-bd-pink/60 bg-bd-pink/15 text-[10px] font-bold uppercase text-bd-pink">
          Ops
        </div>
      </div>
      <div
        className="pointer-events-none absolute right-[4%] top-32 hidden rotate-[6deg] md:block lg:right-[8%]"
        aria-hidden
      >
        <div className="flex h-20 w-16 items-center justify-center rounded border-2 border-dashed border-bd-border-muted bg-white text-[10px] font-bold text-bd-ink">
          BD
        </div>
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <p
          className="mb-4 text-xl text-bd-terracotta md:text-2xl"
          style={{ fontFamily: "var(--font-bd-script), cursive" }}
        >
          Welcome to the operations side of thoughtful campus matching
        </p>

        <h1
          className="text-balance text-4xl font-black leading-[1.05] tracking-tight text-bd-ink md:text-6xl lg:text-7xl"
          style={{ fontFamily: "var(--font-bd-display), Georgia, serif" }}
        >
          Get real-life{" "}
          <span className="relative inline-block whitespace-nowrap">
            <span
              className="pointer-events-none absolute -inset-x-1 -inset-y-1 -z-10 rounded-[50%] border-[3px] border-bd-sky/90 opacity-90"
              style={{ transform: "rotate(-2deg)" }}
              aria-hidden
            />
            <span className="text-bd-pink">match</span>
          </span>{" "}
          workflows
        </h1>
        <p
          className="mt-4 text-3xl font-black tracking-tight text-bd-ink md:text-5xl"
          style={{ fontFamily: "var(--font-bd-display), Georgia, serif" }}
        >
          Without the noise.
        </p>
        <p
          className="mt-6 text-lg text-bd-terracotta md:text-xl"
          style={{ fontFamily: "var(--font-bd-script), cursive" }}
        >
          @your college domains
        </p>

        <div id="sign-in" className="mt-12 scroll-mt-28">
          {children}
        </div>
      </div>
    </section>
  );
}
