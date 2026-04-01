import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

const btnClass =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-bd-ink-dark bg-gradient-to-br from-bd-orange to-bd-orange-bright px-6 py-3 text-sm font-semibold text-white shadow-[3px_3px_0px_0px_var(--bd-shadow-ink)] transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[4px_4px_0px_0px_var(--bd-shadow-ink)] active:translate-y-px active:shadow-[2px_2px_0px_0px_var(--bd-shadow-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-bd-orange focus-visible:ring-offset-2 focus-visible:ring-offset-bd-cream disabled:pointer-events-none disabled:opacity-50";

export default function BdButton({ className = "", type = "button", ...props }: Props) {
  return <button type={type} className={`${btnClass} ${className}`} {...props} />;
}
