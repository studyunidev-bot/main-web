"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import Barcode from "../../Barcode";

type Detail = {
  student: { name: string; maskedIdentifier: string };
  application: { id: string; academicYear: number; examRound: string; status: string; sourceType: string; barcode: string; location: string; province: string; address: string; dressCode: string; eventDate: string; time: string; forfeitRequest: { status: string } | null };
  scores: Array<{ id: string; examName: string; studentScore: number; rankNationwide: number | null; rankInVenue: number | null; totalNationwide: number; totalInVenue: number }>;
  schedule: Array<{ id: number; time: string; activity: string }>;
  settings: { studentExamHeroBannerUrl: string; lineOALink: string; googleDriveLink: string; facebookPageLink: string };
  scorePopulation: string;
};

const count = (value: number | null) => value == null ? "-" : value.toLocaleString("th-TH");
const scoreNumber = (value: number) => value.toLocaleString("th-TH", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

export default function GatpatApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showScores, setShowScores] = useState(false);
  const [showForfeitForm, setShowForfeitForm] = useState(false);
  const [forfeit, setForfeit] = useState({ reason: "", fullName: "", address: "", phone: "" });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/gatpat/portal/applications/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.message || "ไม่สามารถเปิดข้อมูลได้"); if (active) setDetail(body); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "ไม่สามารถเปิดข้อมูลได้"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function submitForfeit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setMessage("");
    try {
      const response = await fetch(`/api/gatpat/portal/applications/${encodeURIComponent(id)}/forfeit`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(forfeit) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "ส่งคำขอไม่สำเร็จ");
      setMessage(body.message || "ส่งคำขอแล้ว"); setShowForfeitForm(false);
      setDetail((current) => current ? { ...current, application: { ...current.application, forfeitRequest: { status: "PENDING" } } } : current);
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "ส่งคำขอไม่สำเร็จ"); }
    finally { setSubmitting(false); }
  }

  if (loading) return <main className="min-h-screen bg-[#fcfaf7] p-8 text-[#1e1b4b]">กำลังโหลดข้อมูล…</main>;
  if (error || !detail) return <main className="min-h-screen bg-[#fcfaf7] p-8 text-[#1e1b4b]"><Link href="/gatpat/student/search" className="text-[#b8860b] underline">กลับไปค้นหา</Link><p role="alert" className="mt-5">{error || "ไม่พบข้อมูล"}</p></main>;

  const { application, schedule, scores, settings } = detail;
  const isOnsite = application.sourceType === "ONSITE_EXCEL";
  const heroBannerUrl = settings.studentExamHeroBannerUrl.trim() || "/images/student-search-baner.jpeg";
  const hasForfeit = Boolean(application.forfeitRequest);
  return <div className="min-h-screen bg-[#fcfaf7] pb-20">
    <div className="relative overflow-hidden bg-[#0f172a] pb-24 pt-0 md:pb-28 md:pt-8">
      <div className="gatpat-hero-image absolute inset-0 bg-cover bg-no-repeat" style={{ backgroundImage: `url("${heroBannerUrl}")` }} />
      <div className="relative z-10 mx-auto w-full max-w-none px-0 md:container md:max-w-5xl md:px-4"><div className="flex h-96 items-end px-4 md:h-[432px] md:px-0"><div className="pb-8 md:pb-10"><span className="inline-flex rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[.25em] text-white shadow-lg backdrop-blur">TCASEXPO</span></div></div></div>
    </div>

    <div className="container mx-auto -mt-14 max-w-3xl px-4 md:-mt-20">
      <section className="premium-light-card relative mb-6 overflow-hidden rounded-xl p-6">
        <div className="mb-8 flex items-center gap-3"><div className="h-8 w-1.5 rounded-full bg-gold" /><h1 className="text-2xl font-bold text-gray-800">รายละเอียดการสมัคร</h1></div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {!isOnsite && <div className="space-y-1"><p className="text-base font-bold uppercase tracking-wider text-gold-dark">วิชาที่สอบ</p><p className="text-lg font-bold text-gray-800 md:text-xl">TGAT ความถนัดทั่วไป</p></div>}
          <div className="space-y-1"><p className="text-base font-bold uppercase tracking-wider text-gold-dark">{isOnsite ? "วันจัดกิจกรรม" : "วันที่สอบ"}</p><p className="text-lg font-bold text-gray-800 md:text-xl">{new Date(application.eventDate).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "long" })}</p></div>
          <div className="space-y-1 border-t border-gray-50 md:col-span-2"><p className="text-base font-bold uppercase tracking-wider text-gold-dark">{isOnsite ? "สถานที่จัดกิจกรรม" : "สนามสอบ"}</p><p className="text-lg font-bold text-gray-800 md:text-xl">{application.location} {application.province}</p></div>
          {!isOnsite && <div className="space-y-1 border-t border-gray-50 pt-2 md:col-span-2"><p className="text-base font-bold uppercase tracking-wider text-gold-dark">ห้องสอบ</p><p className="text-lg font-bold text-gray-800 md:text-xl">{application.address || "-"}</p></div>}
          <div className="space-y-1 border-t border-gray-50 pt-2 md:col-span-2"><p className="text-base font-bold uppercase tracking-wider text-gold-dark">การแต่งกาย</p><p className="text-lg font-bold text-gray-800 md:text-xl">{application.dressCode}</p></div>
        </div>
      </section>

      <section className="premium-light-card mb-6 rounded-xl p-6">
        {isOnsite && <div className="mb-6 flex items-center gap-3"><div className="h-8 w-1.5 rounded-full bg-gold"/><h2 className="text-2xl font-bold text-gray-800">ตารางกำหนดการจัดกิจกรรม</h2></div>}
        <div className="overflow-hidden rounded-md border border-gold/15 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-full border-collapse text-sm md:text-base"><thead><tr className="bg-[#fff8e7] text-left text-[#6f4b00]"><th className="px-4 py-4 font-black md:px-6">{isOnsite ? "เวลา" : "รอบสอบ"}</th><th className="px-4 py-4 font-black md:px-6">{isOnsite ? "รายละเอียด" : "เวลาสอบ"}</th></tr></thead><tbody className="text-lg md:text-xl">{isOnsite ? schedule.map((item, index) => <tr key={item.id} className={index % 2 ? "bg-[#fffdfa]" : "bg-white"}><td className="whitespace-nowrap border-t border-[#f4ead1] px-4 py-4 align-top font-bold text-[#8a5a00] md:px-6">{item.time}</td><td className="border-t border-[#f4ead1] px-4 py-4 font-semibold leading-7 text-gray-700 md:px-6">{item.activity}</td></tr>) : <tr className="bg-[#fffdfa]"><td className="border-t border-[#f4ead1] px-4 py-4 font-bold md:px-6">{application.examRound}</td><td className="border-t border-[#f4ead1] px-4 py-4 font-semibold md:px-6">{application.time}</td></tr>}</tbody></table></div></div>
      </section>

      <section className="premium-light-card mb-6 rounded-xl border-2 border-gold/10 p-6"><div className="mb-6 text-center"><h2 className="mb-1 text-xl font-bold text-gray-800">BARCODE (สำหรับเข้างาน)</h2><p className="text-sm text-gray-500">กรุณาแสดง BARCODE นี้ต่อเจ้าหน้าที่ ณ จุดลงทะเบียน ในวันกิจกรรม</p></div><div className="flex justify-center overflow-x-auto rounded-2xl border border-gray-50 bg-white p-6 shadow-inner"><Barcode value={application.barcode} /></div></section>

      {!isOnsite && scores.length > 0 && <section className="premium-light-card mb-6 rounded-xl border border-gold/10 bg-gradient-to-b from-white to-[#d4a017]/5 p-3 md:p-8"><div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between md:text-left"><h2 className="text-base font-bold text-gray-800 md:text-xl">รายงานผลการสอบ</h2><button type="button" onClick={() => setShowScores(!showScores)} className="w-full rounded-xl bg-[#1e1b4b] px-6 py-2 font-bold text-gold shadow-lg transition active:scale-95 md:w-auto">{showScores ? "ปิดหน้าจอ" : "ตรวจสอบผลคะแนน"}</button></div>
        {showScores && <div className="mt-6 space-y-5">{scores.map((score) => <div key={score.id} className="overflow-hidden rounded-xl border border-gold/15 bg-white shadow-xl"><div className="border-b border-[#d7bf7b] bg-gradient-to-r from-[#fff7df] via-[#fff1c7] to-[#fff7df] px-4 py-4 text-center"><h3 className="font-black text-[#5c3b00]">{score.examName}</h3></div><table className="min-w-full border-collapse text-sm text-gray-700"><tbody><tr className="border-b bg-white"><th className="w-[52%] border-r px-4 py-3 text-left">คะแนนเต็ม</th><td className="px-4 py-3 text-center font-bold">100</td></tr><tr className="border-b bg-[#fbfbfb]"><th className="border-r px-4 py-3 text-left">คะแนนที่ได้</th><td className="px-4 py-3 text-center font-black">{scoreNumber(score.studentScore)}</td></tr><tr className="bg-[#efefef]"><th colSpan={2} className="px-4 py-3 text-center">เทียบลำดับคะแนน : {application.province || "สนามสอบของท่าน"}</th></tr><tr className="border-b bg-white"><th className="border-r px-4 py-3 text-left">ลำดับของท่าน</th><td className="px-4 py-3 text-center">{count(score.rankInVenue)}</td></tr><tr className="border-b bg-[#fbfbfb]"><th className="border-r px-4 py-3 text-left">จำนวนผู้เข้าสอบ</th><td className="px-4 py-3 text-center">{count(score.totalInVenue)}</td></tr><tr className="bg-[#efefef]"><th colSpan={2} className="px-4 py-3 text-center">เทียบลำดับคะแนน : รวมทุกสนามสอบ</th></tr><tr className="border-b bg-white"><th className="border-r px-4 py-3 text-left">ลำดับของท่าน</th><td className="px-4 py-3 text-center">{count(score.rankNationwide)}</td></tr><tr className="bg-[#fbfbfb]"><th className="border-r px-4 py-3 text-left">จำนวนผู้เข้าสอบ</th><td className="px-4 py-3 text-center">{count(score.totalNationwide)}</td></tr></tbody></table></div>)}<p className="text-xs text-gray-500">{detail.scorePopulation}</p></div>}
      </section>}

      {message && <div role="status" className="mb-6 rounded-3xl border border-emerald-100 bg-emerald-50 px-6 py-5 text-sm font-bold text-emerald-700">{message}</div>}
      {!isOnsite && hasForfeit && <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm font-bold text-amber-800">ส่งคำขอแล้ว · {application.forfeitRequest?.status}</div>}
      {!isOnsite && !hasForfeit && application.status !== "CANCELLED" && <section className="premium-light-card mb-6 rounded-xl border border-red-100 bg-red-50/40 p-8"><div className="flex flex-col gap-4 text-center md:flex-row md:items-center md:justify-between md:text-left"><div><h2 className="text-xl font-black text-[#1e1b4b]">สละสิทธิ์การเข้าสอบ</h2><p className="mt-2 text-sm leading-6 text-gray-600">กรณีสละสิทธิ์การเข้าสอบแล้วจะไม่สามารถเข้าสอบได้ทุกกรณี</p></div><button type="button" onClick={() => setShowForfeitForm(!showForfeitForm)} className="bg-gradient-red rounded-2xl px-6 py-3 text-sm font-black text-white shadow-lg">{showForfeitForm ? "ปิดแบบฟอร์ม" : "สละสิทธิ์การเข้าสอบ"}</button></div>{showForfeitForm && <form onSubmit={submitForfeit} className="mt-6 space-y-4"><textarea required value={forfeit.reason} onChange={(event) => setForfeit({ ...forfeit, reason: event.target.value })} placeholder="เหตุผลในการสละสิทธิ์" className="min-h-28 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-300" /><input required value={forfeit.fullName} onChange={(event) => setForfeit({ ...forfeit, fullName: event.target.value })} placeholder="ชื่อ-นามสกุล" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-300" /><textarea required value={forfeit.address} onChange={(event) => setForfeit({ ...forfeit, address: event.target.value })} placeholder="ที่อยู่สำหรับจัดส่งเอกสาร" className="min-h-24 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-300" /><input required value={forfeit.phone} onChange={(event) => setForfeit({ ...forfeit, phone: event.target.value })} placeholder="เบอร์โทรศัพท์" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-300" /><button disabled={submitting} className="w-full rounded-xl bg-[#1e1b4b] px-6 py-3 text-sm font-black text-white shadow-lg disabled:opacity-70">{submitting ? "กำลังส่งข้อมูล..." : "ยืนยันการสละสิทธิ์"}</button></form>}</section>}

      {!isOnsite && (settings.googleDriveLink || settings.facebookPageLink) && <section className="premium-light-card mb-6 rounded-xl border border-[#1e1b4b]/10 bg-gradient-to-r from-[#fffaf0] via-white to-[#f7f8ff] p-6"><div className="flex flex-wrap justify-center gap-3">{settings.googleDriveLink && <a href={settings.googleDriveLink} target="_blank" rel="noreferrer" className="rounded-2xl border bg-white px-5 py-3 text-sm font-black text-[#1e1b4b] shadow-sm">ตรวจสอบเฉลยฉบับ PAPER</a>}{settings.facebookPageLink && <a href={settings.facebookPageLink} target="_blank" rel="noreferrer" className="rounded-2xl border bg-white px-5 py-3 text-sm font-black text-[#1e1b4b] shadow-sm">ตรวจสอบเฉลยฉบับ VIDEO</a>}</div></section>}
      <div className="pb-10 text-center"><Link href="/gatpat/student/search" className="text-sm font-bold text-gray-400 transition-colors hover:text-red-expo">กลับไปหน้าค้นหารายการสมัคร</Link></div>
    </div>
  </div>;
}
