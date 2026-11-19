import { z } from "zod";

export const TOWING_STATUSES = ["new", "dispatched", "completed", "cancelled"] as const;
export const TOWING_MAX_PHOTOS = 5;
export const TOWING_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const TOWING_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const TOWING_PER_PHONE_PER_HOUR = 5;
export const TOWING_GLOBAL_PER_HOUR = 40;
export const TOWING_MAX_VEHICLES = 30;
export const RESCUE_PHONE = "+66 97 009 8182";
export const RATE_LIMIT_MESSAGE = `You have sent several requests recently. If this is an urgent roadside emergency, please call or WhatsApp us directly at ${RESCUE_PHONE}.`;

export const cleanPassport = (v: string) => v.replace(/[^a-z0-9]/gi, "").toUpperCase();
export const phoneDigits = (v: string) => v.replace(/\D/g, "");

const MAPS_HOSTS = ["maps.app.goo.gl", "goo.gl", "google.com", "www.google.com", "maps.google.com"];
export function isMapsLink(v: string): boolean {
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    if (h === "goo.gl") return u.pathname.startsWith("/maps");
    if (h === "google.com" || h === "www.google.com") return u.pathname.startsWith("/maps");
    return MAPS_HOSTS.includes(h) || /^(www\.)?google\.[a-z.]+$/.test(h) && u.pathname.startsWith("/maps");
  } catch { return false; }
}

const req = (msg: string, max: number) => z.string().trim().min(1, msg).max(max);

export const TowingRequest = z.object({
  rider_type: z.enum(["thai", "foreign"]),
  nationality: z.string().trim().max(60).optional().default(""),
  passport_number: z.string().max(30).optional().default("").transform(cleanPassport),
  name: req("Please enter your name.", 120),
  phone: req("Please enter your phone number.", 30).refine(
    (v) => /^\+?[\d\s().-]+$/.test(v) && phoneDigits(v).length >= 6 && phoneDigits(v).length <= 15,
    "Please enter a valid phone number (6–15 digits).",
  ),
  plate_number: req("Please enter the plate number.", 20),
  motorcycle_model: req("Please enter the motorcycle model.", 80),
  /** Motorcycles 2..N; motorcycle 1 stays in plate_number / motorcycle_model. */
  extra_vehicles: z.array(z.object({
    plate_number: req("Please enter the plate number.", 20),
    motorcycle_model: req("Please enter the motorcycle model.", 80),
  })).max(TOWING_MAX_VEHICLES - 1, `Up to ${TOWING_MAX_VEHICLES} motorcycles per request.`).optional().default([]),
  urgency: z.enum(["urgent", "not_urgent"], { message: "Please choose the urgency." }),
  rider_transport: z.enum(["with_pickup", "own_transport"], { message: "Please choose how the rider travels." }),
  pickup_region: req("Please select your breakdown region.", 60),
  pickup_town: req("Please select your town.", 80),
  breakdown_location: z.string().trim().min(3, "Describe the exact spot (landmark / KM marker).").max(300),
  maps_link: z.string().trim().max(500).optional().default("").refine((v) => !v || isMapsLink(v), "Paste a Google Maps link (maps.app.goo.gl or google.com/maps)."),
  pickup_lat: z.number().min(-90).max(90).nullable(),
  pickup_lng: z.number().min(-180).max(180).nullable(),
  destination_region: req("Please select the destination region.", 60),
  destination_town: req("Please select the destination town.", 80),
  destination: z.string().trim().min(3, "Please enter the destination address.").max(300),
}).superRefine((d, ctx) => {
  if (d.rider_type !== "foreign") return;
  if (!d.nationality) ctx.addIssue({ code: "custom", path: ["nationality"], message: "Nationality is required for foreign riders." });
  if (d.passport_number.length < 5) ctx.addIssue({ code: "custom", path: ["passport_number"], message: "Passport number is required for foreign riders." });
});
export type TowingInput = z.input<typeof TowingRequest>;
export type TowingData = z.output<typeof TowingRequest>;

