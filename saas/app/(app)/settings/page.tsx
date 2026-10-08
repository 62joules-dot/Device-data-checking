import { createClient } from "@/lib/supabase/server";
import SetPasswordForm from "@/app/set-password-form";
import { Card, CardHeader, PageHeader } from "@/app/components/ui";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Réglages" />

      <Card>
        <CardHeader title="Connecté en tant que" />
        <p className="px-5 py-4 text-sm text-zinc-600">{user?.email}</p>
      </Card>

      <Card>
        <CardHeader title="Changer le mot de passe" />
        <div className="px-5 py-4">
          <SetPasswordForm />
        </div>
      </Card>

      <Card>
        <CardHeader title="Session" />
        <div className="px-5 py-4">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
