"use client";

import { useEffect, useState } from "react";
import { getProduct } from "./data";
import { getExamPlan } from "./exam-documents";
import { MOCK_EXAM_PAGES, TOTAL_MOCK_QUESTIONS } from "./mock-exam-questions";
import WebBAdminInput from "./WebBAdminInput";
import WebBAdminTextarea from "./WebBAdminTextarea";

type ReferenceSection = "overview" | "content" | "results" | "solutions";

const trialQuestions = MOCK_EXAM_PAGES.flatMap((page) => page.questions);
const trialQuestionDraftKey = "webb-admin-mock:trial-question-draft";
const solutionDurations: Record<string, string> = {
  tgat1: "32:10",
  tgat2: "28:45",
  tgat3: "25:30",
};

function TrialQuestionEditor() {
  const [questions, setQuestions] = useState(() => trialQuestions.map((question) => ({ ...question, choices: [...question.choices] })));
  const [selectedId, setSelectedId] = useState(trialQuestions[0]?.id ?? 0);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(trialQuestionDraftKey);
      if (!stored) return;
      const draft = JSON.parse(stored) as typeof questions;
      if (Array.isArray(draft) && draft.length === trialQuestions.length) setQuestions(draft);
    } catch {
      // The original client questions remain available as the sample reference.
    }
  }, []);
  const selected = questions.find((question) => question.id === selectedId);
  const updateQuestion = (change: Partial<(typeof questions)[number]>) => {
    setQuestions((current) => current.map((question) => question.id === selectedId ? { ...question, ...change } : question));
    setSaved(false);
  };
  if (!selected) return null;
  return (
    <div className="mt-4 rounded-lg border border-blue-100 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><b className="text-sm">จัดการโจทย์ทดลอง · Draft หลังบ้าน</b><p className="text-xs text-slate-500">เริ่มจากโจทย์เดียวกับหน้าลูกค้า · การแก้ไข Draft นี้ใช้สาธิตหน้าหลังบ้าน</p></div>
        <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold" onClick={() => { setQuestions(trialQuestions.map((question) => ({ ...question, choices: [...question.choices] }))); localStorage.removeItem(trialQuestionDraftKey); setSaved(false); }}>คืนค่าโจทย์ต้นฉบับ</button>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[12rem_1fr]">
        <div className="max-h-80 space-y-1 overflow-y-auto" aria-label="เลือกข้อสอบทดลอง">
          {questions.map((question) => <button key={question.id} type="button" onClick={() => setSelectedId(question.id)} className={`block w-full rounded-lg px-3 py-2 text-left text-xs ${question.id === selectedId ? "bg-blue-700 font-bold text-white" : "bg-slate-50 text-slate-700"}`}>ข้อ {question.number} · {question.prompt}</button>)}
        </div>
        <div className="grid gap-2">
          <label className="grid gap-1 text-xs font-semibold">โจทย์ข้อ {selected.number}<WebBAdminTextarea value={selected.prompt} onChange={(event) => updateQuestion({ prompt: event.target.value })} rows={3} className="rounded-lg border border-slate-200 p-2 text-sm font-normal" /></label>
          {selected.choices.map((choice, index) => <label key={index} className="grid gap-1 text-xs font-semibold">ตัวเลือก {String.fromCharCode(65 + index)}<WebBAdminInput value={choice} onChange={(event) => updateQuestion({ choices: selected.choices.map((value, choiceIndex) => choiceIndex === index ? event.target.value : value) as typeof selected.choices })} className="rounded-lg border border-slate-200 p-2 text-sm font-normal" /></label>)}
          <div className="flex items-center gap-3"><button type="button" className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white" onClick={() => { localStorage.setItem(trialQuestionDraftKey, JSON.stringify(questions)); setSaved(true); }}>บันทึก Draft</button>{saved && <span className="text-xs font-semibold text-emerald-700">บันทึกในหน้าจอหลังบ้านนี้แล้ว</span>}</div>
        </div>
      </div>
    </div>
  );
}

