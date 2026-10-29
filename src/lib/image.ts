import { api } from "./api";

// Reduz a foto no navegador antes de enviar (o Render guarda no banco).
export async function compressImage(file: File, maxSize = 1400, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function uploadImage(file: File): Promise<string> {
  const dataUrl = await compressImage(file);
  const { url } = await api<{ url: string }>("/images", { method: "POST", body: { dataUrl } });
  return url;
}
