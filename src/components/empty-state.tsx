import Link from "next/link";

import { buildSearchParams } from "@/lib/schema";

const EXAMPLES = [
  { keywords: "fleece zip pullover", brand: "Patagonia" },
  { keywords: "detroit jacket", brand: "Carhartt" },
  { keywords: "shift dress", brand: "Lilly Pulitzer" },
  { keywords: "501 straight jeans", brand: "Levi's" },
] as const;

export function EmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-border-subtle bg-surface/60 p-8 text-center">
      <h2 className="text-lg font-semibold text-foreground">
        Search a garment to see what it sells for
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
        Enter a brand, a tag, or a description and every marketplace is checked
        at once. Each one reports its own average sold price, so you can see
        where a piece is worth listing before you buy it.
      </p>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Try one of these
        </p>
        <ul className="mt-3 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <li key={`${example.brand} ${example.keywords}`}>
              <Link
                href={`/?${buildSearchParams(example)}`}
                prefetch
                className="inline-block rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
              >
                {`${example.brand} ${example.keywords}`}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
