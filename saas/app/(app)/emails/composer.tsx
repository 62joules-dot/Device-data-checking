"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardHeader } from "@/app/components/ui";
import { DEVICE_TYPE_LABEL } from "@/lib/device-types";
import { PLATFORM_META } from "@/lib/platforms";

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

function deviceName(d: Device) {
  return `${d.brand ?? ""} ${d.model ?? ""}`.trim() || d.reference || "Appareil";
}

function buildEmail(d: Device, listings: Listing[], audience: Audience) {
  const name = deviceName(d);
  const details = [
    d.device_type && `- Type : ${DEVICE_TYPE_LABEL[d.device_type] ?? d.device_type}`,
    d.year && `- Année : ${d.year}`,
    d.condition && `- État : ${d.condition}`,
    d.usage_counter != null && d.usage_counter !== "" && `- Compteur : ${d.usage_counter}`,
    d.price_recommended != null && `- Prix : ${d.price_recommended.toLocaleString("fr-FR")} € HT`,
  ].filter(Boolean);

  const description = listings.map((l) => l.long_description ?? l.short_description).find(Boolean);
  const links = listings
    .filter((l) => l.status === "posted" && l.listing_url)
    .map((l) => `- ${PLATFORM_META[l.platform]?.label ?? l.platform} : ${l.listing_url}`);

  const intro =
    audience === "client"
      ? `Bonjour,\n\nComme suite à nos échanges, je me permets de vous proposer le ${name}, actuellement disponible.`
      : `Bonjour,\n\nJe me permets de vous contacter car nous proposons actuellement un ${name} qui pourrait intéresser votre établissement.`;

  const outro =
    audience === "client"
      ? "Je reste à votre disposition pour toute question ou pour organiser une démonstration."
      : "Si cela vous intéresse, je serais ravi d'en discuter lors d'un court appel. N'hésitez pas à me répondre directement.";

  const body = [
    intro,
    details.length ? `Caractéristiques :\n${details.join("\n")}` : "",
    description ?? "",
    links.length ? `Voir l'annonce en ligne :\n${links.join("\n")}` : "",
    outro,
    "Bien cordialement,",
  ]
    .filter(Boolean)
    .join("\n\n");

  const subject =
    audience === "client" ? `${name} disponible – proposition` : `${name} d'occasion disponible`;

  return { subject, body };
}

export default function EmailComposer({ devices, listings }: { devices: Device[]; listings: Listing[] }) {
  const [deviceId, setDeviceId] = useState("");
  const [audience, setAudience] = useState<Audience>("client");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  const device = devices.find((d) => d.id === deviceId) ?? null;

  // Regenerate the draft whenever the device or the audience changes.
  useEffect(() => {
    if (!device) return;
    const email = buildEmail(device, listings.filter((l) => l.device_id === device.id), audience);
    setSubject(email.subject);
    setBody(email.body);
  }, [device, audience, listings]);

  const gmailUrl =
    "https://mail.google.com/mail/?" +
    new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body }).toString();

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — text is still selectable
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none";

  return (
    <Card>
      <CardHeader title="Nouvel email" />
      <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-xs uppercase tracking-wide text-zinc-400">Appareil</span>
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
            <span className="text-xs uppercase tracking-wide text-zinc-400">Destinataire</span>
            <div className="flex gap-2">
              {(["client", "prospect"] as const).map((a) => (
                <Button
                  key={a}
                  type="button"
                  variant={audience === a ? "primary" : "secondary"}
                  onClick={() => setAudience(a)}
                >
                  {a === "client" ? "Client" : "Prospect"}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-400">À (séparer plusieurs adresses par une virgule)</span>
          <input
            className={inputClass}
            type="text"
            placeholder="client@exemple.fr, prospect@exemple.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-400">Objet</span>
          <input className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-zinc-400">Message</span>
          <textarea
            className={`${inputClass} min-h-[320px] font-mono text-[13px] leading-relaxed`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Choisis un appareil pour générer le message."
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={device && to ? gmailUrl : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!device || !to}
            className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors ${
              device && to ? "bg-red-600 hover:bg-red-500" : "pointer-events-none bg-red-600 opacity-40"
            }`}
          >
            Ouvrir dans Gmail
          </a>
          <Button type="button" variant="secondary" onClick={copy} disabled={!body}>
            {copied ? "Copié !" : "Copier le texte"}
          </Button>
          <span className="text-xs text-zinc-400">
            Gmail s&apos;ouvre avec le mail pré-rempli : tu n&apos;as plus qu&apos;à cliquer sur Envoyer.
          </span>
        </div>
      </div>
    </Card>
  );
}
