"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  RotateCcw,
  Search,
  User,
  X,
} from "lucide-react";
import {
  ADMIN_GENDER_OPTIONS,
  buildAdminUsersHref,
  parseAdminUserSort,
  type AdminOptInStatusFilter,
  type AdminUserSort,
  type AdminUsersFilterTab,
} from "@/lib/adminUserStep";

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

type DetailPayload = {
  id: string;
  email: string | null;
  phone: string | null;
  collegeName: string | null;
  photoUrl: string | null;
  name: string | null;
  nickname: string | null;
  city: string | null;
  age: number | null;
  gender: string | null;
  interests: string[];
  lookingFor: string | null;
  heightCm: number | null;
  drinking: string | null;
  smoking: string | null;
  religion: string | null;
  familyPlans: string | null;
  kidsPreference: string | null;
};

const STEP_COLORS: Record<string, string> = {
  Complete: "#166534",
  Photos: "#1e40af",
  Habits: "#6b21a8",
  Interests: "#92400e",
  Preferences: "#9a3412",
  Profile: "#374151",
  New: "#9ca3af",
};

const HEADER_BG = "#F3F4F6";
const HEADER_TEXT = "#374151";
/** Active filter: underline + label (admin purple, matches Search / Reset) */
const FILTER_ACTIVE_BAR = "#6B2F7A";
/** Chip behind filtered column title */
const HEADER_FILTER_ACTIVE_BG = "#EDE8F7";

/** Visually emphasize column title when that column’s filter/sort is applied */
function headerFilterLabelStyle(active: boolean): CSSProperties {
  if (!active) return { color: HEADER_TEXT };
  return {
    color: FILTER_ACTIVE_BAR,
    backgroundColor: HEADER_FILTER_ACTIVE_BG,
    fontWeight: 700,
  };
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

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b last:border-b-0" style={{ borderColor: "#F0EBFA" }}>
      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#9B87B0" }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: "#1A0A2E" }}>
        {value}
      </span>
    </div>
  );
}

