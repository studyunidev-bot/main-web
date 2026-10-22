"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import AdminSelect from "@/components/ui/AdminSelect";
import WebBAdminInput from "./WebBAdminInput";

export const adminTableHeadClass =
  "whitespace-nowrap bg-slate-50 px-3 py-3 text-left text-xs font-bold text-slate-500";
export const adminTableCellClass =
  "border-t border-slate-100 px-3 py-3 align-middle text-sm text-slate-700";

export default function WebBAdminTable<T>({
  rows,
  getSearchText,
  children,
  toolbar,
  emptyMessage = "ไม่พบรายการ",
  searchPlaceholder = "ค้นหาในรายการ",
  ariaLabel = "ตารางข้อมูล",
  pageSize: initialPageSize = 10,
  resetKey = "",
  hideSearch = false,
}: {
  rows: T[];
  getSearchText: (row: T) => string;
  children: (pageRows: T[]) => ReactNode;
  toolbar?: ReactNode;
  emptyMessage?: string;
  searchPlaceholder?: string;
  ariaLabel?: string;
  pageSize?: number;
  resetKey?: string;
  hideSearch?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(String(initialPageSize));
  const [page, setPage] = useState(0);
  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("th-TH");
    if (!normalized) return rows;
    return rows.filter((row) =>
      getSearchText(row).toLocaleLowerCase("th-TH").includes(normalized),
    );
  }, [getSearchText, query, rows]);
  const size = Number(pageSize);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / size));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * size;
  const pageRows = filteredRows.slice(start, start + size);
  const visiblePages = (() => {
    const pages = new Set<number>([0, pageCount - 1]);
    for (
      let index = Math.max(0, currentPage - 1);
      index <= Math.min(pageCount - 1, currentPage + 1);
      index += 1
    ) {
      pages.add(index);
    }
    return [...pages].sort((left, right) => left - right);
  })();

  useEffect(() => setPage(0), [query, pageSize, resetKey]);

  return (
    <section aria-label={ariaLabel} className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {!hideSearch && (
          <WebBAdminInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="min-w-[210px] flex-1"
          />
        )}
        {toolbar}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {children(pageRows)}
      </div>
      {filteredRows.length === 0 && (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          {emptyMessage}
        </p>
      )}
      <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <span>แสดง</span>
          <div className="w-24">
            <AdminSelect
              value={pageSize}
              onChange={setPageSize}
              ariaLabel="จำนวนรายการต่อหน้า"
              options={[10, 20, 50].map((value) => ({
                value: String(value),
                label: value + " รายการ",
              }))}
            />
          </div>
          <span>
            {filteredRows.length
              ? (start + 1).toLocaleString("th-TH") + "–" +
                Math.min(start + size, filteredRows.length).toLocaleString("th-TH") +
                " จาก " + filteredRows.length.toLocaleString("th-TH")
              : "0 รายการ"}
          </span>
        </div>
        <nav
          aria-label="เปลี่ยนหน้าตาราง"
          className="flex flex-wrap items-center justify-end gap-1.5"
        >
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => setPage(0)}
            aria-label="ไปหน้าแรก"
            title="ไปหน้าแรก"
            className="min-h-9 rounded-lg border border-slate-200 px-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            «
          </button>
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            aria-label="ไปหน้าก่อนหน้า"
            className="min-h-9 rounded-lg border border-slate-200 px-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            ‹
          </button>
          {visiblePages.map((pageIndex, index) => {
            const previousPage = visiblePages[index - 1];
            const hasGap = previousPage !== undefined && pageIndex - previousPage > 1;
            return (
              <span key={pageIndex} className="contents">
                {hasGap && (
                  <span aria-hidden="true" className="px-1 text-slate-400">
                    …
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`ไปหน้า ${pageIndex + 1}`}
                  aria-current={currentPage === pageIndex ? "page" : undefined}
                  onClick={() => setPage(pageIndex)}
                  className={`min-h-9 min-w-9 rounded-lg border px-2 font-semibold ${
                    currentPage === pageIndex
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageIndex + 1}
                </button>
              </span>
            );
          })}
          <button
            type="button"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
            aria-label="ไปหน้าถัดไป"
            className="min-h-9 rounded-lg border border-slate-200 px-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            ›
          </button>
          <button
            type="button"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage(pageCount - 1)}
            aria-label="ไปหน้าสุดท้าย"
            title="ไปหน้าสุดท้าย"
            className="min-h-9 rounded-lg border border-slate-200 px-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            »
          </button>
          <span className="ml-1 min-w-16 text-center text-xs text-slate-500">
            {currentPage + 1} / {pageCount}
          </span>
        </nav>
      </footer>
    </section>
  );
}
