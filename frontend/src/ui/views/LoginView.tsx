import React, { useMemo, useState } from "react";
import { useAuth } from "../../state/auth";

export function LoginView() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (mode === "login" ? "Welcome back" : "Create your account"), [mode]);
  const subtitle = useMemo(
    () =>
      mode === "login"
        ? "Sign in to continue your conversations."
        : "Secure JWT auth with session history stored in MongoDB.",
    [mode]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await login(email, password);
      else await signup(email, name, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>

        <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Email</span>
            <input
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 outline-none ring-indigo-500/30 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          {mode === "signup" && (
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">Name</span>
              <input
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 outline-none ring-indigo-500/30 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
          )}

          <label className="grid gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Password</span>
            <input
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 outline-none ring-indigo-500/30 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-indigo-600 to-fuchsia-600 p-6 text-white shadow-soft">
        <h3 className="text-lg font-semibold tracking-tight">Production-grade chat UX</h3>
        <ul className="mt-3 space-y-2 text-sm text-white/90">
          <li>• Real-time messaging with typing indicators</li>
          <li>• Markdown replies with code formatting</li>
          <li>• Voice input (STT) + voice output (TTS)</li>
          <li>• MongoDB-backed session history + context memory</li>
          <li>• Rate limiting + JWT authentication</li>
        </ul>
      </section>
    </div>
  );
}

