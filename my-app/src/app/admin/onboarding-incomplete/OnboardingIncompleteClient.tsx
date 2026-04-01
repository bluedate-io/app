"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, MoreVertical, X } from "lucide-react";
import UserDetailSheet from "@/components/admin-bd/UserDetailSheet";
import { ADMIN_GENDER_OPTIONS } from "@/lib/adminUserStep";
import {
  ADMIN_BTN_NEUTRAL,
  ADMIN_BTN_PRIMARY_SM,
  ADMIN_BTN_SECONDARY,
  ADMIN_ELEVATED_PANEL,
  ADMIN_INPUT,
  ADMIN_SELECT_LG,
  ADMIN_TABLE_FRAME,
  ADMIN_TOOLBAR,
} from "@/lib/adminChrome";
import { adminTheme } from "@/lib/adminTheme";

const DARK = adminTheme.ink;
const MUTED = adminTheme.textSecondary;
const SUBTLE = adminTheme.mutedLabel;

type Row = {
  id: string;
  email: string | null;
  createdAt: string;
  profile: { fullName: string | null } | null;
  preferences: { genderIdentity: string | null } | null;
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
  gender: string;
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
    <div className="fixed inset-0 z-60 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        className="relative z-61 flex h-full w-full max-w-md flex-col border-l bg-white shadow-2xl"
        style={{ borderColor: adminTheme.accentMutedBg }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-history-title"
      >
        <div
          className="flex items-start justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: adminTheme.accentMutedBg, backgroundColor: adminTheme.accentMutedBg }}
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
            className="shrink-0 rounded-lg p-2 transition hover:bg-bd-table-hover"
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
                  style={{ borderColor: adminTheme.accentMutedBg }}
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
        style={{ borderColor: adminTheme.accentMutedBg }}
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
            className={`${ADMIN_BTN_NEUTRAL} flex-1 py-2.5`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className={`${ADMIN_BTN_PRIMARY_SM} flex-1`}
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
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [actionMenuUserId, setActionMenuUserId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<ReminderHistoryPayload | null>(null);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [committedQ, setCommittedQ] = useState("");
  const [committedGender, setCommittedGender] = useState("");
  const [sort, setSort] = useState<SortOption>("joined_desc");

  const ONBOARDING_REMINDER_GENDER_NOT_PROVIDED = "__not_provided__";
  const committedGenderLabel =
    committedGender.trim() === ONBOARDING_REMINDER_GENDER_NOT_PROVIDED
      ? "Not provided"
      : committedGender.trim();

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
      if (committedGender.trim()) params.set("gender", committedGender.trim());
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
        gender: typeof raw.gender === "string" ? raw.gender : "",
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
  }, [page, pageSize, committedQ, committedGender, sort]);

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
        ? {
            selectAllMatching: true as const,
            q: committedQ,
            ...(committedGender.trim() ? { gender: committedGender.trim() } : {}),
          }
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
    <div className="mx-auto max-w-6xl px-6 py-8">
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
      {detailUserId ? (
        <UserDetailSheet userId={detailUserId} onClose={() => setDetailUserId(null)} />
      ) : null}

      <div className={`${ADMIN_ELEVATED_PANEL} mb-8 space-y-5`}>
        <div>
          <h1
            className="mb-0.5 text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-bd-display), Georgia, serif", color: DARK }}
          >
            Onboarding reminders
          </h1>
          <p className="text-sm" style={{ color: SUBTLE }}>
            Users who have not completed onboarding. Select rows and send one BCC email.
          </p>
          {data != null && (
            <p className="mt-1.5 text-sm" style={{ color: MUTED }}>
              {data.total} user{data.total === 1 ? "" : "s"}
              {committedQ.trim() ? ` matching "${committedQ.trim()}"` : null}
              {committedGender.trim() ? ` · ${committedGenderLabel} only` : null}
            </p>
          )}
        </div>

        <div
          className="border-t-2 border-dashed pt-5 text-sm"
          style={{ borderColor: adminTheme.borderSoft }}
        >
          {lastSend ? (
            <p className="m-0" style={{ color: MUTED }}>
              <span className="font-semibold" style={{ color: DARK }}>
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
            <p className="m-0" style={{ color: SUBTLE }}>
              No reminder emails have been sent yet.
            </p>
          )}
        </div>
      </div>

      {recentSends.length > 0 && (
        <div
          className="mb-8 overflow-hidden rounded-3xl border-2 border-bd-ink-dark bg-bd-elevated shadow-[5px_5px_0px_0px_var(--bd-shadow-ink)]"
        >
          <div
            className="border-b-2 px-4 py-3 md:px-5"
            style={{ borderColor: adminTheme.borderSoft, backgroundColor: adminTheme.tableHeader }}
          >
            <h2 className="text-sm font-semibold" style={{ color: DARK }}>
              Recent sends
            </h2>
            <p className="text-xs mt-0.5" style={{ color: SUBTLE }}>
              Who was included in each batch (newest first).
            </p>
          </div>
          <ul className="divide-y" style={{ borderColor: adminTheme.borderSoft }}>
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
                    className="flex w-full items-start gap-2 px-4 py-3 text-left transition hover:bg-bd-table-hover md:px-5"
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
        className={`${ADMIN_TOOLBAR} mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end`}
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
            className={`${ADMIN_INPUT} w-full min-w-0 sm:max-w-md`}
          />
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCommittedQ(searchDraft.trim());
                setPage(1);
              }}
              className={ADMIN_BTN_PRIMARY_SM}
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
                className={ADMIN_BTN_SECONDARY}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <label htmlFor="onboarding-incomplete-gender" className="text-sm whitespace-nowrap" style={{ color: MUTED }}>
              Gender
            </label>
            <select
              id="onboarding-incomplete-gender"
              value={committedGender}
              onChange={(e) => {
                setCommittedGender(e.target.value);
                setPage(1);
              }}
              className={`${ADMIN_SELECT_LG} min-w-[160px]`}
            >
              <option value="">All genders</option>
              <option value={ONBOARDING_REMINDER_GENDER_NOT_PROVIDED}>Not provided</option>
              {ADMIN_GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
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
              className={`${ADMIN_SELECT_LG} min-w-[200px]`}
            >
              <option value="joined_desc">Joined (newest first)</option>
              <option value="joined_asc">Joined (oldest first)</option>
              <option value="reminders_desc">Reminders sent (high to low)</option>
              <option value="reminders_asc">Reminders sent (low to high)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          type="button"
          onClick={toggleSelectPage}
          disabled={loading || selectableIds.length === 0 || selectAllMatching}
          className={ADMIN_BTN_NEUTRAL}
        >
          {allSelectableSelected ? "Deselect page" : "Select all on page"}
        </button>
        <button
          type="button"
          onClick={toggleSelectAllIncomplete}
          disabled={loading || (!selectAllMatching && emailableTotal === 0)}
          className={ADMIN_BTN_NEUTRAL}
        >
          {selectAllMatching ? "Deselect all incomplete users" : "Select all incomplete users"}
        </button>
        <span className="text-sm" style={{ color: MUTED }}>
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
          className={ADMIN_BTN_PRIMARY_SM}
        >
          Send reminder (BCC)
        </button>
      </div>
      {selectAllMatching && emailableTotal > 0 && (
        <p className="text-sm mb-4" style={{ color: MUTED }}>
          All {emailableTotal} incomplete user{emailableTotal === 1 ? "" : "s"} with an email
          {committedQ.trim() ? ` matching “${committedQ.trim()}”` : ""}
          {committedGender.trim() ? ` · ${committedGenderLabel} only` : ""} will be included. Sort does not change
          who is included.
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

      <div className={ADMIN_TABLE_FRAME}>
        {loading ? (
          <p className="p-6 text-sm" style={{ color: SUBTLE }}>
            Loading…
          </p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm" style={{ color: SUBTLE }}>
            {committedQ.trim()
              ? "No users match your search."
              : "No users with incomplete onboarding."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b-2"
                  style={{
                    borderColor: adminTheme.inkDark,
                    backgroundColor: adminTheme.tableHeader,
                  }}
                >
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
                  <th className="text-left p-3 font-semibold" style={{ color: DARK }}>
                    Name
                  </th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap" style={{ color: DARK }}>
                    Gender
                  </th>
                  <th className="text-left p-3 font-semibold" style={{ color: DARK }}>
                    Email
                  </th>
                  <th className="text-left p-3 font-semibold" style={{ color: DARK }}>
                    Joined
                  </th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap" style={{ color: DARK }}>
                    Reminders sent
                  </th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap" style={{ color: DARK }}>
                    Last reminder
                  </th>
                  <th className="p-3 w-12 text-right align-middle" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, rowIndex) => {
                  const hasEmail = !!r.email?.trim();
                  const checked = (selectAllMatching && hasEmail) || selected.has(r.id);
                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-bd-border-soft transition-colors hover:bg-bd-table-hover ${
                        rowIndex % 2 === 0 ? "bg-bd-table-row" : "bg-bd-table-row-alt"
                      }`}
                    >
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
                      <td className="p-3" style={{ color: DARK }}>
                        {r.profile?.fullName?.trim() || "—"}
                      </td>
                      <td className="p-3 whitespace-nowrap" style={{ color: MUTED }}>
                        {r.preferences?.genderIdentity?.trim() || "—"}
                      </td>
                      <td className="p-3" style={{ color: hasEmail ? MUTED : adminTheme.borderMuted }}>
                        {hasEmail ? r.email : "No email"}
                      </td>
                      <td className="p-3 whitespace-nowrap" style={{ color: MUTED }}>
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="p-3 whitespace-nowrap tabular-nums" style={{ color: MUTED }}>
                        {r.reminderCount ?? 0}
                      </td>
                      <td className="p-3 whitespace-nowrap" style={{ color: MUTED }}>
                        {r.lastReminderSentAt ? formatDate(r.lastReminderSentAt) : "—"}
                      </td>
                      <td className="relative p-3 align-middle text-right">
                        <button
                          type="button"
                          onClick={() => setActionMenuUserId((prev) => (prev === r.id ? null : r.id))}
                          className="inline-flex rounded-lg p-2 transition hover:bg-bd-table-hover"
                          aria-label={`Open actions for ${r.profile?.fullName ?? r.email ?? r.id}`}
                        >
                          <MoreVertical size={18} style={{ color: MUTED }} />
                        </button>
                        {actionMenuUserId === r.id ? (
                          <div
                            className="absolute right-3 top-11 z-20 w-44 overflow-hidden rounded-xl border-2 bg-white shadow-[4px_4px_0px_0px_var(--bd-shadow-ink)]"
                            style={{ borderColor: adminTheme.inkDark }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActionMenuUserId(null);
                                setDetailUserId(r.id);
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-semibold transition hover:bg-bd-table-hover"
                              style={{ color: DARK }}
                            >
                              View user details
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActionMenuUserId(null);
                                setHistoryForUser(r);
                              }}
                              className="w-full border-t px-3 py-2 text-left text-xs font-semibold transition hover:bg-bd-table-hover"
                              style={{ color: DARK, borderColor: adminTheme.borderSoft }}
                            >
                              Reminder history
                            </button>
                          </div>
                        ) : null}
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
          <p className="text-sm order-2 sm:order-1" style={{ color: MUTED }}>
            Showing {rangeStart}–{rangeEnd} of {data.total}
          </p>
          <div className="flex justify-center gap-2 order-1 sm:order-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={ADMIN_BTN_NEUTRAL}
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm" style={{ color: MUTED }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className={ADMIN_BTN_NEUTRAL}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
