import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, PageHeader } from "@/app/components/ui";
import ListingRow from "../../tracking/listing-row";
import PriceForm from "./price-form";
import PhotoManager from "./photo-manager";
import { resolvePhotos } from "@/lib/photo-fallback";

export default async function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: device } = await supabase.from("devices").select("*").eq("id", id).single();
  if (!device) notFound();

  const { data: listings } = await supabase
    .from("device_listings")
    .select("id, platform, title, status, listing_url, posted_at, price")
    .eq("device_id", id)
    .order("platform");

  const { data: bank } = await supabase.from("image_bank").select("*");
  const ownPhotos = Array.isArray(device.photos) ? (device.photos as string[]) : [];
  const fallback = resolvePhotos({ ...device, photos: [] }, bank ?? []).urls;

  const listingsWithDevice = (listings ?? []).map((l) => ({
    ...l,
    device: { id: device.id, brand: device.brand, model: device.model, device_type: device.device_type, price_recommended: device.price_recommended },
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${device.brand ?? ""} ${device.model ?? ""}`}
        description={device.reference ?? undefined}
        action={<Link href="/" className="text-sm text-zinc-500 underline">Retour à l&apos;inventaire</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="space-y-2 p-5 text-sm">
          <div className="grid grid-cols-2 gap-2 text-zinc-600">
            <div><span className="text-zinc-400">État</span><br />{device.condition ?? "—"}</div>
            <div><span className="text-zinc-400">Année</span><br />{device.year ?? "—"}</div>
            <div><span className="text-zinc-400">Pays</span><br />{device.country ?? "—"}</div>
            <div><span className="text-zinc-400">N° de série</span><br />{device.serial_number ?? "—"}</div>
            <div><span className="text-zinc-400">Compteur</span><br />{device.usage_counter ?? "—"}</div>
          </div>
        </Card>
        <Card className="space-y-3 p-5">
          <div className="text-xs uppercase tracking-wide text-zinc-400">Prix recommandé</div>
          <PriceForm deviceId={device.id} currentPrice={device.price_recommended} />
          <p className="text-xs text-zinc-400">
            Les annonces déjà en ligne gardent leur prix affiché jusqu&apos;à ce que tu le changes
            à la main sur la plateforme — elles sont alors marquées &quot;à mettre à jour&quot; ci-dessous.
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Photos" />
        <div className="px-5 py-4">
          <PhotoManager deviceId={device.id} photos={ownPhotos} fallback={fallback} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Où c'est publié" />
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="px-5 py-2.5"></th>
              <th className="py-2.5">Site d&apos;annonce</th>
              <th className="py-2.5">Prix</th>
              <th className="py-2.5">En ligne depuis</th>
              <th className="py-2.5">Lien</th>
              <th className="py-2.5">Statut</th>
              <th className="px-5 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listingsWithDevice.map((l) => (
              <ListingRow key={l.id} listing={l} />
            ))}
            {listingsWithDevice.length === 0 && (
              <tr><td className="px-5 py-6 text-zinc-400" colSpan={7}>Aucune annonce générée pour cet appareil.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
