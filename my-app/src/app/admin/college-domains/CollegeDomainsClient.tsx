"use client";

import { useEffect, useRef, useState } from "react";
import { GraduationCap, Plus, Pencil, Trash2, Check, X, Search } from "lucide-react";
import { adminTheme } from "@/lib/adminTheme";
import {
  ADMIN_BTN_PRIMARY_SM,
  ADMIN_BTN_NEUTRAL_SM,
  ADMIN_INPUT,
} from "@/lib/adminChrome";

interface CollegeDomain {
  id: string;
  collegeName: string;
  domain: string;
}

// Derive a display category from the college name
function getCategory(name: string): string {
  if (/^IIT\b/.test(name)) return "IITs";
  if (/^(NIT|MNIT|MNNIT|MANIT|VNIT)\b/.test(name)) return "NITs";
  if (/^BITS\b/.test(name)) return "BITS";
  if (/^IIIT\b|^ABV-IIIT/.test(name)) return "IIITs";
  if (/^VIT\b/.test(name)) return "VIT";
  if (/^SRM\b/.test(name)) return "SRM";
  if (/^Manipal/.test(name)) return "Manipal";
  return "Others";
}

const CATEGORY_ORDER = ["IITs", "NITs", "BITS", "IIITs", "VIT", "SRM", "Manipal", "Others"];

function Badge({ n }: { n: number }) {
  return (
    <span
      className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: adminTheme.accentMutedBg, color: adminTheme.orange }}
    >
      {n}
    </span>
  );
}

