"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PlatformBadge from "../platform-badge";

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
    <tr className="border-t border-slate-200 align-top">
      <td className="py-2">{deviceName}</td>
      <td><PlatformBadge platform={listing.platform} /></td>
      <td>
        {editing || !isPosted ? (
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="€"
            className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
          />
        ) : (
          listing.price ? `${listing.price} €` : "—"
        )}
      </td>
      <td>
        {listing.posted_at ? (
          <span>
            {new Date(listing.posted_at).toLocaleDateString()}
            <br />
            <span className="text-xs text-slate-400">{daysSince(listing.posted_at)}</span>
          </span>
        ) : (
          "—"
        )}
      </td>
      <td>
        {editing || !isPosted ? (
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="w-40 rounded border border-slate-300 px-2 py-1 text-sm"
          />
        ) : listing.listing_url ? (
          <a href={listing.listing_url} target="_blank" rel="noreferrer" className="text-slate-500 underline">
            Voir l&apos;annonce
          </a>
        ) : (
          "—"
        )}
      </td>
      <td>
        <span
          className={
            listing.status === "sold"
              ? "text-green-600"
              : listing.status === "removed"
              ? "text-slate-400"
              : listing.status === "posted"
              ? "text-teal-600"
              : "text-amber-600"
          }
        >
          {{
            generated: "généré",
            ready: "prêt",
            posted: "en ligne",
            sold: "vendue",
            removed: "retirée",
          }[listing.status] ?? listing.status}
        </span>
      </td>
      <td className="space-x-2 text-xs">
        {!isPosted && (
          <button onClick={markPosted} disabled={busy} className="text-teal-600 underline">
            Marquer en ligne
          </button>
        )}
        {isPosted && !editing && (
          <button onClick={() => setEditing(true)} disabled={busy} className="text-slate-500 underline">
            Modifier
          </button>
        )}
        {isPosted && editing && (
          <button onClick={saveEdits} disabled={busy} className="text-teal-600 underline">
            Enregistrer
          </button>
        )}
        {listing.status === "posted" && (
          <>
            <button onClick={() => patch({ status: "sold" })} disabled={busy} className="text-green-600 underline">
              Vendue
            </button>
            <button onClick={() => patch({ status: "removed" })} disabled={busy} className="text-slate-500 underline">
              Retirer
            </button>
          </>
        )}
        <button onClick={remove} disabled={busy} className="text-red-500 underline">
          Supprimer
        </button>
      </td>
    </tr>
  );
}
