"use client";

import { useEffect, useState } from "react";

type SearchKeywordsInputProps = {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
};

export function SearchKeywordsInput({
  id,
  name,
  defaultValue = "",
  placeholder,
  className,
  required,
}: SearchKeywordsInputProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const showClear = value.length > 0;

  const compactClear = showClear;

  return (
    <div className="relative w-full min-w-0">
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
        enterKeyHint="search"
        className={[
          className,
          compactClear ? "pr-10 md:pr-3" : null,
        ]
          .filter(Boolean)
          .join(" ")}
        onChange={(event) => setValue(event.target.value)}
      />
      {compactClear ? (
        <button
          type="button"
          aria-label="Clear keywords"
          className={[
            "absolute right-1 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center",
            "rounded-md text-xl leading-none text-foreground/75 transition",
            "hover:bg-surface-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            "md:hidden",
          ].join(" ")}
          onClick={() => setValue("")}
        >
          <span aria-hidden>×</span>
        </button>
      ) : null}
    </div>
  );
}
