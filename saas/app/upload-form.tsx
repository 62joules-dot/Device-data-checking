"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UploadForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = (e.currentTarget.elements.namedItem("file") as HTMLInputElement)?.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/generate", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <input type="file" name="file" accept=".xlsx" required className="text-sm" />
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "Generating…" : "Generate listings"}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
}
