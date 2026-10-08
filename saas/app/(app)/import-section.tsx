"use client";

import { useState } from "react";
import { Button, Card } from "@/app/components/ui";
import ImportWizard from "./import/wizard";

export default function ImportSection() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ Importer un fichier</Button>;
  }

  return (
    <Card className="w-full p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">Importer un inventaire</h2>
        <button onClick={() => setOpen(false)} className="text-sm text-zinc-400 hover:text-zinc-700">
          Fermer ✕
        </button>
      </div>
      <ImportWizard onDone={() => setOpen(false)} />
    </Card>
  );
}
