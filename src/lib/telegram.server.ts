// Server-only Telegram alerts. Uses a direct BotFather bot when its token is set,
// otherwise the connector gateway. Never throws: failures are logged (tokens redacted)
// so order/towing saves are never blocked.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

type Ctx = { headers: Record<string, string>; chatId: string; baseUrl: string; token?: string };

/** Direct bot context; null (with a clear log) when the target chat is unusable. */
function directCtx(tag: string, token: string, chatVar: string): Ctx | null {
  const chatId = process.env[chatVar]?.trim();
  if (!chatId) {
    console.error(`[telegram:${tag}] ${chatVar} is not set; alert NOT delivered.`);
    return null;
  }
  // A bot cannot message itself: the number before ":" in the token is the bot's own ID.
  if (chatId === token.split(":")[0]) {
    console.error(`[telegram:${tag}] ${chatVar} is the bot's own ID, not a group or person chat; alert NOT delivered.`);
    return null;
  }
  return { baseUrl: `https://api.telegram.org/bot${token}`, headers: { "Content-Type": "application/json" }, chatId, token };
}

async function resolveCtx(tag: string): Promise<Ctx | null> {
  const mainToken = process.env["TELEGRAM_BOT_TOKEN"]?.trim() ?? "";
  if (tag === "towing") {
    // Rescue alerts use the towing bot (or the main bot) and only the towing chat.
    // Never fall back to the store chat: forwarding passports there would break separation.
    const towingToken = process.env["TELEGRAM_TOWING_BOT_TOKEN"]?.trim() || mainToken;
    if (towingToken) return directCtx(tag, towingToken, "TELEGRAM_TOWING_CHAT_ID");
  } else if (mainToken) {
    return directCtx(tag, mainToken, "TELEGRAM_CHAT_ID");
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

const redact = (s: string, ctx: Ctx) => (ctx.token ? s.split(ctx.token).join("***") : s);

async function call(tag: string, ctx: Ctx, method: string, body: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(`${ctx.baseUrl}/${method}`, { method: "POST", headers: ctx.headers, body: JSON.stringify({ chat_id: ctx.chatId, ...body }) });
    const txt = redact(await res.text(), ctx);
    if (!res.ok) { console.error(`[telegram:${tag}] ${method} failed [${res.status}]: ${txt}`); return false; }
    const j = JSON.parse(txt) as { ok?: boolean; description?: string };
    if (j.ok === false) { console.error(`[telegram:${tag}] ${method} rejected: ${j.description}`); return false; }
    console.log(`[telegram:${tag}] ${method} delivered`);
    return true;
  } catch (e) {
    console.error(`[telegram:${tag}] ${method} network error`, redact(String(e), ctx));
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
