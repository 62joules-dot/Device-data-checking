import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Never sent back to the browser — the client only learns whether one is set.
const SECRET_KEYS = new Set(["app_password", "access_token", "client_secret", "api_key"]);

function mask(credentials: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(credentials ?? {}).map(([k, v]) => [k, SECRET_KEYS.has(k) ? Boolean(v) : v])
  );
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("platform_credentials")
    .select("platform, credentials, updated_at")
    .order("platform");

  return NextResponse.json({
    credentials: (data ?? []).map((row) => ({ ...row, credentials: mask(row.credentials as Record<string, unknown>) })),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { platform, credentials } = await request.json();
  if (!platform) return NextResponse.json({ error: "platform is required" }, { status: 400 });

  // Blank fields keep their stored value ("laisser vide pour garder").
  const { data: existing } = await supabase
    .from("platform_credentials")
    .select("credentials")
    .eq("platform", platform)
    .maybeSingle();
  const merged: Record<string, unknown> = { ...((existing?.credentials as Record<string, unknown>) ?? {}) };
  for (const [k, v] of Object.entries((credentials ?? {}) as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim() === "" && SECRET_KEYS.has(k)) continue;
    merged[k] = typeof v === "string" ? v.trim() : v;
  }

  const { error } = await supabase
    .from("platform_credentials")
    .upsert(
      { user_id: user.id, platform, credentials: merged, updated_at: new Date().toISOString() },
      { onConflict: "user_id,platform" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
