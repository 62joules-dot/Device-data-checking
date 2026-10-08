import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function normKey(s: unknown) {
  return typeof s === "string" ? s.trim().toLowerCase() : "";
}

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
      ...(process.env.PYTHON_ENGINE_API_KEY ? { "X-Api-Key": process.env.PYTHON_ENGINE_API_KEY } : {}),
    },
    body: JSON.stringify({ xlsx_base64: xlsxBase64 }),
  });
  const result = await engineRes.json();
  if (!engineRes.ok) {
    return NextResponse.json({ error: result.error || "engine error" }, { status: 502 });
  }

  const master: any[] = result.master_database ?? [];

  // Existing devices for this user, for duplicate detection + next reference number.
  const { data: existing } = await supabase
    .from("devices")
    .select("id, reference, brand, model, serial_number, year");

  const bySerial = new Map<string, any>();
  const byBrandModelYear = new Map<string, any>();
  for (const d of existing ?? []) {
    if (d.serial_number) bySerial.set(normKey(d.serial_number), d);
    byBrandModelYear.set(`${normKey(d.brand)}|${normKey(d.model)}|${d.year ?? ""}`, d);
  }

  let nextRefNumber =
    1 +
    (existing ?? []).reduce((max, d) => {
      const m = /^REF-(\d+)$/.exec(d.reference ?? "");
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);

  const records = master.map((rec) => {
    const serialMatch = rec.serial_number ? bySerial.get(normKey(rec.serial_number)) : null;
    const comboMatch = byBrandModelYear.get(`${normKey(rec.brand)}|${normKey(rec.model)}|${rec.year ?? ""}`);
    const duplicateOf = serialMatch ?? comboMatch ?? null;

    return {
      ...rec,
      _reference: `REF-${String(nextRefNumber++).padStart(4, "0")}`,
      _duplicate_of: duplicateOf ? { id: duplicateOf.id, reference: duplicateOf.reference } : null,
      _include: !duplicateOf,
    };
  });

  return NextResponse.json({
    report: result.report,
    records,
    automation: result.automation ?? {},
    exports: result.exports ?? {},
    source_label: (file as File).name ?? "upload",
  });
}
