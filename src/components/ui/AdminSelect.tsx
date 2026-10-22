"use client";

import Select from "react-select";
import { useEffect, useState } from "react";

export type AdminSelectOption = { value: string; label: string };

type AdminSelectProps = {
  options: AdminSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  isClearable?: boolean;
};

export default function AdminSelect({
  options,
  value,
  onChange,
  placeholder = "เลือก...",
  disabled = false,
  className,
  ariaLabel,
  isClearable = false,
}: AdminSelectProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => setPortalTarget(document.body), []);

  return (
    <Select<AdminSelectOption, false>
      unstyled
      options={options}
      value={options.find((option) => option.value === value) ?? null}
      onChange={(option) => onChange(option?.value ?? "")}
      isDisabled={disabled}
      isClearable={isClearable}
      isSearchable
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className}
      menuPortalTarget={portalTarget ?? undefined}
      menuPosition="fixed"
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 10000 }) }}
      classNames={{
        control: ({ isFocused, isDisabled }) => `!flex !min-h-10 !rounded-lg !border !bg-white !shadow-none ${isFocused ? "!border-indigo-500 !ring-2 !ring-indigo-100" : "!border-slate-200"} ${isDisabled ? "!cursor-not-allowed !bg-slate-100 !opacity-60" : "hover:!border-indigo-400"}`,
        valueContainer: () => "!px-3 !py-1",
        singleValue: () => "!text-sm !text-slate-800",
        placeholder: () => "!text-sm !text-slate-400",
        input: () => "!text-sm !text-slate-800",
        indicatorsContainer: () => "!px-1",
        dropdownIndicator: () => "!p-2 !text-slate-400 hover:!text-indigo-700",
        clearIndicator: () => "!p-2 !text-slate-400 hover:!text-rose-600",
        menu: () => "!z-[10000] !mt-1 !overflow-hidden !rounded-lg !border !border-slate-200 !bg-white !shadow-lg",
        menuList: () => "!max-h-64 !p-1",
        option: ({ isFocused, isSelected }) => `!cursor-pointer !rounded-md !px-3 !py-2 !text-sm ${isSelected ? "!bg-indigo-600 !text-white" : isFocused ? "!bg-indigo-50 !text-slate-900" : "!bg-white !text-slate-800"}`,
        noOptionsMessage: () => "!px-3 !py-2 !text-sm !text-slate-500",
      }}
    />
  );
}
