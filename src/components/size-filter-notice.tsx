export function SizeFilterNotice({ size }: { size: string }) {
  return (
    <p className="text-xs text-muted">
      Comps are limited to size{" "}
      <span className="font-medium text-foreground">{size}</span> when the
      listing reports a size (or the title clearly includes it). Poshmark also
      applies a server size filter when available.
    </p>
  );
}
