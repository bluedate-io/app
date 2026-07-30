"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Check, X, Search } from "lucide-react";
import { adminTheme } from "@/lib/adminTheme";
import {
  ADMIN_BTN_PRIMARY_SM,
  ADMIN_BTN_NEUTRAL_SM,
  ADMIN_BTN_DANGER_SM,
  ADMIN_INPUT,
} from "@/lib/adminChrome";
import type { GroupedLocation } from "@/repositories/LocationRepository";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubArea { id: string; name: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LocationsClient() {
  const [groups, setGroups] = useState<GroupedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState("");
  const [areaSearch, setAreaSearch] = useState("");

  // City rename
  const [renamingCity, setRenamingCity] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  // Sub-area edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Add sub-area
  const [addValue, setAddValue] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Add new city
  const [showNewCity, setShowNewCity] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [newCitySubArea, setNewCitySubArea] = useState("");
  const [newCityLoading, setNewCityLoading] = useState(false);
  const [newCityError, setNewCityError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/locations");
      const { data } = await res.json();
      const fetched: GroupedLocation[] = data ?? [];
      setGroups(fetched);
      // keep selection valid
      setSelectedCity((prev) => {
        if (!prev && fetched.length) return fetched[0].city;
        if (prev && !fetched.find((g) => g.city === prev) && fetched.length) return fetched[0].city;
        return prev;
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => { if (renamingCity) renameRef.current?.focus(); }, [renamingCity]);

  const searchTerm = citySearch.toLowerCase();
  const filteredGroups = searchTerm
    ? groups.filter(
        (g) =>
          g.city.toLowerCase().includes(searchTerm) ||
          g.subAreas.some((s) => s.name.toLowerCase().includes(searchTerm))
      )
    : groups;

  // When the search matches sub-areas (not the city name), pre-fill areaSearch so
  // matching chips light up immediately on the right.
  const subAreaPreFilter =
    searchTerm &&
    selectedCity &&
    !selectedCity.toLowerCase().includes(searchTerm)
      ? searchTerm
      : areaSearch;

  const activeGroup = groups.find((g) => g.city === selectedCity) ?? null;
  const filteredSubAreas = (activeGroup?.subAreas ?? []).filter((s) =>
    s.name.toLowerCase().includes(subAreaPreFilter.toLowerCase())
  );

  // ── City rename ─────────────────────────────────────────────────────────────
  async function saveRename() {
    if (!renamingCity || !renameValue.trim() || renameValue.trim() === renamingCity) {
      setRenamingCity(null); return;
    }
    setRenameLoading(true); setRenameError(null);
    try {
      const group = groups.find((g) => g.city === renamingCity);
      if (!group?.subAreas.length) { setRenamingCity(null); return; }
      const res = await fetch(`/api/admin/locations/${group.subAreas[0].id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: renameValue.trim(), subArea: group.subAreas[0].name, renameCity: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setSelectedCity(renameValue.trim());
      setRenamingCity(null);
      await load();
    } catch (e) { setRenameError((e as Error).message); }
    finally { setRenameLoading(false); }
  }

  // ── Sub-area edit ───────────────────────────────────────────────────────────
  async function saveEdit(id: string) {
    if (!editValue.trim()) return;
    setEditLoading(true); setEditError(null);
    try {
      const res = await fetch(`/api/admin/locations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: selectedCity, subArea: editValue.trim(), renameCity: false }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setEditingId(null);
      await load();
    } catch (e) { setEditError((e as Error).message); }
    finally { setEditLoading(false); }
  }

  // ── Sub-area delete ─────────────────────────────────────────────────────────
  async function deleteSubArea(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    await fetch(`/api/admin/locations/${id}`, { method: "DELETE" });
    await load();
  }

  // ── Add sub-area ────────────────────────────────────────────────────────────
  async function addSubArea(e: React.FormEvent) {
    e.preventDefault();
    if (!addValue.trim() || !selectedCity) return;
    setAddLoading(true); setAddError(null);
    try {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: selectedCity, subArea: addValue.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setAddValue("");
      await load();
    } catch (e) { setAddError((e as Error).message); }
    finally { setAddLoading(false); }
  }

  // ── Add new city ────────────────────────────────────────────────────────────
  async function addCity(e: React.FormEvent) {
    e.preventDefault();
    if (!newCityName.trim() || !newCitySubArea.trim()) {
      setNewCityError("Both city and a first sub-area are required."); return;
    }
    setNewCityLoading(true); setNewCityError(null);
    try {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: newCityName.trim(), subArea: newCitySubArea.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setSelectedCity(newCityName.trim());
      setNewCityName(""); setNewCitySubArea("");
      setShowNewCity(false);
      await load();
    } catch (e) { setNewCityError((e as Error).message); }
    finally { setNewCityLoading(false); }
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
      {/* ── LEFT: city list ──────────────────────────────────────────────── */}
      <div
        className="flex flex-col shrink-0"
        style={{
          width: 220,
          borderRight: `2px solid ${adminTheme.borderSoft}`,
          background: adminTheme.sidebarTop,
        }}
      >
        {/* City search */}
        <div className="p-3 border-b" style={{ borderColor: adminTheme.borderSoft }}>
          <div
            className="flex items-center gap-2 rounded-xl border-2 px-3 py-1.5"
            style={{ borderColor: adminTheme.borderMuted, background: adminTheme.card }}
          >
            <Search size={13} style={{ color: adminTheme.mutedLabel, flexShrink: 0 }} />
            <input
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Search cities…"
              className="w-full bg-transparent text-xs outline-none"
              style={{ color: adminTheme.ink }}
            />
          </div>
        </div>

        {/* City list */}
        <div className="flex-1 overflow-y-auto">
          {filteredGroups.map((g) => {
            const active = g.city === selectedCity;
            return (
              <button
                key={g.city}
                onClick={() => { setSelectedCity(g.city); setAreaSearch(""); setEditingId(null); setAddValue(""); setAddError(null); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition-colors"
                style={{
                  background: active ? adminTheme.accentMutedBg : "transparent",
                  color: active ? adminTheme.orange : adminTheme.ink,
                  borderLeft: active ? `3px solid ${adminTheme.orange}` : "3px solid transparent",
                }}
              >
                <MapPin size={13} style={{ flexShrink: 0, color: active ? adminTheme.orange : adminTheme.mutedLabel }} />
                <span className="truncate flex-1">{g.city}</span>
                <Badge n={g.subAreas.length} />
              </button>
            );
          })}
          {filteredGroups.length === 0 && (
            <p className="px-4 py-3 text-xs" style={{ color: adminTheme.mutedLabel }}>No cities match.</p>
          )}
        </div>

        {/* Add city button */}
        <div className="p-3 border-t" style={{ borderColor: adminTheme.borderSoft }}>
          <button
            onClick={() => setShowNewCity(true)}
            className={`${ADMIN_BTN_PRIMARY_SM} w-full`}
          >
            <Plus size={13} /> New City
          </button>
        </div>
      </div>

      {/* ── RIGHT: sub-areas panel ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeGroup ? (
          <>
            {/* City header */}
            <div
              className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
              style={{ borderColor: adminTheme.borderSoft, background: adminTheme.elevated }}
            >
              {renamingCity === activeGroup.city ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); void saveRename(); }}
                  className="flex items-center gap-2 flex-1"
                >
                  <input
                    ref={renameRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setRenamingCity(null)}
                    className={`${ADMIN_INPUT} flex-1 text-sm font-semibold`}
                  />
                  <button type="submit" disabled={renameLoading} className={ADMIN_BTN_PRIMARY_SM}>
                    <Check size={13} />
                  </button>
                  <button type="button" onClick={() => setRenamingCity(null)} className={ADMIN_BTN_NEUTRAL_SM}>
                    <X size={13} />
                  </button>
                  {renameError && <span className="text-xs" style={{ color: adminTheme.error }}>{renameError}</span>}
                </form>
              ) : (
                <>
                  <MapPin size={16} style={{ color: adminTheme.orange, flexShrink: 0 }} />
                  <h2 className="text-base font-bold flex-1" style={{ color: adminTheme.ink }}>
                    {activeGroup.city}
                    <span className="ml-2 text-sm font-normal" style={{ color: adminTheme.mutedLabel }}>
                      {activeGroup.subAreas.length} sub-areas
                    </span>
                  </h2>
                  <button
                    onClick={() => { setRenamingCity(activeGroup.city); setRenameValue(activeGroup.city); setRenameError(null); }}
                    className={ADMIN_BTN_NEUTRAL_SM}
                  >
                    <Pencil size={12} /> Rename
                  </button>
                </>
              )}
            </div>

            {/* Sub-area search + add */}
            <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0" style={{ borderColor: adminTheme.borderSoft }}>
              <div
                className="flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 flex-1"
                style={{ borderColor: adminTheme.borderMuted, background: adminTheme.card }}
              >
                <Search size={13} style={{ color: adminTheme.mutedLabel, flexShrink: 0 }} />
                <input
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  placeholder="Filter sub-areas…"
                  className="w-full bg-transparent text-xs outline-none"
                  style={{ color: adminTheme.ink }}
                />
                {areaSearch && (
                  <button onClick={() => setAreaSearch("")} style={{ color: adminTheme.mutedLabel }}>
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Quick add */}
              <form onSubmit={addSubArea} className="flex items-center gap-2">
                <input
                  value={addValue}
                  onChange={(e) => { setAddValue(e.target.value); setAddError(null); }}
                  placeholder="Add sub-area…"
                  className={`${ADMIN_INPUT} text-xs w-40`}
                />
                <button type="submit" disabled={addLoading || !addValue.trim()} className={ADMIN_BTN_PRIMARY_SM}>
                  <Plus size={13} /> Add
                </button>
              </form>
            </div>
            {addError && (
              <p className="px-5 pt-2 text-xs" style={{ color: adminTheme.error }}>{addError}</p>
            )}

            {/* Sub-area chips grid */}
            <div className="flex-1 overflow-y-auto p-5">
              {filteredSubAreas.length === 0 ? (
                <p className="text-sm" style={{ color: adminTheme.mutedLabel }}>
                  {areaSearch ? "No sub-areas match." : "No sub-areas yet. Add one above."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredSubAreas.map((sa) =>
                    editingId === sa.id ? (
                      <form
                        key={sa.id}
                        onSubmit={(e) => { e.preventDefault(); void saveEdit(sa.id); }}
                        className="flex items-center gap-1"
                      >
                        <input
                          value={editValue}
                          onChange={(e) => { setEditValue(e.target.value); setEditError(null); }}
                          onKeyDown={(e) => e.key === "Escape" && setEditingId(null)}
                          autoFocus
                          className={`${ADMIN_INPUT} text-xs w-36`}
                        />
                        <button type="submit" disabled={editLoading} className={ADMIN_BTN_PRIMARY_SM}>
                          <Check size={12} />
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className={ADMIN_BTN_NEUTRAL_SM}>
                          <X size={12} />
                        </button>
                        {editError && <span className="text-xs" style={{ color: adminTheme.error }}>{editError}</span>}
                      </form>
                    ) : (
                      <div
                        key={sa.id}
                        className="group flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-sm font-medium transition-all"
                        style={{
                          borderColor: adminTheme.borderMuted,
                          background: adminTheme.tableSurface,
                          color: adminTheme.ink,
                        }}
                      >
                        <span>{sa.name}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                          <button
                            onClick={() => { setEditingId(sa.id); setEditValue(sa.name); setEditError(null); }}
                            className="rounded-lg p-0.5 hover:bg-amber-100 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={11} style={{ color: adminTheme.orange }} />
                          </button>
                          <button
                            onClick={() => deleteSubArea(sa.id, sa.name)}
                            className="rounded-lg p-0.5 hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={11} style={{ color: adminTheme.error }} />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: adminTheme.mutedLabel }}>Select a city to manage its sub-areas.</p>
          </div>
        )}
      </div>

      {/* ── New city modal ───────────────────────────────────────────────── */}
      {showNewCity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onClick={(e) => e.target === e.currentTarget && setShowNewCity(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border-2 p-6"
            style={{
              borderColor: adminTheme.inkDark,
              background: adminTheme.card,
              boxShadow: `6px 6px 0 ${adminTheme.shadowInk}`,
            }}
          >
            <h3 className="text-base font-bold mb-4" style={{ color: adminTheme.ink }}>Add new city</h3>
            <form onSubmit={addCity} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: adminTheme.mutedLabel }}>City name</label>
                <input
                  autoFocus
                  className={`${ADMIN_INPUT} w-full`}
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder="e.g. Pune"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: adminTheme.mutedLabel }}>First sub-area</label>
                <input
                  className={`${ADMIN_INPUT} w-full`}
                  value={newCitySubArea}
                  onChange={(e) => setNewCitySubArea(e.target.value)}
                  placeholder="e.g. Koregaon Park"
                />
              </div>
              {newCityError && <p className="text-xs" style={{ color: adminTheme.error }}>{newCityError}</p>}
              <div className="flex gap-2 mt-1">
                <button type="submit" disabled={newCityLoading} className={`${ADMIN_BTN_PRIMARY_SM} flex-1`}>
                  <Plus size={13} /> Create
                </button>
                <button type="button" onClick={() => { setShowNewCity(false); setNewCityError(null); }} className={ADMIN_BTN_NEUTRAL_SM}>
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
