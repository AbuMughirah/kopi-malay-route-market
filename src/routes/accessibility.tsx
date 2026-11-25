import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";
import { PolicyBlocks, usePolicy } from "@/lib/i18n/policy-render";
import { ACCESSIBILITY } from "@/lib/i18n/policy-legal";

export const Route = createFileRoute("/accessibility")({ staticData: { sitemap: true },
  head: () => legalHead("/accessibility", "Accessibility Statement", "Kopi Malay's commitment to an accessible, mobile-first shop for every rider and shopper."),
  component: Accessibility,
});

function Accessibility() {
  const doc = usePolicy(ACCESSIBILITY);
  return <LegalPage title={doc.title}><PolicyBlocks blocks={doc.blocks} /></LegalPage>;
}
