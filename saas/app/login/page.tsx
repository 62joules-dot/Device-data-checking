"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "magic-link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
    else {
      router.push("/");
      router.refresh();
    }
  }

  async function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">62joules</h1>

        {mode === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="button"
              onClick={() => { setMode("magic-link"); setError(null); }}
              className="w-full text-xs text-slate-500 underline"
            >
              No password set yet? Use a magic link instead
            </button>
          </form>
        ) : sent ? (
          <p className="text-sm text-slate-600">
            Check your inbox at <strong>{email}</strong> for a magic link. Once signed
            in, set a password from the dashboard so you won&apos;t need email again.
          </p>
        ) : (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            >
              Send magic link
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="button"
              onClick={() => { setMode("password"); setError(null); }}
              className="w-full text-xs text-slate-500 underline"
            >
              Back to password sign-in
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
