export function SiteHeader() {
  return (
    <header>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        <span className="text-foreground">Comp</span>
        <span className="text-accent">Stop</span>
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
        Compare sold and active comps across marketplaces before you buy.
      </p>
      <div
        className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-accent to-vinted"
        aria-hidden
      />
    </header>
  );
}
