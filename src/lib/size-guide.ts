// Apparel size chart (S–5XL). Values copied exactly from the client's official chart.
// XS is intentionally omitted because the store does not stock it.
export type SizeRow = { size: string; chestCm: number; chestIn: number; lengthCm: number; lengthIn: number };

export const SIZE_GUIDE: readonly SizeRow[] = [
  { size: "S", chestCm: 96.5, chestIn: 38, lengthCm: 68.6, lengthIn: 27 },
  { size: "M", chestCm: 101.6, chestIn: 40, lengthCm: 71.1, lengthIn: 28 },
  { size: "L", chestCm: 106.7, chestIn: 42, lengthCm: 73.7, lengthIn: 29 },
  { size: "XL", chestCm: 111.8, chestIn: 44, lengthCm: 76.2, lengthIn: 30 },
  { size: "2XL", chestCm: 116.8, chestIn: 46, lengthCm: 78.7, lengthIn: 31 },
  { size: "3XL", chestCm: 121.9, chestIn: 48, lengthCm: 81.3, lengthIn: 32 },
  { size: "4XL", chestCm: 127, chestIn: 50, lengthCm: 83.8, lengthIn: 33 },
  { size: "5XL", chestCm: 132.1, chestIn: 52, lengthCm: 86.4, lengthIn: 34 },
];

export type SizeUnit = "both" | "cm" | "in";

/** One decimal place, matching the printed chart (e.g. 127.0, 38.0). */
export function formatMeasure(cm: number, inches: number, unit: SizeUnit): string {
  const c = `${cm.toFixed(1)} cm`;
  const i = `${inches.toFixed(1)} in`;
  return unit === "cm" ? c : unit === "in" ? i : `${c} / ${i}`;
}
