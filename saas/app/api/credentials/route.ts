import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("platform_credentials")
    .select("platform, credentials, updated_at")
    .order("platform");

  return NextResponse.json({ credentials: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const { platform, credentials } = body;
  if (!platform) return NextResponse.json({ error: "platform is required" }, { status: 400 });

  const { error } = await supabase
    .from("platform_credentials")
    .upsert(
      { user_id: user.id, platform, credentials: credentials ?? {}, updated_at: new Date().toISOString() },
      { onConflict: "user_id,platform" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
