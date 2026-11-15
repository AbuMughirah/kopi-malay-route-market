import { createServerFn } from "@tanstack/react-start";
import { TowingRequest, TOWING_MAX_PHOTOS, photoError, phoneDigits, rateLimited, RATE_LIMIT_MESSAGE, towingAlert } from "./towing";

export const submitTowingRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    if (!(d instanceof FormData)) throw new Error("Invalid form");
    const honeypot = String(d.get("website_hp") ?? "");
    const photos = d.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
    if (photos.length > TOWING_MAX_PHOTOS) throw new Error(`Up to ${TOWING_MAX_PHOTOS} photos only.`);
    for (const p of photos) { const e = photoError(p); if (e) throw new Error(e); }
    const payload = TowingRequest.parse(JSON.parse(String(d.get("payload") ?? "{}")));
    return { ...payload, photos, honeypot };
  })
  .handler(async ({ data }) => {
    const { photos, honeypot, ...d } = data;
    // Bots fill the hidden field: pretend success, save nothing.
    if (honeypot) return { rateLimited: false as const, reference: `TW-${Math.floor(10000 + Math.random() * 90000)}`, photosSaved: 0, photosSent: 0 };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendTelegram } = await import("./telegram.server");
    const digits = phoneDigits(d.phone);
    const since = new Date(Date.now() - 3600_000).toISOString();
    const [byPhone, all] = await Promise.all([
      supabaseAdmin.from("towing_requests").select("id", { count: "exact", head: true }).eq("phone_digits", digits).gte("created_at", since),
      supabaseAdmin.from("towing_requests").select("id", { count: "exact", head: true }).gte("created_at", since),
    ]);
    if (rateLimited(byPhone.count ?? 0, all.count ?? 0)) return { rateLimited: true as const, message: RATE_LIMIT_MESSAGE };

    const foreign = d.rider_type === "foreign";
    let reference = "";
    let id = "";
    for (let i = 0; i < 5; i++) {
      reference = `TW-${Math.floor(10000 + Math.random() * 90000)}`;
      const { data: row, error } = await supabaseAdmin.from("towing_requests").insert({
        reference, name: d.name, phone: d.phone, phone_digits: digits, plate_number: d.plate_number, motorcycle_model: d.motorcycle_model,
        rider_type: d.rider_type, nationality: foreign ? d.nationality : null, passport_number: foreign ? d.passport_number : null,
        urgency: d.urgency, rider_transport: d.rider_transport,
        pickup_region: d.pickup_region, pickup_town: d.pickup_town, breakdown_location: d.breakdown_location, maps_link: d.maps_link || null,
        pickup_lat: d.pickup_lat, pickup_lng: d.pickup_lng,
        destination_region: d.destination_region, destination_town: d.destination_town, destination: d.destination,
      }).select("id").single();
      if (row) { id = row.id; break; }
      if (error?.code !== "23505" || i === 4) throw new Error(`Could not save your request. Please call us directly at ${"+66 97 009 8182"}.`);
    }
    const paths: string[] = [];
    for (const [i, p] of photos.entries()) {
      const ext = p.type === "image/png" ? "png" : p.type === "image/webp" ? "webp" : "jpg";
      const path = `towing/${reference}/${i + 1}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabaseAdmin.storage.from("payment-receipts").upload(path, new Uint8Array(await p.arrayBuffer()), { contentType: p.type });
      if (error) console.error("[towing] photo upload failed", error.message); else paths.push(path);
    }
    let urls: string[] = [];
    if (paths.length) {
      await supabaseAdmin.from("towing_requests").update({ photo_paths: paths }).eq("id", id);
      urls = ((await supabaseAdmin.storage.from("payment-receipts").createSignedUrls(paths, 60 * 60 * 24 * 7)).data ?? []).map((s) => s.signedUrl).filter(Boolean) as string[];
    }
    const time = new Date().toLocaleString("en-GB", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "short", timeStyle: "short" });
    await sendTelegram(towingAlert(d, reference, time, urls), "towing");
    return { rateLimited: false as const, reference, photosSaved: paths.length, photosSent: photos.length };
  });
