"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import UserDetailSheet from "@/components/admin-bd/UserDetailSheet";
import {
  ADMIN_GENDER_OPTIONS,
  buildAdminUsersExportHref,
  buildAdminUsersHref,
  parseAdminUserSort,
  type AdminOptInStatusFilter,
  type AdminUserSort,
  type AdminUsersFilterTab,
} from "@/lib/adminUserStep";
import {
  ADMIN_BTN_NEUTRAL_SM,
  ADMIN_BTN_PRIMARY_BLOCK,
  ADMIN_BTN_PRIMARY_SM,
  ADMIN_BTN_SECONDARY,
  ADMIN_BTN_SECONDARY_COMPACT,
  ADMIN_FILTER_PANEL,
  ADMIN_MENU_ITEM_HOVER,
  ADMIN_SEARCH_SHELL,
  ADMIN_SELECT,
  ADMIN_SELECT_ACTIVE,
  ADMIN_TABLE_FRAME,
  ADMIN_TOOLBAR,
} from "@/lib/adminChrome";
import { adminTheme } from "@/lib/adminTheme";

type UserRow = {
  id: string;
  phone: string | null;
  email: string | null;
  name: string;
  city: string;
  gender: string;
  step: string;
  completed: boolean;
  optInStatus: string;
  joinedAt: string;
};

type CollegeDomainRow = { collegeName: string; domain: string };

const STEP_COLORS: Record<string, string> = {
  Complete: "#166534",
  Photos: "#1e40af",
  Habits: "#6b21a8",
  Interests: "#92400e",
  Preferences: "#9a3412",
  Profile: "#374151",
  New: "#9ca3af",
};

const HEADER_BG = adminTheme.tableHeader;
const HEADER_TEXT = adminTheme.ink;
/** Active filter: underline + label */
const FILTER_ACTIVE_BAR = adminTheme.orange;
/** Chip behind filtered column title */
const HEADER_FILTER_ACTIVE_BG = adminTheme.accentMutedBg;

/** Visually emphasize column title when that column’s filter/sort is applied */
function headerFilterLabelStyle(active: boolean): CSSProperties {
  if (!active) return { color: HEADER_TEXT };
  return {
    color: FILTER_ACTIVE_BAR,
    backgroundColor: HEADER_FILTER_ACTIVE_BG,
    fontWeight: 700,
  };
}

function tableStripeBackground(index: number): string {
  return index % 2 === 0 ? adminTheme.tableRow : adminTheme.tableRowAlt;
}

