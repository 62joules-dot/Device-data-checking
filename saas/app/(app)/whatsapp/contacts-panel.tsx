"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardHeader } from "@/app/components/ui";
import { createClient } from "@/lib/supabase/client";
import { DEVICE_TYPE_LABEL } from "@/lib/device-types";

export type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  kind: "client" | "prospect";
  interests: string[];
  notes: string | null;
};

export default function ContactsPanel({ contacts }: { contacts: Contact[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [kind, setKind] = useState<"client" | "prospect">("prospect");
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleInterest(k: string) {
    setInterests((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]));
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient()
      .from("contacts")
      .insert({ name, phone: phone || null, kind, interests });
    setBusy(false);
    if (error) return setError(error.message);
    setName("");
    setPhone("");
    setInterests([]);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce contact ?")) return;
    await createClient().from("contacts").delete().eq("id", id);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader title={`Contacts (${contacts.length})`} />
      <form onSubmit={add} className="space-y-2 border-b border-zinc-100 px-5 py-4">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom (ex. Dr Martin – Clinique X)" className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
        <div className="flex gap-2">
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone (06… ou +33…)" className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
          <select value={kind} onChange={(e) => setKind(e.target.value as "client" | "prospect")} className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm">
            <option value="prospect">Prospect</option>
            <option value="client">Client</option>
          </select>
        </div>
        <details className="text-xs">
          <summary className="cursor-pointer text-zinc-500">Intéressé par… ({interests.length})</summary>
          <div className="mt-2 grid max-h-40 grid-cols-1 gap-1 overflow-auto">
            {Object.entries(DEVICE_TYPE_LABEL).map(([k, v]) => (
              <label key={k} className="flex items-center gap-1.5 text-zinc-600">
                <input type="checkbox" checked={interests.includes(k)} onChange={() => toggleInterest(k)} /> {v}
              </label>
            ))}
          </div>
        </details>
        <Button type="submit" disabled={busy}>+ Ajouter le contact</Button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
      <ul className="max-h-96 divide-y divide-zinc-100 overflow-auto">
        {contacts.map((c) => (
          <li key={c.id} className="flex items-start justify-between gap-2 px-5 py-2.5 text-sm">
            <div>
              <div className="font-medium text-zinc-800">{c.name}</div>
              <div className="text-xs text-zinc-400">
                {c.phone} · {c.kind === "client" ? "Client" : "Prospect"}
                {c.interests.length > 0 && ` · ${c.interests.map((i) => DEVICE_TYPE_LABEL[i] ?? i).join(", ")}`}
              </div>
            </div>
            <button onClick={() => remove(c.id)} className="text-xs text-red-500 hover:underline">Supprimer</button>
          </li>
        ))}
        {contacts.length === 0 && <li className="px-5 py-4 text-sm text-zinc-400">Aucun contact.</li>}
      </ul>
    </Card>
  );
}
