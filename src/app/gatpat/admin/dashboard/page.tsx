"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ThaiDatePicker from "@/components/Gatpat/ThaiDatePicker";

type Dashboard = {
  currentAcademicYear: number; totalEnrollments: number; checkedInCount: number; notCheckedInCount: number;
  averageTgat: number | null; activeSessions: Array<{ id: string; name: string; startedAt: string; examRound: string; examLocation?: { name: string; province: string | null } | null }>;
  hourlyCheckIns: Array<{ locationName: string; hour: string; total: number }>;
  topLocations: Array<{ name: string; total: number }>; activeLocationCount: number; pendingForfeits: number;
};

function todayValue() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function dateStart(value: string) { return new Date(`${value}T00:00:00+07:00`).toISOString(); }
function dateEnd(value: string) { return new Date(`${value}T23:59:59.999+07:00`).toISOString(); }

const cardClass = "rounded-xl border border-stroke bg-white p-5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark";

export default function GatpatDashboardPage() {
  const [from, setFrom] = useState(todayValue);
  const [to, setTo] = useState(todayValue);
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (background = false) => {
    if (from && to && from > to) { setError("วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด"); return; }
    if (!background) setLoading(true);
    try {
      const query = new URLSearchParams({ academicYear: String(new Date().getFullYear() + 543) });
      if (from) query.set("from", dateStart(from));
      if (to) query.set("to", dateEnd(to));
      const response = await fetch(`/api/gatpat/admin/dashboard?${query}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "โหลด Dashboard ไม่สำเร็จ");
      setData(body); setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "โหลด Dashboard ไม่สำเร็จ"); }
    finally { if (!background) setLoading(false); }
  }, [from, to]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(true); }, 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const maxHourly = useMemo(() => Math.max(1, ...((data?.hourlyCheckIns ?? []).map((row) => row.total))), [data]);
  const stats = [
    ["ใบสมัครทั้งหมด", data?.totalEnrollments.toLocaleString("th-TH") ?? "—", "ในปีการศึกษาที่เลือก"],
    ["เช็คอินสำเร็จ", data?.checkedInCount.toLocaleString("th-TH") ?? "—", `ยังไม่เช็คอิน ${data?.notCheckedInCount.toLocaleString("th-TH") ?? "—"} คน`],
    ["คะแนนเฉลี่ย TGAT", data?.averageTgat == null ? "—" : Number(data.averageTgat).toFixed(2), "จากข้อมูลคะแนนในระบบ"],
    ["รอบ Check-in ที่เปิดอยู่", data?.activeSessions.length.toLocaleString("th-TH") ?? "—", `${data?.activeLocationCount ?? 0} สนามสอบที่เปิดใช้`],
    ["คำขอสละสิทธิ์รอตรวจ", data?.pendingForfeits.toLocaleString("th-TH") ?? "—", "รอเจ้าหน้าที่ดำเนินการ"],
  ];

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="mt-1 text-2xl font-bold text-dark dark:text-white">Dashboard</h1><p className="mt-1 text-sm text-dark-6 dark:text-dark-5">ภาพรวมปีการศึกษา {data?.currentAcademicYear.toLocaleString("th-TH") ?? (new Date().getFullYear() + 543).toLocaleString("th-TH")} · รีเฟรชทุก 30 วินาที</p></div>
      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-stroke bg-white p-3 shadow-1 dark:border-stroke-dark dark:bg-gray-dark" onSubmit={(event) => { event.preventDefault(); void load(); }}>
        <label className="grid gap-1 text-xs font-medium text-dark-6">ตั้งแต่<ThaiDatePicker label="วันที่เริ่มต้น" value={from} max={to || undefined} onChange={setFrom} /></label>
        <label className="grid gap-1 text-xs font-medium text-dark-6">ถึง<ThaiDatePicker label="วันที่สิ้นสุด" value={to} min={from || undefined} onChange={setTo} /></label>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90" type="submit">ค้นหาข้อมูล</button>
      </form>
    </div>

    {error && <div role="alert" className="rounded-lg border border-red/30 bg-red/5 p-4 text-sm text-red">{error}</div>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{stats.map(([label, value, hint]) => <article key={label} className={cardClass}><p className="text-sm text-dark-6 dark:text-dark-5">{label}</p><p className="mt-3 text-3xl font-bold text-dark dark:text-white">{loading ? "…" : value}</p><p className="mt-2 text-xs text-dark-6 dark:text-dark-5">{hint}</p></article>)}</section>

    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <section className={cardClass}><div className="flex items-center justify-between gap-2"><div><h2 className="font-semibold text-dark dark:text-white">สถิติการเช็คอินรายชั่วโมง</h2><p className="mt-1 text-xs text-dark-6 dark:text-dark-5">แยกตามสนามสอบ · สูงสุด 24 ช่วงเวลาล่าสุด</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{data?.hourlyCheckIns.length ?? 0} รายการ</span></div>
        <div className="mt-5 space-y-4">{data?.hourlyCheckIns.length ? data.hourlyCheckIns.map((row, i) => <div key={`${row.locationName}-${row.hour}-${i}`}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="truncate font-medium text-dark dark:text-white">{row.locationName} · {new Date(row.hour).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "short", hour: "2-digit", minute: "2-digit" })}</span><span className="font-semibold text-primary">{row.total.toLocaleString("th-TH")}</span></div><div className="h-2 overflow-hidden rounded-full bg-gray-2 dark:bg-dark-2"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, row.total / maxHourly * 100)}%` }} /></div></div>) : <p className="rounded-lg border border-dashed border-stroke p-8 text-center text-sm text-dark-6">ไม่มีรายการเช็คอินในช่วงวันที่นี้</p>}</div>
      </section>
      <section className={cardClass}><h2 className="font-semibold text-dark dark:text-white">สนามสอบที่มีการเช็คอินสูงสุด</h2><div className="mt-4 divide-y divide-stroke dark:divide-stroke-dark">{data?.topLocations.length ? data.topLocations.map((row, i) => <div key={row.name} className="flex items-center gap-3 py-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{i + 1}</span><span className="flex-1 text-sm font-medium text-dark dark:text-white">{row.name}</span><span className="text-sm font-bold text-dark dark:text-white">{row.total.toLocaleString("th-TH")}</span></div>) : <p className="py-8 text-center text-sm text-dark-6">ยังไม่มีข้อมูลสนามสอบ</p>}</div></section>
    </div>

    <section className={cardClass}><div className="flex items-center justify-between"><div><h2 className="font-semibold text-dark dark:text-white">Check-in sessions ที่เปิดอยู่</h2><p className="mt-1 text-xs text-dark-6">แสดง session ในปีการศึกษาที่เลือก</p></div><span className="rounded-full bg-green/10 px-3 py-1 text-xs font-semibold text-green">{data?.activeSessions.length ?? 0} เปิดอยู่</span></div>
      {data?.activeSessions.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{data.activeSessions.map((session) => <article key={session.id} className="rounded-lg border border-stroke p-4 dark:border-stroke-dark"><p className="font-semibold text-dark dark:text-white">{session.name}</p><p className="mt-1 text-sm text-dark-6">{session.examLocation?.name ?? "ไม่ระบุสนาม"}{session.examLocation?.province ? ` · ${session.examLocation.province}` : ""}</p><p className="mt-2 text-xs text-dark-6">{session.examRound} · เปิด {new Date(session.startedAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</p></article>)}</div> : <p className="mt-4 rounded-lg border border-dashed border-stroke p-6 text-center text-sm text-dark-6">ไม่มี session ที่เปิดอยู่</p>}
    </section>
  </div>;
}
