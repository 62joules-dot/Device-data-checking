import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getWhatsAppConfig, sendFreeForm, sendTemplate } from "@/lib/whatsapp";
import { toWhatsAppNumber } from "@/lib/phone";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const cfg = await getWhatsAppConfig(supabase);
  if (!cfg) return NextResponse.json({ error: "API WhatsApp non configurée (Réglages → Connexions & API)." }, { status: 400 });

  const { contact_ids, device_id, mode, message, image_urls } = (await request.json()) as {
    contact_ids: string[];
    device_id: string;
    mode: "template" | "free";
    message: string;
    image_urls: string[];
  };

  const { data: device } = await supabase.from("devices").select("*").eq("id", device_id).single();
  if (!device) return NextResponse.json({ error: "Appareil introuvable" }, { status: 404 });
  const { data: contacts } = await supabase.from("contacts").select("*").in("id", contact_ids ?? []);

  const deviceName = `${device.brand ?? ""} ${device.model ?? ""}`.trim();
  const details = [
    device.year && `Année ${device.year}`,
    device.condition && `État ${device.condition}`,
    device.usage_counter && `Compteur ${device.usage_counter}`,
    device.price_recommended != null && `Prix ${Number(device.price_recommended).toLocaleString("fr-FR")} € HT`,
  ].filter(Boolean).join(" · ");

  const results: { contact_id: string; ok: boolean; error?: string }[] = [];
  for (const c of contacts ?? []) {
    const to = toWhatsAppNumber(c.phone);
    const firstName = String(c.name).split(/[\s–-]/)[0] || c.name;
    let providerId: string | undefined;
    let error: string | undefined;
    try {
      if (to.length < 8) throw new Error("Numéro invalide");
      providerId =
        mode === "template"
          ? await sendTemplate(cfg, to, { imageUrl: image_urls?.[0] ?? null, firstName, device: deviceName, details })
          : await sendFreeForm(cfg, to, message.replaceAll("{prenom}", firstName), image_urls ?? []);
    } catch (e) {
      error = e instanceof Error ? e.message : "Échec";
    }
    await supabase.from("contact_messages").insert({
      contact_id: c.id,
      device_id,
      channel: "whatsapp_api",
      status: error ? "failed" : "sent",
      provider_message_id: providerId ?? null,
      error: error ?? null,
    });
    results.push({ contact_id: c.id, ok: !error, error });
  }

  return NextResponse.json({ results });
}
