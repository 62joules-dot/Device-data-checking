import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/app/components/ui";
import EmailComposer from "./composer";

export default async function EmailsPage() {
  const supabase = await createClient();

  const { data: devices } = await supabase
    .from("devices")
    .select("id, brand, model, device_type, year, condition, price_recommended, reference, usage_counter")
    .order("created_at", { ascending: false });

  // Online listings (links to include in the mail) + one generated description per device.
  const { data: listings } = await supabase
    .from("device_listings")
    .select("device_id, platform, status, listing_url, short_description, long_description");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emails"
        description="Choisis un appareil, le mail se remplit tout seul. Relis, puis ouvre-le dans Gmail pour l'envoyer."
      />
      <EmailComposer devices={devices ?? []} listings={listings ?? []} />
    </div>
  );
}
