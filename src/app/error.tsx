"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-14">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Something broke while loading comps
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Individual marketplaces that fail are handled on their own card, so this
        is an unexpected error in the page itself.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
      >
        Try again
      </button>
    </main>
  );
}
