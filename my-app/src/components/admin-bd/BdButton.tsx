import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

const btnClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-bd-orange px-6 py-3 text-sm font-medium text-white transition-transform transition-colors duration-150 hover:bg-[#D95F1C] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-bd-orange focus-visible:ring-offset-2 focus-visible:ring-offset-bd-cream disabled:pointer-events-none disabled:opacity-50";

export default function BdButton({ className = "", type = "button", ...props }: Props) {
  return <button type={type} className={`${btnClass} ${className}`} {...props} />;
}
