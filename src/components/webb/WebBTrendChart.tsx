"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatThaiDate } from "./data";

export type TrendAxis = "money" | "count" | "smallMoney";
export type TrendMetric = {
  id: string;
  label: string;
  color: string;
  axis: TrendAxis;
  value: string;
  defaultSelected?: boolean;
  change?: number;
  comparisonKey?: string;
};
export type TrendPoint = { day: string; [key: string]: string | number | undefined };

const baht = (value: number) => `฿${value >= 1000 ? `${Math.round(value / 1000)}K` : value.toLocaleString("th-TH")}`;

export default function WebBTrendChart({ data, metrics, ariaLabel }: {
  data: TrendPoint[];
  metrics: TrendMetric[];
  ariaLabel: string;
}) {
  const [selected, setSelected] = useState(() => metrics.filter((metric) => metric.defaultSelected).map((metric) => metric.id));
  const activeMetrics = metrics.filter((metric) => selected.includes(metric.id));
  const secondaryAxisType = activeMetrics.find((metric) => metric.axis !== "money")?.axis;
  const toggle = (id: string) => setSelected((current) => {
    if (current.includes(id)) return current.length > 1 ? current.filter((item) => item !== id) : current;
    return [...current, id];
  });

  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const active = selected.includes(metric.id);
        return <button key={metric.id} type="button" aria-pressed={active} onClick={() => toggle(metric.id)} className={`min-h-20 rounded-md border-l-[3px] px-3 py-2 text-left transition-colors ${active ? "border-indigo-600 bg-slate-100" : "border-transparent bg-white hover:bg-slate-50"}`}>
          <span className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700"><span>{metric.label}</span><span className={`grid size-4 place-items-center rounded border text-[10px] ${active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"}`}>{active ? "✓" : ""}</span></span>
          <span className="mt-3 flex flex-wrap items-baseline gap-1"><b className="text-lg text-slate-900">{metric.value}</b>{metric.change !== undefined && <small className={`${metric.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{metric.change >= 0 ? "▲" : "▼"} {Math.abs(metric.change).toFixed(2)}%</small>}</span>
        </button>;
      })}
    </div>
    <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
      {activeMetrics.map((metric) => <span key={metric.id} className="inline-flex items-center gap-1"><span className="inline-block w-4 border-t-2" style={{ borderColor: metric.color }} />{metric.label}</span>)}
      {activeMetrics.some((metric) => metric.comparisonKey) && <span>เส้นประ = ช่วงเปรียบเทียบ</span>}
    </div>
    <div className="mt-3 h-64 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="day" tickFormatter={(day: string) => formatThaiDate(day).replace(/\s*พ\.ศ\..*/, "")} tick={{ fontSize: 11, fill: "#6b7280" }} minTickGap={18} tickLine={false} axisLine={{ stroke: "#d1d5db" }} />
          <YAxis yAxisId="money" tickFormatter={baht} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} width={52} />
          {secondaryAxisType && <YAxis yAxisId="secondary" orientation="right" tickFormatter={secondaryAxisType === "count" ? (value: number) => value.toLocaleString("th-TH") : baht} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} width={48} />}
          <Tooltip labelFormatter={(day) => String(day)} formatter={(value, name) => {
            const metric = metrics.find((item) => name === item.label || name === `${item.label} (เปรียบเทียบ)`);
            const formatted = metric?.axis === "count" ? Number(value).toLocaleString("th-TH") : `${Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;
            return [formatted, name];
          }} contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", boxShadow: "0 8px 24px #0f172a18", fontSize: 12 }} />
          {activeMetrics.flatMap((metric) => [
            <Line key={metric.id} type="linear" dataKey={metric.id} name={metric.label} yAxisId={metric.axis === "money" ? "money" : "secondary"} stroke={metric.color} strokeWidth={2} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />,
            ...(metric.comparisonKey ? [<Line key={`${metric.id}-comparison`} type="linear" dataKey={metric.comparisonKey} name={`${metric.label} (เปรียบเทียบ)`} yAxisId={metric.axis === "money" ? "money" : "secondary"} stroke={metric.color} strokeWidth={1.5} strokeDasharray="5 4" strokeOpacity={0.6} dot={false} isAnimationActive={false} />] : []),
          ])}
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>;
}
