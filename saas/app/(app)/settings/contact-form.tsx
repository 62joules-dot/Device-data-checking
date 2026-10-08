"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui";

export default function ContactForm() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/credentials")
      .then((r) => r.json())
      .then((data) => {
        const contact = (data.credentials ?? []).find((c: any) => c.platform === "contact");
        if (contact) {
          setPhone(contact.credentials?.phone ?? "");
          setEmail(contact.credentials?.email ?? "");
        }
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "contact", credentials: { phone, email } }),
    });
    setBusy(false);
    setSaved(true);
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <p className="text-xs text-zinc-500">Ajoutés automatiquement à toutes les annonces générées aux prochains imports.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={phone} onChange={(e) => { setPhone(e.target.value); setSaved(false); }} placeholder="Téléphone" className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
        <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setSaved(false); }} placeholder="Email de contact" className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" variant="secondary" disabled={busy}>Enregistrer</Button>
        {saved && <span className="text-xs text-emerald-600">Enregistré</span>}
      </div>
    </form>
  );
}
