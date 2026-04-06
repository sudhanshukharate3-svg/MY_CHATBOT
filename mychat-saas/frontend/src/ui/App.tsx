import React, { useEffect, useMemo, useState } from "react";
import { AuthProvider, useAuth } from "../state/auth";
import { LoginView } from "./views/LoginView";
import { ChatView } from "./views/ChatView";
import { ThemeToggle } from "./components/ThemeToggle";

export function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

function Shell() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const raw = localStorage.getItem("mychat.theme");
    return raw === "light" ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("mychat.theme", theme);
  }, [theme]);

  const header = useMemo(
    () => (
      <header className="sticky top-0 z-10 border-b border-zinc-200/60 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-soft" />
            <div>
              <div className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                MYCHAT APP
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Text + Voice • Real-time • Context-aware</div>
            </div>
          </div>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </header>
    ),
    [theme]
  );

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      {header}
      <main className="mx-auto max-w-6xl px-4 py-6">{user ? <ChatView /> : <LoginView />}</main>
    </div>
  );
}