export default function CollegeDomainsClient() {
  const [colleges, setColleges] = useState<CollegeDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("IITs");
  const [catSearch, setCatSearch] = useState("");
  const [listSearch, setListSearch] = useState("");

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Add new
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDomain, setAddDomain] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const addNameRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/college-domains");
      const { data } = await res.json();
      setColleges(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => { if (showAdd) setTimeout(() => addNameRef.current?.focus(), 50); }, [showAdd]);

  // Build category map
  const byCategory = new Map<string, CollegeDomain[]>();
  for (const c of colleges) {
    const cat = getCategory(c.collegeName);
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(c);
  }
  const categories = CATEGORY_ORDER.filter((c) => byCategory.has(c));

  const filteredCats = categories.filter((c) =>
    c.toLowerCase().includes(catSearch.toLowerCase())
  );

  const activeList = (byCategory.get(selectedCategory) ?? []).filter(
    (c) =>
      c.collegeName.toLowerCase().includes(listSearch.toLowerCase()) ||
      c.domain.toLowerCase().includes(listSearch.toLowerCase())
  );

  // ── Edit ───────────────────────────────────────────────────────────────────
  async function saveEdit(id: string) {
    if (!editName.trim() || !editDomain.trim()) return;
    setEditLoading(true); setEditError(null);
    try {
      const res = await fetch(`/api/admin/college-domains/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeName: editName.trim(), domain: editDomain.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed");
      setEditingId(null);
      await load();
    } catch (e) { setEditError((e as Error).message); }
    finally { setEditLoading(false); }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function deleteCollege(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    await fetch(`/api/admin/college-domains/${id}`, { method: "DELETE" });
    await load();
  }

  // ── Add ────────────────────────────────────────────────────────────────────
  async function addCollege(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim() || !addDomain.trim()) return;
    setAddLoading(true); setAddError(null);
    try {
      const res = await fetch("/api/admin/college-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeName: addName.trim(), domain: addDomain.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed");
      setAddName(""); setAddDomain("");
      setShowAdd(false);
      // Switch to the new entry's category
      setSelectedCategory(getCategory(addName.trim()));
      await load();
    } catch (e) { setAddError((e as Error).message); }
    finally { setAddLoading(false); }
  }

  if (loading) {
    return <p className="text-sm py-6" style={{ color: adminTheme.mutedLabel }}>Loading…</p>;
  }

  return (
    <div
      className="flex rounded-3xl border-2 overflow-hidden"
      style={{
        borderColor: adminTheme.inkDark,
        boxShadow: `6px 6px 0 ${adminTheme.shadowInk}`,
        height: "calc(100vh - 140px)",
        minHeight: 520,
        background: adminTheme.card,
      }}
    >
      {/* ── LEFT: category list ──────────────────────────────────────────── */}
      <div
        className="flex flex-col shrink-0"
        style={{
          width: 180,
          borderRight: `2px solid ${adminTheme.borderSoft}`,
          background: adminTheme.sidebarTop,
        }}
      >
        {/* Category search */}
        <div className="p-3 border-b" style={{ borderColor: adminTheme.borderSoft }}>
          <div
            className="flex items-center gap-2 rounded-xl border-2 px-3 py-1.5"
            style={{ borderColor: adminTheme.borderMuted, background: adminTheme.card }}
          >
            <Search size={13} style={{ color: adminTheme.mutedLabel, flexShrink: 0 }} />
            <input
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
              placeholder="Filter…"
              className="w-full bg-transparent text-xs outline-none"
              style={{ color: adminTheme.ink }}
            />
          </div>
        </div>

        {/* Category list */}
        <div className="flex-1 overflow-y-auto">
          {filteredCats.map((cat) => {
            const active = cat === selectedCategory;
            const count = byCategory.get(cat)?.length ?? 0;
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setListSearch(""); setEditingId(null); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition-colors"
                style={{
                  background: active ? adminTheme.accentMutedBg : "transparent",
                  color: active ? adminTheme.orange : adminTheme.ink,
                  borderLeft: active ? `3px solid ${adminTheme.orange}` : "3px solid transparent",
                }}
              >
                <GraduationCap size={13} style={{ flexShrink: 0, color: active ? adminTheme.orange : adminTheme.mutedLabel }} />
                <span className="truncate flex-1">{cat}</span>
                <Badge n={count} />
              </button>
            );
          })}
          {filteredCats.length === 0 && (
            <p className="px-4 py-3 text-xs" style={{ color: adminTheme.mutedLabel }}>No match.</p>
          )}
        </div>

        {/* Total count */}
        <div className="p-3 border-t text-center" style={{ borderColor: adminTheme.borderSoft }}>
          <p className="text-xs font-semibold" style={{ color: adminTheme.mutedLabel }}>
            {colleges.length} total
          </p>
        </div>
      </div>

      {/* ── RIGHT: college list ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
          style={{ borderColor: adminTheme.borderSoft, background: adminTheme.elevated }}
        >
          <GraduationCap size={16} style={{ color: adminTheme.orange, flexShrink: 0 }} />
          <h2 className="text-base font-bold flex-1" style={{ color: adminTheme.ink }}>
            {selectedCategory}
            <span className="ml-2 text-sm font-normal" style={{ color: adminTheme.mutedLabel }}>
              {byCategory.get(selectedCategory)?.length ?? 0} institutions
            </span>
          </h2>
          <button onClick={() => { setShowAdd(true); setAddError(null); }} className={ADMIN_BTN_PRIMARY_SM}>
            <Plus size={13} /> Add
          </button>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0" style={{ borderColor: adminTheme.borderSoft }}>
          <div
            className="flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 flex-1"
            style={{ borderColor: adminTheme.borderMuted, background: adminTheme.card }}
          >
            <Search size={13} style={{ color: adminTheme.mutedLabel, flexShrink: 0 }} />
            <input
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Search by name or domain…"
              className="w-full bg-transparent text-xs outline-none"
              style={{ color: adminTheme.ink }}
            />
            {listSearch && (
              <button onClick={() => setListSearch("")} style={{ color: adminTheme.mutedLabel }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* College rows */}
        <div className="flex-1 overflow-y-auto">
          {activeList.length === 0 ? (
            <p className="px-5 py-4 text-sm" style={{ color: adminTheme.mutedLabel }}>
              {listSearch ? "No results." : "No institutions in this category."}
            </p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: adminTheme.tableHeader }}>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold" style={{ color: adminTheme.textSecondary }}>
                    Institution
                  </th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold" style={{ color: adminTheme.textSecondary }}>
                    Domain
                  </th>
                  <th className="px-5 py-2.5 w-20" />
                </tr>
              </thead>
              <tbody>
                {activeList.map((c, i) =>
                  editingId === c.id ? (
                    <tr key={c.id} style={{ background: adminTheme.accentMutedBg }}>
                      <td className="px-4 py-2">
                        <input
                          value={editName}
                          onChange={(e) => { setEditName(e.target.value); setEditError(null); }}
                          onKeyDown={(e) => e.key === "Escape" && setEditingId(null)}
                          autoFocus
                          className={`${ADMIN_INPUT} text-xs w-full`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editDomain}
                          onChange={(e) => { setEditDomain(e.target.value); setEditError(null); }}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setEditingId(null);
                            if (e.key === "Enter") { e.preventDefault(); void saveEdit(c.id); }
                          }}
                          placeholder="e.g. iitb.ac.in"
                          className={`${ADMIN_INPUT} text-xs w-full`}
                        />
                        {editError && <p className="text-xs mt-1" style={{ color: adminTheme.error }}>{editError}</p>}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => saveEdit(c.id)}
                            disabled={editLoading}
                            className={ADMIN_BTN_PRIMARY_SM}
                          >
                            <Check size={12} />
                          </button>
                          <button onClick={() => setEditingId(null)} className={ADMIN_BTN_NEUTRAL_SM}>
                            <X size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={c.id}
                      className="group transition-colors"
                      style={{ background: i % 2 === 0 ? adminTheme.tableRow : adminTheme.tableRowAlt }}
                    >
                      <td
                        className="px-5 py-3 font-medium"
                        style={{ color: adminTheme.ink, borderTop: `1px solid ${adminTheme.borderSoft}` }}
                      >
                        {c.collegeName}
                      </td>
                      <td
                        className="px-5 py-3 font-mono text-xs"
                        style={{ color: adminTheme.textSecondary, borderTop: `1px solid ${adminTheme.borderSoft}` }}
                      >
                        @{c.domain}
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ borderTop: `1px solid ${adminTheme.borderSoft}` }}
                      >
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingId(c.id); setEditName(c.collegeName); setEditDomain(c.domain); setEditError(null); }}
                            className="rounded-lg p-1 hover:bg-amber-100 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} style={{ color: adminTheme.orange }} />
                          </button>
                          <button
                            onClick={() => deleteCollege(c.id, c.collegeName)}
                            className="rounded-lg p-1 hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} style={{ color: adminTheme.error }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Add modal ────────────────────────────────────────────────────── */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border-2 p-6"
            style={{
              borderColor: adminTheme.inkDark,
              background: adminTheme.card,
              boxShadow: `6px 6px 0 ${adminTheme.shadowInk}`,
            }}
          >
            <h3 className="text-base font-bold mb-4" style={{ color: adminTheme.ink }}>Add institution</h3>
            <form onSubmit={addCollege} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: adminTheme.mutedLabel }}>
                  Institution name
                </label>
                <input
                  ref={addNameRef}
                  className={`${ADMIN_INPUT} w-full`}
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. IIT Bombay"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: adminTheme.mutedLabel }}>
                  Email domain
                </label>
                <input
                  className={`${ADMIN_INPUT} w-full font-mono`}
                  value={addDomain}
                  onChange={(e) => setAddDomain(e.target.value)}
                  placeholder="e.g. iitb.ac.in"
                />
              </div>
              {addError && <p className="text-xs" style={{ color: adminTheme.error }}>{addError}</p>}
              <div className="flex gap-2 mt-1">
                <button type="submit" disabled={addLoading || !addName.trim() || !addDomain.trim()} className={`${ADMIN_BTN_PRIMARY_SM} flex-1`}>
                  <Plus size={13} /> Add
                </button>
                <button type="button" onClick={() => { setShowAdd(false); setAddError(null); }} className={ADMIN_BTN_NEUTRAL_SM}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
