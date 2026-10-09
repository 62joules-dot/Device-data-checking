import { createClient } from "@/lib/supabase/server";
import SetPasswordForm from "@/app/set-password-form";
import { Card, CardHeader, PageHeader } from "@/app/components/ui";
import ConnectionsForm from "./connections-form";
import ContactForm from "./contact-form";
import GmailForm from "./gmail-form";

const SECTIONS = [
  { id: "compte", label: "Compte" },
  { id: "annonces", label: "Annonces" },
  { id: "messagerie", label: "Messagerie" },
  { id: "connexions", label: "Connexions & API" },
  { id: "session", label: "Session" },
];

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{title}</h2>
        <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Divider() {
  return <hr className="border-t border-zinc-200" />;
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader title="Réglages" />

      <nav className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <Divider />

      <Section id="compte" title="Compte" description="Ton identifiant et ton mot de passe.">
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
      </Section>

      <Divider />

      <Section id="annonces" title="Annonces" description="Les coordonnées reprises dans toutes les annonces générées.">
        <Card>
          <CardHeader title="Coordonnées des annonces" />
          <div className="px-5 py-4">
            <ContactForm />
          </div>
        </Card>
      </Section>

      <Divider />

      <Section id="messagerie" title="Messagerie" description="Envoi d'emails depuis l'application.">
        <Card>
          <CardHeader title="Envoi d'emails (Gmail)" />
          <div className="px-5 py-4">
            <GmailForm />
          </div>
        </Card>
      </Section>

      <Divider />

      <Section id="connexions" title="Connexions & API" description="WhatsApp Business et les autres services connectés.">
        <Card>
          <CardHeader title="Connexions & API" />
          <div className="px-5 py-4">
            <ConnectionsForm />
          </div>
        </Card>
      </Section>

      <Divider />

      <Section id="session" title="Session" description="Quitter l'application sur cet appareil.">
        <Card>
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
      </Section>
    </div>
  );
}
