"use client";

import { useEffect, useRef } from "react";

import { MARKETPLACE_THEME } from "@/components/marketplace-theme";
import { useMarketplaceVisibility } from "@/components/marketplace-visibility";
import { marketplaceCatalogRows } from "@/lib/marketplace-visibility";
import { MARKETPLACE_IDS } from "@/lib/marketplaces/types";

function availabilityLabel(row: ReturnType<typeof marketplaceCatalogRows>[number]) {
  const parts: string[] = [];
  if (row.sold) parts.push("Sold");
  if (row.active) parts.push("Active");
  if (row.linkOut) parts.push("Opens on site");
  return parts.join(" · ");
}

export function MarketplacePanelMenu({ className }: { className?: string }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const {
    isEnabled,
    setEnabled,
    enableAll,
    enabledCount,
    hydrated,
  } = useMarketplaceVisibility();

  const rows = marketplaceCatalogRows();
  const total = MARKETPLACE_IDS.length;

  useEffect(() => {
    const node = detailsRef.current;
    if (!node) return;

    function onPointerDown(event: PointerEvent) {
      if (!node?.open) return;
      const target = event.target;
      if (target instanceof Node && !node.contains(target)) {
        node.open = false;
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && node?.open) {
        node.open = false;
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details
      ref={detailsRef}
      className={["group relative shrink-0", className].filter(Boolean).join(" ")}
    >
      <summary
        className={[
          "flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 py-2 text-sm transition",
          "text-muted hover:bg-surface-muted/60 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          "[&::-webkit-details-marker]:hidden",
        ].join(" ")}
      >
        <span className="font-medium text-foreground">Marketplaces</span>
        <span className="tabular text-muted">
          {hydrated ? `${enabledCount}/${total}` : "…"}
        </span>
        <span
          className="text-xs text-muted transition group-open:rotate-180"
          aria-hidden
        >
          ▾
        </span>
      </summary>

      <div
        className={[
          "absolute left-0 z-30 mt-1 w-[min(100vw-2.5rem,20rem)] rounded-xl border border-border-subtle",
          "bg-surface p-2 shadow-lg sm:left-auto sm:right-0",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-2 border-b border-border-subtle px-2 pb-2 pt-1">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Show marketplaces
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              Saved in this browser. Hidden shops are not loaded.
            </p>
          </div>
          <button
            type="button"
            onClick={enableAll}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
          >
            All on
          </button>
        </div>

        <ul className="max-h-[min(50vh,18rem)] overflow-y-auto py-1">
          {rows.map((row) => {
            const checked = isEnabled(row.id);
            const inputId = `marketplace-toggle-${row.id}`;
            return (
              <li key={row.id}>
                <label
                  htmlFor={inputId}
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 transition",
                    "hover:bg-surface-muted/60",
                  ].join(" ")}
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      setEnabled(row.id, event.target.checked)
                    }
                    className="mt-1 size-4 shrink-0 rounded border-border-subtle text-accent focus:ring-accent/30"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span
                        className={`size-2 shrink-0 rounded-full ${MARKETPLACE_THEME[row.id].dot}`}
                        aria-hidden
                      />
                      <span className="text-sm font-medium text-foreground">
                        {row.label}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {availabilityLabel(row)}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
