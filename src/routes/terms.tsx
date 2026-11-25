import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";
import { PolicyBlocks, usePolicy } from "@/lib/i18n/policy-render";
import { TERMS } from "@/lib/i18n/policy-legal";

export const Route = createFileRoute("/terms")({ staticData: { sitemap: true },
  head: () => legalHead("/terms", "Terms & Conditions", "Terms for shopping Kopi Malay Route 1 merchandise, accounts, guest orders, pricing and services."),
  component: Terms,
});

function Terms() {
  const doc = usePolicy(TERMS);
  return <LegalPage title={doc.title}><PolicyBlocks blocks={doc.blocks} /></LegalPage>;
}