function UserDetailSheet({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<DetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Failed to load");
        setData(null);
        return;
      }
      setData(json.data as DetailPayload);
    } catch {
      setError("Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 z-50 h-full w-full max-w-md shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: "#fff", borderLeft: "1px solid #EDE8F7" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: "#F0EBFA" }}
        >
          <span className="text-sm font-semibold" style={{ color: "#1A0A2E" }}>
            User details
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-violet-50 transition"
            aria-label="Close"
          >
            <X size={18} style={{ color: "#6B5E7A" }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading && (
            <p className="text-sm" style={{ color: "#9B87B0" }}>
              Loading…
            </p>
          )}
          {error && !loading && <p className="text-sm text-red-600">{error}</p>}
          {data && !loading && (
            <>
              <div
                className="relative w-full rounded-xl overflow-hidden mb-4"
                style={{ aspectRatio: "4/3", backgroundColor: "#F5F0FB" }}
              >
                {data.photoUrl ? (
                  <Image
                    src={data.photoUrl}
                    alt={data.name ?? "User"}
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User size={48} strokeWidth={1} style={{ color: "#C060C0" }} />
                  </div>
                )}
              </div>

              <p className="text-lg font-bold" style={{ color: "#1A0A2E" }}>
                {data.name ?? "—"}
                {data.age != null && (
                  <span className="font-normal text-sm" style={{ color: "#6B5E7A" }}>
                    , {data.age} yrs
                  </span>
                )}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#9B87B0" }}>
                {[data.gender, data.city].filter(Boolean).join(" · ") || "—"}
              </p>
              {data.email && (
                <p className="text-xs font-mono mt-1 break-all" style={{ color: "#6B5E7A" }}>
                  {data.email}
                </p>
              )}

              <p className="text-[10px] font-bold uppercase tracking-wide mt-6 mb-2" style={{ color: "#9B87B0" }}>
                Profile
              </p>
              {data.interests.length > 0 && (
                <div className="py-2 border-b last:border-b-0" style={{ borderColor: "#F0EBFA" }}>
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#9B87B0" }}>
                    Interests
                  </span>
                  <p className="text-sm mt-1" style={{ color: "#1A0A2E" }}>
                    {data.interests.join(", ")}
                  </p>
                </div>
              )}
              <DetailRow label="Looking for" value={data.lookingFor ?? null} />
              <DetailRow label="Height" value={data.heightCm != null ? `${data.heightCm} cm` : null} />

              <p className="text-[10px] font-bold uppercase tracking-wide mt-6 mb-2" style={{ color: "#9B87B0" }}>
                Lifestyle
              </p>
              <DetailRow label="Drinking" value={data.drinking ?? null} />
              <DetailRow label="Smoking" value={data.smoking ?? null} />
              <DetailRow label="Religion" value={data.religion ?? null} />
              <DetailRow label="Family plans" value={data.familyPlans ?? null} />
              <DetailRow label="Kids preference" value={data.kidsPreference ?? null} />
            </>
          )}
        </div>
      </aside>
    </>
  );
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
      className="inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors hover:border-violet-400 hover:bg-violet-50"
      style={{
        borderColor: "#C9B8D9",
        color: "#6B2F7A",
        backgroundColor: "#FAF5FC",
      }}
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
    "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide rounded-md px-1 py-0.5 -mx-1 hover:bg-black/5";

  const panelClass =
    "absolute left-0 top-full z-50 mt-1 min-w-[260px] max-w-[min(320px,calc(100vw-2rem))] rounded-lg border bg-white px-3 py-2 shadow-lg";
  const panelStyle = { borderColor: "#EDE8F7" } as const;
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

      <div className="mb-3 flex w-full min-w-0 flex-row flex-nowrap items-center justify-between gap-3 overflow-x-auto">
        <form
          className="flex min-w-0 flex-1 flex-row flex-nowrap items-center gap-2"
          role="search"
          aria-label="Search users by name or email"
          onSubmit={(e) => {
            e.preventDefault();
            applySearch();
          }}
        >
          <div
            className="relative flex min-h-10 min-w-[min(100%,14rem)] flex-1 items-center overflow-hidden rounded-xl border bg-white pr-1 transition focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-200"
            style={{ borderColor: "#C9B8D9" }}
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 z-0 -translate-y-1/2"
              size={16}
              strokeWidth={2.25}
              color="#9B87B0"
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
              style={{ color: "#1A0A2E" }}
              autoComplete="off"
            />
            {searchDraft.trim().length > 0 || searchActive ? (
              <button
                type="button"
                aria-label="Clear search"
                title="Clear search"
                className="inline-flex h-9 w-9 px-2 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[#EDE8F7]"
                style={{ color: "#6B2F7A" }}
                onClick={() => clearSearch()}
              >
                <X size={16} strokeWidth={2.25} aria-hidden />
              </button>
            ) : null}
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:border-violet-400 hover:bg-violet-50"
            style={{ borderColor: "#C9B8D9", color: "#6B2F7A", backgroundColor: "#FAF5FC" }}
          >
            Search
          </button>
        </form>
        <select
          value={optInStatus}
          onChange={(e) => applyOptInStatus(e.target.value as AdminOptInStatusFilter)}
          aria-label="Filter by opt-in status"
          className="shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:border-violet-400 hover:bg-violet-50 cursor-pointer"
          style={{
            borderColor: optInStatus !== "all" ? "#6B2F7A" : "#C9B8D9",
            color: optInStatus !== "all" ? "#6B2F7A" : "#6B5E7A",
            backgroundColor: optInStatus !== "all" ? "#EDE8F7" : "#FAF5FC",
          }}
        >
          <option value="all">Opt-in: All</option>
          <option value="opted_in">Opted in</option>
          <option value="opted_out">Opted out</option>
          <option value="opted_in_late">Late</option>
        </select>
        <a
          href={resetAllFiltersHref}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-2 text-xs font-semibold transition-colors hover:border-violet-400 hover:bg-violet-50"
          style={{
            borderColor: "#C9B8D9",
            color: "#6B2F7A",
            backgroundColor: "#FAF5FC",
          }}
          title="Clear search, domain, gender, and sort filters (table + toolbar); keeps All / Completed / Incomplete tab"
        >
          <RotateCcw size={14} strokeWidth={2.25} className="shrink-0 opacity-90" aria-hidden />
          Reset all filters
        </a>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm" style={{ borderColor: "#EDE8F7" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "#E5E7EB", backgroundColor: HEADER_BG }}>
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
                  <div className={panelClass} style={panelStyle}>
                    <div className="flex items-center justify-between gap-2 mb-1.5 pr-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#9B87B0" }}>
                        College domains
                      </p>
                      <ResetFilterButton onClick={clearDomainFilter} aria-label="Reset domain filter" />
                    </div>
                    {collegeDomains.length === 0 ? (
                      <p className="text-xs py-2" style={{ color: "#6B5E7A" }}>
                        No domains in database.
                      </p>
                    ) : (
                      <div className={panelListClass}>
                        <label
                          className="flex items-center gap-2 text-xs cursor-pointer py-1.5 px-1.5 rounded-md border-b font-semibold"
                          style={{ color: "#1A0A2E", borderColor: "#F0EBFA" }}
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
                              className="flex items-start gap-2 text-xs cursor-pointer py-1 px-1.5 rounded-md hover:bg-violet-50/60"
                              style={{ color: "#1A0A2E" }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleDomain(d)}
                                className="mt-0.5 rounded border-gray-300"
                              />
                              <span>
                                <span className="font-medium">{cd.collegeName}</span>
                                <span className="block" style={{ color: "#9B87B0" }}>
                                  {cd.domain}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={applyFromDraft}
                      className="w-full py-2 rounded-md text-xs font-semibold text-white"
                      style={{ background: "linear-gradient(135deg,#8F3A8F,#C060C0)" }}
                    >
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
                  <div className={panelClass} style={panelStyle}>
                    <div className="flex items-center justify-between gap-2 mb-1.5 pr-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#9B87B0" }}>
                        Gender
                      </p>
                      <ResetFilterButton onClick={clearGenderFilter} aria-label="Reset gender filter" />
                    </div>
                    <div className={panelListClass}>
                      <label
                        className="flex items-center gap-2 text-xs cursor-pointer py-1.5 px-1.5 rounded-md border-b font-semibold"
                        style={{ color: "#1A0A2E", borderColor: "#F0EBFA" }}
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
                            className="flex items-center gap-2 text-xs cursor-pointer py-1.5 px-1.5 rounded-md hover:bg-violet-50/60"
                            style={{ color: "#1A0A2E" }}
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
                    <button
                      type="button"
                      onClick={applyFromDraft}
                      className="w-full py-2 rounded-md text-xs font-semibold text-white"
                      style={{ background: "linear-gradient(135deg,#8F3A8F,#C060C0)" }}
                    >
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
                  <div className={panelClass} style={panelStyle}>
                    <div className="flex items-center justify-between gap-2 mb-1.5 pr-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#9B87B0" }}>
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
                          className="flex items-center gap-2 text-xs cursor-pointer py-1.5 px-1.5 rounded-md hover:bg-violet-50/60"
                          style={{ color: "#1A0A2E" }}
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
                    <button
                      type="button"
                      onClick={applyFromDraft}
                      className="w-full py-2 rounded-md text-xs font-semibold text-white"
                      style={{ background: "linear-gradient(135deg,#8F3A8F,#C060C0)" }}
                    >
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
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-sm" style={{ color: "#9B87B0" }}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u, i) => (
                <tr
                  key={u.id}
                  className="transition-colors"
                  style={{
                    borderBottom: i < users.length - 1 ? "1px solid #F9F6FE" : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#FAF8FF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "";
                  }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: "#1A0A2E" }}>
                    {u.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "#9B87B0" }}>
                    {u.email ?? u.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#6B5E7A" }}>
                    {u.city}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#6B5E7A" }}>
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
                  <td className="px-4 py-3" style={{ color: "#9B87B0" }}>
                    {formatDate(u.joinedAt)}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <button
                      type="button"
                      aria-label="Open user details"
                      className="inline-flex p-2 rounded-lg hover:bg-violet-100 transition"
                      style={{ color: "#6B5E7A" }}
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
          <span className="text-xs" style={{ color: "#9B87B0" }}>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <a
                href={pageHref(page - 1, filter, domainsCsv, gendersCsv, sortProp, q, optInStatus)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition"
                style={{ borderColor: "#EDE8F7", color: "#6B5E7A", backgroundColor: "#fff" }}
              >
                <ChevronLeft size={13} /> Prev
              </a>
            ) : (
              <span
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border opacity-40"
                style={{ borderColor: "#EDE8F7", color: "#6B5E7A" }}
              >
                <ChevronLeft size={13} /> Prev
              </span>
            )}

            {page < totalPages ? (
              <a
                href={pageHref(page + 1, filter, domainsCsv, gendersCsv, sortProp, q, optInStatus)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition"
                style={{ borderColor: "#EDE8F7", color: "#6B5E7A", backgroundColor: "#fff" }}
              >
                Next <ChevronRight size={13} />
              </a>
            ) : (
              <span
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border opacity-40"
                style={{ borderColor: "#EDE8F7", color: "#6B5E7A" }}
              >
                Next <ChevronRight size={13} />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
