"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordForm() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("saved");
      setPassword("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <input
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        className="rounded border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
      >
        Set password
      </button>
      {status === "saved" && <span className="text-sm text-green-600">Saved — use it next time instead of a magic link.</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
}
