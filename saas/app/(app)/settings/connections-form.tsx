"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui";
import PlatformBadge from "@/app/platform-badge";

type Field = { key: string; label: string; secret?: boolean; placeholder?: string };

const PLATFORM_FIELDS: Record<string, { title?: string; fields: Field[]; help?: string }> = {
  whatsapp: {
    title: "WhatsApp Business (Cloud API)",
    fields: [
      { key: "access_token", label: "Token d'accès (permanent)", secret: true },
      { key: "phone_number_id", label: "Phone number ID" },
      { key: "template_name", label: "Nom du modèle", placeholder: "annonce_appareil" },
      { key: "template_lang", label: "Langue du modèle", placeholder: "fr" },
      { key: "api_version", label: "Version API", placeholder: "v23.0" },
    ],
    help: "Meta Business → WhatsApp Manager → API Setup : Phone number ID, et un token permanent d'utilisateur système.",
  },
  ebay: {
    fields: [
      { key: "client_id", label: "Client ID" },
      { key: "client_secret", label: "Client Secret", secret: true },
    ],
  },
  dotmed: { fields: [{ key: "api_key", label: "Clé API", secret: true }] },
  machinio: { fields: [{ key: "api_key", label: "Clé API / URL de flux", secret: true }] },
  kitmondo: { fields: [{ key: "api_key", label: "Clé API / URL de flux", secret: true }] },
};

type Stored = Record<string, Record<string, unknown>>;

export default function ConnectionsForm() {
  const [stored, setStored] = useState<Stored>({});
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ platform: string; text: string; ok: boolean } | null>(null);

  function load() {
    fetch("/api/credentials")
      .then((r) => r.json())
      .then((data) => {
        const next: Stored = {};
        for (const row of data.credentials ?? []) next[row.platform] = row.credentials ?? {};
        setStored(next);
      });
  }
  useEffect(load, []);

  function setField(platform: string, key: string, value: string) {
    setValues((v) => ({ ...v, [platform]: { ...v[platform], [key]: value } }));
  }

  async function save(platform: string) {
    setBusy(platform);
    setMessage(null);
    // Only send what was typed — untouched fields keep their stored value.
    const credentials = Object.fromEntries(Object.entries(values[platform] ?? {}).filter(([, v]) => v.trim() !== ""));
    const res = await fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, credentials }),
    });
    setBusy(null);
    if (!res.ok) return setMessage({ platform, text: (await res.json()).error || "Échec", ok: false });
    setValues((v) => ({ ...v, [platform]: {} }));
    setMessage({ platform, text: "Enregistré.", ok: true });
    load();
  }

  async function test(platform: string) {
    setBusy(platform);
    setMessage(null);
    const res = await fetch(`/api/${platform}/test`, { method: "POST" });
    const data = await res.json();
    setBusy(null);
    setMessage(
      res.ok
        ? { platform, text: `Connexion OK — ${data.name ?? ""} ${data.number ?? ""}${data.quality ? ` (qualité ${data.quality})` : ""}`, ok: true }
        : { platform, text: data.error || "Échec", ok: false }
    );
  }

  async function remove(platform: string) {
    if (!confirm("Supprimer cette connexion ?")) return;
    setBusy(platform);
    await fetch(`/api/credentials/${platform}`, { method: "DELETE" });
    setBusy(null);
    load();
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">
        WhatsApp est branché : une fois configuré, l&apos;onglet WhatsApp envoie directement via l&apos;API.
        Les autres plateformes stockent leurs identifiants en attendant leur intégration.
      </p>
      {Object.entries(PLATFORM_FIELDS).map(([platform, cfg]) => {
        const current = stored[platform];
        const isSaved = !!current && Object.values(current).some(Boolean);
        return (
          <div key={platform} className="rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center justify-between">
              {cfg.title ? <span className="text-sm font-medium">{cfg.title}</span> : <PlatformBadge platform={platform} />}
              <span className={`rounded-full px-2 py-0.5 text-xs ${isSaved ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                {isSaved ? "Configuré" : "Non configuré"}
              </span>
            </div>
            {cfg.help && <p className="mt-1 text-xs text-zinc-400">{cfg.help}</p>}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {cfg.fields.map((f) => {
                const has = current?.[f.key];
                return (
                  <label key={f.key} className="text-xs text-zinc-500">
                    {f.label}
                    <input
                      type={f.secret ? "password" : "text"}
                      value={values[platform]?.[f.key] ?? ""}
                      onChange={(e) => setField(platform, f.key, e.target.value)}
                      placeholder={
                        f.secret
                          ? has ? "•••••••• (laisser vide pour garder)" : ""
                          : (typeof has === "string" && has) || f.placeholder || ""
                      }
                      className="mt-0.5 w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-800"
                    />
                  </label>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => save(platform)} disabled={busy === platform}>Enregistrer</Button>
              {platform === "whatsapp" && isSaved && (
                <Button onClick={() => test(platform)} disabled={busy === platform}>Tester la connexion</Button>
              )}
              {isSaved && (
                <Button variant="danger" onClick={() => remove(platform)} disabled={busy === platform}>Déconnecter</Button>
              )}
            </div>
            {message?.platform === platform && (
              <p className={`mt-2 text-xs ${message.ok ? "text-emerald-600" : "text-red-600"}`}>{message.text}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
