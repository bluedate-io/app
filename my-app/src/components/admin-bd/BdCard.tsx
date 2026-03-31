import type { HTMLAttributes, ReactNode } from "react";

type Variant = "default" | "featured";

type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
  children: ReactNode;
};

const base = "rounded-3xl border-2 p-8";

const variants: Record<Variant, string> = {
  default: "border-bd-ink bg-bd-card shadow-[8px_8px_0px_0px_var(--bd-shadow-ink)]",
  featured:
    "border-bd-ink bg-bd-card text-bd-ink shadow-[8px_8px_0px_0px_var(--bd-orange-bright)]",
};

export default function BdCard({
  variant = "default",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
