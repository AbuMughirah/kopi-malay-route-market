import { Fragment, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/hooks/use-i18n";
import type { Lang } from "@/lib/i18n/dictionary";
import { OFFICE_PHONE, OFFICE_TEL_URL, SUPPORT_WHATSAPP_PHONE, SUPPORT_WHATSAPP_URL } from "@/lib/whatsapp";

export type Block = { h: string } | { p: string } | { ul: (string | { text: string; sub: string[] })[] } | { address: string[] };
export type PolicyDoc = { title: string; blocks: Block[] };

const link = "font-medium text-foreground underline underline-offset-4";

/** Inline tokens: **bold**, {wa}, {office}, and [label](/path) for internal pages. */
export function rich(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\{wa\}|\{office\}|\[[^\]]+\]\(\/[a-z-]+\))/g);
  return parts.map((s, i) => {
    if (s.startsWith("**")) return <strong key={i}>{s.slice(2, -2)}</strong>;
    if (s === "{wa}") return <a key={i} href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={link}>{SUPPORT_WHATSAPP_PHONE}</a>;
    if (s === "{office}") return <a key={i} href={OFFICE_TEL_URL} className={link}>{OFFICE_PHONE}</a>;
    const m = /^\[([^\]]+)\]\((\/[a-z-]+)\)$/.exec(s);
    if (m) return <Link key={i} to={m[2] as "/"} className={link}>{m[1]}</Link>;
    return <Fragment key={i}>{s}</Fragment>;
  });
}

export function PolicyBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if ("h" in b) return <h2 key={i}>{b.h}</h2>;
        if ("p" in b) return <p key={i}>{rich(b.p)}</p>;
        if ("address" in b) return <address key={i} className="not-italic font-medium text-foreground">{b.address.map((l, j) => <Fragment key={j}>{l}<br /></Fragment>)}</address>;
        return (
          <ul key={i}>
            {b.ul.map((it, j) => typeof it === "string" ? <li key={j}>{rich(it)}</li> : (
              <li key={j}>{rich(it.text)}<ul className="mt-1">{it.sub.map((s, k) => <li key={k}>{rich(s)}</li>)}</ul></li>
            ))}
          </ul>
        );
      })}
    </>
  );
}

export function usePolicy<T>(docs: Record<Lang, T>): T {
  const { lang } = useI18n();
  return docs[lang] ?? docs.en;
}

export const UPDATED_LABEL: Record<Lang, string> = { en: "Last updated", ms: "Kemas kini terakhir", th: "อัปเดตล่าสุด" };
