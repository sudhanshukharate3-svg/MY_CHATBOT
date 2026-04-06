import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";
import { useAuth } from "../../state/auth";
import { apiJson } from "../../lib/api";
import { createSocket } from "../../lib/socket";
import { Waveform } from "../components/Waveform";

type Session = { _id: string; title: string; updatedAt: string; lastMessageAt: string };
type Message = { _id: string; role: "user" | "assistant" | "system"; content: string; createdAt: string };

export function ChatView() {
  const { user, accessToken, logout } = useAuth();
  const token = accessToken!;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [composer, setComposer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);

  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson<{ sessions: Session[] }>("/api/sessions", { token });
        if (cancelled) return;
        setSessions(data.sessions);
        if (!data.sessions.length) {
          const created = await apiJson<{ session: Session }>("/api/sessions", { method: "POST", token, body: {} });
          if (cancelled) return;
          setSessions([created.session]);
          setActiveSessionId(created.session._id);
        } else {
          setActiveSessionId((prev) => prev ?? data.sessions[0]._id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load sessions");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!activeSessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson<{ messages: Message[] }>(`/api/sessions/${activeSessionId}/messages`, { token });
        if (cancelled) return;
        setMessages(data.messages);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load messages");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSessionId, token]);

  useEffect(() => {
    const socket = createSocket(token);
    socketRef.current = socket;
    socket.on("chat:typing", (p) => {
      if (p.sessionId === activeSessionId) setTyping(p.isTyping);
    });
    socket.on("chat:message:created", (p) => {
      const msg = p.message as Message;
      if (String((msg as any).sessionId) !== String(activeSessionId)) return;
      setMessages((prev) => [...prev, msg]);
      if (msg.role === "assistant" && voiceEnabled) speak(msg.content);
    });
    socket.on("chat:error", (p) => setError(p.message));
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, activeSessionId, voiceEnabled]);

  useEffect(() => {
    if (!activeSessionId) return;
    socketRef.current?.emit("session:join", { sessionId: activeSessionId });
  }, [activeSessionId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const canUseSpeech = useMemo(
    () => typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window),
    []
  );

  async function newSession() {
    try {
      const created = await apiJson<{ session: Session }>("/api/sessions", { method: "POST", token, body: {} });
      setSessions((prev) => [created.session, ...prev]);
      setActiveSessionId(created.session._id);
      setMessages([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create session");
    }
  }

  async function send(text: string) {
    if (!activeSessionId) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setComposer("");
    setBusy(true);
    setError(null);
    try {
      socketRef.current?.emit("chat:message", { sessionId: activeSessionId, text: trimmed, clientMessageId: cryptoId() });
    } finally {
      setBusy(false);
    }
  }

  function startListening() {
    if (!canUseSpeech) {
      setError("Voice input is not supported in this browser. Use Chrome or Edge.");
      return;
    }
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognitionCtor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = (e: any) => {
      setListening(false);
      const err = e?.error;
      if (err === "not-allowed" || err === "permission-denied") {
        setError("Microphone access denied. Allow mic permissions in your browser.");
      } else {
        setError("Voice input failed. Try again or type.");
      }
    };
    rec.onresult = (ev: any) => {
      const transcript = Array.from(ev.results)
        .map((r: any) => r[0]?.transcript ?? "")
        .join("");
      setComposer(transcript);
      const last = ev.results[ev.results.length - 1];
      if (last?.isFinal && transcript.trim()) {
        send(transcript);
        rec.stop();
      }
    };
    rec.start();
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => /zira|female|susan|samantha/i.test(v.name));
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">{user?.name}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={logout}
          >
            Logout
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-soft hover:bg-indigo-500"
            onClick={newSession}
          >
            New chat
          </button>
          <button
            type="button"
            className={clsx(
              "rounded-xl border px-3 py-2 text-sm font-semibold",
              voiceEnabled
                ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-200"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
            )}
            onClick={() => setVoiceEnabled((v) => !v)}
            aria-pressed={voiceEnabled}
            title="Toggle voice output"
          >
            🔊
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {sessions.map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() => setActiveSessionId(s._id)}
              className={clsx(
                "w-full rounded-xl px-3 py-2 text-left text-sm transition",
                activeSessionId === s._id
                  ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              )}
            >
              <div className="truncate font-medium">{s.title}</div>
              <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {new Date(s.lastMessageAt).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-[70vh] flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
              Ask anything via text or voice. Replies support markdown (code blocks, lists, tables).
            </div>
          )}
          {messages
            .filter((m) => m.role !== "system")
            .map((m) => (
              <MessageBubble key={m._id} msg={m} onSpeak={voiceEnabled ? speak : undefined} />
            ))}
          {typing && <TypingIndicator />}
        </div>

        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          {error && (
            <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={clsx(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                listening
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
              )}
              onClick={startListening}
              disabled={busy}
              aria-label="Voice input"
            >
              🎙️
              <Waveform active={listening} />
            </button>

            <input
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-500/30 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950"
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              placeholder="Type your message…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(composer);
                }
              }}
            />

            <button
              type="button"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-indigo-500 disabled:opacity-60"
              onClick={() => send(composer)}
              disabled={busy}
            >
              Send
            </button>
          </div>

          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Tip: use Chrome/Edge for voice input. You can toggle voice output with 🔊.
          </div>
        </div>
      </section>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
      <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
      MYCHAT APP is typing…
    </div>
  );
}

function MessageBubble({ msg, onSpeak }: { msg: Message; onSpeak?: (t: string) => void }) {
  const isUser = msg.role === "user";
  return (
    <div className={clsx("flex animate-floatIn gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && <Avatar label="AI" />}
      <div
        className={clsx(
          "max-w-[78ch] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-indigo-600 text-white"
            : "border border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        )}
      >
        {msg.role === "assistant" ? (
          <div className="prose prose-zinc max-w-none dark:prose-invert prose-pre:bg-zinc-900 prose-pre:text-zinc-50">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{msg.content}</div>
        )}

        <div className={clsx("mt-2 flex items-center justify-between gap-3 text-[11px] opacity-80", isUser && "text-white/80")}>
          <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
          {!isUser && onSpeak && (
            <button type="button" className="font-semibold hover:underline" onClick={() => onSpeak(msg.content)}>
              Speak
            </button>
          )}
        </div>
      </div>
      {isUser && <Avatar label="You" />}
    </div>
  );
}

function Avatar({ label }: { label: string }) {
  return (
    <div className="mt-1 h-9 w-9 flex-none rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-100 text-xs font-semibold text-zinc-700 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-200 grid place-items-center">
      {label}
    </div>
  );
}

function cryptoId() {
  // Lightweight client message id (no dependency)
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

