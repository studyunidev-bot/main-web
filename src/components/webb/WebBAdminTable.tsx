"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LuDownload } from "react-icons/lu";
import WebBAdminInput from "./WebBAdminInput";
import WebBAdminPagination from "./WebBAdminPagination";

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
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(0);
  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("th-TH");
    if (!normalized) return rows;
    return rows.filter((row) =>
      getSearchText(row).toLocaleLowerCase("th-TH").includes(normalized),
    );
  }, [getSearchText, query, rows]);
  const size = pageSize;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / size));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * size;
  const pageRows = filteredRows.slice(start, start + size);
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
      <WebBAdminPagination
        totalItems={filteredRows.length}
        pageSize={size}
        page={currentPage}
        pageCount={pageCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </section>
  );
}
