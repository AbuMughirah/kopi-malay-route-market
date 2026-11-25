import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";
import { PolicyBlocks, usePolicy } from "@/lib/i18n/policy-render";
import { SHIPPING } from "@/lib/i18n/policy-shipping";

export const Route = createFileRoute("/shipping-returns")({ staticData: { sitemap: true },
  head: () => legalHead("/shipping-returns", "Shipping & Returns", "Shipping rates from Tak to Malaysia and Thailand, tumbler weight fees, East Malaysia surcharge and returns."),
  component: ShippingReturns,
});

function ShippingReturns() {
  const doc = usePolicy(SHIPPING);
  return <LegalPage title={doc.title}><PolicyBlocks blocks={doc.blocks} /></LegalPage>;
}
