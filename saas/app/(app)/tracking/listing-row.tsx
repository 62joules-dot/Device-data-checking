"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PlatformBadge from "@/app/platform-badge";
import { Badge, Button } from "@/app/components/ui";
import { LISTING_STATUS_COLOR, LISTING_STATUS_LABEL } from "@/lib/colors";

type Listing = {
  id: string;
  platform: string;
  title: string | null;
  status: string;
  listing_url: string | null;
  posted_at: string | null;
  price: number | null;
  device: { brand: string | null; model: string | null; device_type: string | null } | null;
};

function daysSince(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "1 jour";
  return `${days} jours`;
}

export default function ListingRow({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(listing.listing_url ?? "");
  const [price, setPrice] = useState(listing.price?.toString() ?? "");
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    router.refresh();
  }

  async function markPosted() {
    await patch({ status: "posted", listing_url: url, price });
    setEditing(false);
  }

  async function saveEdits() {
    await patch({ listing_url: url, price });
    setEditing(false);
  }

  async function remove() {
    if (!confirm("Supprimer cette annonce du suivi ?")) return;
    setBusy(true);
    await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  const deviceName = [listing.device?.brand, listing.device?.model].filter(Boolean).join(" ") || "—";
  const isPosted = listing.status === "posted" || listing.status === "sold" || listing.status === "removed";

  return (
    <tr className="border-t border-zinc-100 align-top">
      <td className="px-5 py-3 font-medium text-zinc-800">{deviceName}</td>
      <td className="py-3"><PlatformBadge platform={listing.platform} /></td>
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
      </td>
      <td className="space-x-1 px-5 py-3 text-xs">
        {!isPosted && (
          <Button variant="secondary" onClick={markPosted} disabled={busy}>Marquer en ligne</Button>
        )}
        {isPosted && !editing && (
          <Button variant="ghost" onClick={() => setEditing(true)} disabled={busy}>Modifier</Button>
        )}
        {isPosted && editing && (
          <Button variant="secondary" onClick={saveEdits} disabled={busy}>Enregistrer</Button>
        )}
        {listing.status === "posted" && (
          <>
            <Button variant="ghost" onClick={() => patch({ status: "sold" })} disabled={busy}>Vendue</Button>
            <Button variant="ghost" onClick={() => patch({ status: "removed" })} disabled={busy}>Retirer</Button>
          </>
        )}
        <Button variant="danger" onClick={remove} disabled={busy}>Supprimer</Button>
      </td>
    </tr>
  );
}
