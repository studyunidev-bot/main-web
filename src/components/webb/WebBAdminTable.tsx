"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LuDownload } from "react-icons/lu";
import AdminSelect from "@/components/ui/AdminSelect";
import WebBAdminInput from "./WebBAdminInput";

export const adminTableHeadClass =
  "whitespace-nowrap bg-slate-50 px-3 py-3 text-left text-xs font-bold text-slate-500";
export const adminTableCellClass =
  "border-t border-slate-100 px-3 py-3 align-middle text-sm text-slate-700";

export function downloadCsvData(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
) {
  const escapeCsv = (val: unknown) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };
  const headerLine = headers.map(escapeCsv).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsv).join(","));
  const csvContent = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
  exportCsvFileName,
  exportCsvColumns,
  onExportCsv,
  hideCsvExport = false,
  toolbarBeforeSearch = false,
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
  exportCsvFileName?: string;
  exportCsvColumns?: { header: string; getValue: (row: T) => string | number | boolean | null | undefined }[];
  onExportCsv?: () => void;
  hideCsvExport?: boolean;
  toolbarBeforeSearch?: boolean;
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

  const handleExportCsv = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }
    if (!filteredRows.length) return;

    let headers: string[] = [];
    let dataRows: (string | number | boolean | null | undefined)[][] = [];

    if (exportCsvColumns && exportCsvColumns.length > 0) {
      headers = exportCsvColumns.map((col) => col.header);
      dataRows = filteredRows.map((row) =>
        exportCsvColumns.map((col) => col.getValue(row)),
      );
    } else {
      const firstRow = filteredRows[0];
      if (typeof firstRow === "object" && firstRow !== null) {
        const keys = Object.keys(firstRow).filter((key) => {
          const val = (firstRow as Record<string, unknown>)[key];
          return (
            typeof val === "string" ||
            typeof val === "number" ||
            typeof val === "boolean"
          );
        });
        const keyMap: Record<string, string> = {
          id: "รหัส",
          ref: "เลขอ้างอิง",
          student: "ชื่อผู้เรียน",
          name: "ชื่อ",
          username: "ชื่อผู้ใช้",
          email: "อีเมล",
          phone: "เบอร์โทร",
          product: "วิชา/ข้อสอบ",
          examSet: "ชุดสอบ",
          amount: "ยอดเงิน (บาท)",
          price: "ราคา (บาท)",
          status: "สถานะ",
          payment: "การชำระเงิน",
          date: "วันที่",
          createdAt: "สร้างเมื่อ",
          score: "คะแนน",
          total: "คะแนนรวม",
          reason: "เหตุผล",
          action: "การทำงาน",
          actor: "ผู้ดำเนินการ",
          role: "บทบาท",
          purchaseRef: "เลขอ้างอิงคำสั่งซื้อ",
        };
        headers = keys.map((key) => keyMap[key] || key);
        dataRows = filteredRows.map((row) =>
          keys.map((key) => (row as Record<string, unknown>)[key] as string | number | boolean),
        );
      } else {
        headers = ["ข้อมูล"];
        dataRows = filteredRows.map((row) => [String(row)]);
      }
    }

    const filename =
      exportCsvFileName ||
      `${ariaLabel.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}`;
    downloadCsvData(filename, headers, dataRows);
  };

  useEffect(() => setPage(0), [query, pageSize, resetKey]);

  return (
    <section aria-label={ariaLabel} className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {toolbarBeforeSearch && toolbar}
        {!hideSearch && (
          <WebBAdminInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="min-w-[210px] flex-1"
          />
        )}
        {!toolbarBeforeSearch && toolbar}
        {!hideCsvExport && (
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredRows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            title="ดาวน์โหลดข้อมูลตารางเป็นไฟล์ CSV"
            aria-label="ดาวน์โหลด CSV"
          >
            <LuDownload className="size-4 text-slate-500" />
            <span>ดาวน์โหลด CSV</span>
          </button>
        )}
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
