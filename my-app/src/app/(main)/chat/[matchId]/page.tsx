"use client";

import { useEffect, useRef, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, User } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  mine: boolean;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function ChatConversationPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [partnerPhoto, setPartnerPhoto] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      const res = await authFetch(`/api/chat/${matchId}`);
      if (!res.ok) { router.push("/chat"); return; }
      const { data } = await res.json();
      setMessages(data);
    } catch {
      /* ignore polling errors */
    } finally {
      setLoaded(true);
    }
  }, [matchId, router]);

  // Load partner info from chat list
  const loadPartner = useCallback(async () => {
    try {
      const res = await authFetch("/api/chat");
      const { data } = await res.json();
      const convo = data?.find((c: { matchId: string; name: string; photoUrl: string | null }) => c.matchId === matchId);
      if (convo) { setPartnerName(convo.name); setPartnerPhoto(convo.photoUrl); }
    } catch { /* ignore */ }
  }, [matchId]);

  useEffect(() => {
    loadPartner();
    loadMessages();
    // Poll every 4 seconds for new messages
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [loadMessages, loadPartner]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const content = input.trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);

    // Optimistic insert
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      mine: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await authFetch(`/api/chat/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const { data } = await res.json();
      // Replace optimistic with real message
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data : m)));
    } catch {
      // Remove optimistic on error
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", background: "#F5F0FB" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #EDE8F7",
        }}
      >
        <button
          onClick={() => router.push("/chat")}
          className="p-1.5 rounded-xl"
          style={{ color: "#6B5E7A" }}
        >
          <ArrowLeft size={20} strokeWidth={1.8} />
        </button>

        {partnerPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={partnerPhoto} alt={partnerName} className="rounded-full object-cover" style={{ width: 38, height: 38 }} />
        ) : (
          <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 38, height: 38, background: "linear-gradient(135deg,#F0EBFA,#E8DEFF)" }}>
            <User size={18} style={{ color: "#9B87B0" }} strokeWidth={1.5} />
          </div>
        )}

        <div>
          <p className="text-sm font-semibold leading-tight" style={{ color: "#1A0A2E" }}>
            {partnerName || "Chat"}
          </p>
          <p className="text-xs" style={{ color: "#9B87B0" }}>Matched on Bluedate</p>
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {!loaded && (
          <div className="flex justify-center pt-12">
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#C060C0", borderTopColor: "transparent" }} />
          </div>
        )}

        {loaded && messages.length === 0 && (
          <div className="flex flex-col items-center pt-16 pb-8">
            <p className="text-sm font-medium mb-1" style={{ color: "#1A0A2E" }}>You matched!</p>
            <p className="text-sm" style={{ color: "#9B87B0" }}>Say hello to {partnerName}.</p>
          </div>
        )}

        {messages.map((m, i) => {
          const showTime =
            i === messages.length - 1 ||
            new Date(messages[i + 1].createdAt).getTime() - new Date(m.createdAt).getTime() > 5 * 60 * 1000;

          return (
            <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div style={{ maxWidth: "72%" }}>
                <div
                  className="px-4 py-2.5 text-sm leading-relaxed"
                  style={{
                    borderRadius: m.mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: m.mine
                      ? "linear-gradient(135deg,#8F3A8F,#C060C0)"
                      : "#fff",
                    color: m.mine ? "#fff" : "#1A0A2E",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  }}
                >
                  {m.content}
                </div>
                {showTime && (
                  <p
                    className={`text-xs mt-1 ${m.mine ? "text-right" : "text-left"}`}
                    style={{ color: "#9B87B0" }}
                  >
                    {formatTime(m.createdAt)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 px-4 py-3 flex items-end gap-3"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid #EDE8F7",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none text-sm px-4 py-2.5 rounded-2xl outline-none"
          style={{
            background: "#F5F0FB",
            color: "#1A0A2E",
            border: "1px solid #EDE8F7",
            maxHeight: 120,
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity"
          style={{ background: "linear-gradient(135deg,#8F3A8F,#C060C0)" }}
        >
          <Send size={16} color="#fff" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
