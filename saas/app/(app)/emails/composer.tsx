"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button, Card, CardHeader } from "@/app/components/ui";
import { DEVICE_TYPE_LABEL } from "@/lib/device-types";
import { PLATFORM_META } from "@/lib/platforms";
import { EmailContent, renderEmailHtml, renderEmailText } from "@/lib/email-template";

type Device = {
  id: string;
  brand: string | null;
  model: string | null;
  device_type: string | null;
  year: number | null;
  condition: string | null;
  price_recommended: number | null;
  reference: string | null;
  usage_counter: string | number | null;
  photos: string[] | null;
};

type Listing = {
  device_id: string;
  platform: string;
  status: string;
  listing_url: string | null;
  short_description: string | null;
  long_description: string | null;
};

type Audience = "client" | "prospect";

// The parts of the mail the user can rewrite; everything else comes from the device.
type Editable = {
  subject: string;
  intro: string;
  description: string;
  outro: string;
  signatureName: string;
  showPrice: boolean;
  showPhoto: boolean;
};

function deviceName(d: Device) {
  return `${d.brand ?? ""} ${d.model ?? ""}`.trim() || d.reference || "Appareil";
}

function defaults(d: Device, listings: Listing[], audience: Audience, signatureName: string): Editable {
  const name = deviceName(d);
  return {
    subject: audience === "client" ? `${name} disponible – proposition` : `${name} d'occasion disponible`,
    intro:
      audience === "client"
        ? `Bonjour,\n\nComme suite à nos échanges, je me permets de vous proposer le ${name}, actuellement disponible.`
        : `Bonjour,\n\nJe me permets de vous contacter car nous proposons actuellement un ${name} qui pourrait intéresser votre établissement.`,
    description: listings.map((l) => l.long_description ?? l.short_description).find(Boolean) ?? "",
    outro:
      audience === "client"
        ? "Je reste à votre disposition pour toute question ou pour organiser une démonstration."
        : "Si cela vous intéresse, je serais ravi d'en discuter lors d'un court appel. N'hésitez pas à me répondre directement.",
    signatureName,
    showPrice: d.price_recommended != null,
    showPhoto: true,
  };
}

