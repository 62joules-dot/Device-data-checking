import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import UploadForm from "./upload-form";
import DeviceListings from "./device-listings";

const EXPORT_LABEL: Record<string, string> = {
  ebay: "eBay",
  dotmed: "DOTmed",
  machinio: "Machinio",
  kitmondo: "Kitmondo",
  exapro_prepared: "Exapro",
  bimedis_prepared: "Bimedis",
};

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: runs } = await supabase
    .from("runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: devices } = await supabase
    .from("devices")
    .select("id, brand, model, device_type, condition, country, price_recommended, publishable, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

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

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">62joules — device listings</h1>
        <Link href="/settings" className="text-sm text-slate-500 underline">
          {user.email} · Settings
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-600">Generate from inventory</h2>
        <UploadForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-600">Recent runs</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-1">Source</th>
              <th>Devices</th>
              <th>Publishable</th>
              <th>Date</th>
              <th>Fichiers d&apos;import</th>
            </tr>
          </thead>
          <tbody>
            {(runs ?? []).map((r) => (
              <tr key={r.id} className="border-t border-slate-200">
                <td className="py-1">{r.source_label}</td>
                <td>{r.total_devices}</td>
                <td>{r.publishable_count}</td>
                <td>{new Date(r.created_at).toLocaleString()}</td>
                <td className="space-x-2">
                  {(exportsByRun.get(r.id) ?? []).map((e) => (
                    <a
                      key={e.id}
                      href={`/exports/${e.id}`}
                      className="text-slate-500 underline"
                    >
                      {EXPORT_LABEL[e.platform] ?? e.platform}
                    </a>
                  ))}
                </td>
              </tr>
            ))}
            {(runs ?? []).length === 0 && (
              <tr><td className="py-3 text-slate-400" colSpan={5}>No runs yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-600">Devices</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-1">Device</th>
              <th>Type</th>
              <th>Condition</th>
              <th>Country</th>
              <th>Price</th>
              <th>Status</th>
              <th>Listings</th>
            </tr>
          </thead>
          <tbody>
            {(devices ?? []).map((d) => (
              <tr key={d.id} className="border-t border-slate-200">
                <td className="py-1">{d.brand} {d.model}</td>
                <td>{d.device_type}</td>
                <td>{d.condition}</td>
                <td>{d.country}</td>
                <td>{d.price_recommended ?? "—"}</td>
                <td>
                  <span className={d.publishable ? "text-green-600" : "text-amber-600"}>
                    {d.publishable ? "ready" : "missing data"}
                  </span>
                </td>
                <td><DeviceListings deviceId={d.id} /></td>
              </tr>
            ))}
            {(devices ?? []).length === 0 && (
              <tr><td className="py-3 text-slate-400" colSpan={7}>No devices yet — upload an inventory file above.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
