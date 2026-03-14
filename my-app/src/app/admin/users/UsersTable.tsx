"use client";

type User = {
  id: string;
  phone: string;
  name: string;
  city: string;
  gender: string;
  step: string;
  completed: boolean;
  joinedAt: string;
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function UsersTable({ users }: { users: User[] }) {
  if (users.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400 text-sm">No users found.</div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {["Name", "Phone", "City", "Gender", "Step", "Joined"].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide"
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
              className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                i === users.length - 1 ? "border-b-0" : ""
              }`}
            >
              <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
              <td className="px-4 py-3 text-gray-500 font-mono text-xs">{u.phone}</td>
              <td className="px-4 py-3 text-gray-600">{u.city}</td>
              <td className="px-4 py-3 text-gray-600">{u.gender}</td>
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
              <td className="px-4 py-3 text-gray-500">{formatDate(u.joinedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