function buildContent(d: Device, listings: Listing[], e: Editable, contact: { phone: string; email: string }): EmailContent {
  const specs: [string, string][] = [];
  if (d.device_type) specs.push(["Type", DEVICE_TYPE_LABEL[d.device_type] ?? d.device_type]);
  if (d.brand) specs.push(["Marque", d.brand]);
  if (d.model) specs.push(["Modèle", d.model]);
  if (d.year) specs.push(["Année", String(d.year)]);
  if (d.condition) specs.push(["État", d.condition]);
  if (d.usage_counter != null && d.usage_counter !== "") specs.push(["Compteur", String(d.usage_counter)]);

  const photo = (d.photos ?? []).find((p) => /^https?:\/\//.test(p)) ?? null;

  return {
    title: deviceName(d),
    subtitle: [d.device_type && (DEVICE_TYPE_LABEL[d.device_type] ?? d.device_type), d.year].filter(Boolean).join(" · "),
    photoUrl: e.showPhoto ? photo : null,
    intro: e.intro,
    specs,
    price: e.showPrice && d.price_recommended != null ? `${d.price_recommended.toLocaleString("fr-FR")} € HT` : null,
    description: e.description,
    links: listings
      .filter((l) => l.status === "posted" && l.listing_url)
      .map((l) => ({ label: `Voir sur ${PLATFORM_META[l.platform]?.label ?? l.platform}`, url: l.listing_url! })),
    outro: e.outro,
    signatureName: e.signatureName,
    contactPhone: contact.phone,
    contactEmail: contact.email,
  };
}

function parseRecipients(to: string) {
  return to
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function EmailComposer({
  devices,
  listings,
  contact,
  gmailSender,
}: {
  devices: Device[];
  listings: Listing[];
  contact: { phone: string; email: string };
  gmailSender: string | null;
}) {
  const [deviceId, setDeviceId] = useState("");
  const [audience, setAudience] = useState<Audience>("client");
  const [to, setTo] = useState("");
  const [signatureName, setSignatureName] = useState("62joules");
  const [edit, setEdit] = useState<Editable | null>(null);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const device = devices.find((d) => d.id === deviceId) ?? null;
  const deviceListings = useMemo(() => listings.filter((l) => l.device_id === deviceId), [listings, deviceId]);

  // Remember the signature name between visits (per browser only).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("email-signature-name");
      if (saved) setSignatureName(saved);
    } catch {}
  }, []);

  // Regenerate the editable text whenever the device or the audience changes.
  useEffect(() => {
    if (!device) {
      setEdit(null);
      return;
    }
    setEdit(defaults(device, deviceListings, audience, signatureName));
    setStatus(null);
    // signatureName deliberately excluded: editing it must not reset the rest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device, deviceListings, audience]);

  const content = device && edit ? buildContent(device, deviceListings, edit, contact) : null;
  const html = content ? renderEmailHtml(content) : "";
  const recipients = parseRecipients(to);

  function update<K extends keyof Editable>(key: K, value: Editable[K]) {
    setEdit((e) => (e ? { ...e, [key]: value } : e));
    if (key === "signatureName") {
      try {
        localStorage.setItem("email-signature-name", String(value));
      } catch {}
    }
  }

  async function copyForGmail() {
    if (!content) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([renderEmailText(content)], { type: "text/plain" }),
        }),
      ]);
    } catch {
      // Older browsers: copy the rendered preview as a selection instead.
      const node = previewRef.current;
      if (!node) return;
      const range = document.createRange();
      range.selectNodeContents(node);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      document.execCommand("copy");
      sel?.removeAllRanges();
    }
    setStatus({ kind: "ok", text: "Copié ! Dans Gmail : Nouveau message → colle (Ctrl+V / Cmd+V) dans le corps." });
  }

  async function send() {
    if (!content || !edit || recipients.length === 0) return;
    if (!confirm(`Envoyer ce mail à ${recipients.length} destinataire(s) depuis ${gmailSender} ?`)) return;
    setSending(true);
    setStatus(null);
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: recipients,
        subject: edit.subject,
        html,
        text: renderEmailText(content),
        fromName: edit.signatureName,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setStatus({ kind: "error", text: data.error ?? "Échec de l'envoi." });
      return;
    }
    const failed = (data.failed ?? []) as string[];
    setStatus(
      failed.length
        ? { kind: "error", text: `Envoyé à ${data.sent} destinataire(s). Échec pour : ${failed.join(", ")}` }
        : { kind: "ok", text: `Envoyé à ${data.sent} destinataire(s).` }
    );
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none";
  const labelClass = "text-xs uppercase tracking-wide text-zinc-400";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <Card>
        <CardHeader title="Contenu" />
        <div className="space-y-4 p-5">
          <label className="block space-y-1 text-sm">
            <span className={labelClass}>Appareil</span>
            <select className={inputClass} value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
              <option value="">— Choisir un appareil —</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {deviceName(d)}
                  {d.year ? ` (${d.year})` : ""}
                  {d.reference ? ` · ${d.reference}` : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-1 text-sm">
            <span className={labelClass}>Destinataire</span>
            <div className="flex gap-2">
              {(["client", "prospect"] as const).map((a) => (
                <Button key={a} type="button" variant={audience === a ? "primary" : "secondary"} onClick={() => setAudience(a)}>
                  {a === "client" ? "Client" : "Prospect"}
                </Button>
              ))}
            </div>
            <p className="text-xs text-zinc-400">Changer d&apos;appareil ou de destinataire régénère le texte.</p>
          </div>

          {edit && (
            <>
              <label className="block space-y-1 text-sm">
                <span className={labelClass}>Objet</span>
                <input className={inputClass} value={edit.subject} onChange={(e) => update("subject", e.target.value)} />
              </label>
              <label className="block space-y-1 text-sm">
                <span className={labelClass}>Introduction</span>
                <textarea className={`${inputClass} min-h-[110px]`} value={edit.intro} onChange={(e) => update("intro", e.target.value)} />
              </label>
              <label className="block space-y-1 text-sm">
                <span className={labelClass}>Description</span>
                <textarea className={`${inputClass} min-h-[140px]`} value={edit.description} onChange={(e) => update("description", e.target.value)} />
              </label>
              <label className="block space-y-1 text-sm">
                <span className={labelClass}>Conclusion</span>
                <textarea className={`${inputClass} min-h-[80px]`} value={edit.outro} onChange={(e) => update("outro", e.target.value)} />
              </label>
              <label className="block space-y-1 text-sm">
                <span className={labelClass}>Signature</span>
                <input className={inputClass} value={edit.signatureName} onChange={(e) => update("signatureName", e.target.value)} />
              </label>
              <div className="flex flex-wrap gap-4 text-sm text-zinc-600">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={edit.showPrice} onChange={(e) => update("showPrice", e.target.checked)} />
                  Afficher le prix
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={edit.showPhoto} onChange={(e) => update("showPhoto", e.target.checked)} />
                  Afficher la photo
                </label>
              </div>
              {!contact.phone && !contact.email && (
                <p className="text-xs text-zinc-400">
                  Astuce : ajoute ton téléphone et ton email dans{" "}
                  <Link href="/settings" className="underline">Réglages</Link> pour les afficher sous la signature.
                </p>
              )}
            </>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Aperçu" />
          <div className="p-3">
            {content ? (
              <div ref={previewRef} className="overflow-x-auto rounded-xl" dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p className="px-2 py-10 text-center text-sm text-zinc-400">Choisis un appareil pour générer le mail.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Envoyer" />
          <div className="space-y-4 p-5">
            <div className="space-y-2">
              <Button type="button" onClick={copyForGmail} disabled={!content}>
                Copier pour Gmail
              </Button>
              <p className="text-xs text-zinc-400">
                Copie le mail mis en page : colle-le dans un nouveau message Gmail, ajoute l&apos;objet et envoie.
              </p>
            </div>

            <div className="space-y-2 border-t border-zinc-100 pt-4">
              <label className="block space-y-1 text-sm">
                <span className={labelClass}>Envoi direct — destinataires (séparés par une virgule)</span>
                <input
                  className={inputClass}
                  placeholder="client@exemple.fr, prospect@exemple.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </label>
              {gmailSender ? (
                <>
                  <Button type="button" onClick={send} disabled={!content || recipients.length === 0 || sending}>
                    {sending ? "Envoi…" : `Envoyer depuis ${gmailSender}`}
                  </Button>
                  <p className="text-xs text-zinc-400">
                    Chaque destinataire reçoit son propre mail (personne ne voit les autres adresses). Les mails envoyés apparaissent dans tes « Envoyés » Gmail.
                  </p>
                </>
              ) : (
                <p className="text-xs text-zinc-500">
                  Pour envoyer directement depuis l&apos;application, connecte ton adresse Gmail dans{" "}
                  <Link href="/settings" className="underline">Réglages → Envoi d&apos;emails (Gmail)</Link>.
                </p>
              )}
            </div>

            {status && (
              <p className={`text-sm ${status.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}>{status.text}</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
