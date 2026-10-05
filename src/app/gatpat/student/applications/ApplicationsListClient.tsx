"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type App = { id: string; eventName: string; academicYear: number; examRound: string; sourceType: string; status: string; eventDate: string; location: string; province: string };
type Result = { student: { firstName: string; lastName: string }; applications: App[] };

const statusLabel: Record<string, string> = { REGISTERED: "ยืนยันสิทธิ์สำเร็จ", PAID: "ชำระเงินแล้ว", CANCELLED: "ยกเลิกแล้ว", COMPLETED: "ดำเนินการแล้ว" };

export default function ApplicationsListClient({ identifier }: { identifier: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!identifier) {
      setError("ไม่พบเลขบัตรหรือรหัสผู้สมัคร กรุณากลับไปค้นหาข้อมูล");
      setLoading(false);
      return;
    }
    fetch("/api/gatpat/portal/search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identifier }) })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.message || "ไม่พบข้อมูลผู้สมัคร"); if (active) setResult(body); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "ไม่สามารถโหลดรายการสมัครได้"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [identifier]);

  return <main className="min-h-screen bg-[#fcfaf7] pb-20 font-kanit">
    <header className="bg-[#1e1b4b] px-4 pb-24 pt-16 text-center"><div className="mx-auto max-w-4xl"><span className="inline-block rounded-full bg-gradient-red px-5 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-lg">My Applications</span><h1 className="mb-2 mt-4 text-3xl font-extrabold text-gradient-gold md:text-4xl">รายการการสมัครของฉัน</h1><p className="text-sm italic text-blue-100/60">ตรวจสอบข้อมูลสนามสอบและรายงานผลสอบรายบุคคล</p></div></header>
    <div className="container mx-auto -mt-12 max-w-4xl px-4">
      {loading && <section className="premium-light-card rounded-3xl p-10 text-center text-gray-500">กำลังโหลดรายการสมัคร…</section>}
      {!loading && error && <section role="alert" className="premium-light-card rounded-3xl p-10 text-center"><p className="font-bold text-red-600">{error}</p><Link href="/gatpat/student/search" className="mt-6 inline-block rounded-xl bg-gradient-red px-8 py-3 font-bold text-white">กลับไปหน้าค้นหา</Link></section>}
      {!loading && result && <div className="grid grid-cols-1 gap-6">
        <div className="mb-2 text-center md:hidden"><p className="font-bold text-[#1e1b4b]">คุณ{result.student.firstName} {result.student.lastName}</p><p className="text-xs text-gray-400">รหัสผู้สมัคร / เลขบัตร: {identifier}</p></div>
        {result.applications.length === 0 ? <section className="premium-light-card rounded-[2.5rem] border-2 border-dashed border-gray-200 p-12 text-center"><div className="mb-4 text-5xl">📋</div><h2 className="mb-2 text-xl font-bold text-gray-800">ไม่พบข้อมูลการสมัคร</h2><p className="mb-8 text-gray-500">รหัสผู้สมัครหรือเลขบัตรนี้ยังไม่มีรายการสมัครในระบบ</p><Link href="/gatpat/student/search" className="inline-block rounded-xl bg-gradient-red px-8 py-3 font-bold text-white shadow-lg">กลับไปหน้าค้นหา</Link></section> : result.applications.map((app) => <article key={app.id} className="premium-light-card group rounded-3xl border-l-[12px] border-l-gold p-6 transition-all duration-300 hover:shadow-2xl md:p-8"><div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"><div className="flex-1"><span className={`mb-2 inline-flex rounded px-2 py-0.5 text-[10px] font-black uppercase ${app.sourceType === "SIMULATED_EXCEL" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>{app.sourceType === "SIMULATED_EXCEL" ? "SIMULATED EXAM" : "ONSITE REVIEW"}</span><h2 className="text-2xl font-bold text-[#1e1b4b] transition-colors group-hover:text-gold-dark">{app.eventName}</h2><p className="mt-1 font-mono text-xs text-gray-400">APP ID: {app.id}</p><div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-gold-dark">วันที่จัดกิจกรรม</p><p className="font-bold text-gray-700">{new Date(app.eventDate).toLocaleDateString("th-TH-u-ca-buddhist", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "numeric" })}</p></div><div className="md:col-span-2"><p className="text-[10px] font-bold uppercase tracking-widest text-gold-dark">สถานที่ / จังหวัด</p><p className="font-bold text-gray-700">📍 {app.location} {app.province ? `(${app.province})` : ""}</p></div></div><p className="mt-2 text-xs text-gray-500">ปีการศึกษา {app.academicYear.toLocaleString("th-TH")} · {app.examRound}</p></div><div className="flex w-full flex-col items-end gap-4 border-t pt-4 md:w-auto md:border-t-0 md:pt-0"><span className="flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-[10px] font-bold text-emerald-600 shadow-sm">✓ {statusLabel[app.status] ?? app.status}</span><Link href={`/gatpat/student/applications/${app.id}`} className="w-full rounded-2xl bg-[#1e1b4b] px-8 py-3 text-center font-bold text-white shadow-lg transition-all hover:bg-gold-dark active:scale-95 md:w-auto">ดูรายละเอียด →</Link></div></div></article>)}
        <div className="mt-4 text-center"><Link href="/gatpat/student/search" className="inline-flex items-center justify-center gap-2 text-sm font-bold text-gray-400 transition-colors hover:text-red-expo"> ค้นหาด้วยเลขบัตรอื่น</Link></div>
      </div>}
    </div>
  </main>;
}
