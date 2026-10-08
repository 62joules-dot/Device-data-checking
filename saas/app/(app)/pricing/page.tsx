import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/app/components/ui";
import PricingSimulator from "./simulator";

export default async function PricingPage() {
  const supabase = await createClient();

  const { data: devices } = await supabase
    .from("devices")
    .select("id, brand, model, device_type, year, condition, price_recommended, reference")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Simulateur de prix"
        description="Estimation basée sur tes ventes passées et des références marché (sources citées, aucun prix inventé)."
      />
      <PricingSimulator devices={devices ?? []} />
    </div>
  );
}
