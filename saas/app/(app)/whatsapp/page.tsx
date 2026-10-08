import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/app/components/ui";
import ContactsPanel from "./contacts-panel";
import WhatsAppComposer from "./composer";
import { getWhatsAppConfig } from "@/lib/whatsapp";

export default async function WhatsAppPage() {
  const supabase = await createClient();
  const [{ data: devices }, { data: listings }, { data: bank }, { data: contacts }, { data: sent }] = await Promise.all([
    supabase.from("devices").select("id, reference, brand, model, device_type, year, condition, usage_counter, price_recommended, photos").order("created_at", { ascending: false }),
    supabase.from("device_listings").select("device_id, platform, status, listing_url, short_description"),
    supabase.from("image_bank").select("*"),
    supabase.from("contacts").select("*").order("name"),
    supabase.from("contact_messages").select("contact_id, device_id, sent_at, channel, status, error"),
  ]);
  const apiConfigured = !!(await getWhatsAppConfig(supabase));

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp"
        description="Choisis un appareil, le message et les photos se préparent ; les contacts intéressés par ce type remontent en premier."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <WhatsAppComposer devices={devices ?? []} listings={listings ?? []} bank={bank ?? []} contacts={contacts ?? []} sent={sent ?? []} apiConfigured={apiConfigured} />
        <ContactsPanel contacts={contacts ?? []} />
      </div>
    </div>
  );
}
