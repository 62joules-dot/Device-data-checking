"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/app/components/ui";
import PlatformBadge from "@/app/platform-badge";
import { POST_URL, TIER_A } from "@/lib/platforms";

type Listing = {
  id: string;
  platform: string;
  title: string | null;
  long_description: string | null;
  status: string;
  device: { price_recommended?: number | null } | null;
};

export default function GeneratedPanel({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Copie impossible — sélectionne le texte à la main.");
    }
  }

  async function automate(l: Listing) {
    setBusy(l.id);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${l.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "posted", price: l.device?.price_recommended ?? null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Échec");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-red-600">{error}</p>}
      {listings.map((l) => {
        const text = `${l.title ?? ""}\n\n${l.long_description ?? ""}`.trim();
        const auto = TIER_A.has(l.platform);
        const isPosted = ["posted", "sold", "removed"].includes(l.status);
        return (
          <div key={l.id} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <PlatformBadge platform={l.platform} />
                <span className={`text-xs ${auto ? "text-blue-600" : "text-amber-600"}`}>
                  {auto ? "automatique" : "manuel"}
                </span>
              </span>
              <span className="flex flex-wrap gap-1.5">
                <Button variant="secondary" onClick={() => copy(l.id, text)} disabled={!text}>
                  {copied === l.id ? "Copié ✓" : "Copier le texte"}
                </Button>
                {auto && !isPosted && (
                  <Button onClick={() => automate(l)} disabled={busy === l.id}>
                    {busy === l.id ? "…" : "Automatiser la publication"}
                  </Button>
                )}
                {!auto && POST_URL[l.platform] && (
                  <a href={POST_URL[l.platform]} target="_blank" rel="noreferrer">
                    <Button>Publier sur le site ↗</Button>
                  </a>
                )}
              </span>
            </div>
            {text ? (
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-sans text-xs text-zinc-600">{text}</pre>
            ) : (
              <p className="text-xs text-zinc-400">Aucun texte généré pour cette plateforme — réimporte l&apos;appareil.</p>
            )}
            {!auto && !isPosted && (
              <p className="mt-2 text-xs text-zinc-400">
                Une fois publiée, colle le lien dans la ligne au-dessus puis clique &quot;Marquer en ligne&quot;.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
