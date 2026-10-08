import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, PageHeader, StatTile } from "@/app/components/ui";
import { PLATFORM_COLOR, LISTING_STATUS_COLOR, LISTING_STATUS_LABEL } from "@/lib/colors";
import PlatformBadge from "@/app/platform-badge";
import BarRow from "./bar-row";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; period?: string }>;
}) {
  const { platform, period } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("device_listings")
    .select("platform, status, price, posted_at, created_at, device:devices(id, brand, model, price_recommended)");
  if (platform) query = query.eq("platform", platform);
  if (period && period !== "all") {
    const days = parseInt(period, 10);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    query = query.gte("created_at", since);
  }
  const { data: listings } = await query;
  const rows = listings ?? [];

  const byStatus = new Map<string, number>();
  const byPlatform = new Map<string, number>();
  let valuePosted = 0;
  let valueSold = 0;
  let countPosted = 0;
  let countSold = 0;
  let needsPriceUpdate: { device: any; platform: string; price: number | null }[] = [];

  for (const r of rows as any[]) {
    byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
    byPlatform.set(r.platform, (byPlatform.get(r.platform) ?? 0) + 1);
    if (r.status === "posted") {
      valuePosted += r.price ?? 0;
      countPosted += 1;
      if (r.price != null && r.device?.price_recommended != null && r.price !== r.device.price_recommended) {
        needsPriceUpdate.push({ device: r.device, platform: r.platform, price: r.price });
      }
    }
    if (r.status === "sold") { valueSold += r.price ?? 0; countSold += 1; }
  }

  const statusMax = Math.max(1, ...Array.from(byStatus.values()));
  const platformMax = Math.max(1, ...Array.from(byPlatform.values()));
  const conversion = countPosted + countSold > 0 ? Math.round((countSold / (countPosted + countSold)) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble des annonces, avec filtres."
      />

      <form className="flex flex-wrap items-center gap-3 text-sm">
        <select name="platform" defaultValue={platform ?? ""} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5">
          <option value="">Toutes les plateformes</option>
          {Object.keys(PLATFORM_COLOR).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select name="period" defaultValue={period ?? "all"} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5">
          <option value="all">Toute la période</option>
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
        </select>
        <button className="rounded-lg bg-zinc-900 px-3 py-1.5 font-medium text-white">Filtrer</button>
        {(platform || (period && period !== "all")) && (
          <a href="/analytics" className="text-zinc-500 underline">Réinitialiser</a>
        )}
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Annonces en ligne" value={countPosted} hint={`${valuePosted.toLocaleString("fr-FR")} €`} />
        <StatTile label="Annonces vendues" value={countSold} hint={`${valueSold.toLocaleString("fr-FR")} €`} />
        <StatTile label="Taux de conversion" value={`${conversion}%`} hint="vendues / (vendues + en ligne)" />
        <StatTile label="Prix à mettre à jour" value={needsPriceUpdate.length} hint={needsPriceUpdate.length ? "à changer à la main" : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-zinc-800">Par statut</h3>
          {Array.from(byStatus.entries()).map(([status, count]) => (
            <BarRow
              key={status}
              label={LISTING_STATUS_LABEL[status] ?? status}
              value={count}
              max={statusMax}
              color={LISTING_STATUS_COLOR[status] ?? "#9a988f"}
            />
          ))}
          {byStatus.size === 0 && <p className="text-sm text-zinc-400">Aucune donnée.</p>}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-zinc-800">Par plateforme</h3>
          {Array.from(byPlatform.entries()).map(([p, count]) => (
            <BarRow
              key={p}
              label={<PlatformBadge platform={p} />}
              value={count}
              max={platformMax}
              color={PLATFORM_COLOR[p] ?? "#9a988f"}
            />
          ))}
          {byPlatform.size === 0 && <p className="text-sm text-zinc-400">Aucune donnée.</p>}
        </Card>
      </div>

      {needsPriceUpdate.length > 0 && (
        <Card>
          <CardHeader title="Prix à mettre à jour à la main" />
          <ul className="divide-y divide-zinc-100 px-5">
            {needsPriceUpdate.map((item, i) => (
              <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                <a href={`/devices/${item.device?.id}`} className="font-medium text-zinc-800 hover:underline">
                  {item.device?.brand} {item.device?.model}
                </a>
                <span className="flex items-center gap-2 text-zinc-500">
                  <PlatformBadge platform={item.platform} />
                  <span className="text-amber-600">{item.price} € → {item.device?.price_recommended} €</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
