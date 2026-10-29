"use client";

import { useState } from "react";

import {
  mergeInputClassForMobileClear,
  MobileClearTextField,
} from "@/components/mobile-text-field-clear";

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

  const showClear = value.length > 0;

  return (
    <MobileClearTextField
      value={value}
      clearLabel="Clear keywords"
      onClear={() => setValue("")}
    >
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
        enterKeyHint="search"
        className={mergeInputClassForMobileClear(className, showClear)}
        onChange={(event) => setValue(event.target.value)}
      />
    </MobileClearTextField>
  );
}
