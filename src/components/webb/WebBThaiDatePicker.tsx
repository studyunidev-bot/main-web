"use client";

import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import { Thai } from "flatpickr/dist/l10n/th.js";
import type { Instance } from "flatpickr/dist/types/instance";
import { LuCalendarDays, LuX } from "react-icons/lu";
import { twMerge } from "tailwind-merge";
import WebBAdminInput from "./WebBAdminInput";

flatpickr.localize(Thai);

function parseDateValue(value?: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12);
}

export default function WebBThaiDatePicker({
  label,
  value,
  onChange,
  min,
  max,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<Instance | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!inputRef.current) return;

    const picker = flatpickr(inputRef.current, {
      locale: Thai,
      dateFormat: "j M Y",
      ariaDateFormat: "j F Y",
      defaultDate: parseDateValue(value),
      minDate: parseDateValue(min),
      maxDate: parseDateValue(max),
      allowInput: false,
      disableMobile: true,
      monthSelectorType: "dropdown",
      position: "auto left",
      onChange: (dates, _dateString, instance) => {
        onChangeRef.current(dates[0] ? instance.formatDate(dates[0], "Y-m-d") : "");
      },
      onReady: (_dates, _dateString, instance) => {
        instance.calendarContainer.classList.add("wb-flatpickr-calendar");
      },
    });

    pickerRef.current = picker;
    return () => {
      picker.destroy();
      pickerRef.current = null;
    };
  }, [label]);

  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return;
    const currentValue = picker.selectedDates[0]
      ? picker.formatDate(picker.selectedDates[0], "Y-m-d")
      : "";
    if (currentValue === value) return;
    const nextDate = parseDateValue(value);
    if (nextDate) picker.setDate(nextDate, false);
    else picker.clear(false);
  }, [value]);

  useEffect(() => {
    pickerRef.current?.set({
      minDate: parseDateValue(min),
      maxDate: parseDateValue(max),
    });
  }, [min, max]);

  return (
    <div className={twMerge(`grid min-w-[220px] gap-1.5 ${className || ""}`)}>
      <span className="wb-flatpickr-label">{label}</span>
      <div className="wb-flatpickr-control">
        <WebBAdminInput
          ref={inputRef}
          className="cursor-pointer pr-20"
          placeholder="เลือกวันที่"
          aria-label={label}
          readOnly
        />
        {value && (
          <button
            type="button"
            className="wb-flatpickr-clear"
            aria-label={`ล้าง${label}`}
            onClick={() => onChange("")}
          >
            <LuX aria-hidden="true" />
          </button>
        )}
        <LuCalendarDays className="wb-flatpickr-icon" aria-hidden="true" />
      </div>
    </div>
  );
}
