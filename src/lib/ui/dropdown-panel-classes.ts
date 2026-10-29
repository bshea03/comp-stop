/** Shared floating list panel for brand typeahead and search selects. */
export const DROPDOWN_PANEL_BASE_CLASSES = [
  "absolute z-50 mt-1.5 w-full rounded-lg",
  "border border-accent/30 bg-surface-muted py-1",
  "shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-foreground/10",
].join(" ");

export const DROPDOWN_PANEL_SCROLLABLE_CLASSES = "max-h-56 overflow-y-auto";

export function dropdownPanelClasses(optionCount: number): string {
  return [
    DROPDOWN_PANEL_BASE_CLASSES,
    optionCount > 10 ? DROPDOWN_PANEL_SCROLLABLE_CLASSES : null,
  ]
    .filter(Boolean)
    .join(" ");
}
