import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ListingRow from "./listing-row";

export default async function TrackingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listings } = await supabase
    .from("device_listings")
    .select("id, platform, title, status, listing_url, posted_at, price, device:devices(brand, model, device_type)")
    .order("posted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Suivi des annonces</h1>
        <Link href="/" className="text-sm text-slate-500 underline">Retour au dashboard</Link>
      </div>
      <p className="text-sm text-slate-500">
        Marque une annonce &quot;en ligne&quot; une fois postée manuellement sur la plateforme, avec le prix et le lien.
        Tu peux ensuite la marquer vendue, la retirer, ou la supprimer du suivi.
      </p>

      <table className="w-full text-sm">
        <thead className="text-left text-slate-500">
          <tr>
            <th className="py-1">Appareil</th>
            <th>Plateforme</th>
            <th>Prix</th>
            <th>En ligne depuis</th>
            <th>Lien</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(listings ?? []).map((l: any) => (
            <ListingRow key={l.id} listing={l} />
          ))}
          {(listings ?? []).length === 0 && (
            <tr><td className="py-3 text-slate-400" colSpan={7}>Aucune annonce générée pour l&apos;instant.</td></tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
