"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useMemo,
  useOptimistic,
  useRef,
  useTransition,
  type TouchEvent,
} from "react";

import { ResultsViewProvider } from "@/components/results-view-context";
import {
  DEFAULT_RESULTS_VIEW,
  parseResultsView,
  RESULTS_VIEW_PARAM,
  type ResultsView,
} from "@/lib/results-view";

const TABS: {
  view: ResultsView;
  label: string;
  description: string;
  accentClass: string;
}[] = [
  {
    view: "sold",
    label: "Sold comps",
    description: "Completed sales and sold averages",
    accentClass: "ring-accent/35 dark:ring-accent/45",
  },
  {
    view: "active",
    label: "Active listings",
    description: "Current asking prices still for sale",
    accentClass: "ring-vinted/40 dark:ring-vinted/50",
  },
];

const SLIDE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

const SLIDE_MOTION = [
  "transition-[left,right,transform] duration-350 motion-reduce:transition-none motion-reduce:transform-none",
  `[transition-timing-function:${SLIDE_EASE}]`,
].join(" ");

const TAB_LABEL_MOTION = [
  "transition-[color,font-weight] duration-350 motion-reduce:transition-none",
  `[transition-timing-function:${SLIDE_EASE}]`,
].join(" ");

/** Minimum horizontal travel before we treat a gesture as a tab swipe. */
const SWIPE_DISTANCE_PX = 56;
/** Horizontal motion must dominate vertical (avoids fighting page scroll). */
const SWIPE_HORIZONTAL_DOMINANCE = 1.35;

function isInsideHorizontalScroller(
  target: EventTarget | null,
  boundary: HTMLElement | null,
): boolean {
  if (!(target instanceof Element) || !boundary) return false;

  for (let node: Element | null = target; node && boundary.contains(node); ) {
    if (!(node instanceof HTMLElement)) break;
    const { overflowX } = getComputedStyle(node);
    if (
      (overflowX === "auto" || overflowX === "scroll") &&
      node.scrollWidth > node.clientWidth + 1
    ) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

function tabId(view: ResultsView): string {
  return `results-tab-${view}`;
}

function panelId(view: ResultsView): string {
  return `results-panel-${view}`;
}

function ResultsTabPanel({
  view,
  panelView,
  labelledBy,
  children,
}: {
  view: ResultsView;
  panelView: ResultsView;
  labelledBy: string;
  children: React.ReactNode;
}) {
  const isActive = panelView === view;

  return (
    <div
      role="tabpanel"
      id={panelId(view)}
      aria-labelledby={labelledBy}
      aria-hidden={!isActive}
      inert={!isActive}
      className={[
        "w-1/2 min-w-0 shrink-0 space-y-6",
        isActive ? "relative z-10" : "pointer-events-none overflow-hidden",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function ResultsViewTabs({
  sold,
  active,
}: {
  sold: React.ReactNode;
  active: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlView = useMemo(
    () => parseResultsView(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );

  const [view, setOptimisticView] = useOptimistic(
    urlView,
    (_current, next: ResultsView) => next,
  );
  const [, startTransition] = useTransition();

  const selectView = useCallback(
    (next: ResultsView) => {
      if (next === view) return;

      const params = new URLSearchParams(searchParams.toString());
      if (next === DEFAULT_RESULTS_VIEW) {
        params.delete(RESULTS_VIEW_PARAM);
      } else {
        params.set(RESULTS_VIEW_PARAM, next);
      }

      const qs = params.toString();
      startTransition(() => {
        setOptimisticView(next);
        router.replace(qs ? `/?${qs}` : "/", { scroll: false });
      });
    },
    [router, searchParams, setOptimisticView, view],
  );

  const activeAccent =
    TABS.find((tab) => tab.view === view)?.accentClass ??
    "ring-foreground/15";

  const swipeAreaRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; skip: boolean } | null>(
    null,
  );

  const onSwipeTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }

    const touch = event.touches[0];
    const skip = isInsideHorizontalScroller(
      event.target,
      swipeAreaRef.current,
    );

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      skip,
    };
  }, []);

  const onSwipeTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || start.skip) return;

      const touch = event.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;

      if (Math.abs(deltaX) < SWIPE_DISTANCE_PX) return;
      if (Math.abs(deltaX) < Math.abs(deltaY) * SWIPE_HORIZONTAL_DOMINANCE) {
        return;
      }

      if (deltaX < 0 && view === "sold") {
        selectView("active");
      } else if (deltaX > 0 && view === "active") {
        selectView("sold");
      }
    },
    [selectView, view],
  );

  const onSwipeTouchCancel = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  return (
    <div
      ref={swipeAreaRef}
      className="space-y-6 touch-pan-y"
      onTouchStart={onSwipeTouchStart}
      onTouchEnd={onSwipeTouchEnd}
      onTouchCancel={onSwipeTouchCancel}
    >
      <p className="sr-only">
        Swipe left or right to switch between sold comps and active listings.
      </p>
      <div
        role="tablist"
        aria-label="Results type"
        className="relative flex gap-1.5 rounded-xl border border-border-subtle bg-surface-muted p-1.5"
      >
        <span
          aria-hidden
          className={[
            "pointer-events-none absolute top-1.5 bottom-1.5 rounded-lg bg-surface ring-2 ring-inset",
            SLIDE_MOTION,
            "shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.45)]",
            activeAccent,
            view === "sold"
              ? "left-1.5 right-[calc(50%+0.1875rem)]"
              : "left-[calc(50%+0.1875rem)] right-1.5",
          ].join(" ")}
        />

        {TABS.map((tab) => {
          const selected = view === tab.view;
          return (
            <button
              key={tab.view}
              type="button"
              role="tab"
              id={tabId(tab.view)}
              aria-selected={selected}
              aria-controls={panelId(tab.view)}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectView(tab.view)}
              className={[
                "relative z-10 min-h-11 flex-1 rounded-lg px-3 py-2 text-left sm:px-4",
                TAB_LABEL_MOTION,
              ].join(" ")}
            >
              <span
                className={[
                  "block text-sm",
                  TAB_LABEL_MOTION,
                  selected
                    ? "font-semibold text-foreground"
                    : "font-medium text-muted/75 hover:text-muted",
                ].join(" ")}
              >
                {tab.label}
              </span>
              <span
                className={[
                  "mt-0.5 hidden text-xs sm:block",
                  TAB_LABEL_MOTION,
                  selected ? "text-muted" : "text-muted/55",
                ].join(" ")}
              >
                {tab.description}
              </span>
            </button>
          );
        })}
      </div>

      <ResultsViewProvider view={view}>
        <div className="overflow-hidden">
          <div
            className={["flex w-[200%]", SLIDE_MOTION].join(" ")}
            style={{
              transform: view === "sold" ? "translateX(0)" : "translateX(-50%)",
            }}
          >
            <ResultsTabPanel
              view="sold"
              panelView={view}
              labelledBy={tabId("sold")}
            >
              {sold}
            </ResultsTabPanel>
            <ResultsTabPanel
              view="active"
              panelView={view}
              labelledBy={tabId("active")}
            >
              {active}
            </ResultsTabPanel>
          </div>
        </div>
      </ResultsViewProvider>
    </div>
  );
}
