import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 50;

// Sends the composed mail through the user's own Gmail account (SMTP + app
// password saved in Réglages), one message per recipient.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const to: string[] = Array.isArray(body.to) ? body.to.map((s: unknown) => String(s).trim()) : [];
  const { subject, html, text, fromName } = body;

  if (to.length === 0) return NextResponse.json({ error: "Aucun destinataire." }, { status: 400 });
  if (to.length > MAX_RECIPIENTS) {
    return NextResponse.json({ error: `Maximum ${MAX_RECIPIENTS} destinataires par envoi.` }, { status: 400 });
  }
  const invalid = to.filter((a) => !EMAIL_RE.test(a));
  if (invalid.length) return NextResponse.json({ error: `Adresse invalide : ${invalid.join(", ")}` }, { status: 400 });
  if (!subject || !html) return NextResponse.json({ error: "Objet ou contenu manquant." }, { status: 400 });

  const { data: row } = await supabase
    .from("platform_credentials")
    .select("credentials")
    .eq("user_id", user.id)
    .eq("platform", "gmail")
    .single();
  const creds = (row?.credentials ?? {}) as { user?: string; app_password?: string };
  if (!creds.user || !creds.app_password) {
    return NextResponse.json({ error: "Gmail n'est pas connecté (Réglages → Envoi d'emails)." }, { status: 400 });
  }

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: creds.user, pass: creds.app_password.replace(/\s+/g, "") },
  });

  try {
    await transport.verify();
  } catch {
    return NextResponse.json(
      { error: "Connexion à Gmail refusée : vérifie l'adresse et le mot de passe d'application dans Réglages." },
      { status: 400 }
    );
  }

  const from = fromName ? { name: String(fromName), address: creds.user } : creds.user;
  let sent = 0;
  const failed: string[] = [];
  for (const address of to) {
    try {
      await transport.sendMail({ from, to: address, subject: String(subject), html: String(html), text: text ? String(text) : undefined });
      sent += 1;
    } catch {
      failed.push(address);
    }
  }

  return NextResponse.json({ sent, failed });
}
