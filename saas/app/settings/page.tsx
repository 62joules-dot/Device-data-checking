import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SetPasswordForm from "../set-password-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Settings</h1>
        <Link href="/" className="text-sm text-slate-500 underline">
          Back to dashboard
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-600">Signed in as</h2>
        <p className="text-sm">{user.email}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-600">Change password</h2>
        <SetPasswordForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-600">Session</h2>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded border border-slate-300 px-3 py-2 text-sm font-medium"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