export default function WebBAdminClientReference({
  productId,
  examSet,
  trial,
  section,
}: {
  productId: string;
  examSet: string;
  trial: boolean;
  section: ReferenceSection;
}) {
  const product = getProduct(productId);
  const plan = getExamPlan(productId, examSet);
  const isClientProduct = product.id === productId;

  if (section === "overview") {
    const steps = trial
      ? ["กดทดลองระบบสอบฟรี", "อ่านกติกาและเริ่มจับเวลา", "ทำข้อสอบ TGAT1 ตัวอย่าง", "ส่งหรือหมดเวลา", "กลับแท็บห้องสอบโดยไม่แสดงคะแนน"]
      : ["เลือกสินค้าและชำระเงินจำลอง", "ได้รับสิทธิ์สอบชุด A", "อ่านกติกาและเริ่มจับเวลา", "ส่งคำตอบหรือส่งอัตโนมัติเมื่อหมดเวลา", "ดูผลสอบและเฉลยหลังส่ง"];
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
        <h3 className="font-bold text-slate-900">เส้นทางที่ผู้เรียนเห็นในหน้าบ้าน</h3>
        <p className="mt-1 text-xs text-slate-600">ข้อมูลอ้างอิงสำหรับนำเสนอ UX/UI · การแก้ข้อมูลในหน้าจอนี้ไม่เปลี่ยนหน้าบ้าน</p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {steps.map((step, index) => <li key={step} className="rounded-lg border border-blue-100 bg-white p-3 text-sm text-slate-800"><b className="mr-2 text-blue-700">{index + 1}.</b>{step}</li>)}
        </ol>
        <p className="mt-3 text-xs text-slate-600">
          {trial ? `TGAT1 ทดลอง · ${TOTAL_MOCK_QUESTIONS} ข้อ · ${getExamPlan("tgat1", "A").durationMinutes} นาที · 4 ตัวเลือก · สอบซ้ำได้` : isClientProduct && plan.hasSuppliedExam ? `${product.name} · ชุด ${examSet} · ${plan.questionCount} ข้อ · ${plan.durationMinutes} นาที · เฉลยเปิดหลังส่ง` : "หน้าบ้านยังไม่มีเนื้อหาข้อสอบของรายการนี้"}
        </p>
      </div>
    );
  }

  if (section === "content") {
    if (trial) return (
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
        <h3 className="font-bold text-slate-900">ต้นฉบับข้อสอบทดลองที่ผู้เรียนเห็น</h3>
        <p className="mt-1 text-xs text-slate-600">หน้าบ้านใช้โจทย์และตัวเลือกบนหน้าจอ ไม่ใช้ PDF · {MOCK_EXAM_PAGES.length} หน้า · {TOTAL_MOCK_QUESTIONS} ข้อ · เฉลยรายข้อในหลังบ้านใช้สำหรับผู้จัดทำเท่านั้น</p>
        <details className="mt-3 rounded-lg border border-blue-100 bg-white p-3">
          <summary className="cursor-pointer font-semibold text-blue-800">ดูโจทย์และตัวเลือกทั้ง {trialQuestions.length} ข้อ</summary>
          <div className="mt-3 max-h-96 space-y-3 overflow-y-auto">
            {trialQuestions.map((question) => (
              <div key={question.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                <b>ข้อ {question.number}. {question.prompt}</b>
                <p className="mt-1 text-xs text-slate-500">{question.choices.map((choice, index) => `${String.fromCharCode(65 + index)}. ${choice}`).join(" · ")}</p>
              </div>
            ))}
          </div>
        </details>
        <TrialQuestionEditor />
      </div>
    );
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
        <h3 className="font-bold text-slate-900">เอกสารและโครงสร้างชุดที่หน้าบ้านใช้</h3>
        <p className="mt-1 text-xs text-slate-600">ข้อมูลชุด A ที่หน้าบ้านอ้างอิง · ไฟล์ที่เลือกด้านล่างแสดงขั้นตอนเพิ่มเอกสารในหน้าหลังบ้าน</p>
        {productId === "tgat3" || (productId === "tgat" && plan.sections.some((part) => part.id === "tgat3")) ? <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-950"><b>รูปแบบการตอบ TGAT3:</b> หน้าบ้านแสดงคำตอบตามชนิดของแต่ละข้อ เลือกได้หลายตัวเลือกเฉพาะข้อที่กำหนด และทำเครื่องหมายข้อสัมพันธ์เป็นคู่ · เกณฑ์คะแนนจริงอาจต่างกันในแต่ละฉบับ</p> : null}
        {plan.sections.length ? <div className="mt-3 grid gap-2 lg:grid-cols-3">{plan.sections.map((part) => (
          <article key={part.id} className="rounded-lg border border-blue-100 bg-white p-3 text-sm">
            <b>{part.title}</b>
            <p className="mt-1 text-slate-600">ข้อ {part.questionStart}–{part.questionStart + part.questionCount - 1} · {part.questionCount} ข้อ · {part.choiceCount} ตัวเลือก · {part.durationMinutes} นาที</p>
            <a className="mt-2 block break-all text-xs font-semibold text-blue-700 underline" href={part.examPdf} target="_blank" rel="noreferrer">ดู PDF ข้อสอบที่ผู้เรียนเห็น</a>
          </article>
        ))}</div> : <p className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-600">หน้าบ้านยังไม่มีข้อสอบสำหรับสินค้า/ชุดนี้ จึงแสดงสถานะ “ไฟล์ข้อสอบยังไม่พร้อม”</p>}
      </div>
    );
  }

  if (section === "results") return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
      <h3 className="font-bold text-slate-900">ตัวอย่างผลสอบตามหน้าผู้เรียน</h3>
      <p className="mt-1 text-xs text-slate-600">รายงานผลสอบตัวอย่างของสมชายแสดง TGAT ชุด A · สอบเมื่อ 15 ก.ค. 2569 · ใช้เวลา 2 ชั่วโมง 41 นาที · คะแนนรวม 60.7/100 · อันดับตัวอย่าง 415/2709</p>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {["TGAT1 60.7/100", "TGAT2 67.4/100", "TGAT3 54.6/100"].map((score) => <span key={score} className="rounded-lg border border-blue-100 bg-white px-3 py-2 font-semibold">{score}</span>)}
      </div>
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
        <b>แยกจาก Modal จัดอันดับ:</b> Client คำนวณ Modal จากรายการสอบที่ส่งสำเร็จซึ่งบันทึกใน Browser; ถ้ายังไม่มีรายการ ระบบแสดงคะแนนเป็น “—” และอันดับเป็น “—/0” แม้หน้ารายงานตัวอย่างจะแสดง 60.7 และ 415/2709 อยู่ก็ตาม
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
      <h3 className="font-bold text-slate-900">สื่อเฉลยที่หน้าผู้เรียนเห็นหลังส่ง</h3>
      <p className="mt-1 text-xs text-slate-600">ผู้เรียนเลือกดาวน์โหลด PDF ตามพาร์ท และเห็นรายการวิดีโอเฉลยของพาร์ทเดียวกัน</p>
      {plan.sections.length ? <div className="mt-3 grid gap-2 lg:grid-cols-3">{plan.sections.map((part) => (
        <article key={part.id} className="rounded-lg border border-blue-100 bg-white p-3 text-sm">
          <b>{part.title}</b>
          <p className="mt-1 text-slate-600">วิดีโอเฉลย {solutionDurations[part.id] || `${part.durationMinutes}:00`} นาที</p>
          <a className="mt-2 block break-all text-xs font-semibold text-blue-700 underline" href={part.solutionPdf} target="_blank" rel="noreferrer">ดู PDF เฉลยที่ผู้เรียนดาวน์โหลด</a>
        </article>
      ))}</div> : <p className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-600">หน้าบ้านยังไม่มีสื่อเฉลยสำหรับชุดนี้</p>}
    </div>
  );
}
