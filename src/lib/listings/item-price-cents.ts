/** Parse a SoldComps decimal string; returns null if missing or invalid. */
export function parseMoneyDollars(value: string | undefined | null): number | null {
  if (value == null || value.trim() === "") return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Item price in cents for SoldComps rows. Prefer `soldPrice` (listing price);
 * `totalPrice` includes shipping when both are known.
 */
export function soldCompsItemPriceCents(item: {
  soldPrice?: string;
  totalPrice?: string;
  shippingPrice?: string | null;
}): number | null {
  const sold = parseMoneyDollars(item.soldPrice);
  if (sold != null) return Math.round(sold * 100);

  const total = parseMoneyDollars(item.totalPrice);
  if (total == null) return null;

  const shipping = parseMoneyDollars(item.shippingPrice ?? undefined) ?? 0;
  return Math.max(0, Math.round((total - shipping) * 100));
}

/** Grailed `sold_price` is usually item-only; subtract shipping when bundled. */
export function grailedItemPriceCents(hit: {
  sold_price?: number;
  sold_shipping_price?: number;
  sold_price_includes_shipping?: boolean | null;
}): number | null {
  const sold = hit.sold_price;
  if (sold == null || !Number.isFinite(sold)) return null;

  let dollars = sold;
  if (
    hit.sold_price_includes_shipping &&
    hit.sold_shipping_price != null &&
    Number.isFinite(hit.sold_shipping_price)
  ) {
    dollars = sold - hit.sold_shipping_price;
  }

  return Math.max(0, Math.round(dollars * 100));
}
