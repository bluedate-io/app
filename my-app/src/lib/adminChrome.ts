/**
 * Reusable surface classes — Bluedate admin neo-brutalist / editorial polish.
 * Pair with tokens in adminTheme.ts + globals.css (--bd-*).
 */

/** Page sections: title blocks, onboarding summary cards */
export const ADMIN_ELEVATED_PANEL =
  "rounded-3xl border-2 border-bd-ink-dark bg-bd-elevated p-5 shadow-[5px_5px_0px_0px_var(--bd-shadow-ink)] md:p-6";

/** Dense toolbars: search + actions */
export const ADMIN_TOOLBAR =
  "rounded-2xl border-2 border-bd-ink-dark bg-white/95 px-4 py-3 shadow-[4px_4px_0px_0px_var(--bd-shadow-ink)] backdrop-blur-sm";

/** Data table outer frame (matches Users table) */
export const ADMIN_TABLE_FRAME =
  "overflow-x-auto rounded-3xl border-2 border-bd-ink-dark bg-bd-table-surface shadow-[6px_6px_0px_0px_var(--bd-shadow-ink)]";

/** Interactive list / pool cards */
export const ADMIN_CARD_INTERACTIVE =
  "rounded-2xl border-2 border-bd-border-muted bg-white p-4 text-left shadow-[3px_3px_0px_0px_var(--bd-shadow-ink)] transition-all duration-150 hover:-translate-y-0.5 hover:border-bd-orange hover:shadow-[4px_4px_0px_0px_var(--bd-orange)]";

/** Same as above but flush edges for photo-on-top grid tiles */
export const ADMIN_CARD_INTERACTIVE_MEDIA =
  "rounded-2xl border-2 border-bd-border-muted bg-white text-left shadow-[3px_3px_0px_0px_var(--bd-shadow-ink)] transition-all duration-150 hover:-translate-y-0.5 hover:border-bd-orange hover:shadow-[4px_4px_0px_0px_var(--bd-orange)] overflow-hidden";

// ─── Form controls (buttons, selects, inputs) — same neo frame as toolbars ───

/** Search field shell (icon + input inside) */
export const ADMIN_SEARCH_SHELL =
  "relative flex min-h-10 min-w-[min(100%,14rem)] flex-1 items-center overflow-hidden rounded-xl border-2 border-bd-ink-dark bg-bd-card pr-1 shadow-[2px_2px_0px_0px_var(--bd-shadow-ink)] transition focus-within:border-bd-orange focus-within:ring-2 focus-within:ring-bd-orange/25";

/** Native & text inputs in toolbars / forms */
export const ADMIN_INPUT =
  "rounded-xl border-2 border-bd-ink-dark bg-bd-card px-3 py-2 text-sm font-medium text-bd-ink shadow-[2px_2px_0px_0px_var(--bd-shadow-ink)] transition placeholder:text-bd-muted-label focus:outline-none focus-visible:border-bd-orange focus-visible:ring-2 focus-visible:ring-bd-orange/25";

/** Compact native `<select>` (toolbar, filters) */
export const ADMIN_SELECT =
  "h-10 shrink-0 cursor-pointer rounded-xl border-2 border-bd-ink-dark bg-bd-card px-3 text-xs font-semibold text-bd-text-secondary shadow-[2px_2px_0px_0px_var(--bd-shadow-ink)] transition hover:bg-bd-table-hover focus:outline-none focus-visible:border-bd-orange focus-visible:ring-2 focus-visible:ring-bd-orange/25";

/** Add when a filter value is applied (non-default) */
export const ADMIN_SELECT_ACTIVE = "border-bd-orange bg-bd-accent-muted-bg text-bd-orange";

/** Roomier `<select>` (onboarding, wider labels) */
export const ADMIN_SELECT_LG =
  "min-h-10 cursor-pointer rounded-xl border-2 border-bd-ink-dark bg-bd-card px-3 py-2 text-sm font-medium text-bd-ink shadow-[2px_2px_0px_0px_var(--bd-shadow-ink)] transition hover:bg-bd-table-hover focus:outline-none focus-visible:border-bd-orange focus-visible:ring-2 focus-visible:ring-bd-orange/25";

/** Primary CTA — orange gradient + ink frame */
export const ADMIN_BTN_PRIMARY_SM =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 border-bd-ink-dark bg-gradient-to-br from-bd-orange to-bd-orange-bright px-4 py-2 text-sm font-semibold text-white shadow-[2px_2px_0px_0px_var(--bd-shadow-ink)] transition hover:brightness-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-bd-orange/40 active:translate-y-px active:shadow-[1px_1px_0px_0px_var(--bd-shadow-ink)] disabled:pointer-events-none disabled:opacity-50";

