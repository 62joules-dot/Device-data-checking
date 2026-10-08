"use client";

import { useState } from "react";
import ListingRow from "./listing-row";
import PlatformBadge from "@/app/platform-badge";

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

export default function DeviceGroup({ deviceName, deviceId, listings }: {
  deviceName: string;
  deviceId: string | undefined;
  listings: Listing[];
}) {
  const [open, setOpen] = useState(false);
  const allPlatforms = Array.from(new Set(listings.map((l) => l.platform)));
  const [selected, setSelected] = useState<Set<string>>(new Set(allPlatforms));

  function toggle(p: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  }

  return (
    <>
      <tr className="border-t border-zinc-100 bg-zinc-50/60">
        <td colSpan={7} className="px-5 py-3">
          <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 text-left">
            <span className={`mt-0.5 inline-block text-zinc-400 transition-transform ${open ? "rotate-90" : ""}`}>
              ▶
            </span>
            <span className="flex-1 font-medium text-zinc-900">
              {deviceId ? (
                <a href={`/devices/${deviceId}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                  {deviceName}
                </a>
              ) : (
                deviceName
              )}
            </span>
            <span className="flex items-center gap-1 pt-0.5">
              {allPlatforms.map((p) => (
                <span key={p} title={p}><PlatformBadge platform={p} /></span>
              ))}
            </span>
          </button>
        </td>
      </tr>
      {open &&
        listings.map((l) => (
          <ListingRow
            key={l.id}
            listing={l}
            selected={selected.has(l.platform)}
            onToggleSelect={() => toggle(l.platform)}
          />
        ))}
    </>
  );
}
