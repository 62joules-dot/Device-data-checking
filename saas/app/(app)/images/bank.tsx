"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardHeader } from "@/app/components/ui";
import { createClient } from "@/lib/supabase/client";
import { deleteImage, uploadImage } from "@/lib/images";
import type { BankImage } from "@/lib/photo-fallback";
import { DEVICE_TYPE_LABEL } from "@/lib/device-types";

export default function ImageBank({ images }: { images: BankImage[] }) {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!files?.length) return;
    if (!model && !deviceType) {
      setError("Indique au moins un modèle ou un type d'appareil.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      for (const f of Array.from(files)) {
        const { path, url } = await uploadImage(f, "bank");
        const { error } = await supabase.from("image_bank").insert({
          brand: brand || null,
          model: model || null,
          device_type: deviceType || null,
          url,
          path,
        });
        if (error) throw new Error(error.message);
      }
      setFiles(null);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setBusy(false);
    }
  }

  async function remove(img: BankImage) {
    if (!confirm("Supprimer cette image de la banque ?")) return;
    const supabase = createClient();
    await supabase.from("image_bank").delete().eq("id", img.id);
    await deleteImage(img.path);
    router.refresh();
  }

  const q = filter.trim().toLowerCase();
  const shown = images.filter(
    (i) => !q || [i.brand, i.model, i.device_type && DEVICE_TYPE_LABEL[i.device_type]].some((v) => v?.toLowerCase().includes(q))
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Ajouter des images" />
        <form onSubmit={add} className="space-y-3 px-5 py-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Marque (ex. Candela)" className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Modèle (ex. GentleMax Pro)" className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
            <select value={deviceType} onChange={(e) => setDeviceType(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm">
              <option value="">Type d&apos;appareil (optionnel)</option>
              {Object.entries(DEVICE_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} className="text-sm" />
            <Button type="submit" disabled={busy || !files?.length}>{busy ? "Envoi…" : "Ajouter à la banque"}</Button>
          </div>
          <p className="text-xs text-zinc-400">
            Utilisée quand un appareil n&apos;a pas de photo : d&apos;abord les images du même modèle, sinon celles du type
            (sans modèle). N&apos;ajoute que des images que tu as le droit d&apos;utiliser (tes photos, ou fournies par le fabricant/revendeur).
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      </Card>

      <Card>
        <CardHeader
          title={`${images.length} image${images.length > 1 ? "s" : ""}`}
          action={<input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrer…" className="rounded-lg border border-zinc-200 px-3 py-1 text-sm" />}
        />
        <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          {shown.map((img) => (
            <div key={img.id} className="group space-y-1.5">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button onClick={() => remove(img)} className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 text-xs text-red-600 opacity-0 shadow group-hover:opacity-100">✕</button>
              </div>
              <div className="text-xs text-zinc-600">
                <div className="font-medium">{[img.brand, img.model].filter(Boolean).join(" ") || "—"}</div>
                <div className="text-zinc-400">{img.device_type ? DEVICE_TYPE_LABEL[img.device_type] : ""}</div>
              </div>
            </div>
          ))}
          {shown.length === 0 && <p className="col-span-full text-sm text-zinc-400">Aucune image.</p>}
        </div>
      </Card>
    </div>
  );
}
