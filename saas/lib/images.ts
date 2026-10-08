import { createClient } from "@/lib/supabase/client";

export const BUCKET = "device-images";

// Uploads under "<user id>/<folder>/..." — the storage policy only lets a user
// write inside their own folder.
export async function uploadImage(file: File, folder: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function deleteImage(path: string) {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

// Storage path from one of our public URLs, or null for external links (Drive...).
export function pathFromUrl(url: string) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}
