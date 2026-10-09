import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DeviceListings from "@/app/device-listings";
import PlatformBadge from "@/app/platform-badge";
import { Card, CardHeader, PageHeader, StatTile } from "@/app/components/ui";
import ImportSection from "./import-section";

const FORMAT_SUFFIX: Record<string, string> = {
  ebay: "CSV",
  dotmed: "TSV",
  machinio: "CSV",
  kitmondo: "CSV",
  exapro_prepared: "CSV",
  bimedis_prepared: "CSV",
};

function exportPlatformKey(platform: string) {
  return platform.endsWith("_automation") ? platform.replace("_automation", "") : platform;
}

export default async function Dashboard() {
  const supabase = await createClient();

  const { data: runs } = await supabase
    .from("runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: devices } = await supabase
    .from("devices")
    .select("id, reference, brand, model, device_type, condition, country, price_recommended, publishable, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  type ExportRow = { id: string; run_id: string; platform: string; filename: string };
  const runIds = (runs ?? []).map((r) => r.id);
  const exportRows: ExportRow[] = runIds.length
    ? ((
        await supabase
          .from("run_exports")
          .select("id, run_id, platform, filename")
          .in("run_id", runIds)
      ).data ?? [])
    : [];

  const exportsByRun = new Map<string, ExportRow[]>();
  for (const e of exportRows) {
    const list = exportsByRun.get(e.run_id) ?? [];
    list.push(e);
    exportsByRun.set(e.run_id, list);
  }

  const total = devices?.length ?? 0;
  const publishable = (devices ?? []).filter((d) => d.publishable).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Stock Appareils"
        description="Ton inventaire et les fichiers générés pour chaque import."
      />

      <ImportSection />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Appareils" value={total} />
        <StatTile label="Prêts à publier" value={publishable} hint={total ? `${Math.round((publishable / total) * 100)}%` : undefined} />
        <StatTile label="Imports" value={runs?.length ?? 0} />
        <StatTile label="Données manquantes" value={total - publishable} />
      </div>

      <Card>
        <CardHeader title="Imports récents" />
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="px-5 py-2.5">Source</th>
              <th className="py-2.5">Appareils</th>
              <th className="py-2.5">Prêts</th>
              <th className="py-2.5">Date</th>
              <th className="py-2.5">Fichiers d&apos;import</th>
            </tr>
          </thead>
          <tbody>
            {(runs ?? []).map((r) => (
              <tr key={r.id} className="border-t border-zinc-100">
                <td className="px-5 py-2.5 font-medium text-zinc-700">{r.source_label}</td>
                <td className="py-2.5">{r.total_devices}</td>
                <td className="py-2.5">{r.publishable_count}</td>
                <td className="py-2.5 text-zinc-500">{new Date(r.created_at).toLocaleString()}</td>
                <td className="py-2.5">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {(exportsByRun.get(r.id) ?? []).map((e) => {
                      const key = exportPlatformKey(e.platform);
                      const suffix = FORMAT_SUFFIX[key];
                      return (
                        <a key={e.id} href={`/exports/${e.id}`} className="text-zinc-500 hover:text-zinc-900">
                          <PlatformBadge platform={key} />
                          <span className="text-xs text-zinc-400"> {suffix ? `(${suffix})` : "(JSON)"}</span>
                        </a>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
            {(runs ?? []).length === 0 && (
              <tr><td className="px-5 py-6 text-zinc-400" colSpan={5}>Aucun import pour l&apos;instant.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardHeader title="Inventaire" />
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="px-5 py-2.5">Référence</th>
              <th className="py-2.5">Appareil</th>
              <th className="py-2.5">État</th>
              <th className="py-2.5">Pays</th>
              <th className="py-2.5">Prix</th>
              <th className="py-2.5">Statut</th>
              <th className="py-2.5">Annonces</th>
            </tr>
          </thead>
          <tbody>
            {(devices ?? []).map((d) => (
              <tr key={d.id} className="border-t border-zinc-100">
                <td className="px-5 py-2.5 font-mono text-xs text-zinc-400">{d.reference ?? "—"}</td>
                <td className="py-2.5 font-medium text-zinc-800">
                  <Link href={`/devices/${d.id}`} className="hover:underline">{d.brand} {d.model}</Link>
                </td>
                <td className="py-2.5 text-zinc-500">{d.condition}</td>
                <td className="py-2.5 text-zinc-500">{d.country}</td>
                <td className="py-2.5 text-zinc-700">{d.price_recommended ? `${d.price_recommended} €` : "—"}</td>
                <td className="py-2.5">
                  <span className={d.publishable ? "text-emerald-600" : "text-amber-600"}>
                    {d.publishable ? "Prêt" : "Données manquantes"}
                  </span>
                </td>
                <td className="py-2.5"><DeviceListings deviceId={d.id} /></td>
              </tr>
            ))}
            {(devices ?? []).length === 0 && (
              <tr><td className="px-5 py-6 text-zinc-400" colSpan={7}>Aucun appareil — ajoute une machine ou importe un fichier Excel pour commencer.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
