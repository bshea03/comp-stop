"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { useBrandCatalog } from "@/components/brand-catalog-context";
import {
  mergeBrandSuggestions,
  suggestBrandsFromList,
} from "@/lib/brands/suggest-clothing-brands";

type BrandAutocompleteInputProps = {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
};

const LIVE_SUGGEST_DEBOUNCE_MS = 220;
const SUGGEST_LIMIT = 12;

export function BrandAutocompleteInput({
  id,
  name,
  defaultValue = "",
  placeholder,
  className,
}: BrandAutocompleteInputProps) {
  const { brands: catalogBrands } = useBrandCatalog();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const localSuggestions = useMemo(
    () =>
      open
        ? suggestBrandsFromList(catalogBrands, value, SUGGEST_LIMIT)
        : [],
    [catalogBrands, open, value],
  );

  useEffect(() => {
    const trimmed = value.trim();
    if (!open || trimmed.length < 1) {
      setLiveSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const params = new URLSearchParams({ q: trimmed });
          const response = await fetch(`/api/brands/suggest?${params}`, {
            signal: controller.signal,
          });
          if (!response.ok) return;
          const body = (await response.json()) as { brands?: string[] };
          if (Array.isArray(body.brands)) {
            setLiveSuggestions(body.brands);
          }
        } catch {
          // Local catalog matches remain visible.
        }
      })();
    }, LIVE_SUGGEST_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, value]);

  const suggestions = useMemo(
    () =>
      mergeBrandSuggestions(
        [liveSuggestions, localSuggestions],
        SUGGEST_LIMIT,
      ),
    [liveSuggestions, localSuggestions],
  );

  const closeList = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const selectSuggestion = useCallback(
    (brand: string) => {
      setValue(brand);
      closeList();
    },
    [closeList],
  );

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && !root.contains(event.target)) {
        closeList();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [closeList]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (!suggestions.length) {
      if (event.key === "Escape") closeList();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1,
      );
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]!);
    } else if (event.key === "Escape") {
      closeList();
    }
  };

  const showList = open && suggestions.length > 0;

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={showList ? listboxId : undefined}
        aria-activedescendant={
          showList && activeIndex >= 0
            ? `${listboxId}-option-${activeIndex}`
            : undefined
        }
        className={className}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Brand suggestions"
          className={[
            "absolute z-50 mt-1.5 max-h-56 w-full overflow-y-auto rounded-lg",
            "border border-accent/30 bg-surface-muted py-1",
            "shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-foreground/10",
          ].join(" ")}
        >
          {suggestions.map((brand, index) => {
            const selected = index === activeIndex;
            return (
              <li
                key={brand}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={selected}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  className={[
                    "w-full px-3 py-2 text-left text-sm text-foreground",
                    selected ? "bg-surface" : "hover:bg-surface/80",
                  ].join(" ")}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSuggestion(brand)}
                >
                  {brand}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
