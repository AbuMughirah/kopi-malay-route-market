import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";
import { PolicyBlocks, usePolicy } from "@/lib/i18n/policy-render";
import { REFUND } from "@/lib/i18n/policy-refund";

export const Route = createFileRoute("/refund-policy")({ staticData: { sitemap: true },
  head: () => legalHead("/refund-policy", "Refund, Return & Exchange Policy", "How Kopi Malay handles QR payment verification, cancellations, exchanges, damaged items and bank refunds."),
  component: RefundPolicy,
});

function RefundPolicy() {
  const doc = usePolicy(REFUND);
  return <LegalPage title={doc.title} updated="17 November 2026"><PolicyBlocks blocks={doc.blocks} /></LegalPage>;
}
