"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui";

export default function GmailForm() {
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/credentials")
      .then((r) => r.json())
      .then((data) => {
        const gmail = (data.credentials ?? []).find((c: any) => c.platform === "gmail");
        if (gmail?.credentials?.user) {
          setAddress(gmail.credentials.user);
          setConnected(Boolean(gmail.credentials.app_password));
        }
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!address || !password) {
      setMessage("Renseigne l'adresse et le mot de passe d'application.");
      return;
    }
    setBusy(true);
    await fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "gmail", credentials: { user: address.trim(), app_password: password.trim() } }),
    });
    setBusy(false);
    setPassword("");
    setConnected(true);
    setMessage("Gmail connecté.");
  }

  async function remove() {
    if (!confirm("Déconnecter Gmail ?")) return;
    setBusy(true);
    await fetch("/api/credentials/gmail", { method: "DELETE" });
    setBusy(false);
    setConnected(false);
    setAddress("");
    setMessage(null);
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <p className="text-xs text-zinc-500">
        Permet d&apos;envoyer les mails de la page Emails directement depuis ton adresse. Il faut un{" "}
        <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline">
          mot de passe d&apos;application Google
        </a>{" "}
        (la validation en 2 étapes doit être activée sur le compte) — pas ton mot de passe Gmail habituel.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          type="email"
          value={address}
          onChange={(e) => { setAddress(e.target.value); setMessage(null); }}
          placeholder="ton.adresse@gmail.com"
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setMessage(null); }}
          placeholder={connected ? "•••••••• (déjà enregistré)" : "Mot de passe d'application"}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" variant="secondary" disabled={busy}>{connected ? "Mettre à jour" : "Connecter"}</Button>
        {connected && <Button type="button" variant="danger" onClick={remove} disabled={busy}>Déconnecter</Button>}
        {connected && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">Connecté</span>}
        {message && <span className="text-xs text-zinc-500">{message}</span>}
      </div>
    </form>
  );
}
