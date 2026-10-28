"use client";

import AdminSelect from "@/components/ui/AdminSelect";

export default function WebBAdminPagination({
  totalItems,
  pageSize,
  page,
  pageCount,
  onPageChange,
  onPageSizeChange,
  ariaLabel = "เปลี่ยนหน้าตาราง",
}: {
  totalItems: number;
  pageSize: number;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  ariaLabel?: string;
}) {
  const start = page * pageSize;
  const visiblePages = new Set<number>([0, pageCount - 1]);
  for (
    let index = Math.max(0, page - 1);
    index <= Math.min(pageCount - 1, page + 1);
    index += 1
  ) {
    visiblePages.add(index);
  }
  const pages = [...visiblePages].sort((left, right) => left - right);

  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <span>แสดง</span>
        <div className="w-24">
          <AdminSelect
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
            ariaLabel="จำนวนรายการต่อหน้า"
            options={[10, 20, 50].map((value) => ({
              value: String(value),
              label: `${value} รายการ`,
            }))}
          />
        </div>
        <span>
          {totalItems
            ? `${(start + 1).toLocaleString("th-TH")}–${Math.min(
                start + pageSize,
                totalItems,
              ).toLocaleString("th-TH")} จาก ${totalItems.toLocaleString("th-TH")}`
            : "0 รายการ"}
        </span>
      </div>
      <nav
        aria-label={ariaLabel}
        className="flex flex-wrap items-center justify-end gap-1.5"
      >
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(0)}
          aria-label="ไปหน้าแรก"
          title="ไปหน้าแรก"
          className="min-h-9 rounded-lg border border-slate-200 px-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          «
        </button>
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          aria-label="ไปหน้าก่อนหน้า"
          className="min-h-9 rounded-lg border border-slate-200 px-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          ‹
        </button>
        {pages.map((pageIndex, index) => {
          const previousPage = pages[index - 1];
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
                aria-current={page === pageIndex ? "page" : undefined}
                onClick={() => onPageChange(pageIndex)}
                className={`min-h-9 min-w-9 rounded-lg border px-2 font-semibold ${
                  page === pageIndex
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
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))}
          aria-label="ไปหน้าถัดไป"
          className="min-h-9 rounded-lg border border-slate-200 px-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          ›
        </button>
        <button
          type="button"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(pageCount - 1)}
          aria-label="ไปหน้าสุดท้าย"
          title="ไปหน้าสุดท้าย"
          className="min-h-9 rounded-lg border border-slate-200 px-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          »
        </button>
        <span className="ml-1 min-w-16 text-center text-xs text-slate-500">
          {page + 1} / {pageCount}
        </span>
      </nav>
    </footer>
  );
}
