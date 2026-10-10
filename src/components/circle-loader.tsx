import { MARKETPLACE_THEME } from "@/components/marketplace-theme";
import type { MarketplaceId } from "@/lib/marketplaces/types";

const SIZE = {
  sm: "size-7 border-2",
  md: "size-9 border-2",
  lg: "size-11 border-[3px]",
} as const;

export function CircleLoader({
  size = "md",
  label,
  marketplace,
  className = "",
}: {
  size?: keyof typeof SIZE;
  /** Shown below the spinner (visible). */
  label?: string;
  /** Tint the ring with the marketplace brand color. */
  marketplace?: MarketplaceId;
  className?: string;
}) {
  const tint = marketplace
    ? MARKETPLACE_THEME[marketplace].text
    : "text-accent";

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-6 ${className}`}
      role="status"
    >
      <span
        className={`inline-block animate-spin rounded-full border-solid border-current/20 border-t-current ${SIZE[size]} ${tint}`}
        aria-hidden
      />
      {label ? (
        <p className="text-center text-sm font-medium text-muted">{label}</p>
      ) : null}
    </div>
  );
}
