import { BrandFilterNotice } from "@/components/brand-filter-notice";
import type { SearchQuery } from "@/lib/marketplaces/types";

function KeywordFilterNotice() {
  return (
    <p className="text-xs text-muted">
      When your search names an item type (shorts, jacket, etc.), comps must
      match that type in the title — not every word from your query. That drops
      fuzzy hits (e.g. shirts for a shorts search) while staying closer to what
      marketplaces show for the same keywords.
    </p>
  );
}

function ConditionFilterNotice({
  condition,
}: {
  condition: NonNullable<SearchQuery["condition"]>;
}) {
  return (
    <p className="text-xs text-muted">
      Comps are limited to{" "}
      <span className="font-medium text-foreground">{condition}</span> when the
      listing reports a condition we can map to that bucket. Marketplaces use
      different labels; unrelated conditions are dropped from averages. Poshmark
      also applies a server filter for new and like-new tiers when available.
    </p>
  );
}

export function SearchFiltersFooter({ query }: { query: SearchQuery }) {
  return (
    <footer className="space-y-2 border-t border-border-subtle pt-6">
      <KeywordFilterNotice />
      {query.brand ? <BrandFilterNotice brand={query.brand} /> : null}
      {query.condition ? (
        <ConditionFilterNotice condition={query.condition} />
      ) : null}
    </footer>
  );
}
