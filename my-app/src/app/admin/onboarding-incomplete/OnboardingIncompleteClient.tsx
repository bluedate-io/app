"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, MoreVertical, X } from "lucide-react";

const DARK = "#1A0A2E";
const MUTED = "#6B5E7A";
const SUBTLE = "#9B87B0";

type Row = {
  id: string;
  email: string | null;
  createdAt: string;
  profile: { fullName: string | null } | null;
  reminderCount: number;
  lastReminderSentAt: string | null;
};

type RecentSend = {
  id: string;
  sentAt: string;
  recipientCount: number;
  sentByName: string | null;
  recipients: Array<{ userId: string; fullName: string | null; email: string | null }>;
};

const RECIPIENTS_PREVIEW_CAP = 50;

type LastSend = {
  sentAt: string;
  recipientCount: number;
  sentByName: string | null;
} | null;

type SortOption =
  | "joined_desc"
  | "joined_asc"
  | "reminders_desc"
  | "reminders_asc";

type ListPayload = {
  total: number;
  emailableTotal: number;
  users: Row[];
  page: number;
  pageSize: number;
  lastSend: LastSend;
  recentSends: RecentSend[];
  q: string;
  sort: SortOption;
};
type HistoryEvent = {
  id: string;
  sentAt: string;
  batchBccCount: number;
  sentByName: string | null;
};

type ReminderHistoryPayload = {
  user: { id: string; fullName: string | null; email: string | null };
  events: HistoryEvent[];
};



function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function recipientDisplayName(r: RecentSend["recipients"][number]) {
  const name = r.fullName?.trim();
  if (name) return name;
  if (r.email?.trim()) return r.email.trim();
  return `Unknown user (${r.userId.slice(0, 8)}…)`;
}

