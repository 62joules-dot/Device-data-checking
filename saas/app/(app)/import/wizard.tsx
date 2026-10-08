"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, CardHeader } from "@/app/components/ui";
import PlatformBadge from "@/app/platform-badge";
import ManualDeviceForm from "./manual-form";

type Record_ = {
  id: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  condition: string | null;
  country: string | null;
  price_recommended: number | null;
  _missing_required?: string[];
  _publishable?: boolean;
  _reference: string;
  _duplicate_of: { id: string; reference: string | null } | null;
  _include: boolean;
  generated?: any;
};

function v(x: unknown) {
  return x == null || x === "MISSING" ? "" : String(x);
}

type ParseResult = {
  report: any;
  records: Record_[];
  automation: Record<string, any[]>;
  exports: Record<string, { filename: string; content: string }>;
  source_label: string;
};

// Where a device can go. Nothing is sent at import: listings wait in Suivi until
// reviewed and validated. "auto" = sent by the platform feed once validated;
// "manual" = posted by hand from Suivi; "file" = only an import file is produced.
const TARGETS: { platform: string; kind: "auto" | "manual" | "file" }[] = [
  { platform: "leboncoin", kind: "manual" },
  { platform: "wallapop", kind: "manual" },
  { platform: "facebook", kind: "manual" },
  { platform: "ebay", kind: "auto" },
  { platform: "machinio", kind: "auto" },
  { platform: "kitmondo", kind: "auto" },
  { platform: "dotmed", kind: "file" },
  { platform: "exapro_prepared", kind: "file" },
  { platform: "bimedis_prepared", kind: "file" },
];

type TargetChoice = { enabled: boolean };
const TARGETS_STORAGE_KEY = "import.targets";

function defaultTargets(): Record<string, TargetChoice> {
  return Object.fromEntries(TARGETS.map((t) => [t.platform, { enabled: true }]));
}

export type ImportMode = "file" | "manual";

