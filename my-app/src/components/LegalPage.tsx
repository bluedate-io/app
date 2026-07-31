import Link from "next/link";

export function LegalPage({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#EDE8D5] px-5 py-8 text-[#2B1A07] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 border-b-2 border-[#2B1A07] pb-7">
          <Link href="/login" className="text-sm font-bold text-[#E8622A] hover:underline">
            Tryren
          </Link>
          <h1 className="mt-4 font-playfair text-4xl font-black tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6F604D]">{summary}</p>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#8B7962]">
            Effective 31 July 2026 · Last updated 31 July 2026
          </p>
        </header>

        <article className="space-y-8 text-[15px] leading-7 text-[#493A28] [&_a]:font-semibold [&_a]:text-[#C94E1F] [&_a]:underline [&_h2]:font-playfair [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#2B1A07] [&_li]:pl-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </article>

        <footer className="mt-12 border-t border-[#B9AA96] pt-6 text-sm text-[#6F604D]">
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal policies">
            <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/cancellation-and-refund-policy">Cancellation &amp; Refunds</Link>
          </nav>
          <p className="mt-4">Questions? Email <a href="mailto:admin@tryren.in">admin@tryren.in</a>.</p>
        </footer>
      </div>
    </main>
  );
}
