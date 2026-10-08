"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PlatformBadge from "./platform-badge";

type Listing = {
  platform: string;
  title: string | null;
  short_description: string | null;
  long_description: string | null;
  status: string;
};

// Tier A (ebay/machinio/kitmondo) ship as import files instead — see "Fichiers d'import" above.
const COPY_PASTE_PLATFORMS = ["leboncoin", "wallapop", "facebook"];

export default function DeviceListings({ deviceId }: { deviceId: string }) {
  const [open, setOpen] = useState(false);
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (listings) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("device_listings")
      .select("platform, title, short_description, long_description, status")
      .eq("device_id", deviceId)
      .in("platform", COPY_PASTE_PLATFORMS);
    setListings((data as Listing[]) ?? []);
  }

  async function copy(platform: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(platform);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard API unavailable — nothing to do, text is still selectable
    }
  }

  return (
    <div>
      <button onClick={toggle} className="text-xs text-slate-500 underline">
        {open ? "Hide listings" : "View listings"}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {listings === null && <p className="text-xs text-slate-400">Loading…</p>}
          {listings?.length === 0 && (
            <p className="text-xs text-slate-400">No listing text yet.</p>
          )}
          {listings?.map((l) => {
            const text = `${l.title ?? ""}\n\n${l.long_description ?? l.short_description ?? ""}`;
            return (
              <div key={l.platform} className="rounded border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium"><PlatformBadge platform={l.platform} /></span>
                  <button
                    onClick={() => copy(l.platform, text)}
                    className="text-slate-500 underline"
                  >
                    {copied === l.platform ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-slate-600">{text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
