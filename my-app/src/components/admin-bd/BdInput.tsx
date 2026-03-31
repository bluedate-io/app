import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

/** Admin login email field — underline style only (sole consumer in codebase). */
export default function BdInput({ className = "", ...props }: Props) {
  return (
    <input
      className={`w-full border-0 border-b-2 border-bd-ink bg-transparent pb-2 text-base text-bd-ink placeholder:text-bd-muted focus:outline-none focus:ring-0 ${className}`}
      {...props}
    />
  );
}
