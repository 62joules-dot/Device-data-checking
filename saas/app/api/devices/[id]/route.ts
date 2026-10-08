import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const update: Record<string, unknown> = {};
  if (Array.isArray(body.photos)) {
    update.photos = body.photos.filter((p: unknown) => typeof p === "string" && p);
  }
  if ("price_recommended" in body) {
    const price = body.price_recommended === "" || body.price_recommended === null
      ? null
      : Number(body.price_recommended);
    update.price_recommended = price;

    // Keep the "Prêt / Données manquantes" flag in sync with the price.
    const { data: current } = await supabase.from("devices").select("missing_fields").eq("id", id).single();
    const others = ((current?.missing_fields as string[]) ?? []).filter((f) => f !== "price_recommended");
    const missing = price == null ? [...others, "price_recommended"] : others;
    update.missing_fields = missing;
    update.publishable = missing.length === 0;
  }

  const { error } = await supabase.from("devices").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
