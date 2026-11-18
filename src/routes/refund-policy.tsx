import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";
import { OFFICE_PHONE, OFFICE_TEL_URL, SUPPORT_WHATSAPP_PHONE, SUPPORT_WHATSAPP_URL } from "@/lib/whatsapp";

const link = "font-medium text-foreground underline underline-offset-4";

export const Route = createFileRoute("/refund-policy")({ staticData: { sitemap: true },
  head: () => legalHead("/refund-policy", "Refund, Return & Exchange Policy", "How Kopi Malay handles QR payment verification, cancellations, exchanges, damaged items and bank refunds."),
  component: RefundPolicy,
});

function RefundPolicy() {
  return (
    <LegalPage title="Refund, Return & Exchange Policy" updated="17 November 2026">
      <p className="font-semibold text-foreground">Kopi Malay – Official Merchandise</p>
      <p>Thank you for shopping with Kopi Malay! We appreciate your support and want to ensure you have a pleasant shopping experience.</p>
      <p>Please read our Return & Exchange Policy carefully before placing your order.</p>

      <h2>1. Order Payment & Verification</h2>
      <ul>
        <li>All orders are placed via manual QR transfer (DuitNow / Touch 'n Go for Malaysia, PromptPay for Thailand).</li>
        <li>Orders remain in "Pending Verification" until our team confirms your payment receipt matches the order total.</li>
        <li>If a receipt is invalid, unreadable, or unpaid, we will contact you. Unverified orders may be cancelled after 24 hours.</li>
      </ul>

      <h2>2. Order Cancellation & Modification (Before Dispatch)</h2>
      <ul>
        <li><strong>In-app size changes for registered customers:</strong> If you placed an apparel order (T-shirt or Jersey) while signed in to your account, you can change your selected size free of charge in My Profile while your order is still "Pending Verification" (up to 2 size changes per order, subject to stock availability).</li>
        <li><strong>Manual changes &amp; guest orders:</strong> If you checked out as a guest, or need to cancel or change your delivery address, contact us on WhatsApp (<a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={link}>{SUPPORT_WHATSAPP_PHONE}</a>) immediately with your order reference, before your parcel is packed and dispatched.</li>
        <li><strong>Lock after verification:</strong> Once your payment is verified, in-app size changes are no longer available. Once an order has been packed, processed, or handed to the courier, it cannot be cancelled or modified.</li>
        <li>For approved pre-dispatch cancellations, refunds will be issued directly to your original bank account via manual transfer.</li>
      </ul>

      <h2>3. Return & Exchange Eligibility (After Delivery)</h2>
      <p>Customers may request an exchange under the following conditions:</p>
      <ul>
        <li>The product must be unused, unworn, unwashed, and in its original condition.</li>
        <li>All original tags, labels, and packaging must remain intact.</li>
        <li>For stickers, patches, and accessories: adhesive backings must be completely unpeeled and original packaging unopened.</li>
        <li>Promotional bundles (e.g., 3-sticker bundles) must be returned in their full complete set.</li>
        <li>The customer must provide proof of purchase or an order number.</li>
        <li>Exchange requests must be submitted within 7 days of receiving the parcel.</li>
        <li>Products that have been used, washed, altered, or damaged by the customer are not eligible for return or exchange.</li>
        <li>Kopi Malay reserves the right to reject requests that do not meet these conditions.</li>
      </ul>

      <h2>4. Wrong Orders & Size Exchanges</h2>
      <p>If a customer accidentally orders the wrong size, colour, design, or product:</p>
      <ul>
        <li>Monetary refunds will not be provided after delivery.</li>
        <li>Customers may exchange the product for another available size or an item of equivalent value.</li>
        <li>If the replacement item is more expensive, the customer must pay the price difference via our official QR transfer prior to dispatch.</li>
        <li>If the replacement item is cheaper, the remaining balance will not be refunded or credited.</li>
        <li>Two-way shipping costs (return postage to Tak, Thailand and re-delivery of the replacement item) are the sole responsibility of the customer.</li>
        <li>Please double-check your measurements against our size charts before completing your purchase.</li>
      </ul>

      <h2>5. Damaged, Defective, or Incorrect Items</h2>
      <ul>
        <li>For transit damage (crushed tumblers, torn packaging), please contact us within 48 hours of delivery so courier claims can be initiated.</li>
        <li>For manufacturing defects or wrong items sent by Kopi Malay, please contact us within 7 days of delivery.</li>
        <li>
          Customers must provide:
          <ul className="mt-1">
            <li>Order number.</li>
            <li>Clear photos or videos showing the defect, damage, or wrong item received.</li>
            <li>Brief description of the issue.</li>
          </ul>
        </li>
        <li>If confirmed to be an error on our part or a manufacturing defect, Kopi Malay will replace the item and cover all associated replacement shipping costs. If a replacement is permanently out of stock, a direct refund to your bank account will be issued.</li>
      </ul>

      <h2>6. Return Shipping & Handling</h2>
      <ul>
        <li>
          All voluntary returns and exchanges must be securely packaged and shipped to our fulfillment location in Tak, Thailand:
          <address className="mt-2 not-italic font-medium text-foreground">
            Kopi Malay (Returns Department)<br />
            3, 13 Chomphon, Tambon Rahaeng,<br />
            Mueang Tak District, Tak 63000, Thailand
          </address>
        </li>
        <li>Customers are responsible for ensuring returned items are safely packaged. Kopi Malay is not liable for parcels lost or damaged during transit. We strongly recommend using a registered courier service with tracking.</li>
      </ul>

      <h2>7. Replacement Processing</h2>
      <ul>
        <li>Replacement products will only be dispatched after Kopi Malay has received, inspected, and approved the returned item.</li>
        <li>Replacements are subject to stock availability. If the requested size or item is sold out, customers may select another item of equal value, or receive a direct refund to their original bank account.</li>
        <li>Please allow 3–7 business days after parcel arrival for inspection and replacement dispatch.</li>
      </ul>

      <h2>8. Non-Returnable & Non-Exchangeable Items</h2>
      <p>The following items are strictly non-returnable and non-exchangeable:</p>
      <ul>
        <li>Products that have been worn, washed, stained, or used.</li>
        <li>Products that have been altered, modified, tailored, or customized after purchase.</li>
        <li>Stickers or patches with peeled adhesive or broken seals.</li>
        <li>Products damaged through customer negligence or improper washing/handling.</li>
        <li>Items with missing tags, labels, or original packaging.</li>
        <li>Items marked as Clearance or Final Sale.</li>
      </ul>

      <h2>9. Product Variations & Notes</h2>
      <ul>
        <li>Product colours may appear slightly different due to screen settings, lighting conditions, or device display variations.</li>
        <li>Minor differences in printing or stitching tolerances inherent to garment manufacturing do not constitute a defect.</li>
        <li>All return and exchange requests are subject to final inspection and approval by Kopi Malay.</li>
      </ul>

      <h2>10. Contact Us</h2>
      <p>For return requests, payment confirmations, or inquiries, please reach out directly through our verified channels:</p>
      <ul>
        <li>WhatsApp: <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={link}>{SUPPORT_WHATSAPP_PHONE}</a></li>
        <li>Office Phone: <a href={OFFICE_TEL_URL} className={link}>{OFFICE_PHONE}</a></li>
        <li>Operating Hours: 8:00 AM – 6:00 PM (UTC+7) Daily</li>
      </ul>
    </LegalPage>
  );
}
