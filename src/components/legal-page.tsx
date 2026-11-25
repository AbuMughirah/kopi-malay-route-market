import type { ReactNode } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { UPDATED_LABEL } from "@/lib/i18n/policy-render";

export function legalHead(path: string, title: string, description: string) {
  const full = `${title} — Kopi Malay Route 1`;
  const url = `https://kopimalay.shop${path}`;
  return {
    meta: [
      { title: full },
      { name: "description", content: description },
      { property: "og:title", content: full },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function LegalPage({ title, updated = "9 November 2026", children }: { title: string; updated?: string; children: ReactNode }) {
  const { lang } = useI18n();
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <h1 className="break-words font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{UPDATED_LABEL[lang]}: {updated}</p>
      <div className="mt-8 space-y-6 break-words leading-relaxed text-foreground/85 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
        {children}
      </div>
    </article>
  );
}
