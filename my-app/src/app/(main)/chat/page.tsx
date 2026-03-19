"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { User, MessageCircle } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

type Convo = {
  matchId: string;
  name: string;
  photoUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unread: boolean;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} className="rounded-full object-cover shrink-0" style={{ width: 52, height: 52 }} />
  ) : (
    <div className="rounded-full shrink-0 flex items-center justify-center" style={{ width: 52, height: 52, background: "linear-gradient(135deg,#F0EBFA,#E8DEFF)" }}>
      <User size={22} style={{ color: "#9B87B0" }} strokeWidth={1.5} />
    </div>
  );
}

export default function ChatPage() {
  const [convos, setConvos] = useState<Convo[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/api/chat");
      const { data } = await res.json();
      setConvos(data);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ minHeight: "100%", background: "#F5F0FB" }}>
      <div className="px-4 pt-5 pb-2">
        <h1 className="text-lg font-bold" style={{ color: "#1A0A2E" }}>Messages</h1>
      </div>

      <div className="px-4 pt-2 pb-28">
        {/* Loading skeletons */}
        {!convos && !error && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-white animate-pulse" style={{ height: 76 }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center py-24">
            <p className="text-sm mb-3" style={{ color: "#DC2626" }}>Failed to load messages.</p>
            <button onClick={load} className="text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "#EDE8F7", color: "#6B5E7A" }}>Retry</button>
          </div>
        )}

        {/* Empty */}
        {convos?.length === 0 && (
          <div className="flex flex-col items-center py-32">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg,#F0EBFA,#E8DEFF)" }}>
              <MessageCircle size={24} style={{ color: "#9B87B0" }} strokeWidth={1.5} />
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: "#1A0A2E" }}>No conversations yet</p>
            <p className="text-sm text-center max-w-xs" style={{ color: "#9B87B0" }}>
              Once you are matched, you can start chatting here.
            </p>
          </div>
        )}

        {/* Conversation list */}
        {convos && convos.length > 0 && (
          <div className="space-y-2">
            {convos.map((c) => (
              <Link
                key={c.matchId}
                href={`/chat/${c.matchId}`}
                className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 no-underline"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              >
                <div className="relative">
                  <Avatar url={c.photoUrl} name={c.name} />
                  {c.unread && (
                    <span
                      className="absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                      style={{ backgroundColor: "#8F3A8F" }}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className="text-sm font-semibold truncate"
                      style={{ color: "#1A0A2E", fontWeight: c.unread ? 700 : 600 }}
                    >
                      {c.name}
                    </span>
                    <span className="text-xs shrink-0 ml-2" style={{ color: "#9B87B0" }}>
                      {timeAgo(c.lastMessageAt)}
                    </span>
                  </div>
                  <p
                    className="text-sm truncate"
                    style={{ color: c.unread ? "#3B2056" : "#9B87B0", fontWeight: c.unread ? 500 : 400 }}
                  >
                    {c.lastMessage ?? "Say hello"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
