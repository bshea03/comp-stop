"use client";

import { useSearchState } from "@/components/search-state";
import { SearchTextInput } from "@/components/search-text-input";
import { SearchSelectField } from "@/components/search-select-field";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { BrandAutocompleteInput } from "@/components/brand-autocomplete-input";
import { MarketplacePanelMenu } from "@/components/marketplace-panel-menu";
import { CONDITION_SEARCH_SELECT_ITEMS } from "@/lib/listings/condition-match";
import { RESULTS_VIEW_PARAM } from "@/lib/results-view";
import {
  buildSearchParams,
  DEFAULT_DAYS_BACK,
  readSearchQueryFromFormData,
  readSearchQueryFromSearchParams,
  SEARCH_PARAM_KEYS,
  searchQueryCacheKey,
  TIME_WINDOWS,
} from "@/lib/schema";

const FIELD_CLASSES =
  "w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/70 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25";

const LABEL_CLASSES =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted";

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={LABEL_CLASSES} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function SearchFormSkeleton() {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm">
      <div className="h-[86px] animate-pulse rounded-lg bg-surface-muted sm:h-[62px]" />
    </div>
  );
}

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSearching, startTransition, beginSearch } = useSearchState();

  const current = useMemo(
    () => readSearchQueryFromSearchParams(searchParams),
    [searchParams],
  );

  const currentSearchKey = useMemo(
    () => searchQueryCacheKey(current) ?? "",
    [current],
  );

  const clearSearch = useCallback(() => {
    if (isSearching) return;
    startTransition(() => {
      router.push("/");
    });
  }, [isSearching, router, startTransition]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSearching) return;

      const query = readSearchQueryFromFormData(
        new FormData(event.currentTarget),
      );
      if (!query.keywords) return;

      const params = new URLSearchParams(buildSearchParams(query));
      params.delete(RESULTS_VIEW_PARAM);

      const nextSearch = params.toString();
      const onActiveTab = searchParams.get(RESULTS_VIEW_PARAM) === "active";

      beginSearch();
      startTransition(() => {
        if (
          nextSearch === currentSearchKey &&
          currentSearchKey.length > 0 &&
          !onActiveTab
        ) {
          router.refresh();
        } else {
          router.push(nextSearch ? `/?${nextSearch}` : "/");
        }
      });
    },
    [
      beginSearch,
      currentSearchKey,
      isSearching,
      router,
      searchParams,
      startTransition,
    ],
  );

  return (
    // Remounting on URL change resets controlled fields after browser navigation.
    <form
      key={searchParams.toString()}
      action="/"
      method="get"
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
        <Field
          label="Garment, tag, or keywords"
          htmlFor="field-keywords"
          className="lg:col-span-4"
        >
          <SearchTextInput
            id="field-keywords"
            name={SEARCH_PARAM_KEYS.keywords}
            defaultValue={current.keywords ?? ""}
            placeholder="wool bomber jacket"
            clearLabel="Clear keywords"
            required
            enterKeyHint="search"
            className={FIELD_CLASSES}
          />
        </Field>

        <Field label="Brand" htmlFor="field-brand" className="lg:col-span-3">
          <BrandAutocompleteInput
            id="field-brand"
            name={SEARCH_PARAM_KEYS.brand}
            defaultValue={current.brand ?? ""}
            placeholder="Carhartt"
            className={FIELD_CLASSES}
          />
        </Field>

        <Field label="Size" htmlFor="field-size" className="lg:col-span-1">
          <SearchTextInput
            id="field-size"
            name={SEARCH_PARAM_KEYS.size}
            defaultValue={current.size ?? ""}
            placeholder="M"
            clearLabel="Clear size"
            className={FIELD_CLASSES}
          />
        </Field>

        <Field
          label="Condition"
          htmlFor="field-condition"
          className="lg:col-span-2"
        >
          <SearchSelectField
            id="field-condition"
            name={SEARCH_PARAM_KEYS.condition}
            defaultValue={current.condition ?? ""}
            listAriaLabel="Condition options"
            className={FIELD_CLASSES}
            items={CONDITION_SEARCH_SELECT_ITEMS}
          />
        </Field>

        <Field label="Sold within" htmlFor="field-days" className="lg:col-span-2">
          <SearchSelectField
            id="field-days"
            name={SEARCH_PARAM_KEYS.daysBack}
            defaultValue={String(current.daysBack ?? DEFAULT_DAYS_BACK)}
            listAriaLabel="Sold within options"
            className={FIELD_CLASSES}
            items={TIME_WINDOWS.map((window) => ({
              kind: "option" as const,
              value: String(window.days),
              label: window.label,
            }))}
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="submit"
          disabled={isSearching}
          aria-busy={isSearching}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
        {current.keywords ? (
          <button
            type="button"
            onClick={clearSearch}
            disabled={isSearching}
            className={[
              "w-full rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-semibold",
              "text-foreground shadow-sm transition hover:bg-surface-muted/60",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              "disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto",
            ].join(" ")}
          >
            Clear search
          </button>
        ) : null}
        <MarketplacePanelMenu className="w-full sm:ml-auto sm:w-auto" />
      </div>
    </form>
  );
}
