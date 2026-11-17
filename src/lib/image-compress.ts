/** Browser-only image shrinking before upload. Never blocks: any failure returns the original file. */
export type CompressOptions = { maxSize?: number; quality?: number; skipBelowBytes?: number; keepPng?: boolean };

const DEFAULTS = { maxSize: 1600, quality: 0.82, skipBelowBytes: 150 * 1024, keepPng: false };

/** Pure decision: PDFs, non-images, tiny files and (optionally) PNGs are left untouched. */
export function shouldCompress(file: { type: string; size: number }, opts: CompressOptions = {}): boolean {
  const o = { ...DEFAULTS, ...opts };
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return false;
  if (o.keepPng && file.type === "image/png") return false;
  return file.size >= o.skipBelowBytes;
}

export function scaledSize(width: number, height: number, maxSize: number): { width: number; height: number } {
  const scale = Math.min(1, maxSize / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const o = { ...DEFAULTS, ...opts };
  if (!shouldCompress(file, o)) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const { width, height } = scaledSize(bmp.width, bmp.height, o.maxSize);
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff"; // transparent areas become white, not black, in JPEG
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bmp, 0, 0, width, height);
    bmp.close?.();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", o.quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
