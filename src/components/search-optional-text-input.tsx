"use client";

import { useState } from "react";

import {
  mergeInputClassForMobileClear,
  MobileClearTextField,
} from "@/components/mobile-text-field-clear";

type SearchOptionalTextInputProps = {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  clearLabel: string;
};

/** Optional search filter text field with the same mobile clear control as keywords. */
export function SearchOptionalTextInput({
  id,
  name,
  defaultValue = "",
  placeholder,
  className,
  clearLabel,
}: SearchOptionalTextInputProps) {
  const [value, setValue] = useState(defaultValue);

  const showClear = value.length > 0;

  return (
    <MobileClearTextField
      value={value}
      clearLabel={clearLabel}
      onClear={() => setValue("")}
    >
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        className={mergeInputClassForMobileClear(className, showClear)}
        onChange={(event) => setValue(event.target.value)}
      />
    </MobileClearTextField>
  );
}