function ReminderHistorySheet({
  open,
  onClose,
  titleLine,
  loading,
  error,
  data,
}: {
  open: boolean;
  onClose: () => void;
  titleLine: string;
  loading: boolean;
  error: string | null;
  data: ReminderHistoryPayload | null;
}) {
  if (!open) return null;

  const displayName =
    titleLine.trim() ||
    data?.user.fullName?.trim() ||
    data?.user.email?.trim() ||
    (data ? `User ${data.user.id.slice(0, 8)}…` : "User");

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        className="relative z-[61] flex h-full w-full max-w-md flex-col border-l bg-white shadow-2xl"
        style={{ borderColor: "#EDE8F7" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-history-title"
      >
        <div
          className="flex items-start justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: "#EDE8F7", backgroundColor: "#FAF8FC" }}
        >
          <div className="min-w-0">
            <h2 id="reminder-history-title" className="text-base font-bold truncate" style={{ color: DARK }}>
              Reminder history
            </h2>
            <p className="text-sm mt-0.5 truncate" style={{ color: MUTED }}>
              {displayName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-violet-100/60 transition shrink-0"
            aria-label="Close"
          >
            <X size={20} style={{ color: MUTED }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && <p className="text-sm" style={{ color: SUBTLE }}>Loading…</p>}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {!loading && !error && data && data.events.length === 0 && (
            <p className="text-sm" style={{ color: SUBTLE }}>
              No reminder emails have been sent to this user yet.
            </p>
          )}
          {!loading && !error && data && data.events.length > 0 && (
            <ol className="space-y-4">
              {data.events.map((ev, i) => (
                <li
                  key={ev.id}
                  className="rounded-xl border px-4 py-3"
                  style={{ borderColor: "#EDE8F7" }}
                >
                  <p className="text-xs font-semibold mb-1" style={{ color: SUBTLE }}>
                    #{data.events.length - i}
                  </p>
                  <p className="text-sm font-medium" style={{ color: DARK }}>
                    {formatDate(ev.sentAt)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: MUTED }}>
                    Sent by {ev.sentByName?.trim() ? ev.sentByName : "Admin"} · Batch had{" "}
                    {ev.batchBccCount} BCC recipient{ev.batchBccCount === 1 ? "" : "s"}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
}



function ConfirmSendModal({
  selectedCount,
  onCancel,
  onConfirm,
  confirming,
}: {
  selectedCount: number;
  onCancel: () => void;
  onConfirm: () => void;
  confirming: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onCancel}
      />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl border bg-white shadow-2xl p-6"
        style={{ borderColor: "#EDE8F7" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-reminder-confirm-title"
      >
        <p
          id="onboarding-reminder-confirm-title"
          className="text-base font-bold mb-1"
          style={{ color: DARK }}
        >
          Send onboarding reminder?
        </p>
        <p className="text-sm mb-4" style={{ color: MUTED }}>
          One email will go to {selectedCount} recipient{selectedCount === 1 ? "" : "s"} in BCC.
          They will not see each other&apos;s addresses.
        </p>

        <ul className="flex flex-col gap-2 mb-6">
          {[
            "Single message to all selected users",
            "Addresses hidden via BCC",
            "Send is logged for “last sent” on this page",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm" style={{ color: DARK }}>
              <Check size={14} className="shrink-0" style={{ color: "#166534" }} />
              {item}
            </li>
          ))}
        </ul>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition hover:bg-gray-50"
            style={{ borderColor: "#C9B8D9", color: MUTED }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition"
            style={{
              background: confirming ? SUBTLE : "linear-gradient(135deg,#8F3A8F,#C060C0)",
              opacity: confirming ? 0.85 : 1,
            }}
          >
            {confirming ? "Sending…" : "Send reminder"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingIncompleteClient() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ListPayload | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAllMatching, setSelectAllMatching] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expandedSendIds, setExpandedSendIds] = useState<Set<string>>(new Set());
  const [historyForUser, setHistoryForUser] = useState<Row | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<ReminderHistoryPayload | null>(null);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [committedQ, setCommittedQ] = useState("");
  const [sort, setSort] = useState<SortOption>("joined_desc");

  const toggleSendExpanded = (id: string) => {
    setExpandedSendIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sort,
      });
      if (committedQ.trim()) params.set("q", committedQ.trim());
      const res = await fetch(`/api/admin/onboarding-incomplete?${params.toString()}`, {
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as { error?: { message?: string } }).error?.message ?? "Failed to load");
        setData(null);
        return;
      }
      const raw = (json as { data: ListPayload & { q?: string; sort?: string } }).data;
      const maxPage = Math.max(1, Math.ceil(raw.total / raw.pageSize));
      if (raw.total > 0 && page > maxPage) {
        setPage(maxPage);
        return;
      }
      const s = raw.sort;
      const sortNorm: SortOption =
        s === "joined_asc" || s === "reminders_desc" || s === "reminders_asc" ? s : "joined_desc";
      const payload: ListPayload = {
        ...raw,
        emailableTotal: typeof raw.emailableTotal === "number" ? raw.emailableTotal : 0,
        q: raw.q ?? "",
        sort: sortNorm,
      };
      setData(payload);
      setSelected(new Set());
      setSelectAllMatching(false);
    } catch {
      setError("Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, committedQ, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = data?.users ?? [];
  const selectableIds = useMemo(
    () => rows.filter((r) => r.email?.trim()).map((r) => r.id),
    [rows],
  );
  const allSelectableSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  const someSelectedOnPage = useMemo(
    () => selectableIds.some((id) => selected.has(id)),
    [selectableIds, selected],
  );

  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (!el) return;
    el.indeterminate =
      !selectAllMatching && someSelectedOnPage && !allSelectableSelected;
  }, [someSelectedOnPage, allSelectableSelected, selectAllMatching]);

  useEffect(() => {
    if (!historyForUser) {
      setHistoryData(null);
      setHistoryError(null);
      setHistoryLoading(false);
      return;
    }
    const userId = historyForUser.id;
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryData(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/admin/onboarding-incomplete/users/${encodeURIComponent(userId)}/reminder-history`,
          { credentials: "include" },
        );
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setHistoryError(
            (json as { error?: { message?: string } }).error?.message ?? "Failed to load history",
          );
          setHistoryLoading(false);
          return;
        }
        setHistoryData((json as { data: ReminderHistoryPayload }).data);
      } catch {
        if (!cancelled) setHistoryError("Failed to load history");
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [historyForUser]);

  const toggleRow = (id: string, hasEmail: boolean) => {
    if (!hasEmail) return;
    setSelectAllMatching(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectPage = () => {
    setSelectAllMatching(false);
    if (allSelectableSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of selectableIds) next.delete(id);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of selectableIds) next.add(id);
        return next;
      });
    }
  };

  const toggleSelectAllIncomplete = () => {
    if (selectAllMatching) {
      setSelectAllMatching(false);
      setSelected(new Set());
    } else {
      setSelectAllMatching(true);
      setSelected(new Set());
    }
  };

  const emailableTotal = data?.emailableTotal ?? 0;
  const effectiveCount = selectAllMatching ? emailableTotal : selected.size;

  const sendReminders = async () => {
    if (effectiveCount === 0) return;
    setSending(true);
    setSendError(null);
    try {
      const body = selectAllMatching
        ? { selectAllMatching: true as const, q: committedQ }
        : { userIds: [...selected] };
      const res = await fetch("/api/admin/onboarding-incomplete/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSendError((json as { error?: { message?: string } }).error?.message ?? "Send failed");
        return;
      }
      setConfirmOpen(false);
      await load();
    } catch {
      setSendError("Send failed");
    } finally {
      setSending(false);
    }
  };

  const lastSend = data?.lastSend ?? null;
  const recentSends = data?.recentSends ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const rangeStart = data && data.total > 0 ? (page - 1) * data.pageSize + 1 : 0;
  const rangeEnd = data ? Math.min(page * data.pageSize, data.total) : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {confirmOpen && effectiveCount > 0 && (
        <ConfirmSendModal
          selectedCount={effectiveCount}
          onCancel={() => !sending && setConfirmOpen(false)}
          onConfirm={() => void sendReminders()}
          confirming={sending}
        />
      )}

      <ReminderHistorySheet
        open={historyForUser !== null}
        onClose={() => setHistoryForUser(null)}
        titleLine={
          historyForUser
            ? historyForUser.profile?.fullName?.trim() ||
              historyForUser.email?.trim() ||
              `User ${historyForUser.id.slice(0, 8)}…`
            : ""
        }
        loading={historyLoading}
        error={historyError}
        data={historyData}
      />

      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-0.5"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#1A0A2E" }}
        >
          Onboarding reminders
        </h1>
        <p className="text-sm" style={{ color: "#9B87B0" }}>
          Users who have not completed onboarding. Select rows and send one BCC email.
        </p>
        {data != null && (
          <p className="text-sm mt-1.5" style={{ color: "#6B5E7A" }}>
            {data.total} user{data.total === 1 ? "" : "s"}
            {committedQ.trim() ? ` matching "${committedQ.trim()}"` : null}
          </p>
        )}
      </div>

      <div
        className="mb-5 rounded-xl border px-4 py-3 text-sm"
        style={{ borderColor: "#EDE8F7", backgroundColor: "#fff" }}
      >
        {lastSend ? (
          <p style={{ color: "#6B5E7A", margin: 0 }}>
            <span className="font-medium" style={{ color: "#1A0A2E" }}>
              Last sent:
            </span>{" "}
            {formatDate(lastSend.sentAt)}
            {" · "}
            {lastSend.recipientCount} BCC recipient{lastSend.recipientCount === 1 ? "" : "s"}
            {lastSend.sentByName != null && lastSend.sentByName !== ""
              ? ` · by ${lastSend.sentByName}`
              : ""}
          </p>
        ) : (
          <p style={{ color: "#9B87B0", margin: 0 }}>No reminder emails have been sent yet.</p>
        )}
      </div>

      {recentSends.length > 0 && (
        <div
          className="mb-6 rounded-xl border overflow-hidden"
          style={{ borderColor: "#EDE8F7", backgroundColor: "#fff" }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: "#EDE8F7", backgroundColor: "#FAF8FC" }}>
            <h2 className="text-sm font-semibold" style={{ color: DARK }}>
              Recent sends
            </h2>
            <p className="text-xs mt-0.5" style={{ color: SUBTLE }}>
              Who was included in each batch (newest first).
            </p>
          </div>
          <ul className="divide-y" style={{ borderColor: "#F5F0FB" }}>
            {recentSends.map((send) => {
              const open = expandedSendIds.has(send.id);
              const list = send.recipients;
              const shown = open ? list.slice(0, RECIPIENTS_PREVIEW_CAP) : [];
              const more = open ? Math.max(0, list.length - RECIPIENTS_PREVIEW_CAP) : 0;
              return (
                <li key={send.id}>
                  <button
                    type="button"
                    onClick={() => toggleSendExpanded(send.id)}
                    className="w-full flex items-start gap-2 px-4 py-3 text-left hover:bg-violet-50/50 transition"
                  >
                    {open ? (
                      <ChevronDown size={18} className="shrink-0 mt-0.5" style={{ color: MUTED }} />
                    ) : (
                      <ChevronRight size={18} className="shrink-0 mt-0.5" style={{ color: MUTED }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: DARK }}>
                        {formatDate(send.sentAt)}
                        <span className="font-normal" style={{ color: MUTED }}>
                          {" "}
                          · {send.recipientCount} BCC ·{" "}
                          {send.sentByName?.trim() ? send.sentByName : "Admin"}
                        </span>
                      </p>
                      {!open && list.length > 0 && (
                        <p className="text-xs mt-1 truncate" style={{ color: SUBTLE }}>
                          {list
                            .slice(0, 3)
                            .map(recipientDisplayName)
                            .join(", ")}
                          {list.length > 3 ? ` +${list.length - 3} more` : ""}
                        </p>
                      )}
                      {open && (
                        <ul className="mt-2 space-y-1 text-xs" style={{ color: MUTED }}>
                          {shown.map((r) => {
                            const email = r.email?.trim() ?? "";
                            const hasName = !!r.fullName?.trim();
                            return (
                              <li key={r.userId}>
                                <span className="font-medium" style={{ color: DARK }}>
                                  {recipientDisplayName(r)}
                                </span>
                                {hasName && email ? (
                                  <span className="text-[11px]"> · {email}</span>
                                ) : null}
                              </li>
                            );
                          })}
                          {more > 0 && (
                            <li style={{ color: SUBTLE }}>+{more} more recipients in this batch</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div
        className="mb-4 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end"
        style={{ borderColor: "#EDE8F7", backgroundColor: "#fff" }}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="onboarding-incomplete-search">
            Search by name or email
          </label>
          <input
            id="onboarding-incomplete-search"
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setCommittedQ(searchDraft.trim());
                setPage(1);
              }
            }}
            placeholder="Search name or email"
            className="w-full min-w-0 rounded-xl border px-3 py-2 text-sm sm:max-w-md"
            style={{ borderColor: "#EDE8F7", color: DARK }}
          />
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCommittedQ(searchDraft.trim());
                setPage(1);
              }}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg,#8F3A8F,#C060C0)" }}
            >
              Search
            </button>
            {committedQ.trim() ? (
              <button
                type="button"
                onClick={() => {
                  setSearchDraft("");
                  setCommittedQ("");
                  setPage(1);
                }}
                className="rounded-xl border px-4 py-2 text-sm font-medium"
                style={{ borderColor: "#C9B8D9", color: MUTED }}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="onboarding-incomplete-sort" className="text-sm whitespace-nowrap" style={{ color: MUTED }}>
            Sort by
          </label>
          <select
            id="onboarding-incomplete-sort"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortOption);
              setPage(1);
            }}
            className="rounded-xl border px-3 py-2 text-sm min-w-[200px]"
            style={{ borderColor: "#EDE8F7", color: DARK, backgroundColor: "#fff" }}
          >
            <option value="joined_desc">Joined (newest first)</option>
            <option value="joined_asc">Joined (oldest first)</option>
            <option value="reminders_desc">Reminders sent (high to low)</option>
            <option value="reminders_asc">Reminders sent (low to high)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          type="button"
          onClick={toggleSelectPage}
          disabled={loading || selectableIds.length === 0 || selectAllMatching}
          className="px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
          style={{ backgroundColor: "#EDE8F7", color: "#6B5E7A" }}
        >
          {allSelectableSelected ? "Deselect page" : "Select all on page"}
        </button>
        <button
          type="button"
          onClick={toggleSelectAllIncomplete}
          disabled={loading || (!selectAllMatching && emailableTotal === 0)}
          className="px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
          style={{ backgroundColor: "#EDE8F7", color: "#6B5E7A" }}
        >
          {selectAllMatching ? "Deselect all incomplete users" : "Select all incomplete users"}
        </button>
        <span className="text-sm" style={{ color: "#6B5E7A" }}>
          {effectiveCount} selected
        </span>
        <button
          type="button"
          onClick={() => {
            if (effectiveCount === 0) return;
            setSendError(null);
            setConfirmOpen(true);
          }}
          disabled={sending || effectiveCount === 0}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg,#8F3A8F,#C060C0)",
          }}
        >
          Send reminder (BCC)
        </button>
      </div>
      {selectAllMatching && emailableTotal > 0 && (
        <p className="text-sm mb-4" style={{ color: "#6B5E7A" }}>
          All {emailableTotal} incomplete user{emailableTotal === 1 ? "" : "s"} with an email
          {committedQ.trim() ? ` matching “${committedQ.trim()}”` : ""} will be included. Sort does not change who
          is included.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 mb-3" role="alert">
          {error}
        </p>
      )}
      {sendError && (
        <p className="text-sm text-red-600 mb-3" role="alert">
          {sendError}
        </p>
      )}

      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "#EDE8F7", backgroundColor: "#fff" }}
      >
        {loading ? (
          <p className="p-6 text-sm" style={{ color: "#9B87B0" }}>
            Loading…
          </p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm" style={{ color: "#9B87B0" }}>
            {committedQ.trim()
              ? "No users match your search."
              : "No users with incomplete onboarding."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #EDE8F7", backgroundColor: "#FAF8FC" }}>
                  <th className="p-3 w-10 align-middle">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={
                        (selectAllMatching && emailableTotal > 0) ||
                        (allSelectableSelected && selectableIds.length > 0)
                      }
                      disabled={loading || selectableIds.length === 0 || selectAllMatching}
                      onChange={toggleSelectPage}
                      aria-label="Select all users on this page"
                    />
                  </th>
                  <th className="text-left p-3 font-semibold" style={{ color: "#1A0A2E" }}>
                    Name
                  </th>
                  <th className="text-left p-3 font-semibold" style={{ color: "#1A0A2E" }}>
                    Email
                  </th>
                  <th className="text-left p-3 font-semibold" style={{ color: "#1A0A2E" }}>
                    Joined
                  </th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap" style={{ color: "#1A0A2E" }}>
                    Reminders sent
                  </th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap" style={{ color: "#1A0A2E" }}>
                    Last reminder
                  </th>
                  <th className="p-3 w-12 text-right align-middle" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const hasEmail = !!r.email?.trim();
                  const checked = (selectAllMatching && hasEmail) || selected.has(r.id);
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid #F5F0FB" }}>
                      <td className="p-3 align-middle">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!hasEmail || selectAllMatching}
                          onChange={() => toggleRow(r.id, hasEmail)}
                          className="rounded border-gray-300"
                          aria-label={`Select ${r.profile?.fullName ?? r.email ?? r.id}`}
                        />
                      </td>
                      <td className="p-3" style={{ color: "#1A0A2E" }}>
                        {r.profile?.fullName?.trim() || "—"}
                      </td>
                      <td className="p-3" style={{ color: hasEmail ? "#6B5E7A" : "#C4B8D4" }}>
                        {hasEmail ? r.email : "No email"}
                      </td>
                      <td className="p-3 whitespace-nowrap" style={{ color: "#6B5E7A" }}>
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="p-3 whitespace-nowrap tabular-nums" style={{ color: "#6B5E7A" }}>
                        {r.reminderCount ?? 0}
                      </td>
                      <td className="p-3 whitespace-nowrap" style={{ color: "#6B5E7A" }}>
                        {r.lastReminderSentAt ? formatDate(r.lastReminderSentAt) : "—"}
                      </td>
                      <td className="p-3 align-middle text-right">
                        <button
                          type="button"
                          onClick={() => setHistoryForUser(r)}
                          className="inline-flex rounded-lg p-2 hover:bg-violet-100/60 transition"
                          aria-label={`Reminder history for ${r.profile?.fullName ?? r.email ?? r.id}`}
                        >
                          <MoreVertical size={18} style={{ color: MUTED }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.total > 0 && (
        <div className="flex flex-col items-center gap-2 mt-6 sm:flex-row sm:justify-center sm:gap-4">
          <p className="text-sm order-2 sm:order-1" style={{ color: "#6B5E7A" }}>
            Showing {rangeStart}–{rangeEnd} of {data.total}
          </p>
          <div className="flex justify-center gap-2 order-1 sm:order-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: "#EDE8F7", color: "#6B5E7A" }}
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm" style={{ color: "#6B5E7A" }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: "#EDE8F7", color: "#6B5E7A" }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
