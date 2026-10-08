import { createClient } from "@/lib/supabase/server";
import ListingRow from "./listing-row";
import { Card, CardHeader, PageHeader } from "@/app/components/ui";
import { PLATFORM_COLOR, LISTING_STATUS_LABEL } from "@/lib/colors";

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; status?: string }>;
}) {
  const { platform, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("device_listings")
    .select("id, platform, title, status, listing_url, posted_at, price, device:devices(brand, model, device_type)")
    .order("posted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (platform) query = query.eq("platform", platform);
  if (status) query = query.eq("status", status);

  const { data: listings } = await query;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suivi des annonces"
        description='Marque une annonce "en ligne" une fois postée manuellement, avec le prix et le lien — puis vendue, retirée, ou supprime-la du suivi.'
      />

      <form className="flex flex-wrap items-center gap-3 text-sm">
        <select
          name="platform"
          defaultValue={platform ?? ""}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700"
        >
          <option value="">Toutes les plateformes</option>
          {Object.keys(PLATFORM_COLOR).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(LISTING_STATUS_LABEL).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button className="rounded-lg bg-zinc-900 px-3 py-1.5 font-medium text-white">Filtrer</button>
        {(platform || status) && (
          <a href="/tracking" className="text-zinc-500 underline">Réinitialiser</a>
        )}
      </form>

      <Card>
        <CardHeader title={`${listings?.length ?? 0} annonce${(listings?.length ?? 0) === 1 ? "" : "s"}`} />
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="px-5 py-2.5">Appareil</th>
              <th className="py-2.5">Plateforme</th>
              <th className="py-2.5">Prix</th>
              <th className="py-2.5">En ligne depuis</th>
              <th className="py-2.5">Lien</th>
              <th className="py-2.5">Statut</th>
              <th className="px-5 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(listings ?? []).map((l: any) => (
              <ListingRow key={l.id} listing={l} />
            ))}
            {(listings ?? []).length === 0 && (
              <tr><td className="px-5 py-6 text-zinc-400" colSpan={7}>Aucune annonce pour ces filtres.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
