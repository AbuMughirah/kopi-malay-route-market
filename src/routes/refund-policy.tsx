import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";
import { MAX_SIZE_CHANGES } from "@/lib/size-exchange";
import { OFFICE_PHONE, OFFICE_TEL_URL, SUPPORT_WHATSAPP_PHONE, SUPPORT_WHATSAPP_URL } from "@/lib/whatsapp";

const RETURN_ADDRESS = "Kopi Malay, 3, 13 Chomphon, Tambon Rahaeng, Mueang Tak District, Tak 63000, Thailand";
const link = "font-medium text-foreground underline underline-offset-4";

export const Route = createFileRoute("/refund-policy")({
  head: () => legalHead("/refund-policy", "Refund, Return & Exchange Policy", "How Kopi Malay handles QR payment verification, cancellations, size exchanges, damaged items and bank refunds. No store credit."),
  component: RefundPolicy,
});

function RefundPolicy() {
  return (
    <LegalPage title="Refund, Return & Exchange Policy" updated="17 November 2026">
      <p>This policy covers every order placed on this store and shipped from Tak, Thailand to Malaysia or Thailand. We do not offer store credit — approved refunds are always paid back to your bank account.</p>

      <h2>1. Payment & verification</h2>
      <p>All orders are paid by manual QR transfer (DuitNow / Touch 'n Go for Malaysia, PromptPay for Thailand). After you upload your payment slip, your order stays "Pending Verification" until our team confirms the payment matches the order total.</p>
      <p>If a slip cannot be verified (wrong amount, unreadable, or no payment received), we will contact you. Orders that remain unverified may be cancelled, and any amount received is returned by bank transfer. Overpayments are returned the same way.</p>

      <h2>2. Changes & cancellations before dispatch</h2>
      <ul>
        <li><strong>Free size change in My Profile:</strong> while your order is still "Pending Verification", you can change the size of apparel items yourself in <Link to="/profile" className={link}>My Profile</Link>, up to {MAX_SIZE_CHANGES} times per order, subject to stock. The price stays the same.</li>
        <li>Once our team verifies your order, self-service size changes are locked. Message us on WhatsApp before it ships and we will help where stock allows.</li>
        <li>You may cancel any time before your order is shipped by contacting us with your order reference. Verified payments for cancelled orders are refunded by direct bank transfer (DuitNow / PromptPay) to the account that paid.</li>
        <li>Orders already handed to the courier cannot be cancelled.</li>
      </ul>

      <h2>3. Exchange eligibility after delivery</h2>
      <p>Contact us within <strong>7 days of delivery</strong> to request an exchange. Items must be:</p>
      <ul>
        <li>Unused, unworn and unwashed, with original tags and packaging intact.</li>
        <li>Stickers with their adhesive backing unpeeled.</li>
        <li>Complete bundles — sticker bundles must be returned as the full set purchased.</li>
      </ul>

      <h2>4. Wrong size or change of mind</h2>
      <ul>
        <li>We offer <strong>exchanges only</strong> after delivery. There are no cash refunds for change of mind or a wrong size chosen.</li>
        <li>Exchanges are subject to available stock.</li>
        <li>If the replacement costs more, you pay the difference by the same QR payment method. If it costs less, the difference is not refunded.</li>
        <li>You cover shipping both ways: sending the item back to Tak, and the replacement parcel to you.</li>
      </ul>

      <h2>5. Damaged, defective or incorrect items</h2>
      <ul>
        <li>Report <strong>transit damage within 48 hours</strong> of delivery, and <strong>manufacturing defects within 7 days</strong>.</li>
        <li>Send your order reference with clear photos (unboxing photos, the item, and the parcel label) on WhatsApp.</li>
        <li>If confirmed, Kopi Malay covers the replacement and its shipping. If the item is sold out, we refund it in full by bank transfer.</li>
      </ul>

      <h2>6. Return address</h2>
      <p>Please message us before sending anything back so we can match the parcel to your order. Send returns to: {RETURN_ADDRESS}.</p>

      <h2>7. Inspection & processing</h2>
      <p>Returned items are inspected on arrival. Approved replacements are dispatched, and approved bank refunds are paid, within 3–7 business days after inspection.</p>

      <h2>8. Non-returnable & non-exchangeable items</h2>
      <ul>
        <li>Products that have been altered, modified, tailored or customised after purchase.</li>
        <li>Items that have been used, worn, washed or damaged after delivery.</li>
        <li>Stickers with peeled adhesive, and partial sticker bundles.</li>
        <li>Shipping fees, except where the error was ours.</li>
      </ul>

      <h2>9. Product variations</h2>
      <p>Colours may look slightly different from photos because of screen settings and lighting. Small variations in print placement or finish are normal and are not treated as defects.</p>

      <h2>10. Contact us</h2>
      <ul>
        <li>WhatsApp: <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={link}>{SUPPORT_WHATSAPP_PHONE}</a></li>
        <li>Office: <a href={OFFICE_TEL_URL} className={link}>{OFFICE_PHONE}</a></li>
        <li>Hours: 8 AM – 6 PM, every day.</li>
      </ul>
      <p>See also <Link to="/shipping-returns" className={link}>Shipping & Returns</Link> for delivery rates and times.</p>
    </LegalPage>
  );
}
