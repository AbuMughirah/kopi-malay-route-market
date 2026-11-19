import { createFileRoute } from "@tanstack/react-router";

// Loyverse calls this when counter stock changes. The payload is never trusted:
// we only use it as a signal and re-read stock directly from the Loyverse API.
// Callers must present LOYVERSE_WEBHOOK_SECRET as `?token=` (Loyverse webhooks are
// unsigned, so the secret lives in the registered URL); otherwise nothing runs.
export const Route = createFileRoute("/api/public/loyverse-webhook")({ staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["LOYVERSE_WEBHOOK_SECRET"];
        const token = new URL(request.url).searchParams.get("token");
        if (!secret || !token || token !== secret) return new Response("unauthorized", { status: 401 });
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { pullStock } = await import("@/lib/loyverse.server");
          await pullStock(supabaseAdmin);
          return new Response("ok");
        } catch (e) {
          console.error("Loyverse sync failed", e);
          return new Response("sync failed", { status: 500 });
        }
      },
    },
  },
});
