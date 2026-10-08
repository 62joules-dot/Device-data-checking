import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getWhatsAppConfig, testConnection } from "@/lib/whatsapp";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const cfg = await getWhatsAppConfig(supabase);
  if (!cfg) return NextResponse.json({ error: "Token d'accès et Phone number ID requis." }, { status: 400 });

  try {
    const info = await testConnection(cfg);
    return NextResponse.json({ ok: true, number: info.display_phone_number, name: info.verified_name, quality: info.quality_rating });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Échec" }, { status: 400 });
  }
}
