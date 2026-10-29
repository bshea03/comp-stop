import { BrandFilterNotice } from "@/components/brand-filter-notice";
import { SizeFilterNotice } from "@/components/size-filter-notice";
import {
  conditionFilterLabel,
} from "@/lib/listings/condition-match";
import { CONDITION_USED_ONLY } from "@/lib/schema";
import type { SearchQuery } from "@/lib/marketplaces/types";

function ConditionFilterNotice({
  condition,
}: {
  condition: NonNullable<SearchQuery["condition"]>;
}) {
  const label = conditionFilterLabel(condition);

  if (condition === CONDITION_USED_ONLY) {
    return (
      <p className="text-xs text-muted">
        Comps exclude new listings and include{" "}
        <span className="font-medium text-foreground">Excellent</span>,{" "}
        <span className="font-medium text-foreground">Good</span>, and{" "}
        <span className="font-medium text-foreground">Fair</span> when the
        marketplace reports a condition we can map. Unmapped conditions are
        dropped from averages.
      </p>
    );
  }

  return (
    <p className="text-xs text-muted">
      Comps are limited to{" "}
      <span className="font-medium text-foreground">{label}</span> when the
      listing reports a condition we can map to that bucket. Marketplaces use
      different labels; unrelated conditions are dropped from averages. Poshmark
      also applies a server filter for new and like-new tiers when available.
    </p>
  );
}

export function SearchFiltersFooter({ query }: { query: SearchQuery }) {
  if (!query.brand && !query.size && !query.condition) return null;

  return (
    <footer className="space-y-2 border-t border-border-subtle pt-6">
      {query.brand ? <BrandFilterNotice brand={query.brand} /> : null}
      {query.size ? <SizeFilterNotice size={query.size} /> : null}
      {query.condition ? (
        <ConditionFilterNotice condition={query.condition} />
      ) : null}
    </footer>
  );
}
