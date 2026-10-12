export function BrandFilterNotice({ brand }: { brand: string }) {
  return (
    <p className="text-xs text-muted">
      Results are filtered to listings whose brand matches{" "}
      <span className="font-medium text-foreground">{brand}</span> (including
      close spelling variants). Listings with a different designer label are
      dropped from comps and averages—especially on Grailed, where keyword
      search can surface unrelated brands.
    </p>
  );
}
