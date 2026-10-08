import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/app/components/ui";
import ImageBank from "./bank";

export default async function ImagesPage() {
  const supabase = await createClient();
  const { data: images } = await supabase.from("image_bank").select("*").order("created_at", { ascending: false });
  return (
    <div className="space-y-6">
      <PageHeader title="Banque d'images" description="Photos de référence par modèle ou type, utilisées quand un appareil n'a pas ses propres photos." />
      <ImageBank images={images ?? []} />
    </div>
  );
}
