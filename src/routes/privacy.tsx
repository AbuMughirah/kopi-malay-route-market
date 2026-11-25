import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";
import { PolicyBlocks, usePolicy } from "@/lib/i18n/policy-render";
import { PRIVACY } from "@/lib/i18n/policy-legal";

export const Route = createFileRoute("/privacy")({ staticData: { sitemap: true },
  head: () => legalHead("/privacy", "Privacy Policy", "How Kopi Malay collects, uses and protects customer, guest-order and towing request information."),
  component: Privacy,
});

function Privacy() {
  const doc = usePolicy(PRIVACY);
  return <LegalPage title={doc.title}><PolicyBlocks blocks={doc.blocks} /></LegalPage>;
}
