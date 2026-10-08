"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui";
import PlatformBadge from "@/app/platform-badge";

const PLATFORM_FIELDS: Record<string, { key: string; label: string }[]> = {
  ebay: [
    { key: "client_id", label: "Client ID" },
    { key: "client_secret", label: "Client Secret" },
  ],
  dotmed: [{ key: "api_key", label: "Clé API" }],
  machinio: [{ key: "api_key", label: "Clé API / URL de flux" }],
  kitmondo: [{ key: "api_key", label: "Clé API / URL de flux" }],
};

type Saved = Record<string, { connected: boolean; updatedAt: string | null }>;

export default function ConnectionsForm() {
  const [saved, setSaved] = useState<Saved>({});
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/credentials")
      .then((r) => r.json())
      .then((data) => {
        const next: Saved = {};
        for (const row of data.credentials ?? []) {
          next[row.platform] = { connected: true, updatedAt: row.updated_at };
        }
        setSaved(next);
      });
  }, []);

  function setField(platform: string, key: string, value: string) {
    setValues((v) => ({ ...v, [platform]: { ...v[platform], [key]: value } }));
  }

  async function save(platform: string) {
    setBusy(platform);
    setMessage(null);
    const credentials = values[platform] ?? {};
    await fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, credentials }),
    });
    setSaved((s) => ({ ...s, [platform]: { connected: true, updatedAt: new Date().toISOString() } }));
    setValues((v) => ({ ...v, [platform]: {} }));
    setBusy(null);
    setMessage(`${platform} connecté.`);
  }

  async function remove(platform: string) {
    if (!confirm("Supprimer cette connexion ?")) return;
    setBusy(platform);
    await fetch(`/api/credentials/${platform}`, { method: "DELETE" });
    setSaved((s) => {
      const next = { ...s };
      delete next[platform];
      return next;
    });
    setBusy(null);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">
        Stocke ici les identifiants API de chaque plateforme. Pour l&apos;instant ça prépare le terrain —
        la publication automatique réelle (appel de l&apos;API pour créer l&apos;annonce) reste à brancher
        plateforme par plateforme une fois ces comptes développeur obtenus.
      </p>
      {message && <p className="text-xs text-emerald-600">{message}</p>}
      {Object.entries(PLATFORM_FIELDS).map(([platform, fields]) => {
        const isSaved = saved[platform]?.connected;
        return (
          <div key={platform} className="rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center justify-between">
              <PlatformBadge platform={platform} />
              {isSaved ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">Connecté</span>
              ) : (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">Non connecté</span>
              )}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {fields.map((f) => (
                <input
                  key={f.key}
                  type="password"
                  value={values[platform]?.[f.key] ?? ""}
                  onChange={(e) => setField(platform, f.key, e.target.value)}
                  placeholder={isSaved ? "•••••••• (laisser vide pour garder)" : f.label}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                />
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={() => save(platform)} disabled={busy === platform}>
                {isSaved ? "Mettre à jour" : "Connecter"}
              </Button>
              {isSaved && (
                <Button variant="danger" onClick={() => remove(platform)} disabled={busy === platform}>
                  Déconnecter
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
