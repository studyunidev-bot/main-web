"use client";

import { useMemo, useState } from "react";

const weekdays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const inputClass =
  "rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark dark:border-stroke-dark dark:bg-dark-2 dark:text-white";

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day
    ? new Date(Date.UTC(year, month - 1, day, 12))
    : null;
}

function toValue(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export default function ThaiDatePicker({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}) {
  const selectedDate = parseDate(value);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const initial = selectedDate ?? new Date();
    return new Date(
      Date.UTC(initial.getUTCFullYear(), initial.getUTCMonth(), 1, 12),
    );
  });

  const days = useMemo(() => {
    const year = month.getUTCFullYear();
    const monthIndex = month.getUTCMonth();
    const count = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const offset = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
    return [
      ...Array(offset).fill(null),
      ...Array.from(
        { length: count },
        (_, index) => new Date(Date.UTC(year, monthIndex, index + 1, 12)),
      ),
    ];
  }, [month]);

  const displayDate = selectedDate
    ? selectedDate.toLocaleDateString("th-TH-u-ca-buddhist", {
        timeZone: "Asia/Bangkok",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "เลือกวันที่";
  const displayMonth = month.toLocaleDateString("th-TH-u-ca-buddhist", {
    timeZone: "Asia/Bangkok",
    month: "long",
    year: "numeric",
  });

  function shiftMonth(delta: number) {
    setMonth(
      (current) =>
        new Date(
          Date.UTC(
            current.getUTCFullYear(),
            current.getUTCMonth() + delta,
            1,
            12,
          ),
        ),
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`${label}: ${displayDate}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`${inputClass} flex min-h-[42px] w-full items-center justify-between gap-3 text-left`}
      >
        <span>{displayDate}</span>
        <span aria-hidden="true" className="text-primary">
          ▦
        </span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-[min(19rem,calc(100vw-2rem))] rounded-xl border border-stroke bg-white p-3 shadow-2 dark:border-stroke-dark dark:bg-gray-dark">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-lg border border-stroke px-3 py-1.5 text-dark dark:border-stroke-dark dark:text-white"
              aria-label="เดือนก่อนหน้า"
            >
              ‹
            </button>
            <strong className="text-sm text-dark dark:text-white">
              {displayMonth}
            </strong>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-lg border border-stroke px-3 py-1.5 text-dark dark:border-stroke-dark dark:text-white"
              aria-label="เดือนถัดไป"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-dark-6">
            {weekdays.map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
            {days.map((date, index) =>
              date ? (
                <button
                  key={toValue(date)}
                  type="button"
                  disabled={Boolean(
                    (min && toValue(date) < min) ||
                      (max && toValue(date) > max),
                  )}
                  onClick={() => {
                    onChange(toValue(date));
                    setOpen(false);
                  }}
                  className={`rounded-lg py-2 text-sm disabled:cursor-not-allowed disabled:opacity-25 ${value === toValue(date) ? "bg-primary font-semibold text-white" : "text-dark hover:bg-primary/10 dark:text-white"}`}
                >
                  {date.getUTCDate()}
                </button>
              ) : (
                <span key={`blank-${index}`} />
              ),
            )}
          </div>
          <div className="mt-3 flex justify-between border-t border-stroke pt-2 dark:border-stroke-dark">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-xs text-dark-6"
            >
              ล้างวันที่
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-primary"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
