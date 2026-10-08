import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const deviceType = searchParams.get("device_type");
  const brand = searchParams.get("brand");

  if (!deviceType) {
    return NextResponse.json({ error: "device_type is required" }, { status: 400 });
  }

  const { data: soldAll } = await supabase
    .from("device_listings")
    .select("price, platform, posted_at, device:devices(brand, model, device_type, year, condition)")
    .eq("status", "sold")
    .not("price", "is", null);
  const sold = (soldAll ?? []).filter((s: any) => s.device?.device_type === deviceType);

  const { data: references } = await supabase
    .from("price_references")
    .select("*")
    .eq("device_type", deviceType)
    .order("price", { ascending: true });

  let brandReferences: typeof references = [];
  if (brand) {
    const { data } = await supabase
      .from("price_references")
      .select("*")
      .ilike("brand", brand)
      .order("price", { ascending: true });
    brandReferences = data ?? [];
  }

  return NextResponse.json({
    sold,
    references: references ?? [],
    brandReferences,
  });
}
