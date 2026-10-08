"use client";

import { useState } from "react";
import { Button, Card } from "@/app/components/ui";
import ImportWizard, { ImportMode } from "./import/wizard";

export default function ImportSection() {
  const [mode, setMode] = useState<ImportMode | null>(null);

  if (!mode) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setMode("manual")}>+ Ajouter un appareil</Button>
        <Button variant="secondary" onClick={() => setMode("file")}>Importer un fichier Excel</Button>
      </div>
    );
  }

  return (
    <Card className="w-full p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">
          {mode === "manual" ? "Ajouter un appareil" : "Importer un inventaire"}
        </h2>
        <button onClick={() => setMode(null)} className="text-sm text-zinc-400 hover:text-zinc-700">
          Fermer ✕
        </button>
      </div>
      {/* key: switching mode restarts the wizard from its first step */}
      <ImportWizard key={mode} mode={mode} onDone={() => setMode(null)} />
    </Card>
  );
}
