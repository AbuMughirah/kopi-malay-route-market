// Server-only Telegram text alert via the connector gateway.
// Never throws: failures are logged with full detail so order/towing saves are never blocked.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

type Ctx = { headers: Record<string, string>; chatId: string; baseUrl: string; direct?: boolean };

async function resolveCtx(tag: string): Promise<Ctx | null> {
  // A separately configured bot is used only for rescue notifications.
  // Never fall back after a delivery error: it may already have delivered,
  // and forwarding passports to the store chat would break separation.
  // Sapey bot (direct token) handles every alert when configured; chats stay separate.
  const sapey = process.env["TELEGRAM_SAPEY_BOT_TOKEN"]?.trim();
  if (sapey && tag !== "towing") {
    const chatId = process.env["TELEGRAM_CHAT_ID"]?.trim();
    if (!chatId) {
      console.error(`[telegram:${tag}] Store chat is not configured; alert NOT delivered.`);
      return null;
    }
    return { baseUrl: `https://api.telegram.org/bot${sapey}`, headers: { "Content-Type": "application/json" }, chatId, direct: true };
  }
  const towingToken = tag === "towing" ? (sapey || process.env["TELEGRAM_TOWING_BOT_TOKEN"]?.trim()) : "";
  if (towingToken) {
    const chatId = process.env["TELEGRAM_TOWING_CHAT_ID"]?.trim();
    if (!chatId) {
      console.error("[telegram:towing] Dedicated bot chat is not configured; alert NOT delivered.");
      return null;
    }
    return { baseUrl: `https://api.telegram.org/bot${towingToken}`, headers: { "Content-Type": "application/json" }, chatId, direct: true };
  }
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const tgKey = process.env["TELEGRAM_API_KEY"];
  if (!lovableKey || !tgKey) {
    console.error(`[telegram:${tag}] Not configured (LOVABLE_API_KEY=${!!lovableKey}, TELEGRAM_API_KEY=${!!tgKey})`);
    return null;
  }
  const headers = { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": tgKey, "Content-Type": "application/json" };
  // Towing alerts go to their own chat when configured, else fall back to the store chat.
  const towingChat = tag === "towing" ? process.env["TELEGRAM_TOWING_CHAT_ID"]?.trim() : "";
  if (towingChat) return { headers, chatId: towingChat, baseUrl: GATEWAY_URL };
  const envChat = process.env["TELEGRAM_CHAT_ID"]?.trim();
  if (envChat) return { headers, chatId: envChat, baseUrl: GATEWAY_URL };
  // Fallback: Telegram keeps updates only ~24h, so set TELEGRAM_CHAT_ID for reliability.
  const r = await fetch(`${GATEWAY_URL}/getUpdates`, { method: "POST", headers, body: "{}" });
  if (!r.ok) {
    console.error(`[telegram:${tag}] getUpdates failed [${r.status}]: ${await r.text()}`);
    return null;
  }
  const j = (await r.json()) as { result?: { message?: { chat?: { id: number } }; my_chat_member?: { chat?: { id: number } } }[] };
  const last = [...(j.result ?? [])].reverse().find((u) => u.message?.chat?.id ?? u.my_chat_member?.chat?.id);
  const id = last?.message?.chat?.id ?? last?.my_chat_member?.chat?.id;
  if (!id) {
    console.error(`[telegram:${tag}] No TELEGRAM_CHAT_ID set and no recent chat with the bot — alert NOT delivered. Message the bot, then save its chat ID.`);
    return null;
  }
  return { headers, chatId: String(id), baseUrl: GATEWAY_URL };
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
