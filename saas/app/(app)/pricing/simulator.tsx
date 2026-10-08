"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/app/components/ui";
import { DEVICE_TYPE_LABEL } from "@/lib/device-types";

type Device = {
  id: string;
  brand: string | null;
  model: string | null;
  device_type: string | null;
  year: number | null;
  condition: string | null;
  price_recommended: number | null;
  reference: string | null;
};

type SoldRow = { price: number; platform: string; device: { brand: string | null; model: string | null } };
type RefRow = {
  id: string;
  brand: string | null;
  model: string | null;
  year_from: number | null;
  year_to: number | null;
  price: number;
  currency: string;
  condition_note: string | null;
  source_name: string | null;
  source_url: string | null;
  note: string | null;
};

function stats(nums: number[]) {
  if (nums.length === 0) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const avg = Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
  return { min, max, avg };
}

export default function PricingSimulator({ devices }: { devices: Device[] }) {
  const [deviceId, setDeviceId] = useState<string>("");
  const [manualType, setManualType] = useState<string>("");
  const [data, setData] = useState<{ sold: SoldRow[]; references: RefRow[]; brandReferences: RefRow[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const device = devices.find((d) => d.id === deviceId) ?? null;
  const deviceType = device?.device_type || manualType;
  const brand = device?.brand ?? undefined;

  useEffect(() => {
    if (!deviceType) {
      setData(null);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({ device_type: deviceType });
    if (brand) params.set("brand", brand);
    fetch(`/api/pricing?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [deviceType, brand]);

  const soldStats = data ? stats(data.sold.map((s) => s.price)) : null;
  const refsByCurrency = new Map<string, RefRow[]>();
  for (const r of [...(data?.references ?? []), ...(data?.brandReferences ?? [])]) {
    if (!refsByCurrency.has(r.currency)) refsByCurrency.set(r.currency, []);
    if (!refsByCurrency.get(r.currency)!.some((x) => x.id === r.id)) refsByCurrency.get(r.currency)!.push(r);
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-500">Choisir dans l&apos;inventaire</label>
            <select
              value={deviceId}
              onChange={(e) => { setDeviceId(e.target.value); setManualType(""); }}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              <option value="">— Aucun —</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.reference ? `${d.reference} — ` : ""}{d.brand} {d.model}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Ou choisir un type d&apos;appareil</label>
            <select
              value={manualType}
              onChange={(e) => { setManualType(e.target.value); setDeviceId(""); }}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              <option value="">— Choisir —</option>
              {Object.entries(DEVICE_TYPE_LABEL).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        {device && (
          <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
            <span>Année : {device.year ?? "—"}</span>
            <span>État : {device.condition ?? "—"}</span>
            <span>Prix actuel : {device.price_recommended ? `${device.price_recommended} €` : "—"}</span>
          </div>
        )}
      </Card>

      {!deviceType && (
        <p className="text-sm text-zinc-400">Choisis un appareil ou un type pour voir la fiche d&apos;estimation.</p>
      )}

      {deviceType && loading && <p className="text-sm text-zinc-400">Recherche en cours…</p>}

      {deviceType && !loading && data && (
        <>
          <Card>
            <CardHeader title="Tes ventes passées (ce type d'appareil)" />
            <div className="px-5 py-4">
              {soldStats ? (
                <>
                  <p className="text-sm text-zinc-700">
                    <strong>{soldStats.avg.toLocaleString("fr-FR")} €</strong> en moyenne
                    ({soldStats.min.toLocaleString("fr-FR")} – {soldStats.max.toLocaleString("fr-FR")} €
                    sur {data.sold.length} vente{data.sold.length > 1 ? "s" : ""}).
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-zinc-500">
                    {data.sold.map((s, i) => (
                      <li key={i}>{s.device.brand} {s.device.model} — {s.price} € ({s.platform})</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-zinc-400">
                  Pas encore de vente enregistrée pour ce type — marque tes annonces &quot;vendue&quot; dans le Suivi
                  pour que ça alimente l&apos;estimation.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Références marché (recherche web, sources citées)" />
            <div className="px-5 py-4">
              {refsByCurrency.size === 0 ? (
                <p className="text-sm text-zinc-400">
                  Pas encore de référence externe pour ce type/cette marque dans la base.
                </p>
              ) : (
                Array.from(refsByCurrency.entries()).map(([currency, rows]) => {
                  const s = stats(rows.map((r) => r.price));
                  return (
                    <div key={currency} className="mb-4">
                      <p className="text-sm text-zinc-700">
                        <strong>{s?.min.toLocaleString()} – {s?.max.toLocaleString()} {currency}</strong>
                        {" "}sur {rows.length} référence{rows.length > 1 ? "s" : ""}.
                      </p>
                      <ul className="mt-2 space-y-1.5 text-xs text-zinc-500">
                        {rows.map((r) => (
                          <li key={r.id}>
                            {r.brand && <strong className="text-zinc-700">{r.brand} {r.model}</strong>}
                            {" "}{r.price.toLocaleString()} {r.currency}
                            {r.year_from && ` (${r.year_from === r.year_to ? r.year_from : `${r.year_from}-${r.year_to}`})`}
                            {r.condition_note && ` — ${r.condition_note}`}
                            {r.source_url ? (
                              <a href={r.source_url} target="_blank" rel="noreferrer" className="ml-1 text-blue-600 underline">
                                {r.source_name ?? "source"}
                              </a>
                            ) : r.source_name ? ` — ${r.source_name}` : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })
              )}
              <p className="mt-2 text-xs text-zinc-400">
                Devises différentes affichées séparément — pas de conversion automatique pour éviter une fausse précision.
                Ce sont des prix affichés (asking price), pas forcément des prix de vente réels.
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