export default function ImportWizard({ onDone, mode = "file" }: { onDone?: () => void; mode?: ImportMode }) {
  const STEPS = [mode === "manual" ? "Saisie" : "Fichier", "Vérification", "Préparation", "Résultat"];
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [records, setRecords] = useState<Record_[]>([]);
  const [confirmResult, setConfirmResult] = useState<{ total: number; publishable: number } | null>(null);
  const [targets, setTargets] = useState<Record<string, TargetChoice>>(defaultTargets);

  // Last import's platform choices come back as the default for the next one.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TARGETS_STORAGE_KEY) ?? "null");
      if (saved && typeof saved === "object") setTargets({ ...defaultTargets(), ...saved });
    } catch {
      // storage unavailable — keep defaults
    }
  }, []);

  function updateTarget(platform: string, patch: Partial<TargetChoice>) {
    setTargets((t) => ({ ...t, [platform]: { ...t[platform], ...patch } }));
  }

  const selectedTargets = TARGETS.filter((t) => targets[t.platform]?.enabled);

  async function analyze(init: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/import/parse", { method: "POST", ...init });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analyse impossible");
      setParsed(data);
      setRecords(data.records);
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse impossible");
    } finally {
      setBusy(false);
    }
  }

  function updateRecord(id: string, patch: Partial<Record_>) {
    setRecords((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function confirm() {
    if (!parsed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records,
          automation: parsed.automation,
          exports: parsed.exports,
          source_label: parsed.source_label,
          platforms: Object.fromEntries(
            selectedTargets.map((t) => [t.platform, {}])
          ),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import impossible");
      try {
        localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(targets));
      } catch {
        // storage unavailable — choice just isn't remembered
      }
      setConfirmResult(data);
      setStep(3);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import impossible");
    } finally {
      setBusy(false);
    }
  }

  const includedCount = records.filter((r) => r._include).length;
  const duplicateCount = records.filter((r) => r._duplicate_of).length;

  return (
    <div className="space-y-6">
      <ol className="flex items-center gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                i === step ? "bg-zinc-900 text-white" : i < step ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-400"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span className={i === step ? "font-medium text-zinc-900" : "text-zinc-400"}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-zinc-200" />}
          </li>
        ))}
      </ol>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {step === 0 && mode === "manual" && (
        <ManualDeviceForm
          busy={busy}
          onSubmit={(row) =>
            analyze({
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rows: [row], source_label: "Saisie manuelle" }),
            })
          }
        />
      )}

      {step === 0 && mode === "file" && (
        <Card className="p-6">
          <h2 className="text-base font-semibold text-zinc-900">Importer un fichier Excel</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Une ligne par appareil. Les champs manquants seront flagués, jamais inventés.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <Button
              onClick={() => {
                if (!file) return;
                const body = new FormData();
                body.append("file", file);
                analyze({ body });
              }}
              disabled={!file || busy}
            >
              {busy ? "Analyse…" : "Analyser"}
            </Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Card className="flex flex-wrap gap-6 px-5 py-4 text-sm">
            <div><span className="font-semibold text-zinc-900">{records.length}</span> <span className="text-zinc-500">appareils détectés</span></div>
            <div><span className="font-semibold text-zinc-900">{duplicateCount}</span> <span className="text-zinc-500">déjà connus — seront mis à jour</span></div>
            <div><span className="font-semibold text-zinc-900">{records.length - duplicateCount}</span> <span className="text-zinc-500">nouveaux</span></div>
            <div><span className="font-semibold text-zinc-900">{includedCount}</span> <span className="text-zinc-500">seront importés</span></div>
          </Card>

          <Card>
            <CardHeader title="Vérifier les appareils et les références" />
            <p className="px-5 pt-3 text-xs text-zinc-500">
              Un appareil déjà présent (même n° de série, ou même marque/modèle/année) est mis à jour
              sans perdre son suivi (lien, statut) — il n&apos;est pas dupliqué. Décoche une ligne pour l&apos;ignorer.
            </p>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-5 py-2.5">Inclure</th>
                  <th className="py-2.5">Référence</th>
                  <th className="py-2.5">Appareil</th>
                  <th className="py-2.5">Année</th>
                  <th className="py-2.5">Prix</th>
                  <th className="py-2.5">Statut</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-t border-zinc-100">
                    <td className="px-5 py-2">
                      <input
                        type="checkbox"
                        checked={r._include}
                        onChange={(e) => updateRecord(r.id, { _include: e.target.checked })}
                      />
                    </td>
                    <td className="py-2">
                      <input
                        value={r._reference}
                        onChange={(e) => updateRecord(r.id, { _reference: e.target.value })}
                        className="w-24 rounded-lg border border-zinc-200 px-2 py-1 font-mono text-xs"
                      />
                    </td>
                    <td className="py-2 font-medium text-zinc-800">{v(r.brand)} {v(r.model)}</td>
                    <td className="py-2 text-zinc-500">{v(r.year) || "—"}</td>
                    <td className="py-2 text-zinc-700">{r.price_recommended ? `${r.price_recommended} €` : "—"}</td>
                    <td className="py-2">
                      {r._duplicate_of ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                          Mise à jour
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                          Nouveau
                        </span>
                      )}
                      {!r._publishable && (
                        <span className="ml-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                          {(r._missing_required ?? []).join(", ") || "incomplet"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setStep(0)}>Retour</Button>
            <Button onClick={() => setStep(2)}>Continuer</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <Card className="p-6">
          <h2 className="text-base font-semibold text-zinc-900">Où publier ?</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {includedCount} appareil{includedCount === 1 ? "" : "s"} seront enregistrés. Coche les sites où publier :
            les annonces sont préparées et sauvegardées dans le Suivi. Rien n&apos;est envoyé tant que tu ne les as pas
            relues et validées une par une.
          </p>
          <ul className="mt-4 divide-y divide-zinc-100 rounded-xl border border-zinc-200 text-sm">
            {TARGETS.map((t) => {
              const choice = targets[t.platform];
              return (
                <li key={t.platform} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                  <label className="flex items-center gap-2.5 text-zinc-700">
                    <input
                      type="checkbox"
                      checked={choice.enabled}
                      onChange={(e) => updateTarget(t.platform, { enabled: e.target.checked })}
                    />
                    <PlatformBadge platform={t.platform} />
                  </label>
                  {!choice.enabled ? (
                    <span className="text-xs text-zinc-400">Non publié</span>
                  ) : t.kind === "auto" ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      À relire et valider dans le Suivi — envoi automatique ensuite
                    </span>
                  ) : t.kind === "manual" ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                      À relire dans le Suivi — publication à la main
                    </span>
                  ) : (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      Fichier d&apos;import uniquement
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {selectedTargets.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">
              Aucun site coché : les appareils seront enregistrés sans annonce.
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setStep(1)}>Retour</Button>
            <Button onClick={confirm} disabled={busy || includedCount === 0}>
              {busy ? "Import…" : `Importer ${includedCount} appareil${includedCount === 1 ? "" : "s"}`}
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && confirmResult && (
        <Card className="p-6">
          <h2 className="text-base font-semibold text-zinc-900">{mode === "manual" ? "Appareil ajouté" : "Import terminé"}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {confirmResult.total} appareil{confirmResult.total === 1 ? "" : "s"} enregistré{confirmResult.total === 1 ? "" : "s"}, {confirmResult.publishable} prêt{confirmResult.publishable === 1 ? "" : "s"} à publier.
          </p>
          <div className="mt-5 flex gap-2">
            {onDone ? (
              <Button onClick={onDone}>Voir l&apos;inventaire</Button>
            ) : (
              <a href="/"><Button>Voir l&apos;inventaire</Button></a>
            )}
            <a href="/tracking"><Button variant="secondary">Aller au suivi des annonces</Button></a>
            {mode === "manual" && (
              <Button
                variant="ghost"
                onClick={() => {
                  setParsed(null);
                  setRecords([]);
                  setConfirmResult(null);
                  setStep(0);
                }}
              >
                + Ajouter un autre appareil
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
