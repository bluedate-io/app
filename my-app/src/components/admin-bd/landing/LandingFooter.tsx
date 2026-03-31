import { config } from "@/config";

const adminEmail = config.admin.email;

export default function LandingFooter() {
  return (
    <footer className="px-4 pb-6 pt-12 md:pt-16">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-t-[3rem] bg-bd-navy-deep px-6 py-14 text-slate-200 md:px-12 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <p
              className="text-3xl font-bold leading-tight text-white md:text-4xl"
              style={{ fontFamily: "var(--font-bd-display), Georgia, serif" }}
            >
              Real meets.
              <br />
              Real connections.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <nav className="flex flex-col gap-3" aria-label="Footer primary">
              <FooterLink href="https://bluedate.io/">Our story</FooterLink>
              <FooterLink href={`mailto:${adminEmail}`}>Write to us</FooterLink>
              <FooterLink href="https://www.instagram.com/bluedate.io/">Instagram</FooterLink>
            </nav>
            <nav className="flex flex-col gap-3" aria-label="Footer legal">
              <FooterLink href="https://bluedate.io/">Privacy</FooterLink>
              <FooterLink href="https://bluedate.io/">Terms</FooterLink>
            </nav>
          </div>
        </div>

        <p
          className="mt-16 text-center text-5xl font-black tracking-tight text-slate-100 md:mt-20 md:text-7xl lg:text-8xl"
          style={{
            fontFamily: "var(--font-bd-display), Georgia, serif",
            textShadow: "0 2px 0 #0a1628, 0 6px 24px rgba(30, 58, 138, 0.45)",
          }}
        >
          bluedate
        </p>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 text-xs text-slate-400 sm:flex-row">
          <span>Bluedate</span>
          <span>Designed and built in India</span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-slate-300 transition hover:text-white">
      {children}
    </a>
  );
}
