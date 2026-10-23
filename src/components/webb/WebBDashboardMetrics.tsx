"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LuCheck, LuChevronDown, LuChevronRight, LuDownload, LuFilter } from "react-icons/lu";
import WebBThaiDatePicker from "./WebBThaiDatePicker";
import WebBAdminTable from "./WebBAdminTable";
import { formatThaiDate, toDateInputValue } from "./data";
import WebBTrendChart, { type TrendMetric, type TrendPoint } from "./WebBTrendChart";
import { readAdminMockPurchases } from "./webb-admin-mock-store";
import type { DemoOrder as Order, DemoStudent as Student } from "./WebBAdminDemo";

type Metric = "gmv" | "units" | "sku" | "orders";
const metrics: { id: Metric; label: string; color: string }[] = [
  { id: "gmv", label: "GMV", color: "#0d9488" },
  { id: "units", label: "สินค้าที่ขายได้", color: "#2563eb" },
  { id: "sku", label: "คำสั่งซื้อ SKU", color: "#9333ea" },
  { id: "orders", label: "คำสั่งซื้อ", color: "#ea580c" },
];
const mockChange: Record<Metric, number> = { gmv: 17.7, units: -13.47, sku: 12.83, orders: -15.59 };
const baht = (n: number) => `${n.toLocaleString("th-TH", { maximumFractionDigits: 2, minimumFractionDigits: 2 })} บาท`;
const inRange = (day: string, from: string, to: string) => (!from || day >= from) && (!to || day <= to);
const family = (product: string) => ["TGAT", "TPAT", "A-Level", "NETSAT"].find((name) => product.toUpperCase().includes(name.toUpperCase())) || "อื่นๆ";
const values = (rows: Order[]) => {
  const paid = rows.filter((row) => row.status === "สำเร็จ");
  return { gmv: paid.reduce((sum, row) => sum + row.charged, 0), units: paid.length, sku: new Set(paid.map((row) => row.product)).size, orders: rows.length };
};

