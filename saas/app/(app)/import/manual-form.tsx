"use client";

import { useState } from "react";
import { Button, Card } from "@/app/components/ui";

// Keys are header spellings the engine's ALIASES (src/schema.py) already
// understand, so a typed device goes through the exact same pipeline as an
// Excel row — same normalization, same generated listings.
type Field = {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "number" | "select" | "textarea";
  options?: string[];
  wide?: boolean;
};

const FIELDS: Field[] = [
  { key: "Marque", label: "Marque", required: true, placeholder: "Candela" },
  { key: "Modèle", label: "Modèle", required: true, placeholder: "GentleMax Pro" },
  { key: "Année", label: "Année", type: "number", placeholder: "2019" },
  { key: "Numéro de série", label: "N° de série" },
  { key: "État", label: "État", required: true, placeholder: "Très bon état" },
  { key: "Pays", label: "Pays (localisation)", required: true, placeholder: "France" },
  { key: "Compteur", label: "Compteur (tirs / heures)", placeholder: "120 000 tirs" },
  { key: "Priorité", label: "Priorité de vente", placeholder: "1" },
  { key: "Prix conseillé", label: "Prix conseillé (€)", required: true, type: "number", placeholder: "45000" },
  { key: "Prix minimum", label: "Prix minimum (€)", type: "number" },
  { key: "Prix premium", label: "Prix premium (€)", type: "number" },
  { key: "TVA récupérable", label: "TVA récupérable", type: "select", options: ["", "Oui", "Non"] },
  { key: "Livraison possible", label: "Livraison possible", type: "select", options: ["", "Oui", "Non"] },
  { key: "Options", label: "Options", type: "textarea", wide: true, placeholder: "Séparées par des virgules" },
  { key: "Accessoires", label: "Accessoires", type: "textarea", wide: true, placeholder: "Séparés par des virgules" },
  { key: "Photos", label: "Photos (liens)", type: "textarea", wide: true, placeholder: "URLs ou liens Google Drive, séparés par des virgules" },
];

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-300 focus:border-zinc-400 focus:outline-none";

export default function ManualDeviceForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (row: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const missingRequired = FIELDS.filter((f) => f.required && !values[f.key]?.trim());

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!values["Marque"]?.trim() || !values["Modèle"]?.trim()) return;
    onSubmit(values);
  }

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-zinc-900">Ajouter un appareil</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Saisis la machine directement. Les champs marqués * sont nécessaires pour publier — s&apos;ils
        manquent, l&apos;appareil est enregistré quand même et flagué « Données manquantes ».
      </p>
      <form onSubmit={submit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className={`block text-sm ${f.wide ? "sm:col-span-2" : ""}`}>
            <span className="mb-1 block text-xs font-medium text-zinc-500">
              {f.label}
              {f.required && <span className="text-red-500"> *</span>}
            </span>
            {f.type === "select" ? (
              <select
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className={inputClass}
              >
                {f.options!.map((o) => (
                  <option key={o} value={o}>{o || "—"}</option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                rows={2}
                value={values[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className={inputClass}
              />
            ) : (
              <input
                type={f.type === "number" ? "number" : "text"}
                min={f.type === "number" ? 0 : undefined}
                value={values[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className={inputClass}
              />
            )}
          </label>
        ))}
        <div className="flex items-center justify-between gap-3 sm:col-span-2">
          <span className="text-xs text-amber-600">
            {missingRequired.length > 0 && `Manquant pour publier : ${missingRequired.map((f) => f.label).join(", ")}`}
          </span>
          <Button type="submit" disabled={busy || !values["Marque"]?.trim() || !values["Modèle"]?.trim()}>
            {busy ? "Analyse…" : "Analyser"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
