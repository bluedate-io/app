"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type User = {
  id: string;
  phone: string | null;
  email: string | null;
  name: string;
  city: string;
  gender: string;
  step: string;
  completed: boolean;
  joinedAt: string;
};

const STEP_COLORS: Record<string, string> = {
  Complete:    "#166534",
  Photos:      "#1e40af",
  Habits:      "#6b21a8",
  Interests:   "#92400e",
  Preferences: "#9a3412",
  Profile:     "#374151",
  New:         "#9ca3af",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function pageHref(page: number, filter: string) {
  const f = filter !== "all" ? `&filter=${filter}` : "";
  return `/admin/users?page=${page}${f}`;
}

export default function UsersTable({
  users,
  page,
  totalPages,
  filter,
}: {
  users: User[];
  page: number;
  totalPages: number;
  filter: string;
}) {
  if (users.length === 0) {
    return (
      <div className="text-center py-20 text-sm" style={{ color: "#9B87B0" }}>
        No users found.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm" style={{ borderColor: "#EDE8F7" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "#F0EBFA" }}>
              {["Name", "Email / Phone", "City", "Gender", "Step", "Joined"].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "#9B87B0" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr
                key={u.id}
                className="transition-colors"
                style={{
                  borderBottom: i < users.length - 1 ? "1px solid #F9F6FE" : "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF8FF")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
              >
                <td className="px-4 py-3 font-medium" style={{ color: "#1A0A2E" }}>{u.name}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: "#9B87B0" }}>
                  {u.email ?? u.phone ?? "—"}
                </td>
                <td className="px-4 py-3" style={{ color: "#6B5E7A" }}>{u.city}</td>
                <td className="px-4 py-3" style={{ color: "#6B5E7A" }}>{u.gender}</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      color: STEP_COLORS[u.step] ?? "#374151",
                      backgroundColor: (STEP_COLORS[u.step] ?? "#374151") + "18",
                    }}
                  >
                    {u.step}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: "#9B87B0" }}>{formatDate(u.joinedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-xs" style={{ color: "#9B87B0" }}>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <a
                href={pageHref(page - 1, filter)}
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
                href={pageHref(page + 1, filter)}
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
