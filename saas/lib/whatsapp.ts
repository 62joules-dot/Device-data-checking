// Server-only: WhatsApp Business Cloud API (Meta Graph API).
import type { SupabaseClient } from "@supabase/supabase-js";

export type WhatsAppConfig = {
  access_token: string;
  phone_number_id: string;
  template_name?: string;
  template_lang?: string;
  api_version?: string;
};

export async function getWhatsAppConfig(supabase: SupabaseClient): Promise<WhatsAppConfig | null> {
  const { data } = await supabase
    .from("platform_credentials")
    .select("credentials")
    .eq("platform", "whatsapp")
    .maybeSingle();
  const c = (data?.credentials ?? {}) as Partial<WhatsAppConfig>;
  if (!c.access_token || !c.phone_number_id) return null;
  return c as WhatsAppConfig;
}

function base(cfg: WhatsAppConfig) {
  return `https://graph.facebook.com/${cfg.api_version || "v23.0"}`;
}

async function call(cfg: WhatsAppConfig, path: string, init?: RequestInit) {
  const res = await fetch(`${base(cfg)}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${cfg.access_token}`, "Content-Type": "application/json", ...init?.headers },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = json?.error;
    throw new Error(e ? `${e.message}${e.code ? ` (code ${e.code})` : ""}` : `HTTP ${res.status}`);
  }
  return json;
}

export async function testConnection(cfg: WhatsAppConfig) {
  return call(cfg, `${cfg.phone_number_id}?fields=display_phone_number,verified_name,quality_rating`);
}

async function send(cfg: WhatsAppConfig, to: string, payload: Record<string, unknown>) {
  const json = await call(cfg, `${cfg.phone_number_id}/messages`, {
    method: "POST",
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, ...payload }),
  });
  return json?.messages?.[0]?.id as string | undefined;
}

// Template params can't contain newlines, tabs or 4+ consecutive spaces.
function param(text: string) {
  return text.replace(/[\n\t]+/g, " · ").replace(/ {4,}/g, " ").trim().slice(0, 1000);
}

// Approved template "annonce_appareil": IMAGE header + body {{1}} prénom,
// {{2}} appareil, {{3}} caractéristiques. Works outside the 24h window.
export async function sendTemplate(
  cfg: WhatsAppConfig,
  to: string,
  args: { imageUrl: string | null; firstName: string; device: string; details: string }
) {
  const components: Record<string, unknown>[] = [];
  if (args.imageUrl) {
    components.push({ type: "header", parameters: [{ type: "image", image: { link: args.imageUrl } }] });
  }
  components.push({
    type: "body",
    parameters: [args.firstName, args.device, args.details].map((t) => ({ type: "text", text: param(t || "-") })),
  });
  return send(cfg, to, {
    type: "template",
    template: { name: cfg.template_name || "annonce_appareil", language: { code: cfg.template_lang || "fr" }, components },
  });
}

// Free-form: only accepted if the contact wrote to us in the last 24h.
export async function sendFreeForm(cfg: WhatsAppConfig, to: string, text: string, imageUrls: string[]) {
  const ids: (string | undefined)[] = [];
  ids.push(await send(cfg, to, { type: "text", text: { body: text.slice(0, 4096), preview_url: true } }));
  for (const link of imageUrls) ids.push(await send(cfg, to, { type: "image", image: { link } }));
  return ids.filter(Boolean)[0];
}
