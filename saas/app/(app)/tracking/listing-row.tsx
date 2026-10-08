"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PlatformBadge from "@/app/platform-badge";
import { Badge, Button } from "@/app/components/ui";
import { LISTING_STATUS_COLOR, LISTING_STATUS_LABEL } from "@/lib/colors";
import { TIER_A } from "@/lib/platforms";

type Listing = {
  id: string;
  platform: string;
  title: string | null;
  status: string;
  listing_url: string | null;
  posted_at: string | null;
  price: number | null;
  device: { id?: string; brand: string | null; model: string | null; device_type: string | null; price_recommended?: number | null } | null;
};

type Props = {
  listing: Listing;
  selected?: boolean;
  onToggleSelect?: () => void;
};

function daysSince(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "1 jour";
  return `${days} jours`;
}

export default function ListingRow({ listing, selected, onToggleSelect }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(listing.listing_url ?? "");
  const [price, setPrice] = useState(listing.price?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Échec");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec");
    } finally {
      setBusy(false);
    }
  }

  async function markPosted() {
    await patch({ status: "posted", listing_url: url, price });
    setEditing(false);
  }

  async function saveEdits() {
    await patch({ listing_url: url, price });
    setEditing(false);
  }

  // Auto platforms go straight back online; manual ones return to "ready" and
  // need the new link once reposted by hand.
  async function republish() {
    const auto = TIER_A.has(listing.platform);
    await patch(
      auto
        ? { status: "posted", price: devicePrice ?? listing.price }
        : { status: "ready", posted_at: null, listing_url: null }
    );
    if (!auto) setUrl("");
  }

  const isPosted = listing.status === "posted" || listing.status === "sold" || listing.status === "removed";
  const devicePrice = listing.device?.price_recommended ?? null;
  const priceStale =
    listing.status === "posted" && listing.price != null && devicePrice != null &&
    Number(listing.price) !== Number(devicePrice);

  return (
    <tr className="border-t border-zinc-100 align-top">
      <td className="px-5 py-3">
        {onToggleSelect && (
          <input type="checkbox" checked={!!selected} onChange={onToggleSelect} />
        )}
      </td>
      <td className="py-3">
        <PlatformBadge platform={listing.platform} />
        <span className={`ml-1.5 text-xs ${TIER_A.has(listing.platform) ? "text-blue-600" : "text-amber-600"}`}>
          {TIER_A.has(listing.platform) ? "auto" : "manuel"}
        </span>
      </td>
      <td className="py-3">
        {editing || !isPosted ? (
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="€"
            className="w-20 rounded-lg border border-zinc-200 px-2 py-1 text-sm"
          />
        ) : (
          listing.price ? `${listing.price} €` : "—"
        )}
      </td>
      <td className="py-3">
        {listing.posted_at ? (
          <span>
            {new Date(listing.posted_at).toLocaleDateString()}
            <br />
            <span className="text-xs text-zinc-400">{daysSince(listing.posted_at)}</span>
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="py-3">
        {editing || !isPosted ? (
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="w-40 rounded-lg border border-zinc-200 px-2 py-1 text-sm"
          />
        ) : listing.listing_url ? (
          <a href={listing.listing_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
            Voir l&apos;annonce
          </a>
        ) : (
          "—"
        )}
      </td>
      <td className="py-3">
        <Badge color={LISTING_STATUS_COLOR[listing.status] ?? "#9a988f"}>
          {LISTING_STATUS_LABEL[listing.status] ?? listing.status}
        </Badge>
        {priceStale && (
          <div className="mt-1 text-xs text-amber-600">
            ⚠️ À changer à la main ({listing.price} € → {devicePrice} €)
          </div>
        )}
      </td>
      <td className="space-x-1 px-5 py-3 text-xs">
        {!isPosted && (
          <Button onClick={markPosted} disabled={busy}>
            {TIER_A.has(listing.platform) ? "Automatiser la publication" : "Marquer en ligne"}
          </Button>
        )}
        {isPosted && !editing && (
          <Button variant="ghost" onClick={() => setEditing(true)} disabled={busy}>Modifier</Button>
        )}
        {isPosted && editing && (
          <Button variant="secondary" onClick={saveEdits} disabled={busy}>Enregistrer</Button>
        )}
        {priceStale && (
          <Button variant="ghost" onClick={() => patch({ price: devicePrice })} disabled={busy}>
            Prix mis à jour
          </Button>
        )}
        {listing.status === "posted" && (
          <Button variant="ghost" onClick={() => patch({ status: "sold" })} disabled={busy}>Vendue</Button>
        )}
        {(listing.status === "sold" || listing.status === "removed") ? (
          <Button onClick={republish} disabled={busy}>Republier</Button>
        ) : (
          <Button variant="danger" onClick={() => patch({ status: "removed" })} disabled={busy}>Retirer</Button>
        )}
        {error && <div className="mt-1 text-red-600">{error}</div>}
      </td>
    </tr>
  );
}
