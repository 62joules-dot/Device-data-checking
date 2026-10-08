"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Card, CardHeader } from "@/app/components/ui";
import { createClient } from "@/lib/supabase/client";
import { DEVICE_TYPE_LABEL } from "@/lib/device-types";
import { resolvePhotos, type BankImage } from "@/lib/photo-fallback";
import { toWhatsAppNumber, whatsAppLink } from "@/lib/phone";
import type { Contact } from "./contacts-panel";

type Device = {
  id: string;
  reference: string | null;
  brand: string | null;
  model: string | null;
  device_type: string | null;
  year: number | null;
  condition: string | null;
  usage_counter: string | null;
  price_recommended: number | null;
  photos: unknown;
};
type Listing = { device_id: string; platform: string; status: string; listing_url: string | null; short_description: string | null };
type Sent = { contact_id: string; device_id: string | null; sent_at: string; channel: string; status: string; error: string | null };
type Mode = "template" | "free";

function buildTemplate(d: Device, listings: Listing[], photos: string[]) {
  const name = `${d.brand ?? ""} ${d.model ?? ""}`.trim();
  const facts = [
    d.year && `Année : ${d.year}`,
    d.condition && `État : ${d.condition}`,
    d.usage_counter && `Compteur : ${d.usage_counter}`,
    d.price_recommended != null && `Prix : ${Number(d.price_recommended).toLocaleString("fr-FR")} € HT`,
  ].filter(Boolean);
  const desc = (listings.find((l) => l.platform === "leboncoin") ?? listings[0])?.short_description;
  const online = listings.find((l) => l.status === "posted" && l.listing_url)?.listing_url;
  return [
    "Bonjour {prenom},",
    `Je vous propose actuellement : *${name}*${d.device_type ? ` (${DEVICE_TYPE_LABEL[d.device_type] ?? d.device_type})` : ""}.`,
    facts.join("\n"),
    desc ?? "",
    photos.length ? `Photos :\n${photos.join("\n")}` : "",
    online ? `Annonce : ${online}` : "",
    "Intéressé(e) ? Répondez-moi ici, je vous envoie plus de détails.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export default function WhatsAppComposer({
  devices, listings, bank, contacts, sent, apiConfigured,
}: {
  devices: Device[]; listings: Listing[]; bank: BankImage[]; contacts: Contact[]; sent: Sent[]; apiConfigured: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("template");
  const [sending, setSending] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState("");
  const [template, setTemplate] = useState("");
  const [included, setIncluded] = useState<string[]>([]);
  const [kindFilter, setKindFilter] = useState<"" | "client" | "prospect">("");
  const [shareError, setShareError] = useState<string | null>(null);

  const device = devices.find((d) => d.id === deviceId) ?? null;
  const photos = useMemo(() => (device ? resolvePhotos(device, bank) : { urls: [], fromBank: false }), [device, bank]);
  const deviceListings = listings.filter((l) => l.device_id === deviceId);

  function pick(id: string) {
    setDeviceId(id);
    const d = devices.find((x) => x.id === id);
    if (!d) return setTemplate("");
    const urls = resolvePhotos(d, bank).urls.slice(0, 4);
    setIncluded(urls);
    setTemplate(buildTemplate(d, listings.filter((l) => l.device_id === id), urls));
  }

  function togglePhoto(url: string) {
    const next = included.includes(url) ? included.filter((u) => u !== url) : [...included, url];
    setIncluded(next);
    if (device) setTemplate(buildTemplate(device, deviceListings, next));
  }

  const ranked = contacts
    .filter((c) => !kindFilter || c.kind === kindFilter)
    .map((c) => ({ c, match: !!device?.device_type && c.interests.includes(device.device_type) }))
    .sort((a, b) => Number(b.match) - Number(a.match) || a.c.name.localeCompare(b.c.name));

  function messageFor(c: Contact) {
    return template.replaceAll("{prenom}", c.name.split(/[\s–-]/)[0] || c.name);
  }

  async function apiSend(targets: Contact[]) {
    if (!targets.length) return;
    if (targets.length > 1 && !confirm(`Envoyer via l'API WhatsApp à ${targets.length} contacts ?`)) return;
    if (mode === "template" && included.length === 0 && !confirm("Aucune photo sélectionnée — le modèle Meta avec image échouera. Continuer ?")) return;
    setSending(true);
    setApiMessage(null);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_ids: targets.map((c) => c.id), device_id: deviceId, mode, message: template, image_urls: included }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      const ok = data.results.filter((r: { ok: boolean }) => r.ok).length;
      const failed = data.results.filter((r: { ok: boolean }) => !r.ok);
      setApiMessage(`${ok} envoyé(s)${failed.length ? `, ${failed.length} échec(s) : ${failed[0].error}` : ""}.`);
      router.refresh();
    } catch (e) {
      setApiMessage(e instanceof Error ? e.message : "Échec");
    } finally {
      setSending(false);
    }
  }

  async function logSend(c: Contact) {
    await createClient().from("contact_messages").insert({ contact_id: c.id, device_id: deviceId || null, channel: "whatsapp" });
    router.refresh();
  }

  // Mobile: the share sheet can carry the actual image files into WhatsApp.
  async function shareWithPhotos() {
    setShareError(null);
    try {
      const files = await Promise.all(
        included.map(async (url, i) => {
          const blob = await (await fetch(url)).blob();
          return new File([blob], `photo-${i + 1}.${blob.type.split("/")[1] || "jpg"}`, { type: blob.type });
        })
      );
      const text = template.replaceAll("{prenom}", "").replace("Bonjour ,", "Bonjour,");
      if (navigator.canShare?.({ files, text })) await navigator.share({ files, text });
      else setShareError("Partage de fichiers non supporté ici — utilise le téléphone, ou les liens WhatsApp ci-dessous.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setShareError("Partage impossible (photo externe non téléchargeable ?).");
    }
  }

  const lastSent = (contactId: string) =>
    sent
      .filter((s) => s.contact_id === contactId && s.device_id === deviceId)
      .sort((a, b) => a.sent_at.localeCompare(b.sent_at))
      .pop();

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <select value={deviceId} onChange={(e) => pick(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm">
          <option value="">— Choisir l&apos;appareil à proposer —</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>{d.reference ? `${d.reference} — ` : ""}{d.brand} {d.model}</option>
          ))}
        </select>

        {device && (
          <>
            <div>
              <div className="mb-2 text-xs font-medium text-zinc-500">
                Photos à joindre {photos.fromBank && <span className="text-amber-600">(banque d&apos;images — pas de photo propre)</span>}
              </div>
              {photos.urls.length === 0 ? (
                <p className="text-xs text-zinc-400">Aucune photo — ajoute-en sur la fiche appareil ou dans la banque d&apos;images.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {photos.urls.map((url) => (
                    <button key={url} type="button" onClick={() => togglePhoto(url)}
                      className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 ${included.includes(url) ? "border-emerald-500" : "border-transparent opacity-40"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-zinc-500">Message ({"{prenom}"} est remplacé par le prénom du contact)</div>
              <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={12} className="w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-xs" />
            </div>
            {included.length > 0 && (
              <div>
                <Button variant="secondary" onClick={shareWithPhotos}>Partager avec les photos (mobile)</Button>
                {shareError && <p className="mt-1 text-xs text-amber-600">{shareError}</p>}
              </div>
            )}
          </>
        )}
      </Card>

      {device && (
        <Card>
          <CardHeader
            title="Envoyer à"
            action={
              <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as "" | "client" | "prospect")} className="rounded-lg border border-zinc-200 px-2 py-1 text-xs">
                <option value="">Tous</option>
                <option value="client">Clients</option>
                <option value="prospect">Prospects</option>
              </select>
            }
          />
          {apiConfigured ? (
            <div className="space-y-2 border-b border-zinc-100 px-5 py-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-zinc-500">Envoi API :</span>
                <label className="flex items-center gap-1"><input type="radio" checked={mode === "template"} onChange={() => setMode("template")} /> Modèle Meta (1er contact)</label>
                <label className="flex items-center gap-1"><input type="radio" checked={mode === "free"} onChange={() => setMode("free")} /> Message libre + photos (contact qui t&apos;a écrit &lt; 24 h)</label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={sending} onClick={() => apiSend(ranked.filter((r) => r.match).map((r) => r.c))}>
                  Envoyer aux intéressés ({ranked.filter((r) => r.match).length})
                </Button>
                <Button variant="secondary" disabled={sending} onClick={() => apiSend(ranked.map((r) => r.c))}>
                  Envoyer à toute la liste ({ranked.length})
                </Button>
              </div>
              {sending && <p className="text-zinc-400">Envoi en cours…</p>}
              {apiMessage && <p className="text-zinc-700">{apiMessage}</p>}
            </div>
          ) : (
            <p className="border-b border-zinc-100 px-5 py-2.5 text-xs text-zinc-400">
              Envoi via lien (tu cliques sur Envoyer dans WhatsApp). Pour l&apos;envoi direct, configure l&apos;API dans Réglages → Connexions & API.
            </p>
          )}
          <ul className="divide-y divide-zinc-100">
            {ranked.map(({ c, match }) => {
              const last = lastSent(c.id);
              const valid = toWhatsAppNumber(c.phone).length >= 8;
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-sm">
                  <div>
                    <span className="font-medium text-zinc-800">{c.name}</span>
                    <span className="ml-2 text-xs text-zinc-400">{c.kind === "client" ? "Client" : "Prospect"}</span>
                    {match && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">intéressé par ce type</span>}
                    {last && (
                      <span className={`ml-2 text-xs ${last.status === "failed" ? "text-red-500" : "text-zinc-400"}`} title={last.error ?? undefined}>
                        {last.status === "failed" ? "échec" : last.channel === "whatsapp_api" ? "envoyé (API)" : "ouvert dans WhatsApp"} le {new Date(last.sent_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {valid ? (
                    <div className="flex gap-1.5">
                      {apiConfigured && (
                        <Button disabled={sending} onClick={() => apiSend([c])}>Envoyer (API)</Button>
                      )}
                      <a href={whatsAppLink(c.phone, messageFor(c))} target="_blank" rel="noreferrer" onClick={() => logSend(c)}>
                        <Button variant={apiConfigured ? "secondary" : "primary"}>{apiConfigured ? "Ouvrir WhatsApp" : "Envoyer sur WhatsApp"}</Button>
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-red-500">numéro invalide</span>
                  )}
                </li>
              );
            })}
            {ranked.length === 0 && <li className="px-5 py-4 text-sm text-zinc-400">Aucun contact — ajoute-en à droite.</li>}
          </ul>
        </Card>
      )}
    </div>
  );
}