export function towingErrors(input: unknown): Record<string, string> {
  const r = TowingRequest.safeParse(input);
  const out: Record<string, string> = {};
  if (!r.success) for (const i of r.error.issues) { const k = i.path[0] === "extra_vehicles" && i.path.length >= 3 ? i.path.join(".") : String(i.path[0]); out[k] ??= i.message; }
  return out;
}

export function photoError(f: { type: string; size: number }): string | null {
  if (!TOWING_PHOTO_TYPES.includes(f.type)) return "Photos must be JPG, PNG or WEBP.";
  if (f.size > TOWING_PHOTO_MAX_BYTES) return "Each photo must be under 5 MB.";
  return null;
}

/** Rate-limit decision from counts in the last hour. */
export function rateLimited(phoneCount: number, globalCount: number): boolean {
  return phoneCount >= TOWING_PER_PHONE_PER_HOUR || globalCount >= TOWING_GLOBAL_PER_HOUR;
}

export const URGENCY_LABEL = { urgent: "URGENT", not_urgent: "Not urgent" } as const;
export const TRANSPORT_LABEL = { with_pickup: "Rider rides with pick-up", own_transport: "Rider arranges own transport" } as const;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function allVehicles(d: Pick<TowingData, "plate_number" | "motorcycle_model" | "extra_vehicles">) {
  return [{ plate_number: d.plate_number, motorcycle_model: d.motorcycle_model }, ...(d.extra_vehicles ?? [])];
}

export function towingAlert(d: TowingData, reference: string, time: string, photoUrls: string[]): string {
  const tel = d.phone.replace(/[^\d+]/g, "");
  const coords = d.pickup_lat != null && d.pickup_lng != null ? `https://maps.google.com/?q=${d.pickup_lat},${d.pickup_lng}` : "";
  const lines = [
    `🚨 <b>TOWING &amp; RESCUE ${esc(reference)}</b>${d.urgency === "urgent" ? " · ‼️ <b>URGENT</b>" : " · Not urgent"}`,
    "",
    `👤 Rider: ${esc(d.name)} (${d.rider_type === "foreign" ? "Foreign rider" : "Thai local"})`,
    ...(d.rider_type === "foreign" ? [`🌐 Nationality: ${esc(d.nationality)}`, `🛂 Passport: <code>${esc(d.passport_number)}</code>`] : []),
    `📞 Phone: <a href="tel:${esc(tel)}">${esc(d.phone)}</a>${tel ? ` · <a href="https://wa.me/${esc(tel.replace("+", ""))}">WhatsApp</a>` : ""}`,
    ...(() => {
      const v = allVehicles(d);
      if (v.length === 1) return [`🏍️ ${esc(d.motorcycle_model)} (Plate: ${esc(d.plate_number)})`];
      return [`🏍️ <b>Motorcycles: ${v.length}</b>`, ...v.map((m, i) => `   ${i + 1}. ${esc(m.motorcycle_model)} [${esc(m.plate_number)}]`)];
    })(),
    `🧍 ${TRANSPORT_LABEL[d.rider_transport]}`,
    "",
    `📍 From: ${esc(d.pickup_town)}, ${esc(d.pickup_region)}`,
    `   ${esc(d.breakdown_location)}`,
    ...(d.maps_link ? [`   🗺️ Maps link: ${esc(d.maps_link)}`] : []),
    ...(coords ? [`   📍 GPS pin: ${coords}`] : []),
    `🏁 To: ${esc(d.destination_town)}, ${esc(d.destination_region)}`,
    `   ${esc(d.destination)}`,
    ...(photoUrls.length ? ["", `📷 Photos: ${photoUrls.map((u, i) => `<a href="${esc(u)}">${i + 1}</a>`).join(" · ")}`] : []),
    "",
    `⏰ ${esc(time)} (UTC+8)`,
  ];
  return lines.join("\n");
}
