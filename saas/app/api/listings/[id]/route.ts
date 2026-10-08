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
  if ("listing_url" in body) update.listing_url = body.listing_url || null;
  if ("price" in body) update.price = body.price === "" || body.price === null ? null : Number(body.price);
  if ("status" in body) update.status = body.status;
  if (body.status === "posted" && !("posted_at" in body)) update.posted_at = new Date().toISOString();
  if ("posted_at" in body) update.posted_at = body.posted_at;

  const { error } = await supabase.from("device_listings").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
