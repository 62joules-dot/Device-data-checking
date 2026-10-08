export type BankImage = {
  id: string;
  brand: string | null;
  model: string | null;
  device_type: string | null;
  url: string;
  path: string;
  source_url?: string | null;
  license?: string | null;
};

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

// The device's own photos; otherwise bank images for the same model, then the
// same device type.
export function resolvePhotos(
  device: { brand: string | null; model: string | null; device_type: string | null; photos?: unknown },
  bank: BankImage[]
): { urls: string[]; fromBank: boolean } {
  const own = Array.isArray(device.photos) ? (device.photos as string[]).filter(Boolean) : [];
  if (own.length) return { urls: own, fromBank: false };
  const byModel = bank.filter(
    (b) => b.model && norm(b.model) === norm(device.model) && (!b.brand || norm(b.brand) === norm(device.brand))
  );
  if (byModel.length) return { urls: byModel.map((b) => b.url), fromBank: true };
  const byType = bank.filter((b) => b.device_type && b.device_type === device.device_type && !b.model);
  return { urls: byType.map((b) => b.url), fromBank: byType.length > 0 };
}
