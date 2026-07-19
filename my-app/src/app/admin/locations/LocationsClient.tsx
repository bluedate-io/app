"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Trash2, Pencil, Plus, ChevronDown, ChevronRight, Check, X } from "lucide-react";
import { adminTheme } from "@/lib/adminTheme";
import { ADMIN_BTN_NEUTRAL_SM, ADMIN_BTN_PRIMARY_SM, ADMIN_INPUT } from "@/lib/adminChrome";
import type { GroupedLocation } from "@/repositories/LocationRepository";

export default function LocationsClient() {
  const [locations, setLocations] = useState<GroupedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());

  // Add form state
  const [addCity, setAddCity] = useState("");
  const [addSubArea, setAddSubArea] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  // Sub-area edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editCity, setEditCity] = useState("");
  const [editSubArea, setEditSubArea] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // City rename state
  const [editCityName, setEditCityName] = useState<string | null>(null);
  const [editCityValue, setEditCityValue] = useState("");
  const [editCityError, setEditCityError] = useState<string | null>(null);
  const [editCityLoading, setEditCityLoading] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/locations");
      const { data } = await res.json();
      setLocations(data ?? []);
      setExpandedCities(new Set((data ?? []).map((l: GroupedLocation) => l.city)));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (editCityName) cityInputRef.current?.focus();
  }, [editCityName]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addCity.trim() || !addSubArea.trim()) {
      setAddError("Both city and sub-area are required.");
      return;
    }
    setAddLoading(true); setAddError(null);
    try {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: addCity.trim(), subArea: addSubArea.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add location");
      setAddCity(""); setAddSubArea("");
      await load();
    } catch (err) {
      setAddError((err as Error).message);
    } finally {
      setAddLoading(false);
    }
  }

  function startEdit(id: string, city: string, subArea: string) {
    setEditCityName(null);
    setEditId(id);
    setEditCity(city);
    setEditSubArea(subArea);
    setEditError(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setEditLoading(true); setEditError(null);
    try {
      const res = await fetch(`/api/admin/locations/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: editCity, subArea: editSubArea.trim(), renameCity: false }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update");
      setEditId(null);
      await load();
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setEditLoading(false);
    }
  }

  function startEditCity(city: string) {
    setEditId(null);
    setEditCityName(city);
    setEditCityValue(city);
    setEditCityError(null);
  }

  async function handleSaveCityEdit(e: React.FormEvent, group: GroupedLocation) {
    e.preventDefault();
    const newCity = editCityValue.trim();
    if (!newCity || newCity === editCityName) { setEditCityName(null); return; }
    if (group.subAreas.length === 0) { setEditCityName(null); return; }
    setEditCityLoading(true); setEditCityError(null);
    try {
      // Use the first sub-area id as the anchor; renameCity:true renames all entries
      const anchorId = group.subAreas[0].id;
      const anchorSubArea = group.subAreas[0].name;
      const res = await fetch(`/api/admin/locations/${anchorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: newCity, subArea: anchorSubArea, renameCity: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to rename city");
      setEditCityName(null);
      await load();
    } catch (err) {
      setEditCityError((err as Error).message);
    } finally {
      setEditCityLoading(false);
    }
  }

  async function handleDelete(id: string, subArea: string) {
    if (!confirm(`Delete "${subArea}"? Users with this location will need to re-assign.`)) return;
    await fetch(`/api/admin/locations/${id}`, { method: "DELETE" });
    await load();
  }

  function toggleCity(city: string) {
    if (editCityName === city) return;
    setExpandedCities((prev) => {
      const next = new Set(prev);
      next.has(city) ? next.delete(city) : next.add(city);
      return next;
    });
  }

  if (loading) {
    return <p className="text-sm py-4" style={{ color: adminTheme.mutedLabel }}>Loading locations...</p>;
  }

  return (
    <div className="max-w-2xl">
      {/* Add new location */}
      <form onSubmit={handleAdd} className="mb-8 p-5 rounded-xl border-2" style={{ borderColor: adminTheme.borderMuted, background: adminTheme.accentMutedBg }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: adminTheme.ink }}>Add location</h3>
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: adminTheme.mutedLabel }}>City</label>
            <input className={ADMIN_INPUT} value={addCity} onChange={(e) => setAddCity(e.target.value)} placeholder="e.g. Hyderabad" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: adminTheme.mutedLabel }}>Sub-area</label>
            <input className={ADMIN_INPUT} value={addSubArea} onChange={(e) => setAddSubArea(e.target.value)} placeholder="e.g. Kondapur" />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={addLoading} className={ADMIN_BTN_PRIMARY_SM}>
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
        {addError && <p className="text-xs mt-1" style={{ color: "#C0392B" }}>{addError}</p>}
      </form>

      {/* Location list */}
      {locations.length === 0 ? (
        <p className="text-sm" style={{ color: adminTheme.mutedLabel }}>No locations yet. Add one above.</p>
      ) : (
        <div className="space-y-4">
          {locations.map((group) => {
            const expanded = expandedCities.has(group.city);
            const isEditingCity = editCityName === group.city;

            return (
              <div key={group.city} className="rounded-xl border-2 overflow-hidden" style={{ borderColor: adminTheme.borderSoft }}>
                {/* City header */}
                {isEditingCity ? (
                  <form
                    onSubmit={(e) => handleSaveCityEdit(e, group)}
                    className="flex items-center gap-2 px-4 py-2.5"
                    style={{ background: adminTheme.sidebarTop }}
                  >
                    <MapPin size={15} style={{ color: adminTheme.orange }} />
                    <input
                      ref={cityInputRef}
                      className={`${ADMIN_INPUT} flex-1 py-1.5 text-sm font-semibold`}
                      value={editCityValue}
                      onChange={(e) => setEditCityValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Escape") setEditCityName(null); }}
                    />
                    <button type="submit" disabled={editCityLoading} className={ADMIN_BTN_PRIMARY_SM} title="Save">
                      <Check size={13} />
                    </button>
                    <button type="button" onClick={() => setEditCityName(null)} className={ADMIN_BTN_NEUTRAL_SM} title="Cancel">
                      <X size={13} />
                    </button>
                    {editCityError && <p className="text-xs" style={{ color: "#C0392B" }}>{editCityError}</p>}
                  </form>
                ) : (
                  <div className="flex items-center px-4 py-3" style={{ background: adminTheme.sidebarTop }}>
                    <button
                      type="button"
                      onClick={() => toggleCity(group.city)}
                      className="flex items-center gap-2 flex-1 text-left min-w-0"
                    >
                      <MapPin size={15} style={{ color: adminTheme.orange }} />
                      <span className="text-sm font-semibold" style={{ color: adminTheme.ink }}>{group.city}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: adminTheme.accentMutedBg, color: adminTheme.orange }}>
                        {group.subAreas.length}
                      </span>
                      <span className="ml-auto">{expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditCity(group.city)}
                      className={`${ADMIN_BTN_NEUTRAL_SM} ml-3 shrink-0`}
                      title="Rename city"
                    >
                      <Pencil size={12} /> Rename
                    </button>
                  </div>
                )}

                {expanded && !isEditingCity && (
                  <div className="divide-y" style={{ borderColor: adminTheme.borderSoft }}>
                    {group.subAreas.map((sa) => (
                      <div key={sa.id}>
                        {editId === sa.id ? (
                          <form onSubmit={handleSaveEdit} className="px-4 py-3 flex items-center gap-2">
                            <input
                              className={`${ADMIN_INPUT} flex-1`}
                              value={editSubArea}
                              onChange={(e) => setEditSubArea(e.target.value)}
                              placeholder="Sub-area name"
                              autoFocus
                              onKeyDown={(e) => { if (e.key === "Escape") setEditId(null); }}
                            />
                            {editError && <p className="text-xs" style={{ color: "#C0392B" }}>{editError}</p>}
                            <button type="submit" disabled={editLoading} className={ADMIN_BTN_PRIMARY_SM} title="Save">
                              <Check size={13} />
                            </button>
                            <button type="button" onClick={() => setEditId(null)} className={ADMIN_BTN_NEUTRAL_SM} title="Cancel">
                              <X size={13} />
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-center justify-between px-4 py-2.5" style={{ background: adminTheme.tableSurface }}>
                            <span className="text-sm" style={{ color: adminTheme.textSecondary }}>{sa.name}</span>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => startEdit(sa.id, group.city, sa.name)} className={ADMIN_BTN_NEUTRAL_SM}>
                                <Pencil size={12} /> Edit
                              </button>
                              <button type="button" onClick={() => handleDelete(sa.id, sa.name)} className={ADMIN_BTN_NEUTRAL_SM}>
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Quick add sub-area inline */}
                    <QuickAddSubArea city={group.city} onAdded={load} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuickAddSubArea({ city, onAdded }: { city: string; onAdded: () => void }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, subArea: value.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setValue("");
      onAdded();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleAdd} className="px-4 py-2.5 flex items-center gap-2" style={{ background: adminTheme.tableRowAlt }}>
      <input
        className={`${ADMIN_INPUT} flex-1 text-xs`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`+ Add sub-area in ${city}`}
      />
      <button type="submit" disabled={loading || !value.trim()} className={ADMIN_BTN_NEUTRAL_SM}>
        <Plus size={12} /> Add
      </button>
      {error && <p className="text-xs" style={{ color: "#C0392B" }}>{error}</p>}
    </form>
  );
}
