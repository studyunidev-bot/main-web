"use client";

import { getProduct } from "./data";
import { getExamPlan } from "./exam-documents";
import {
  TOTAL_MOCK_QUESTIONS,
} from "./mock-exam-questions";

type ReferenceSection = "overview" | "content" | "results" | "solutions";

const solutionDurations: Record<string, string> = {
  tgat1: "32:10",
  tgat2: "28:45",
  tgat3: "25:30",
};

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
