import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendTelegram } from "../lib/telegram.server";

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
  it("keeps store orders on the original gateway and chat", async () => {
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