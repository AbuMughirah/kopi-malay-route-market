import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendTelegram, sendTelegramWithPhotos } from "../lib/telegram.server";

const fetchMock = vi.fn();
function firstCall() {
  const call = fetchMock.mock.calls[0];
  if (!call) throw new Error("Expected a Telegram request");
  return call;
}
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset().mockResolvedValue(new Response('{"ok":true}'));
  vi.stubEnv("LOVABLE_API_KEY", "test-gateway-key");
  vi.stubEnv("TELEGRAM_API_KEY", "test-store-key");
  vi.stubEnv("TELEGRAM_CHAT_ID", "store-chat");
  vi.stubEnv("TELEGRAM_TOWING_BOT_TOKEN", "test-rescue-token");
  vi.stubEnv("TELEGRAM_TOWING_CHAT_ID", "rescue-chat");
  vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("Telegram bot separation", () => {
  it("sends towing only through the dedicated bot and chat", async () => {
    expect(await sendTelegram("Rescue test", "towing")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = firstCall();
    expect(url).toBe("https://api.telegram.org/bottest-rescue-token/sendMessage");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(init.body).chat_id).toBe("rescue-chat");
  });
  it("keeps store orders on the gateway when no store bot token is set", async () => {
    await sendTelegram("Order test", "order");
    const [url, init] = firstCall();
    expect(url).toBe("https://connector-gateway.lovable.dev/telegram/sendMessage");
    expect(init.headers["X-Connection-Api-Key"]).toBe("test-store-key");
    expect(JSON.parse(init.body).chat_id).toBe("store-chat");
  });
  it("retains the gateway fallback when no dedicated bot is configured", async () => {
    vi.stubEnv("TELEGRAM_TOWING_BOT_TOKEN", "");
    await sendTelegram("Rescue test", "towing");
    const [url, init] = firstCall();
    expect(url).toBe("https://connector-gateway.lovable.dev/telegram/sendMessage");
    expect(JSON.parse(init.body).chat_id).toBe("rescue-chat");
  });
  it("never sends to store staff when the dedicated chat is missing", async () => {
    vi.stubEnv("TELEGRAM_TOWING_CHAT_ID", "");
    expect(await sendTelegram("Rescue test", "towing")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("does not retry through the store bot after a dedicated failure", async () => {
    fetchMock.mockResolvedValue(new Response('{"ok":false}', { status: 403 }));
    expect(await sendTelegram("Rescue test", "towing")).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("does not leak token-bearing network errors", async () => {
    fetchMock.mockRejectedValue(new Error("https://api.telegram.org/bottest-rescue-token/sendMessage"));
    expect(await sendTelegram("Rescue test", "towing")).toBe(false);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("test-rescue-token");
  });
});
describe("Direct store bot (TELEGRAM_BOT_TOKEN)", () => {
  beforeEach(() => { vi.stubEnv("TELEGRAM_BOT_TOKEN", "111:store-token"); });
  it("sends order alerts through the store bot to the store chat", async () => {
    expect(await sendTelegram("Order test", "order")).toBe(true);
    const [url, init] = firstCall();
    expect(url).toBe("https://api.telegram.org/bot111:store-token/sendMessage");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(init.body).chat_id).toBe("store-chat");
  });
  it("keeps towing on the towing bot and towing chat", async () => {
    await sendTelegram("Rescue test", "towing");
    const [url, init] = firstCall();
    expect(url).toBe("https://api.telegram.org/bottest-rescue-token/sendMessage");
    expect(JSON.parse(init.body).chat_id).toBe("rescue-chat");
  });
  it("uses the store bot for towing when no towing bot is set, still only to the towing chat", async () => {
    vi.stubEnv("TELEGRAM_TOWING_BOT_TOKEN", "");
    await sendTelegram("Rescue test", "towing");
    const [url, init] = firstCall();
    expect(url).toBe("https://api.telegram.org/bot111:store-token/sendMessage");
    expect(JSON.parse(init.body).chat_id).toBe("rescue-chat");
  });
  it("does not fall back to the gateway when the store chat is missing", async () => {
    vi.stubEnv("TELEGRAM_CHAT_ID", "");
    expect(await sendTelegram("Order test", "order")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("refuses a chat ID that is the bot's own ID", async () => {
    vi.stubEnv("TELEGRAM_CHAT_ID", "111");
    expect(await sendTelegram("Order test", "order")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("redacts the token from logged errors", async () => {
    fetchMock.mockRejectedValue(new Error("https://api.telegram.org/bot111:store-token/sendMessage"));
    expect(await sendTelegram("Order test", "order")).toBe(false);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("store-token");
  });
});
describe("Towing photo hybrid delivery", () => {
  const methods = () => fetchMock.mock.calls.map((c) => String(c[0]).split("/").pop());
  it("sends a single photo with the alert as caption", async () => {
    expect(await sendTelegramWithPhotos("Short alert", "towing", ["https://x/1.jpg"])).toBe(true);
    expect(methods()).toEqual(["sendPhoto"]);
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).caption).toBe("Short alert");
  });
  it("sends an album with caption on the first photo", async () => {
    await sendTelegramWithPhotos("Short alert", "towing", ["https://x/1.jpg", "https://x/2.jpg"]);
    expect(methods()).toEqual(["sendMediaGroup"]);
    const media = JSON.parse(fetchMock.mock.calls[0]![1].body).media;
    expect(media[0].caption).toBe("Short alert");
    expect(media[1].caption).toBeUndefined();
  });
  it("sends text first then photos when alert exceeds 1000 characters", async () => {
    await sendTelegramWithPhotos("a".repeat(1001), "towing", ["https://x/1.jpg", "https://x/2.jpg"]);
    expect(methods()).toEqual(["sendMessage", "sendMediaGroup"]);
  });
  it("falls back to the text alert when photo delivery fails", async () => {
    fetchMock.mockResolvedValueOnce(new Response("bad", { status: 400 }));
    expect(await sendTelegramWithPhotos("Short alert", "towing", ["https://x/1.jpg"])).toBe(true);
    expect(methods()).toEqual(["sendPhoto", "sendMessage"]);
  });
  it("uses a plain message with no photos", async () => {
    await sendTelegramWithPhotos("Short alert", "towing", []);
    expect(methods()).toEqual(["sendMessage"]);
  });
});
