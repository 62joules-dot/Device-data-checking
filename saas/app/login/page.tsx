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
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200/70 bg-white p-8 shadow-sm shadow-zinc-900/[0.03]">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          62<span className="text-blue-600">joules</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Connecte-toi pour accéder à ton inventaire.</p>

        {mode === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              {busy ? "Connexion…" : "Se connecter"}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="button"
              onClick={() => { setMode("magic-link"); setError(null); }}
              className="w-full text-xs text-zinc-400 underline hover:text-zinc-600"
            >
              Pas encore de mot de passe ? Utiliser un lien magique
            </button>
          </form>
        ) : sent ? (
          <p className="mt-6 text-sm text-zinc-600">
            Regarde ta boîte mail à <strong>{email}</strong> pour le lien magique.
            Une fois connecté, définis un mot de passe depuis les réglages.
          </p>
        ) : (
          <form onSubmit={handleMagicLinkSubmit} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Envoyer le lien magique
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="button"
              onClick={() => { setMode("password"); setError(null); }}
              className="w-full text-xs text-zinc-400 underline hover:text-zinc-600"
            >
              Revenir à la connexion par mot de passe
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
