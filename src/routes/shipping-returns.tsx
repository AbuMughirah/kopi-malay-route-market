import { createFileRoute, Link } from "@tanstack/react-router";
import { SUPPORT_WHATSAPP_PHONE } from "@/lib/whatsapp";
import { LegalPage, legalHead } from "@/components/legal-page";

export const Route = createFileRoute("/shipping-returns")({ staticData: { sitemap: true },
  head: () => legalHead("/shipping-returns", "Shipping & Returns", "Shipping rates from Tak to Malaysia and Thailand, tumbler weight fees, East Malaysia surcharge and returns."),
  component: () => (
    <LegalPage title="Shipping & Returns">
      <p>All orders are packed and dispatched from Tak, Thailand. We currently deliver to Malaysia and Thailand only; Singapore customers may arrange collection through a contact in Peninsular Malaysia.</p>
      <h2>Thailand</h2>
      <ul>
        <li>Accessories, stickers, patches, magnets and apparel ship free.</li>
        <li>Tumblers weigh 292g each. THB 60 applies for the first kilogram of tumbler weight, plus THB 60 for every additional kilogram started.</li>
      </ul>
      <h2>Peninsular Malaysia</h2>
      <ul>
        <li>Jerseys & T-shirts: RM 20 for every block of 2 shirts.</li>
        <li>Tumblers: RM 20 for every block of 2 tumblers.</li>
        <li>Accessories (stickers, magnets, patches, lanyards, other merch): RM 20 for every block of 20 units.</li>
        <li>Big-item bonus: each block of 2 shirts or 2 tumblers ships up to 20 accessories free. Only accessories beyond that allowance are charged at RM 20 per block of 20 (e.g. 2 shirts + 20 stickers = RM 20; 2 shirts + 21 stickers = RM 40; 4 shirts + 40 stickers = RM 40).</li>
      </ul>
      <h2>Sabah & Sarawak</h2>
      <p>The Peninsular Malaysia rate applies, plus a flat RM 10 surcharge once per order.</p>
      <h2>Processing & tracking</h2>
      <p>Orders ship after payment verification, usually within 1–3 working days. You will receive a courier tracking number once dispatched. Cross-border delivery typically takes 5–10 working days.</p>
      <h2>Returns & exchanges</h2>
      <ul>
        <li>Apparel sizes can be changed free in My Profile while an order is still "Pending Verification".</li>
        <li>After delivery we offer exchanges only, requested within 7 days on WhatsApp ({SUPPORT_WHATSAPP_PHONE}). Items must be unused, unwashed and in original packaging.</li>
        <li>Report transit damage within 48 hours and defects within 7 days, with photos.</li>
        <li>The customer covers shipping both ways for size or change-of-mind exchanges; we cover it when the item was damaged, faulty or incorrect.</li>
        <li>Return address: Kopi Malay, 3, 13 Chomphon, Tambon Rahaeng, Mueang Tak District, Tak 63000, Thailand.</li>
        <li>No store credit. Full details: <Link to="/refund-policy" className="font-medium text-foreground underline underline-offset-4">Refund, Return & Exchange Policy</Link>.</li>
      </ul>
    </LegalPage>
  ),
});
