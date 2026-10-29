"use client";

import { useState } from "react";

import {
  mergeInputClassForMobileClear,
  MobileClearTextField,
} from "@/components/mobile-text-field-clear";

type SearchTextInputProps = {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  clearLabel: string;
  required?: boolean;
  enterKeyHint?: "search" | "done";
};

export function SearchTextInput({
  id,
  name,
  defaultValue = "",
  placeholder,
  className,
  clearLabel,
  required,
  enterKeyHint,
}: SearchTextInputProps) {
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
        required={required}
        enterKeyHint={enterKeyHint}
        className={mergeInputClassForMobileClear(className, showClear)}
        onChange={(event) => setValue(event.target.value)}
      />
    </MobileClearTextField>
  );
}
