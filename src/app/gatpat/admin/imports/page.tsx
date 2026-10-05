"use client";

import { ChangeEvent, useEffect, useState } from "react";
import ThaiDatePicker from "@/components/Gatpat/ThaiDatePicker";

type PreviewResult = { previewId: string; expiresAt: string; changes: { total: number; counts: Record<string, number> }; result: { meta: { parserVersion: string; importBatchSize: number }; locations: any; onsite: any; simulated: any } };

export default function GatpatImportsPage() {
  const [year, setYear] = useState(String(new Date().getFullYear() + 543));
  const [onsiteRound, setOnsiteRound] = useState("MORNING");
  const [simulatedRound, setSimulatedRound] = useState("AFTERNOON");
  const [examDate, setExamDate] = useState("");
  const [files, setFiles] = useState<Record<string, File | null>>({ locations: null, onsite: null, simulated: null });
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [changes, setChanges] = useState<any[]>([]);

  async function loadHistory() {
    const response = await fetch("/api/gatpat/admin/imports");
    if (response.ok) setHistory((await response.json()).items ?? []);
  }
  useEffect(() => { void loadHistory(); }, []);

  function changeFile(key: string, event: ChangeEvent<HTMLInputElement>) {
    setFiles((current) => ({ ...current, [key]: event.target.files?.[0] ?? null }));
    setPreview(null);
    setMessage("");
  }

  async function submit(mode: "preview" | "apply") {
    if (mode === "apply" && !preview) return;
    if (mode === "apply" && !window.confirm("ยืนยันนำเข้าข้อมูลตามไฟล์ที่ preview แล้วหรือไม่? ระบบจะอัปเดตรายการที่ตรงกันและเพิ่มรายการใหม่")) return;
    setBusy(true); setMessage("");
    const form = new FormData();
    form.set("academicYear", year);
    form.set("onsiteRound", onsiteRound);
    form.set("simulatedRound", simulatedRound);
    if (examDate) form.set("examDate", examDate);
    for (const key of ["locations", "onsite", "simulated"]) if (files[key]) form.set(key, files[key] as File);
    try {
      const response = mode === "preview"
        ? await fetch("/api/gatpat/admin/imports/preview", { method: "POST", body: form })
        : await fetch("/api/gatpat/admin/imports/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ previewId: preview?.previewId }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "นำเข้าข้อมูลไม่สำเร็จ");
      if (mode === "preview") {
        setPreview(body);
        const diffResponse = await fetch(`/api/gatpat/admin/imports/previews/${body.previewId}/changes?page=1&pageSize=50`);
        setChanges(diffResponse.ok ? (await diffResponse.json()).items ?? [] : []);
      } else { setPreview(null); setChanges([]); await loadHistory(); }
      setMessage(mode === "preview" ? "Preview เสร็จแล้ว ยังไม่มีการบันทึกข้อมูล" : "นำเข้าข้อมูลเสร็จแล้ว");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally { setBusy(false); }
  }

  const summaries = preview?.result ? [
    ["ไฟล์สถานที่", preview.result.locations],
    ["ไฟล์ Onsite", preview.result.onsite],
    ["ไฟล์ Simulated", preview.result.simulated],
  ].filter((entry) => entry[1]) as Array<[string, any]> : [];

  return (
    <>
      <p className="text-sm font-medium text-primary">ระบบสมัครสอบ · เว็บ A</p><h1 className="mt-1 text-2xl font-bold text-dark dark:text-white">นำเข้าข้อมูล Excel</h1>
      <div className="mt-5 rounded-xl border border-amber/20 bg-amber/5 p-4 text-sm leading-6 text-dark-6">
        Preview นี้รัน parser จริงภายใน transaction แล้วย้อนรายการฐานข้อมูลทั้งหมดก่อนตอบกลับ ระบบเก็บประวัติเดิมและไม่ soft-delete รายการที่หายจากไฟล์อัตโนมัติ
      </div>
      <div className="mt-5 grid gap-4 rounded-xl border border-stroke bg-white p-5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark">
        <label className="grid max-w-xs gap-2 text-sm">ปีการศึกษา (พ.ศ.)<input className="rounded border p-3" type="number" min="2500" value={year} onChange={(event) => { setYear(event.target.value); setPreview(null); }} /></label>
        <div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-2 text-sm">รอบสอบ Onsite<select className="rounded border p-3" value={onsiteRound} onChange={(event) => { setOnsiteRound(event.target.value); setPreview(null); }}><option value="MORNING">เช้า</option><option value="AFTERNOON">บ่าย</option></select></label><label className="grid gap-2 text-sm">รอบสอบจำลอง<select className="rounded border p-3" value={simulatedRound} onChange={(event) => { setSimulatedRound(event.target.value); setPreview(null); }}><option value="MORNING">เช้า</option><option value="AFTERNOON">บ่าย</option></select></label><label className="grid gap-2 text-sm">วันที่สอบ<ThaiDatePicker label="วันที่สอบ" value={examDate} onChange={(date) => { setExamDate(date); setPreview(null); }} /></label></div>
        {[["locations", "ไฟล์สนามสอบ"], ["onsite", "ไฟล์ผู้สมัคร Onsite"], ["simulated", "ไฟล์สอบจำลอง"]].map(([key, label]) => <label key={key} className="grid gap-2 text-sm">{label}<input className="rounded border p-2" type="file" accept=".xlsx,.csv" onChange={(event) => changeFile(key, event)} />{files[key] && <span className="text-xs text-slate-500">{files[key]?.name}</span>}</label>)}
        <div className="flex flex-wrap gap-3">
          <button disabled={busy || !Object.values(files).some(Boolean)} onClick={() => submit("preview")} className="rounded-lg border border-primary px-5 py-3 font-semibold text-primary disabled:opacity-50">{busy ? "กำลังประมวลผล…" : "ตรวจสอบ Preview"}</button>
          <button disabled={busy || !preview} onClick={() => submit("apply")} className="rounded-lg bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50">ยืนยันนำเข้า</button>
        </div>
      </div>
      {message && <p role="status" className="mt-4 rounded border bg-white p-4">{message}</p>}
      {summaries.length > 0 && <section className="mt-6 space-y-4"><h2 className="text-xl font-semibold">ผลการวิเคราะห์ไฟล์</h2>{summaries.map(([label, summary]) => <article key={label} className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold">{label} · {summary.fileId}</h3><p className="mt-2 text-sm">อ่าน {summary.rowCount} แถว · สำเร็จ {summary.successCount} · ผิดพลาด {summary.failedCount}</p>
        {!!summary.warnings?.length && <ul className="mt-3 list-disc pl-5 text-sm text-amber-800">{summary.warnings.map((warning: string, index: number) => <li key={index}>{warning}</li>)}</ul>}
        {!!summary.errors?.length && <ul className="mt-3 max-h-56 list-disc overflow-auto pl-5 text-sm text-red-800">{summary.errors.slice(0, 100).map((error: string, index: number) => <li key={index}>{error}</li>)}</ul>}
      </article>)}</section>}
      {preview && <section className="mt-6 rounded-xl border bg-white p-5"><h2 className="text-xl font-semibold">รายการเปลี่ยนแปลงก่อนยืนยัน</h2><p className="mt-2 text-sm">ทั้งหมด {preview.changes.total} รายการ · Preview ใช้ได้ถึง {new Date(preview.expiresAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</p><div className="mt-3 flex flex-wrap gap-2">{Object.entries(preview.changes.counts).map(([key, count]) => <span key={key} className="rounded-full bg-slate-100 px-3 py-1 text-sm">{key}: {count}</span>)}</div><p className="mt-3 text-sm text-slate-600">รายละเอียดรายแถวและค่าก่อน/หลังถูกเก็บใน change journal สำหรับตรวจสอบ ระบบจะไม่ใช้ Preview ที่หมดอายุหรือถูกใช้ไปแล้ว</p></section>}
      {preview && changes.length > 0 && <section className="mt-4 overflow-auto rounded-xl border bg-white p-4"><h3 className="font-semibold">ตัวอย่างการเปลี่ยนแปลง (สูงสุด 50 รายการแรก)</h3><table className="mt-3 min-w-full text-left text-xs"><thead><tr><th className="p-2">#</th><th className="p-2">ตาราง</th><th className="p-2">การทำงาน</th><th className="p-2">Record ID</th><th className="p-2">ก่อนแก้</th><th className="p-2">หลังแก้</th></tr></thead><tbody>{changes.map((item, index) => <tr key={item.id} className="border-t align-top"><td className="p-2">{index + 1}</td><td className="p-2">{item.modelName}</td><td className="p-2">{item.action}</td><td className="p-2 font-mono">{item.recordId ?? "หลายรายการ"}</td><td className="max-w-xs p-2"><pre className="max-h-32 overflow-auto whitespace-pre-wrap">{JSON.stringify(item.beforeData, null, 2)}</pre></td><td className="max-w-xs p-2"><pre className="max-h-32 overflow-auto whitespace-pre-wrap">{JSON.stringify(item.afterData, null, 2)}</pre></td></tr>)}</tbody></table></section>}
      <section className="mt-8"><h2 className="text-xl font-semibold">ประวัติการนำเข้า</h2><div className="mt-3 space-y-3">{history.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"><div><p className="font-medium">{item.originalName} · พ.ศ. {item.academicYear}</p><p className="text-sm text-slate-600">{item.successCount}/{item.rowCount} แถว · มี {item.changeCount} การเปลี่ยนแปลง · {new Date(item.uploadedAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}{item.rolledBackAt ? " · ย้อนกลับแล้ว" : ""}</p></div>{item.changeCount > 0 && !item.rolledBackAt && <button className="rounded border border-red-700 px-3 py-2 text-sm text-red-800" onClick={async () => { if (!window.confirm("ยืนยันย้อนกลับรายการนี้? หากข้อมูลถูกแก้ภายหลัง ระบบจะปฏิเสธเพื่อป้องกันการทับข้อมูล")) return; const response = await fetch(`/api/gatpat/admin/imports/${item.id}/rollback`, { method: "POST" }); const body = await response.json(); setMessage(response.ok ? "ย้อนกลับการนำเข้าแล้ว" : body.message); await loadHistory(); }}>ย้อนกลับ</button>}</article>)}</div></section>
    </>
  );
}
