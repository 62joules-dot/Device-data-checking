import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/app/components/ui";
import EmailComposer from "./composer";

export default async function EmailsPage() {
  const supabase = await createClient();

  const { data: devices } = await supabase
    .from("devices")
    .select("id, brand, model, device_type, year, condition, price_recommended, reference, usage_counter, photos")
    .order("created_at", { ascending: false });

  // Online listings (links to include in the mail) + one generated description per device.
  const { data: listings } = await supabase
    .from("device_listings")
    .select("device_id, platform, status, listing_url, short_description, long_description");

  // Signature contact details (Réglages → Coordonnées) and whether Gmail sending is set up.
  const { data: creds } = await supabase
    .from("platform_credentials")
    .select("platform, credentials")
    .in("platform", ["contact", "gmail"]);
  const contact = (creds?.find((c) => c.platform === "contact")?.credentials ?? {}) as { phone?: string; email?: string };
  const gmail = (creds?.find((c) => c.platform === "gmail")?.credentials ?? {}) as { user?: string; app_password?: string };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emails"
        description="Choisis un appareil : le mail se met en page et se remplit tout seul. Modifie le texte, puis copie-le dans Gmail ou envoie-le directement."
      />
      <EmailComposer
        devices={devices ?? []}
        listings={listings ?? []}
        contact={{ phone: contact.phone ?? "", email: contact.email ?? "" }}
        gmailSender={gmail.user && gmail.app_password ? gmail.user : null}
      />
    </div>
  );
}
