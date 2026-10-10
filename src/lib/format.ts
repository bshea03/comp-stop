const currencyFormatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: string, maximumFractionDigits: number) {
  const key = `${currency}:${maximumFractionDigits}`;
  let formatter = currencyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: maximumFractionDigits,
      maximumFractionDigits,
    });
    currencyFormatters.set(key, formatter);
  }
  return formatter;
}

export function formatCents(cents: number, currency = "USD"): string {
  return currencyFormatter(currency, 2).format(cents / 100);
}

/** Drops the cents, for headline figures where the precision is false comfort. */
export function formatCentsRounded(cents: number, currency = "USD"): string {
  return currencyFormatter(currency, 0).format(Math.round(cents / 100));
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

export function formatDateRange(from: string, to: string): string {
  const fromLabel = formatDate(from);
  const toLabel = formatDate(to);
  return fromLabel === toLabel ? fromLabel : `${fromLabel} - ${toLabel}`;
}

export function formatCount(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

/** Difference between two prices as a signed percentage, e.g. "+18%". */
export function formatPercentDelta(value: number, baseline: number): string {
  if (baseline === 0) return "--";
  const delta = Math.round(((value - baseline) / baseline) * 100);
  return `${delta > 0 ? "+" : ""}${delta}%`;
}
