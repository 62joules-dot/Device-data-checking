import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const PLATFORMS = ["leboncoin", "wallapop", "facebook", "ebay", "machinio", "kitmondo"] as const;
// Nothing goes online at import: every listing waits in Suivi (ready/generated)
// until the user has read it and clicked "Valider et publier".
const LANG_BY_PLATFORM: Record<string, string> = {
  leboncoin: "fr",
  facebook: "fr",
  wallapop: "es",
  ebay: "en",
  machinio: "en",
  kitmondo: "en",
};

// normalize.py uses the literal string "MISSING" as a sentinel for an empty
// field, never invented — strip it to a real null before it reaches the DB.
function clean(v: unknown) {
  return v == null || v === "MISSING" ? null : v;
}

function deviceFields(rec: any) {
  const gen = rec.generated ?? {};
  return {
    external_id: rec.id ?? null,
    reference: rec._reference ?? null,
    brand: clean(rec.brand),
    model: clean(rec.model),
    device_type: gen.device_type ?? null,
    year: clean(rec.year) != null ? parseInt(String(rec.year), 10) || null : null,
    serial_number: clean(rec.serial_number),
    usage_counter: clean(rec.usage_counter),
    condition: clean(rec.condition),
    country: clean(rec.country),
    price_recommended: rec.price_recommended ?? null,
    price_min: rec.price_min ?? null,
    price_premium: rec.price_premium ?? null,
    photos: rec.photos ?? [],
    source: "engine",
    missing_fields: rec._missing_required ?? [],
    publishable: Boolean(rec._publishable),
    updated_at: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const records: any[] = body.records ?? [];
  const automation: Record<string, any[]> = body.automation ?? {};
  const exports: Record<string, { filename: string; content: string }> = body.exports ?? {};
  const sourceLabel: string = body.source_label ?? "upload";
  // Platforms chosen in the import wizard, { platform: {} }. Absent -> all.
  const chosen: Record<string, unknown> | null =
    body.platforms && typeof body.platforms === "object" ? body.platforms : null;
  const isChosen = (platform: string) => !chosen || platform in chosen;

  const included = records.filter((r) => r._include !== false);

  const { data: run, error: runError } = await supabase
    .from("runs")
    .insert({ user_id: user.id, source_label: sourceLabel, total_devices: included.length, publishable_count: 0 })
    .select()
    .single();

  if (runError || !run) {
    return NextResponse.json({ error: runError?.message || "failed to record run" }, { status: 500 });
  }

  // Existing device_listings for devices we're about to update, keyed "deviceId|platform",
  // so an update refreshes the text but never touches listing_url/posted_at/price/status
  // that the Suivi page already tracks.
  const updateDeviceIds = included.filter((r) => r._duplicate_of).map((r) => r._duplicate_of.id);
  const existingListings = updateDeviceIds.length
    ? (
        await supabase
          .from("device_listings")
          .select("id, device_id, platform")
          .in("device_id", updateDeviceIds)
      ).data ?? []
    : [];
  const existingListingId = new Map<string, string>();
  for (const l of existingListings) existingListingId.set(`${l.device_id}|${l.platform}`, l.id);

  let publishableCount = 0;

  for (const rec of included) {
    let deviceId: string;

    if (rec._duplicate_of) {
      const { error } = await supabase
        .from("devices")
        .update(deviceFields(rec))
        .eq("id", rec._duplicate_of.id);
      if (error) continue;
      deviceId = rec._duplicate_of.id;
    } else {
      const { data: device, error } = await supabase
        .from("devices")
        .insert({ ...deviceFields(rec), user_id: user.id, status: "draft" })
        .select()
        .single();
      if (error || !device) continue;
      deviceId = device.id;
    }

    if (rec._publishable) publishableCount += 1;

    const gen = rec.generated ?? {};
    for (const platform of PLATFORMS) {
      if (!isChosen(platform)) continue;
      const perPlatform = (automation[platform] ?? []).find((a: any) => a._device_id === rec.id);
      if (!perPlatform) continue;
      const lang = LANG_BY_PLATFORM[platform];
      const fields = {
        title: perPlatform.titre ?? null,
        short_description: gen.short_description?.[lang] ?? null,
        long_description: perPlatform.description ?? null,
        keywords: gen.tags ?? [],
      };

      const existingId = existingListingId.get(`${deviceId}|${platform}`);
      if (existingId) {
        // Text only — never touch status/posted_at/price/listing_url, which Suivi owns.
        await supabase.from("device_listings").update(fields).eq("id", existingId);
      } else {
        await supabase.from("device_listings").insert({
          device_id: deviceId,
          platform,
          status: perPlatform._ready_to_publish ? "ready" : "generated",
          ...fields,
        });
      }
    }
  }

  await supabase.from("runs").update({ publishable_count: publishableCount }).eq("id", run.id);

  const exportRows = Object.entries(exports).filter(([platform]) => isChosen(platform)).map(([platform, e]) => ({
    run_id: run.id,
    platform,
    filename: e.filename,
    content: e.content,
  }));
  for (const platform of PLATFORMS) {
    if (!isChosen(platform)) continue;
    const platformRecords = automation[platform];
    if (platformRecords && platformRecords.length > 0) {
      exportRows.push({
        run_id: run.id,
        platform: `${platform}_automation`,
        filename: `${platform}.json`,
        content: JSON.stringify(platformRecords, null, 2),
      });
    }
  }
  if (exportRows.length > 0) {
    await supabase.from("run_exports").insert(exportRows);
  }

  return NextResponse.json({ run_id: run.id, total: included.length, publishable: publishableCount });
}
