"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteImage, pathFromUrl, uploadImage } from "@/lib/images";

export default function PhotoManager({
  deviceId,
  photos,
  fallback,
}: {
  deviceId: string;
  photos: string[];
  fallback: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: string[]) {
    const res = await fetch(`/api/devices/${deviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photos: next }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Échec");
    router.refresh();
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push((await uploadImage(f, `devices/${deviceId}`)).url);
      await save([...photos, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(url: string) {
    if (!confirm("Retirer cette photo ?")) return;
    setBusy(true);
    try {
      await save(photos.filter((p) => p !== url));
      const path = pathFromUrl(url);
      if (path) await deleteImage(path);
    } finally {
      setBusy(false);
    }
  }

  const shown = photos.length ? photos : fallback;

  return (
    <div className="space-y-3">
      {photos.length === 0 && fallback.length > 0 && (
        <p className="text-xs text-amber-600">Pas de photo propre — images de la banque utilisées en attendant.</p>
      )}
      {shown.length === 0 && <p className="text-sm text-zinc-400">Aucune photo. Ajoute-en, ou alimente la banque d&apos;images.</p>}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {shown.map((url) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            {photos.includes(url) && (
              <button
                onClick={() => onRemove(url)}
                disabled={busy}
                className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 text-xs text-red-600 opacity-0 shadow group-hover:opacity-100"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700">
        {busy ? "Envoi…" : "+ Ajouter des photos"}
        <input type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={(e) => onUpload(e.target.files)} />
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