function parseAppliedCsv(csv: string): Set<string> {
  const s = new Set<string>();
  for (const part of csv.split(",").map((x) => x.trim().toLowerCase())) {
    if (part) s.add(part);
  }
  return s;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function pageHref(
  pageNum: number,
  filter: AdminUsersFilterTab,
  domainsCsv: string,
  gendersCsv: string,
  sort: AdminUserSort,
  q: string,
  optInStatus: AdminOptInStatusFilter,
) {
  return buildAdminUsersHref({
    filter,
    page: pageNum,
    domainsCsv: domainsCsv.trim() || undefined,
    gendersCsv: gendersCsv.trim() || undefined,
    sort,
    q: q.trim() || undefined,
    optInStatus,
  });
}

type OpenFilter = "email" | "gender" | "step" | null;

function ResetFilterButton({
  onClick,
  "aria-label": ariaLabel,
}: {
  onClick: () => void;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title="Reset this filter to default (clears column filter)"
      className={ADMIN_BTN_SECONDARY_COMPACT}
    >
      <RotateCcw size={12} strokeWidth={2.25} className="shrink-0 opacity-90" aria-hidden />
      Reset
    </button>
  );
}

export default function UsersTable({
  users,
  page,
  totalPages,
  filter,
  domainsCsv,
  gendersCsv,
  sort: sortProp,
  collegeDomains,
  initialDomainsCsv,
  initialGendersCsv,
  q,
  optInStatus,
  resetAllFiltersHref,
}: {
  users: UserRow[];
  page: number;
  totalPages: number;
  filter: AdminUsersFilterTab;
  domainsCsv: string;
  gendersCsv: string;
  sort: AdminUserSort;
  collegeDomains: CollegeDomainRow[];
  initialDomainsCsv: string;
  initialGendersCsv: string;
  /** Applied URL search (name or email, case-insensitive) */
  q: string;
  optInStatus: AdminOptInStatusFilter;
  resetAllFiltersHref: string;
}) {
  const router = useRouter();
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState(q);
  const [openFilter, setOpenFilter] = useState<OpenFilter>(null);
  const [domainSet, setDomainSet] = useState(() => parseAppliedCsv(initialDomainsCsv));
  const [genderSet, setGenderSet] = useState(() => {
    const s = new Set<string>();
    for (const g of initialGendersCsv.split(",").map((x) => x.trim())) {
      if (g && ADMIN_GENDER_OPTIONS.includes(g as (typeof ADMIN_GENDER_OPTIONS)[number])) {
        s.add(g);
      }
    }
    return s;
  });
  const [sortDraft, setSortDraft] = useState<AdminUserSort>(sortProp);

  const emailRootRef = useRef<HTMLTableCellElement>(null);
  const genderRootRef = useRef<HTMLTableCellElement>(null);
  const stepRootRef = useRef<HTMLTableCellElement>(null);
  const allDomainsSelectRef = useRef<HTMLInputElement>(null);
  const allGendersSelectRef = useRef<HTMLInputElement>(null);

  const allDomainsSelected = useMemo(
    () =>
      collegeDomains.length > 0 &&
      collegeDomains.every((cd) => domainSet.has(cd.domain.toLowerCase())),
    [collegeDomains, domainSet],
  );
  const someDomainsSelected = useMemo(
    () => collegeDomains.some((cd) => domainSet.has(cd.domain.toLowerCase())),
    [collegeDomains, domainSet],
  );
  const allGendersSelected = useMemo(
    () => ADMIN_GENDER_OPTIONS.every((g) => genderSet.has(g)),
    [genderSet],
  );
  const someGendersSelected = useMemo(
    () => ADMIN_GENDER_OPTIONS.some((g) => genderSet.has(g)),
    [genderSet],
  );

  useEffect(() => {
    const el = allDomainsSelectRef.current;
    if (el) el.indeterminate = someDomainsSelected && !allDomainsSelected;
  }, [someDomainsSelected, allDomainsSelected]);

  useEffect(() => {
    const el = allGendersSelectRef.current;
    if (el) el.indeterminate = someGendersSelected && !allGendersSelected;
  }, [someGendersSelected, allGendersSelected]);

  useEffect(() => {
    setDomainSet(parseAppliedCsv(initialDomainsCsv));
  }, [initialDomainsCsv]);

  useEffect(() => {
    const s = new Set<string>();
    for (const g of initialGendersCsv.split(",").map((x) => x.trim())) {
      if (g && ADMIN_GENDER_OPTIONS.includes(g as (typeof ADMIN_GENDER_OPTIONS)[number])) {
        s.add(g);
      }
    }
    setGenderSet(s);
  }, [initialGendersCsv]);

  useEffect(() => {
    setSortDraft(sortProp);
  }, [sortProp]);

  useEffect(() => {
    setSearchDraft(q);
  }, [q]);

  useEffect(() => {
    if (!openFilter) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (openFilter === "email" && emailRootRef.current?.contains(t)) return;
      if (openFilter === "gender" && genderRootRef.current?.contains(t)) return;
      if (openFilter === "step" && stepRootRef.current?.contains(t)) return;
      setOpenFilter(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFilter(null);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openFilter]);

  const draftDomainsCsv = useMemo(
    () =>
      collegeDomains
        .map((d) => d.domain.toLowerCase())
        .filter((d) => domainSet.has(d))
        .join(","),
    [collegeDomains, domainSet],
  );

  const draftGendersCsv = useMemo(() => [...genderSet].join(","), [genderSet]);

  function applyFromDraft() {
    const href = buildAdminUsersHref({
      filter,
      page: 1,
      domainsCsv: draftDomainsCsv || undefined,
      gendersCsv: draftGendersCsv || undefined,
      sort: sortDraft,
      q: q.trim() || undefined,
      optInStatus,
    });
    router.push(href);
    setOpenFilter(null);
  }

  function applyOptInStatus(value: AdminOptInStatusFilter) {
    router.push(
      buildAdminUsersHref({
        filter,
        page: 1,
        domainsCsv: domainsCsv.trim() || undefined,
        gendersCsv: gendersCsv.trim() || undefined,
        sort: sortProp,
        q: q.trim() || undefined,
        optInStatus: value,
      }),
    );
  }

  function toggleDomain(domainLower: string) {
    setDomainSet((prev) => {
      const next = new Set(prev);
      if (next.has(domainLower)) next.delete(domainLower);
      else next.add(domainLower);
      return next;
    });
  }

  function toggleGender(g: string) {
    setGenderSet((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }

  function toggleAllDomainsRow() {
    setDomainSet((prev) => {
      const every =
        collegeDomains.length > 0 &&
        collegeDomains.every((cd) => prev.has(cd.domain.toLowerCase()));
      if (every) return new Set<string>();
      return new Set(collegeDomains.map((d) => d.domain.toLowerCase()));
    });
  }

  function toggleAllGendersRow() {
    setGenderSet((prev) => {
      const every = ADMIN_GENDER_OPTIONS.every((g) => prev.has(g));
      if (every) return new Set<string>();
      return new Set<string>(ADMIN_GENDER_OPTIONS);
    });
  }

  function clearDomainFilter() {
    router.push(
      buildAdminUsersHref({
        filter,
        page: 1,
        domainsCsv: undefined,
        gendersCsv: gendersCsv.trim() || undefined,
        sort: sortProp,
        q: q.trim() || undefined,
        optInStatus,
      }),
    );
    setOpenFilter(null);
  }

  function clearGenderFilter() {
    router.push(
      buildAdminUsersHref({
        filter,
        page: 1,
        domainsCsv: domainsCsv.trim() || undefined,
        gendersCsv: undefined,
        sort: sortProp,
        q: q.trim() || undefined,
        optInStatus,
      }),
    );
    setOpenFilter(null);
  }

  function clearSortFilter() {
    router.push(
      buildAdminUsersHref({
        filter,
        page: 1,
        domainsCsv: domainsCsv.trim() || undefined,
        gendersCsv: gendersCsv.trim() || undefined,
        sort: "joined_desc",
        q: q.trim() || undefined,
        optInStatus,
      }),
    );
    setOpenFilter(null);
  }

  function applySearch() {
    router.push(
      buildAdminUsersHref({
        filter,
        page: 1,
        domainsCsv: domainsCsv.trim() || undefined,
        gendersCsv: gendersCsv.trim() || undefined,
        sort: sortProp,
        q: searchDraft.trim() || undefined,
        optInStatus,
      }),
    );
  }

  function clearSearch() {
    setSearchDraft("");
    router.push(
      buildAdminUsersHref({
        filter,
        page: 1,
        domainsCsv: domainsCsv.trim() || undefined,
        gendersCsv: gendersCsv.trim() || undefined,
        sort: sortProp,
        optInStatus,
      }),
    );
  }

  function toggleHeader(which: OpenFilter) {
    setOpenFilter((o) => (o === which ? null : which));
  }

  const plainThClass = "text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide align-middle";
  const filterBtnClass =
    "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide rounded-md px-1 py-0.5 -mx-1 hover:bg-bd-table-hover";

  const panelListClass =
    "flex flex-col gap-1 max-h-52 overflow-y-auto py-1.5 px-1 mb-2 rounded-md";

  const domainFilterActive = domainsCsv.trim().length > 0;
  const genderFilterActive = gendersCsv.trim().length > 0;
  const sortFilterActive = sortProp !== "joined_desc";
  const searchActive = q.trim().length > 0;

  return (
    <div>
      {detailUserId && (
        <UserDetailSheet userId={detailUserId} onClose={() => setDetailUserId(null)} />
      )}

      <div
        className={`${ADMIN_TOOLBAR} mb-5 flex w-full min-w-0 flex-row flex-nowrap items-center justify-between gap-3 overflow-x-auto`}
      >
        <form
          className="flex min-w-0 flex-1 flex-row flex-nowrap items-center gap-2"
          role="search"
          aria-label="Search users by name or email"
          onSubmit={(e) => {
            e.preventDefault();
            applySearch();
          }}
        >
          <div className={ADMIN_SEARCH_SHELL}>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 z-0 -translate-y-1/2"
              size={16}
              strokeWidth={2.25}
              color={adminTheme.mutedLabel}
              aria-hidden
            />
            <input
              type="text"
              role="searchbox"
              aria-label="Search by name or email"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search by name or email…"
              enterKeyHint="search"
              className={`box-border min-h-10 min-w-0 flex-1 border-0 bg-transparent py-2 pl-9 text-sm outline-none ring-0 focus:ring-0 ${
                searchDraft.trim().length > 0 || searchActive ? "pr-1" : "pr-3"
              }`}
              style={{ color: adminTheme.ink }}
              autoComplete="off"
            />
            {searchDraft.trim().length > 0 || searchActive ? (
              <button
                type="button"
                aria-label="Clear search"
                title="Clear search"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg px-2 transition-colors hover:bg-bd-table-hover"
                style={{ color: adminTheme.orange }}
                onClick={() => clearSearch()}
              >
                <X size={16} strokeWidth={2.25} aria-hidden />
              </button>
            ) : null}
          </div>
          <button type="submit" className={ADMIN_BTN_PRIMARY_SM}>
            Search
          </button>
        </form>
        <select
          value={optInStatus}
          onChange={(e) => applyOptInStatus(e.target.value as AdminOptInStatusFilter)}
          aria-label="Filter by opt-in status"
          className={`${ADMIN_SELECT} ${optInStatus !== "all" ? ADMIN_SELECT_ACTIVE : ""}`}
        >
          <option value="all">Opt-in: All</option>
          <option value="opted_in">Opted in</option>
          <option value="opted_out">Opted out</option>
          <option value="opted_in_late">Late</option>
        </select>
        <a
          href={buildAdminUsersExportHref({
            filter,
            domainsCsv: domainsCsv.trim() || undefined,
            gendersCsv: gendersCsv.trim() || undefined,
            sort: sortProp,
            q: q.trim() || undefined,
            optInStatus,
          })}
          download
          className={ADMIN_BTN_SECONDARY}
          title="Download CSV of all users matching current filters (includes all profile data and photo URLs)"
        >
          ↓ Download CSV
        </a>
        <a
          href={resetAllFiltersHref}
          className={ADMIN_BTN_SECONDARY}
          title="Clear search, domain, gender, and sort filters (table + toolbar); keeps All / Completed / Incomplete tab"
        >
          <RotateCcw size={14} strokeWidth={2.25} className="shrink-0 opacity-90" aria-hidden />
          Reset all filters
        </a>
      </div>

      <div className={ADMIN_TABLE_FRAME}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2" style={{ borderColor: adminTheme.borderMuted, backgroundColor: HEADER_BG }}>
              <th className={plainThClass} style={{ color: HEADER_TEXT }}>
                Name
              </th>
              <th
                ref={emailRootRef}
                className={`${plainThClass} relative align-top pb-2.5`}
                style={{ color: domainFilterActive ? FILTER_ACTIVE_BAR : HEADER_TEXT }}
                title={
                  domainFilterActive
                    ? "College domain filter active — use Email / Phone ▼ or Reset to change"
                    : undefined
                }
              >
                <button
                  type="button"
                  className={`${filterBtnClass}${domainFilterActive ? " rounded-md px-1.5 py-0.5" : ""}`}
                  style={headerFilterLabelStyle(domainFilterActive)}
                  aria-expanded={openFilter === "email"}
                  onClick={() => toggleHeader("email")}
                >
                  Email / Phone
                  <ChevronDown
                    size={14}
                    className="shrink-0 opacity-70"
                    style={{
                      color: domainFilterActive ? FILTER_ACTIVE_BAR : undefined,
                      transform: openFilter === "email" ? "rotate(180deg)" : undefined,
                      transition: "transform 0.15s",
                    }}
                  />
                </button>
                {domainFilterActive && (
                  <span
                    className="pointer-events-none absolute bottom-0 left-2 right-2 h-[3px] rounded-sm"
                    style={{ backgroundColor: FILTER_ACTIVE_BAR }}
                    aria-hidden
                  />
                )}
                {openFilter === "email" && (
                  <div className={ADMIN_FILTER_PANEL}>
                    <div className="flex items-center justify-between gap-2 mb-1.5 pr-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: adminTheme.mutedLabel }}>
                        College domains
                      </p>
                      <ResetFilterButton onClick={clearDomainFilter} aria-label="Reset domain filter" />
                    </div>
                    {collegeDomains.length === 0 ? (
                      <p className="text-xs py-2" style={{ color: adminTheme.textSecondary }}>
                        No domains in database.
                      </p>
                    ) : (
                      <div className={panelListClass}>
                        <label
                          className="flex items-center gap-2 text-xs cursor-pointer py-1.5 px-1.5 rounded-md border-b font-semibold"
                          style={{ color: adminTheme.ink, borderColor: adminTheme.borderSoft }}
                        >
                          <input
                            ref={allDomainsSelectRef}
                            type="checkbox"
                            checked={allDomainsSelected}
                            onChange={toggleAllDomainsRow}
                            className="rounded border-gray-300"
                          />
                          All colleges
                        </label>
                        {collegeDomains.map((cd) => {
                          const d = cd.domain.toLowerCase();
                          const checked = domainSet.has(d);
                          return (
                            <label
                              key={cd.domain}
                              className={`flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-xs ${ADMIN_MENU_ITEM_HOVER}`}
                              style={{ color: adminTheme.ink }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleDomain(d)}
                                className="mt-0.5 rounded border-gray-300"
                              />
                              <span>
                                <span className="font-medium">{cd.collegeName}</span>
                                <span className="block" style={{ color: adminTheme.mutedLabel }}>
                                  {cd.domain}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <button type="button" onClick={applyFromDraft} className={ADMIN_BTN_PRIMARY_BLOCK}>
                      Apply
                    </button>
                  </div>
                )}
              </th>
              <th className={plainThClass} style={{ color: HEADER_TEXT }}>
                City
              </th>
              <th
                ref={genderRootRef}
                className={`${plainThClass} relative align-top pb-2.5`}
                style={{ color: genderFilterActive ? FILTER_ACTIVE_BAR : HEADER_TEXT }}
                title={
                  genderFilterActive
                    ? "Gender filter active — use Gender ▼ or Reset to change"
                    : undefined
                }
              >
                <button
                  type="button"
                  className={`${filterBtnClass}${genderFilterActive ? " rounded-md px-1.5 py-0.5" : ""}`}
                  style={headerFilterLabelStyle(genderFilterActive)}
                  aria-expanded={openFilter === "gender"}
                  onClick={() => toggleHeader("gender")}
                >
                  Gender
                  <ChevronDown
                    size={14}
                    className="shrink-0 opacity-70"
                    style={{
                      color: genderFilterActive ? FILTER_ACTIVE_BAR : undefined,
                      transform: openFilter === "gender" ? "rotate(180deg)" : undefined,
                      transition: "transform 0.15s",
                    }}
                  />
                </button>
                {genderFilterActive && (
                  <span
                    className="pointer-events-none absolute bottom-0 left-2 right-2 h-[3px] rounded-sm"
                    style={{ backgroundColor: FILTER_ACTIVE_BAR }}
                    aria-hidden
                  />
                )}
                {openFilter === "gender" && (
                  <div className={ADMIN_FILTER_PANEL}>
                    <div className="flex items-center justify-between gap-2 mb-1.5 pr-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: adminTheme.mutedLabel }}>
                        Gender
                      </p>
                      <ResetFilterButton onClick={clearGenderFilter} aria-label="Reset gender filter" />
                    </div>
                    <div className={panelListClass}>
                      <label
                        className="flex items-center gap-2 text-xs cursor-pointer py-1.5 px-1.5 rounded-md border-b font-semibold"
                        style={{ color: adminTheme.ink, borderColor: adminTheme.borderSoft }}
                      >
                        <input
                          ref={allGendersSelectRef}
                          type="checkbox"
                          checked={allGendersSelected}
                          onChange={toggleAllGendersRow}
                          className="rounded border-gray-300"
                        />
                        All genders
                      </label>
                      {ADMIN_GENDER_OPTIONS.map((g) => {
                        const checked = genderSet.has(g);
                        return (
                          <label
                            key={g}
                            className={`flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-xs ${ADMIN_MENU_ITEM_HOVER}`}
                            style={{ color: adminTheme.ink }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleGender(g)}
                              className="rounded border-gray-300"
                            />
                            {g}
                          </label>
                        );
                      })}
                    </div>
                    <button type="button" onClick={applyFromDraft} className={ADMIN_BTN_PRIMARY_BLOCK}>
                      Apply
                    </button>
                  </div>
                )}
              </th>
              <th
                ref={stepRootRef}
                className={`${plainThClass} relative align-top pb-2.5`}
                style={{ color: sortFilterActive ? FILTER_ACTIVE_BAR : HEADER_TEXT }}
                title={
                  sortFilterActive
                    ? "Sort override active — use Step ▼ or Reset to restore default"
                    : undefined
                }
              >
                <button
                  type="button"
                  className={`${filterBtnClass}${sortFilterActive ? " rounded-md px-1.5 py-0.5" : ""}`}
                  style={headerFilterLabelStyle(sortFilterActive)}
                  aria-expanded={openFilter === "step"}
                  onClick={() => toggleHeader("step")}
                >
                  Step
                  <ChevronDown
                    size={14}
                    className="shrink-0 opacity-70"
                    style={{
                      color: sortFilterActive ? FILTER_ACTIVE_BAR : undefined,
                      transform: openFilter === "step" ? "rotate(180deg)" : undefined,
                      transition: "transform 0.15s",
                    }}
                  />
                </button>
                {sortFilterActive && (
                  <span
                    className="pointer-events-none absolute bottom-0 left-2 right-2 h-[3px] rounded-sm"
                    style={{ backgroundColor: FILTER_ACTIVE_BAR }}
                    aria-hidden
                  />
                )}
                {openFilter === "step" && (
                  <div className={ADMIN_FILTER_PANEL}>
                    <div className="flex items-center justify-between gap-2 mb-1.5 pr-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: adminTheme.mutedLabel }}>
                        Sort list by
                      </p>
                      <ResetFilterButton
                        onClick={clearSortFilter}
                        aria-label="Reset sort to default (newest joined first)"
                      />
                    </div>
                    <div className={panelListClass}>
                      {(
                        [
                          ["joined_desc", "Joined (newest first)"],
                          ["joined_asc", "Joined (oldest first)"],
                          ["completed_first", "Onboarding complete first"],
                          ["incomplete_first", "Onboarding incomplete first"],
                        ] as const
                      ).map(([value, label]) => (
                        <label
                          key={value}
                          className={`flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-xs ${ADMIN_MENU_ITEM_HOVER}`}
                          style={{ color: adminTheme.ink }}
                        >
                          <input
                            type="radio"
                            name="admin-users-sort"
                            checked={sortDraft === value}
                            onChange={() => setSortDraft(parseAdminUserSort(value))}
                            className="border-gray-300"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <button type="button" onClick={applyFromDraft} className={ADMIN_BTN_PRIMARY_BLOCK}>
                      Apply
                    </button>
                  </div>
                )}
              </th>
              <th className={plainThClass} style={{ color: HEADER_TEXT }}>
                Opt-in
              </th>
              <th className={plainThClass} style={{ color: HEADER_TEXT }}>
                Joined
              </th>
              <th className={`${plainThClass} w-12`} style={{ color: HEADER_TEXT }} aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr style={{ backgroundColor: adminTheme.tableSurface }}>
                <td colSpan={8} className="px-4 py-16 text-center text-sm" style={{ color: adminTheme.mutedLabel }}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u, i) => (
                <tr
                  key={u.id}
                  className="transition-colors duration-150"
                  style={{
                    backgroundColor: tableStripeBackground(i),
                    borderBottom: i < users.length - 1 ? `1px solid ${adminTheme.borderSoft}` : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = adminTheme.tableRowHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = tableStripeBackground(i);
                  }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: adminTheme.ink }}>
                    {u.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: adminTheme.mutedLabel }}>
                    {u.email ?? u.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: adminTheme.textSecondary }}>
                    {u.city}
                  </td>
                  <td className="px-4 py-3" style={{ color: adminTheme.textSecondary }}>
                    {u.gender}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        color: STEP_COLORS[u.step] ?? "#374151",
                        backgroundColor: `${STEP_COLORS[u.step] ?? "#374151"}18`,
                      }}
                    >
                      {u.step}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.optInStatus === "opted_in" ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: "#166534", backgroundColor: "#16653418" }}>
                        Opted in
                      </span>
                    ) : u.optInStatus === "opted_in_late" ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: "#92400e", backgroundColor: "#92400e18" }}>
                        Late
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: "#6b7280", backgroundColor: "#6b728018" }}>
                        Opted out
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3" style={{ color: adminTheme.mutedLabel }}>
                    {formatDate(u.joinedAt)}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <button
                      type="button"
                      aria-label="Open user details"
                      className="inline-flex rounded-lg p-2 transition hover:bg-bd-table-hover"
                      style={{ color: adminTheme.textSecondary }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailUserId(u.id);
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-xs" style={{ color: adminTheme.mutedLabel }}>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <a
                href={pageHref(page - 1, filter, domainsCsv, gendersCsv, sortProp, q, optInStatus)}
                className={ADMIN_BTN_NEUTRAL_SM}
              >
                <ChevronLeft size={13} /> Prev
              </a>
            ) : (
              <span className={`${ADMIN_BTN_NEUTRAL_SM} pointer-events-none opacity-40`}>
                <ChevronLeft size={13} /> Prev
              </span>
            )}

            {page < totalPages ? (
              <a
                href={pageHref(page + 1, filter, domainsCsv, gendersCsv, sortProp, q, optInStatus)}
                className={ADMIN_BTN_NEUTRAL_SM}
              >
                Next <ChevronRight size={13} />
              </a>
            ) : (
              <span className={`${ADMIN_BTN_NEUTRAL_SM} pointer-events-none opacity-40`}>
                Next <ChevronRight size={13} />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