/** Full-width primary (filter dropdown Apply) */
export const ADMIN_BTN_PRIMARY_BLOCK =
  "w-full rounded-xl border-2 border-bd-ink-dark bg-gradient-to-br from-bd-orange to-bd-orange-bright py-2.5 text-xs font-semibold text-white shadow-[2px_2px_0px_0px_var(--bd-shadow-ink)] transition hover:brightness-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-bd-orange/40 active:translate-y-px active:shadow-[1px_1px_0px_0px_var(--bd-shadow-ink)]";

/** Secondary — peach fill, orange label (CSV, reset, outline actions) */
export const ADMIN_BTN_SECONDARY =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 border-bd-ink-dark bg-bd-accent-muted-bg px-3 py-2 text-xs font-semibold text-bd-orange shadow-[2px_2px_0px_0px_var(--bd-shadow-ink)] transition hover:bg-bd-table-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-bd-orange/25 active:translate-y-px active:shadow-[1px_1px_0px_0px_var(--bd-shadow-ink)] disabled:pointer-events-none disabled:opacity-50";

/** Compact reset-style control */
export const ADMIN_BTN_SECONDARY_COMPACT =
  "inline-flex shrink-0 items-center gap-1 rounded-lg border-2 border-bd-ink-dark bg-bd-accent-muted-bg px-2 py-0.5 text-[11px] font-semibold text-bd-orange shadow-[1px_1px_0px_0px_var(--bd-shadow-ink)] transition hover:bg-bd-table-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-bd-orange/25 active:translate-y-px";

/** Muted actions (select all, pagination, skip) */
export const ADMIN_BTN_NEUTRAL =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-bd-ink-dark bg-bd-table-row-alt px-4 py-2 text-sm font-semibold text-bd-text-secondary shadow-[2px_2px_0px_0px_var(--bd-shadow-ink)] transition hover:bg-bd-table-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-bd-orange/20 active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

export const ADMIN_BTN_NEUTRAL_SM =
  "inline-flex items-center justify-center gap-1 rounded-xl border-2 border-bd-ink-dark bg-bd-table-row-alt px-3 py-1.5 text-xs font-semibold text-bd-text-secondary shadow-[2px_2px_0px_0px_var(--bd-shadow-ink)] transition hover:bg-bd-table-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-bd-orange/20 active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

/** Destructive confirm (delete, etc.) */
export const ADMIN_BTN_DANGER_SM =
  "rounded-lg border-2 border-bd-ink-dark bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-[2px_2px_0px_0px_var(--bd-shadow-ink)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

/** Column filter popovers */
export const ADMIN_FILTER_PANEL =
  "absolute left-0 top-full z-50 mt-1 min-w-[260px] max-w-[min(320px,calc(100vw-2rem))] rounded-xl border-2 border-bd-ink-dark bg-bd-card px-3 py-2 shadow-[4px_4px_0px_0px_var(--bd-shadow-ink)]";

/** Small floating menu (multi-select, match dropdowns) */
export const ADMIN_DROPDOWN_PANEL =
  "absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border-2 border-bd-ink-dark bg-bd-card shadow-[4px_4px_0px_0px_var(--bd-shadow-ink)]";

/** Match tool: multi-select trigger */
export const ADMIN_MULTI_TRIGGER =
  "flex h-10 items-center gap-1.5 rounded-xl border-2 border-bd-ink-dark bg-bd-accent-muted-bg px-3 text-xs font-semibold whitespace-nowrap text-bd-text-secondary shadow-[2px_2px_0px_0px_var(--bd-shadow-ink)] transition hover:bg-bd-table-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-bd-orange/25";

export const ADMIN_MULTI_TRIGGER_ACTIVE = "border-bd-orange bg-bd-accent-muted-bg text-bd-orange";

/** List row hover inside dropdowns */
export const ADMIN_MENU_ITEM_HOVER = "hover:bg-bd-table-hover";

/** Tiny inputs inside filter shells (age min/max) */
export const ADMIN_INNER_INPUT =
  "w-13 shrink-0 rounded-lg border-2 border-bd-ink-dark bg-bd-card px-1.5 py-1 text-center text-xs tabular-nums text-bd-ink shadow-[1px_1px_0px_0px_var(--bd-shadow-ink)] outline-none focus-visible:ring-2 focus-visible:ring-bd-orange/25";
