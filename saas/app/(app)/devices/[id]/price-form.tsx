"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/app/components/ui";

export default function PriceForm({ deviceId, currentPrice }: { deviceId: string; currentPrice: number | null }) {
  const router = useRouter();
  const [price, setPrice] = useState(currentPrice?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    await fetch(`/api/devices/${deviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price_recommended: price }),
    });
    setBusy(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="flex items-center gap-2">
      <input
        type="number"
        value={price}
        onChange={(e) => { setPrice(e.target.value); setSaved(false); }}
        placeholder="€"
        className="w-28 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
      />
      <Button type="submit" variant="secondary" disabled={busy}>
        {busy ? "…" : "Mettre à jour le prix"}
      </Button>
      {saved && <span className="text-xs text-emerald-600">Enregistré</span>}
    </form>
  );
}
