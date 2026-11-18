import { createFileRoute } from "@tanstack/react-router";
import { Clock, MapPin, Phone } from "lucide-react";
import shop from "@/assets/header.jpg.asset.json";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { OFFICE_PHONE, OFFICE_TEL_URL, SUPPORT_WHATSAPP_PHONE, SUPPORT_WHATSAPP_URL } from "@/lib/whatsapp";

const ADDRESS = "3, 13 Chomphon, Tambon Rahaeng, Mueang Tak District, Tak 63000";
const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Kopi Malay, " + ADDRESS)}`;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Kopi Malay Tak" },
      { name: "description", content: "Visit Kopi Malay in Tak, Thailand. Open 8 AM – 6 PM every day. Call our office or chat on WhatsApp." },
      { property: "og:title", content: "Contact Us — Kopi Malay Tak" },
      { property: "og:description", content: "Shop address, opening hours, office phone and WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const row = "flex items-start gap-3";
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold uppercase md:text-5xl">Contact us</h1>
      <img src={shop.url} alt="Kopi Malay shop in Tak" loading="lazy" decoding="async" className="mt-6 aspect-[16/9] w-full rounded-lg object-cover" />
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="space-y-5">
          <p className={row}><MapPin className="mt-0.5 size-5 shrink-0" /><span><strong className="block">Kopi Malay</strong>{ADDRESS}</span></p>
          <p className={row}><Clock className="mt-0.5 size-5 shrink-0" /><span><strong className="block">Opening hours</strong>8:00 AM – 6:00 PM, every day</span></p>
        </div>
        <div className="space-y-3">
          <a href={OFFICE_TEL_URL} className="flex items-center gap-3 rounded-md border p-4 hover:border-foreground"><Phone className="size-5" /><span><strong className="block">Office</strong>{OFFICE_PHONE}</span></a>
          <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-md border p-4 hover:border-foreground"><WhatsAppIcon /><span><strong className="block">WhatsApp</strong>{SUPPORT_WHATSAPP_PHONE}</span></a>
          <a href={MAPS} target="_blank" rel="noopener noreferrer" className="block rounded-md bg-foreground px-5 py-3 text-center font-display font-semibold uppercase text-background">Open in Google Maps</a>
        </div>
      </div>
    </div>
  );
}