export default function WebBDashboardMetrics({ orders, students, onOrderDetail }: { orders: Order[]; students: Student[]; onOrderDetail: (order: Order) => void }) {
  const today = new Date();
  const [from, setFrom] = useState(toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [to, setTo] = useState(toDateInputValue(today));
  const [compareFrom, setCompareFrom] = useState("");
  const [compareTo, setCompareTo] = useState("");
  const [product, setProduct] = useState("");
  const [tableMode, setTableMode] = useState<"orders" | "applicants">("orders");
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showFilters) return;
    const closeOnOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [showFilters]);
  const purchases = readAdminMockPurchases();
  const citizenIdFor = (name: string) => {
    const purchase = purchases.find((row) => `${row.profileSnapshot?.firstName || ""} ${row.profileSnapshot?.lastName || ""}`.trim() === name);
    return purchase?.profileSnapshot?.citizenId || "ไม่มีข้อมูลเลขบัตร";
  };
  const current = orders.filter((row) => inRange(row.day, from, to));
  const previous = compareFrom && compareTo ? orders.filter((row) => inRange(row.day, compareFrom, compareTo)) : [];
  const tableRows = useMemo(
    () => current.filter((row) => !product || family(row.product) === product),
    [current, product],
  );
  const currentValues = values(current);
  const previousValues = values(previous);
  const days = from && to && from <= to ? Array.from({ length: Math.floor((new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / 86400000) + 1 }, (_, index) => {
    const date = new Date(`${from}T12:00:00`);
    date.setDate(date.getDate() + index);
    return toDateInputValue(date);
  }) : [];
  const compareDays = compareFrom && compareTo && compareFrom <= compareTo ? Array.from({ length: Math.floor((new Date(`${compareTo}T12:00:00`).getTime() - new Date(`${compareFrom}T12:00:00`).getTime()) / 86400000) + 1 }, (_, index) => {
    const date = new Date(`${compareFrom}T12:00:00`);
    date.setDate(date.getDate() + index);
    return toDateInputValue(date);
  }) : [];
  const chartData = days.map((day, index) => {
    const todayValues = values(current.filter((row) => row.day === day));
    const priorValues = compareDays[index] ? values(previous.filter((row) => row.day === compareDays[index])) : null;
    return { day, compareDay: compareDays[index], ...todayValues, compareGmv: priorValues?.gmv, compareUnits: priorValues?.units, compareSku: priorValues?.sku, compareOrders: priorValues?.orders };
  });
  const chartMetrics: TrendMetric[] = metrics.map((metric) => {
    const value = currentValues[metric.id];
    const previousValue = previousValues[metric.id];
    const hasComparison = Boolean(compareFrom && compareTo);
    return {
      ...metric,
      axis: metric.id === "gmv" ? "money" : "count",
      value: metric.id === "gmv" ? baht(value) : value.toLocaleString("th-TH"),
      defaultSelected: metric.id === "gmv" || metric.id === "units",
      change: hasComparison
        ? previousValue
          ? ((value - previousValue) / previousValue) * 100
          : undefined
        : mockChange[metric.id],
      ...(compareDays.length ? { comparisonKey: `compare${metric.id.charAt(0).toUpperCase()}${metric.id.slice(1)}` } : {}),
    };
  });
  const download = () => {
    const lines = tableMode === "orders"
      ? [["วันที่", "เลขคำสั่งซื้อ", "ผู้สมัคร", "สินค้า", "ยอดเรียกเก็บ", "สถานะ"], ...tableRows.map((row) => [row.day, row.ref, row.student, row.product, String(row.charged), row.status])]
      : [["รหัสผู้สมัคร", "ชื่อผู้สมัคร", "เลขบัตรประชาชน", "อีเมล", "ระดับชั้น", "สถานะ"], ...students.map((student) => [student.id, student.name, citizenIdFor(student.name), student.email, student.grade, student.status])];
    const csv = "\uFEFF" + lines.map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "webb-dashboard-mock.csv"; link.click(); URL.revokeObjectURL(url);
  };
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="mr-auto"><h3 className="text-base font-bold text-slate-900">ตัวชี้วัดที่สำคัญ</h3><p className="text-xs text-slate-500">อัปเดตจากข้อมูล Mockup ในเบราว์เซอร์</p></div>
      <span className="text-xs font-semibold text-slate-500">ช่วงวันที่</span>
      <WebBThaiDatePicker label="เริ่มต้น" value={from} max={to || undefined} onChange={setFrom} className="!min-w-0 w-36 [&_.wb-flatpickr-label]:sr-only" />
      <span className="text-slate-400">–</span>
      <WebBThaiDatePicker label="สิ้นสุด" value={to} min={from || undefined} onChange={setTo} className="!min-w-0 w-36 [&_.wb-flatpickr-label]:sr-only" />
      <span className="text-xs font-semibold text-slate-500">เปรียบเทียบ</span>
      <WebBThaiDatePicker label="เริ่มต้นเปรียบเทียบ" value={compareFrom} max={compareTo || undefined} onChange={setCompareFrom} className="!min-w-0 w-36 [&_.wb-flatpickr-label]:sr-only" />
      <span className="text-slate-400">–</span>
      <WebBThaiDatePicker label="สิ้นสุดเปรียบเทียบ" value={compareTo} min={compareFrom || undefined} onChange={setCompareTo} className="!min-w-0 w-36 [&_.wb-flatpickr-label]:sr-only" />
    </div>
    <WebBTrendChart data={chartData as TrendPoint[]} metrics={chartMetrics} ariaLabel="กราฟเส้นแสดงตัวชี้วัดตามช่วงวันที่ที่เลือก" />
    <div className="rounded-xl border border-slate-200 bg-white p-4">
    <WebBAdminTable
      rows={(tableMode === "orders" ? tableRows : students) as (Order | Student)[]}
      toolbarBeforeSearch
      toolbar={<div className="flex shrink-0 flex-nowrap items-center gap-2"><b className="mr-1 whitespace-nowrap text-sm">{tableMode === "orders" ? "รายการคำสั่งซื้อ" : "รายการผู้สมัคร"}</b><div ref={filterRef} className="relative"><button type="button" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold"><LuFilter /> ตัวกรอง</button>{showFilters && <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-xl"><h4 className="border-b border-slate-200 pb-3 text-base font-bold">ตัวกรอง</h4><button type="button" aria-expanded={productMenuOpen} onClick={() => setProductMenuOpen(!productMenuOpen)} className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left text-sm hover:bg-slate-50"><span>หมวดหมู่สินค้า{product && <small className="ml-2 text-indigo-600">{product}</small>}</span>{productMenuOpen ? <LuChevronDown className="size-4 text-slate-400" /> : <LuChevronRight className="size-4 text-slate-400" />}</button>{productMenuOpen && <div className="mb-1 ml-3 border-l-2 border-indigo-100 pl-2">{["TGAT", "TPAT", "A-Level", "NETSAT"].map((option) => <button key={option} type="button" onClick={() => { setProduct(product === option ? "" : option); setTableMode("orders"); }} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50">{option}{product === option && <LuCheck className="size-4 text-indigo-600" />}</button>)}</div>}<button type="button" onClick={() => { setTableMode("orders"); setShowFilters(false); }} className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left text-sm hover:bg-slate-50">คำสั่งซื้อ<LuChevronRight className="size-4 text-slate-400" /></button><button type="button" onClick={() => { setTableMode("applicants"); setShowFilters(false); }} className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left text-sm hover:bg-slate-50">ผู้สมัคร<LuChevronRight className="size-4 text-slate-400" /></button></div>}</div><button type="button" onClick={download} className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-sm"><LuDownload /> ดาวน์โหลด CSV</button></div>}
      onExportCsv={download}
      hideCsvExport
      getSearchText={(row) => "ref" in row ? `${row.ref} ${row.student} ${citizenIdFor(row.student)} ${row.product} ${row.status}` : `${row.id} ${row.name} ${citizenIdFor(row.name)} ${row.email} ${row.grade} ${row.status}`}
      ariaLabel={tableMode === "orders" ? "ตารางรายการคำสั่งซื้อ" : "ตารางรายการผู้สมัคร"}
      searchPlaceholder={tableMode === "orders" ? "ค้นหาคำสั่งซื้อ" : "ค้นหาผู้สมัคร ชื่อ หรือเลขบัตรประชาชน"}
      emptyMessage={tableMode === "orders" ? "ไม่พบรายการคำสั่งซื้อ" : "ไม่พบข้อมูลผู้สมัคร"}
      resetKey={`${from}${to}${product}${tableMode}`}
    >
      {(rows) => tableMode === "orders" ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b bg-slate-50">{["วันที่", "เลขคำสั่งซื้อ", "ผู้สมัคร", "เลขบัตรประชาชน", "สินค้า", "ยอดเรียกเก็บ", "สถานะ", "รายละเอียด"].map((head) => <th key={head} className="p-3">{head}</th>)}</tr></thead><tbody>{(rows as unknown as Order[]).map((row) => <tr key={row.ref} className="border-b"><td className="p-3">{formatThaiDate(row.day)}</td><td className="p-3 font-semibold">{row.ref}</td><td className="p-3">{row.student}</td><td className="p-3">{citizenIdFor(row.student)}</td><td className="p-3">{row.product}</td><td className="p-3">{baht(row.charged)}</td><td className="p-3">{row.status}</td><td className="p-3"><button type="button" onClick={() => onOrderDetail(row)} className="rounded-lg border px-2 py-1">ดูรายการ</button></td></tr>)}</tbody></table></div> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b bg-slate-50">{["รหัสผู้สมัคร", "ชื่อผู้สมัคร", "เลขบัตรประชาชน", "อีเมล", "ระดับชั้น", "สถานะ"].map((head) => <th key={head} className="p-3">{head}</th>)}</tr></thead><tbody>{(rows as unknown as Student[]).map((row) => <tr key={row.id} className="border-b"><td className="p-3">{row.id}</td><td className="p-3 font-semibold">{row.name}</td><td className="p-3">{citizenIdFor(row.name)}</td><td className="p-3">{row.email}</td><td className="p-3">{row.grade}</td><td className="p-3">{row.status}</td></tr>)}</tbody></table></div>}
    </WebBAdminTable>
    </div>
  </div>;
}
