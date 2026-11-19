// Server-only Telegram text alert via the connector gateway.
// Never throws: failures are logged with full detail so order/towing saves are never blocked.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

type Ctx = { headers: Record<string, string>; chatId: string; baseUrl: string; direct?: boolean };

async function resolveCtx(tag: string): Promise<Ctx | null> {
  // All alerts go only to Sapey's two bots: towing → towing bot/chat, everything else → orders bot/chat.
  // Never fall back to any other bot or chat, so alerts never reach the old recipient.
  const towing = tag === "towing";
  const token = process.env[towing ? "SAPEY_TOWING_BOT_TOKEN" : "SAPEY_ORDERS_BOT_TOKEN"]?.trim();
  const chatId = process.env[towing ? "SAPEY_TOWING_CHAT_ID" : "SAPEY_ORDERS_CHAT_ID"]?.trim();
  if (!token || !chatId) {
    console.error(`[telegram:${tag}] Sapey ${towing ? "towing" : "orders"} bot is not configured; alert NOT delivered.`);
    return null;
  }
  return { baseUrl: `https://api.telegram.org/bot${token}`, headers: { "Content-Type": "application/json" }, chatId, direct: true };
}

async function call(tag: string, ctx: Ctx, method: string, body: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(`${ctx.baseUrl}/${method}`, { method: "POST", headers: ctx.headers, body: JSON.stringify({ chat_id: ctx.chatId, ...body }) });
    const txt = await res.text();
    if (!res.ok) { console.error(`[telegram:${tag}] ${method} failed [${res.status}]: ${ctx.direct ? "Dedicated bot delivery failed" : txt}`); return false; }
    const j = JSON.parse(txt) as { ok?: boolean; description?: string };
    if (j.ok === false) { console.error(`[telegram:${tag}] ${method} rejected: ${ctx.direct ? "Dedicated bot delivery rejected" : j.description}`); return false; }
    console.log(`[telegram:${tag}] ${method} delivered`);
    return true;
  } catch (e) {
    console.error(`[telegram:${tag}] ${method} network error`, ctx.direct ? "Dedicated bot connection failed" : e);
    return false;
  }
}

export async function sendTelegram(text: string, tag = "alert", attachment?: { url: string; isPdf: boolean }): Promise<boolean> {
  try {
    const ctx = await resolveCtx(tag);
    if (!ctx) return false;
    const ok = await call(tag, ctx, "sendMessage", { text, parse_mode: "HTML", disable_web_page_preview: true });
    if (attachment?.url) await call(tag, ctx, attachment.isPdf ? "sendDocument" : "sendPhoto", { [attachment.isPdf ? "document" : "photo"]: attachment.url });
    return ok;
  } catch (e) {
    console.error(`[telegram:${tag}] unexpected error`, e);
    return false;
  }
}

/** Caption limit is 1,024; stay under 1,000 raw HTML characters for a safe margin. */
export const CAPTION_SAFE_LIMIT = 1000;

/**
 * Smart hybrid: short alerts ride as the photo/album caption (one forwardable bundle);
 * long alerts go as a text message followed by the photos. If photo delivery fails,
 * the text (which still carries photo links) is sent so the alert is never lost.
 */
export async function sendTelegramWithPhotos(text: string, tag: string, photoUrls: string[]): Promise<boolean> {
  try {
    const ctx = await resolveCtx(tag);
    if (!ctx) return false;
    const urls = photoUrls.slice(0, 10);
    const textMsg = () => call(tag, ctx, "sendMessage", { text, parse_mode: "HTML", disable_web_page_preview: true });
    if (!urls.length) return textMsg();
    const media = (caption?: string) => urls.length === 1
      ? call(tag, ctx, "sendPhoto", { photo: urls[0], ...(caption ? { caption, parse_mode: "HTML" } : {}) })
      : call(tag, ctx, "sendMediaGroup", { media: urls.map((u, i) => ({ type: "photo", media: u, ...(i === 0 && caption ? { caption, parse_mode: "HTML" } : {}) })) });
    if (text.length <= CAPTION_SAFE_LIMIT) {
      if (await media(text)) return true;
      return textMsg();
    }
    const ok = await textMsg();
    if (!(await media())) console.error(`[telegram:${tag}] photos not attached; links remain in the text alert`);
    return ok;
  } catch (e) {
    console.error(`[telegram:${tag}] unexpected error`, e);
    return false;
  }
}

export const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
