import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const PLATFORMS = ["leboncoin", "wallapop", "facebook", "ebay", "machinio", "kitmondo"] as const;
const LANG_BY_PLATFORM: Record<string, string> = {
  leboncoin: "fr",
  facebook: "fr",
  wallapop: "es",
  ebay: "en",
  machinio: "en",
  kitmondo: "en",
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const engineUrl = process.env.PYTHON_ENGINE_URL;
  if (!engineUrl) {
    return NextResponse.json({ error: "PYTHON_ENGINE_URL is not configured" }, { status: 500 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "missing 'file'" }, { status: 400 });
  }

  const xlsxBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const engineRes = await fetch(`${engineUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.PYTHON_ENGINE_API_KEY
        ? { "X-Api-Key": process.env.PYTHON_ENGINE_API_KEY }
        : {}),
    },
    body: JSON.stringify({ xlsx_base64: xlsxBase64 }),
  });

  const result = await engineRes.json();
  if (!engineRes.ok) {
    return NextResponse.json({ error: result.error || "engine error" }, { status: 502 });
  }

  const master: any[] = result.master_database ?? [];
  const automation: Record<string, any[]> = result.automation ?? {};
  const exports: Record<string, { filename: string; content: string }> = result.exports ?? {};

  const { data: run, error: runError } = await supabase
    .from("runs")
    .insert({
      user_id: user.id,
      source_label: (file as File).name ?? "upload",
      total_devices: master.length,
      publishable_count: 0,
    })
    .select()
    .single();

  if (runError || !run) {
    return NextResponse.json({ error: runError?.message || "failed to record run" }, { status: 500 });
  }

  let publishableCount = 0;

  for (const rec of master) {
    const gen = rec.generated ?? {};
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .insert({
        user_id: user.id,
        external_id: rec.id ?? null,
        brand: rec.brand ?? null,
        model: rec.model ?? null,
        device_type: gen.device_type ?? null,
        year: rec.year ?? null,
        serial_number: rec.serial_number ?? null,
        condition: rec.condition ?? null,
        country: rec.country ?? null,
        price_recommended: rec.price_recommended ?? null,
        price_min: rec.price_min ?? null,
        price_premium: rec.price_premium ?? null,
        photos: rec.photos ?? [],
        source: "engine",
        missing_fields: rec._missing_required ?? [],
        publishable: Boolean(rec._publishable),
        status: "draft",
      })
      .select()
      .single();

    if (deviceError || !device) continue;
    if (rec._publishable) publishableCount += 1;

    const listingsRows = PLATFORMS
      .map((platform) => {
        const perPlatform = (automation[platform] ?? []).find(
          (a: any) => a._device_id === rec.id
        );
        if (!perPlatform) return null;
        const lang = LANG_BY_PLATFORM[platform];
        return {
          device_id: device.id,
          platform,
          title: perPlatform.titre ?? null,
          short_description: gen.short_description?.[lang] ?? null,
          long_description: perPlatform.description ?? null,
          keywords: gen.tags ?? [],
          status: perPlatform._ready_to_publish ? "ready" : "generated",
        };
      })
      .filter(Boolean);

    if (listingsRows.length > 0) {
      await supabase.from("device_listings").insert(listingsRows as any[]);
    }
  }

  await supabase
    .from("runs")
    .update({ publishable_count: publishableCount })
    .eq("id", run.id);

  const exportRows = Object.entries(exports).map(([platform, e]) => ({
    run_id: run.id,
    platform,
    filename: e.filename,
    content: e.content,
  }));

  // Per-platform automation JSON (leboncoin/wallapop/facebook/ebay/machinio/kitmondo),
  // same shape run_all.build_automation_record produces — downloadable alongside the
  // Tier-A CSV/TSV files, not just stored as title/description in device_listings.
  for (const platform of PLATFORMS) {
    const records = automation[platform];
    if (records && records.length > 0) {
      exportRows.push({
        run_id: run.id,
        platform: `${platform}_automation`,
        filename: `${platform}.json`,
        content: JSON.stringify(records, null, 2),
      });
    }
  }

  if (exportRows.length > 0) {
    await supabase.from("run_exports").insert(exportRows);
  }

  return NextResponse.json({ report: result.report, total: master.length, publishable: publishableCount });
}
