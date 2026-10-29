"use client";

export function mergeInputClassForMobileClear(
  className: string | undefined,
  showClear: boolean,
): string {
  return [className, showClear ? "pr-10 md:pr-3" : null]
    .filter(Boolean)
    .join(" ");
}

export function MobileTextFieldClearButton({
  clearLabel,
  onClear,
}: {
  clearLabel: string;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={clearLabel}
      className={[
        "absolute right-1 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center",
        "rounded-md text-xl leading-none text-foreground/75 transition",
        "hover:bg-surface-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        "md:hidden",
      ].join(" ")}
      onClick={onClear}
    >
      <span aria-hidden>×</span>
    </button>
  );
}

export function MobileClearTextField({
  value,
  onClear,
  clearLabel,
  children,
}: {
  value: string;
  onClear: () => void;
  clearLabel: string;
  children: React.ReactNode;
}) {
  const showClear = value.length > 0;
  return (
    <div className="relative w-full min-w-0">
      {children}
      {showClear ? (
        <MobileTextFieldClearButton clearLabel={clearLabel} onClear={onClear} />
      ) : null}
    </div>
  );
}
