/** Browser-safe rules for customer self-service apparel size changes. */
export const MAX_SIZE_CHANGES = 2;
export const SIZE_CHANGE_STATUSES = ["pending_verification"] as const;

export const canChangeSize = (status: string) => (SIZE_CHANGE_STATUSES as readonly string[]).includes(status);

/** Sizes a customer may switch to: offered by the product, not the current size, not already a line in the order, and in stock when tracked. */
export function sizeChoices(input: { sizes: string[]; current: string; taken: string[]; stock: Record<string, number> | null; quantity: number }) {
  return input.sizes.map((size) => {
    const left = input.stock ? input.stock[size] ?? 0 : null;
    const disabled = size === input.current || input.taken.includes(size) || (left != null && left < input.quantity);
    return { size, left, disabled };
  });
}

export const SIZE_CHANGE_ERRORS: Record<string, string> = {
  not_found: "Order not found.",
  locked: "This order is already verified or shipped. Please contact us on WhatsApp to change the size.",
  same: "That is already the size on your order.",
  duplicate: "This order already has that size for this item. Please contact us on WhatsApp.",
  limit: `You can change sizes up to ${MAX_SIZE_CHANGES} times per order. Please contact us on WhatsApp.`,
  sold_out: "Sorry, that size just sold out. Please pick another size.",
  not_apparel: "Only apparel sizes can be changed.",
};
