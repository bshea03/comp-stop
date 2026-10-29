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

type SearchSelectOption = {
  kind: "option";
  value: string;
  label: string;
};

type SearchSelectDivider = {
  kind: "divider";
};

type SearchSelectListItem = SearchSelectOption | SearchSelectDivider;

type SearchSelectFieldProps = {
  id: string;
  name: string;
  defaultValue?: string;
  items: readonly SearchSelectListItem[];
  className?: string;
  listAriaLabel: string;
};

const LISTBOX_BASE_CLASSES = [
  "absolute z-50 mt-1.5 w-full rounded-lg",
  "border border-accent/30 bg-surface-muted py-1",
  "shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-foreground/10",
].join(" ");

/** Short filter lists (condition, sold within) fit without scrolling. */
const LISTBOX_SCROLLABLE_CLASSES = "max-h-56 overflow-y-auto";

function listboxClasses(optionCount: number): string {
  return [
    LISTBOX_BASE_CLASSES,
    optionCount > 10 ? LISTBOX_SCROLLABLE_CLASSES : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function isOption(item: SearchSelectListItem): item is SearchSelectOption {
  return item.kind === "option";
}

export function SearchSelectField({
  id,
  name,
  defaultValue = "",
  items,
  className,
  listAriaLabel,
}: SearchSelectFieldProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const options = useMemo(
    () => items.filter(isOption),
    [items],
  );

  const selectedIndex = options.findIndex((option) => option.value === value);
  const displayLabel =
    selectedIndex >= 0
      ? options[selectedIndex]!.label
      : (options[0]?.label ?? "");

  const closeList = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const selectOption = useCallback(
    (option: SearchSelectOption) => {
      setValue(option.value);
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

  const openList = useCallback(() => {
    setOpen(true);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [selectedIndex]);

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      openList();
      return;
    }

    if (!open) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openList();
      }
      return;
    }

    if (options.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) =>
        prev <= 0 ? options.length - 1 : prev - 1,
      );
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectOption(options[activeIndex]!);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeList();
    }
  };

  const showList = open && options.length > 0;

  const listIndexByItemIndex = useMemo(() => {
    const indices = new Map<number, number>();
    let optionIndex = 0;
    items.forEach((item, itemIndex) => {
      if (item.kind === "option") {
        indices.set(itemIndex, optionIndex);
        optionIndex += 1;
      }
    });
    return indices;
  }, [items]);

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <input type="hidden" name={name} value={value} />
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={showList}
        aria-controls={showList ? listboxId : undefined}
        aria-activedescendant={
          showList && activeIndex >= 0
            ? `${listboxId}-option-${activeIndex}`
            : undefined
        }
        className={[
          className,
          "relative flex w-full items-center pr-9 text-left",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="min-w-0 truncate">{displayLabel}</span>
        <span
          className={[
            "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted transition",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={listAriaLabel}
          className={listboxClasses(options.length)}
        >
          {items.map((item, itemIndex) => {
            if (item.kind === "divider") {
              return (
                <li
                  key={`divider-${itemIndex}`}
                  role="presentation"
                  aria-hidden
                  className="my-1 border-t border-border-subtle"
                />
              );
            }

            const listIndex = listIndexByItemIndex.get(itemIndex)!;

            const isSelected = item.value === value;
            const highlighted = listIndex === activeIndex;

            return (
              <li
                key={item.value === "" ? "__any__" : item.value}
                id={`${listboxId}-option-${listIndex}`}
                role="option"
                aria-selected={isSelected}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  className={[
                    "w-full px-3 py-2 text-left text-sm text-foreground",
                    highlighted || isSelected
                      ? "bg-surface"
                      : "hover:bg-surface/80",
                  ].join(" ")}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(item)}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
