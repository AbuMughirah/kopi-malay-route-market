import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";
import { rich, usePolicy } from "@/lib/i18n/policy-render";
import { FAQ } from "@/lib/i18n/policy-legal";

export const Route = createFileRoute("/faq")({ staticData: { sitemap: true },
  head: () => legalHead("/faq", "FAQ", "Answers about ordering, shipping to Malaysia and Thailand, QR payments, sticker bundles and Towing & Rescue."),
  component: Faq,
});

function Faq() {
  const doc = usePolicy(FAQ);
  return (
    <LegalPage title={doc.title}>
      <div className="divide-y divide-border border-y border-border">
        {doc.items.map((f, i) => (
          <details key={i} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-semibold text-foreground">
              {f.q}
              <span className="text-xl transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-3 text-foreground/80">{rich(f.a)}</p>
          </details>
        ))}
      </div>
    </LegalPage>
  );
}
