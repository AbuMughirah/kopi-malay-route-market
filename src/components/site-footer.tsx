import { Link } from "@tanstack/react-router";

import { Phone } from "lucide-react";
import { OFFICE_PHONE, OFFICE_TEL_URL, SUPPORT_WHATSAPP_PHONE, SUPPORT_WHATSAPP_URL as WHATSAPP_URL } from "@/lib/whatsapp";
import route1 from "@/assets/tak-route-1-badge.png.asset.json";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { useT } from "@/i18n/provider";
import type { Key } from "@/i18n/dictionary";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M16.6 3c.4 2.2 1.8 3.6 4 3.8v3.1c-1.5 0-2.9-.4-4-1.2v6.1c0 3.3-2.6 5.7-5.8 5.7S5 18.1 5 15c0-3.3 2.9-5.8 6.3-5.3v3.2c-1.6-.4-3.1.7-3.1 2.2 0 1.3 1.1 2.4 2.5 2.4 1.5 0 2.6-1 2.6-2.8V3h3.3z" />
    </svg>
  );
}

const legal = [
  { to: "/privacy", label: "Privacy Policy", key: "footer.privacy" as Key },
  { to: "/accessibility", label: "Accessibility Statement", key: "footer.access" as Key },
  { to: "/terms", label: "Terms & Conditions", key: "footer.terms" as Key },
  { to: "/refund-policy", label: "Refund Policy", key: "footer.refund" as Key },
  { to: "/shipping-returns", label: "Shipping & Returns", key: "footer.shipping" as Key },
  { to: "/faq", label: "FAQ", key: "footer.faq" as Key },
  { to: "/contact", label: "Contact Us", key: "nav.contact" as Key },
  { to: "/track", label: "Track Your Order", key: "nav.track" as Key },
] as const;

const socials = [
  { href: "https://www.facebook.com/kopimalay22/", label: "Facebook", Icon: FacebookIcon },
  { href: "https://www.instagram.com/kopimalay", label: "Instagram", Icon: InstagramIcon },
  { href: "https://www.tiktok.com/@kopi.malay", label: "TikTok", Icon: TikTokIcon },
];

const heading = "mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-foreground";
const iconBtn =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-foreground/30 text-foreground transition-colors hover:bg-foreground hover:text-background";

export function SiteFooter() {
  const { t } = useT();
  return (
    <footer className="no-print border-t bg-background text-foreground">
      <div className="flex flex-col items-center px-4 pt-12 text-center">
        <button type="button" aria-label={t("footer.top")} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="transition-transform hover:-translate-y-1">
          <img src={route1.url} alt="Tak Route 1" className="size-36 object-contain md:size-44" loading="lazy" />
        </button>
        <p className="mt-4 font-display text-sm font-bold uppercase tracking-[0.25em] md:text-base">{t("footer.tagline")}</p>
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 text-sm text-muted-foreground md:grid-cols-3">
        <nav aria-label="Legal">
          <h2 className={heading}>{t("footer.legal")}</h2>
          <ul className="space-y-2">
            {legal.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-foreground hover:underline">{t(l.key)}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className={heading}>{t("footer.social")}</h2>
          <div className="flex gap-3">
            {socials.map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Kopi Malay on ${label}`} className={iconBtn}>
                <Icon />
              </a>
            ))}
          </div>
        </div>
        <address className="not-italic">
          <h2 className={heading}>{t("footer.contact")}</h2>
          <p className="font-semibold text-foreground">Kopi Malay</p>
          <p className="mt-1">3, 13 Chomphon, Tambon Rahaeng,<br />Mueang Tak District, Tak 63000</p>
          <a href={OFFICE_TEL_URL} aria-label="Call Kopi Malay office" className="mt-4 flex items-center gap-3 hover:text-foreground">
            <span className={iconBtn}><Phone className="size-5" /></span>
            <span>{OFFICE_PHONE} <span className="text-xs">({t("footer.office")})</span></span>
          </a>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="Chat with Kopi Malay on WhatsApp" className="mt-3 flex items-center gap-3 hover:text-foreground">
            <span className={iconBtn}><WhatsAppIcon /></span>
            <span>{SUPPORT_WHATSAPP_PHONE}</span>
          </a>
        </address>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Kopi Malay. CRAFTED WITH CARE, MADE TO PERFECTION.
        </p>
      </div>
    </footer>
  );
}
