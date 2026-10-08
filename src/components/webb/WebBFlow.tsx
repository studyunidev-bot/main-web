"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WebBMyPurchases from "./WebBMyPurchases";
import { getProduct } from "./data";
import { currentPurchaseForProduct, examAnswersStorageKey, examResultStorageKey, setPurchaseExamStatus, updateAdminAttempt } from "./demo-store";
type FlowMode = "status" | "rules" | "success" | "error";
type ExamType = "purchased" | "trial";

function ExamStateScreen({
  success,
  productId,
  interrupted = false,
}: {
  success: boolean;
  productId: string;
  interrupted?: boolean;
}) {
  return (
    <main
      className={`wb-exam-state-page${success ? " is-success" : " is-error"}`}
    >
      <section className="wb-exam-state-content">
        <div className="wb-exam-state-art" aria-hidden="true">
          <i />
          <span>{success ? "🎉" : "⏰"}</span>
        </div>
        <h1>
          {success ? "ส่งคำตอบสำเร็จ" : interrupted ? "การเชื่อมต่อขัดข้อง" : "หมดเวลาทำข้อสอบ"}
          <span aria-hidden="true">{success ? "✧" : "〃"}</span>
        </h1>
        <p>
          {success
            ? "ระบบได้บันทึกคำตอบของคุณเรียบร้อยแล้ว สามารถดูผลสอบและเฉลยได้ในห้องสอบ"
            : interrupted
              ? "ระบบล้างคำตอบของรอบที่หลุดแล้ว เพื่อให้เริ่มรอบใหม่ได้อย่างถูกต้อง กรุณาติดต่อผู้ดูแลเพื่อขออนุมัติสิทธิ์สอบใหม่"
              : "การสอบเสร็จสิ้น ระบบได้บันทึกคำตอบของคุณเรียบร้อยแล้ว สามารถดูผลสอบและเฉลยได้ในห้องสอบ"}
        </p>
        <dl className="wb-exam-state-summary">
          <div>
            <dt>คุณใช้เวลาในการสอบทั้งหมด</dt>
            <dd>01:00:06</dd>
          </div>
          <div>
            <dt>เริ่มสอบ</dt>
            <dd>10:20 - 10:51 น.</dd>
          </div>
          <div>
            <dt>วันที่สอบ</dt>
            <dd>14 ก.ค. 2569</dd>
          </div>
        </dl>
        <div className="wb-exam-state-actions">
          <Link
            href={interrupted ? "/webb/status" : "/webb/student?view=profile"}
            className="wb-exam-state-back"
          >
            {interrupted ? "กลับรายการที่ซื้อแล้ว" : "กลับหน้าโปรไฟล์"}
          </Link>
          <Link
            href={interrupted ? "/webb" : `/webb/results?product=${productId}`}
            className="wb-exam-state-results"
          >
            {interrupted ? "ติดต่อทีมช่วยเหลือ" : "ดูผลสอบ"}
          </Link>
        </div>
      </section>
    </main>
  );
}

function RulesScreen({
  productId,
  examType,
  returnTo,
}: {
  productId: string;
  examType: ExamType;
  returnTo: "home" | "overview" | "exam";
}) {
  const product = getProduct(productId);
  const router = useRouter();
  const [warningOpen, setWarningOpen] = useState(false);
  const [hasEntitlement, setHasEntitlement] = useState(examType === "trial");
  const [attemptState, setAttemptState] = useState("");
  const examHref = `/webb/exam?product=${product.id}&type=${examType}`;
  const backHref =
    returnTo === "home" ? "/webb" : `/webb/student?view=${returnTo}`;
  const resultKey = examResultStorageKey(product.id, examType);
  const answerKey = examAnswersStorageKey(product.id, examType);

  useEffect(() => {
    if (examType === "trial") return;
    setHasEntitlement(!!currentPurchaseForProduct(product.id));
    try {
      const saved = localStorage.getItem(resultKey);
      setAttemptState(saved ? (JSON.parse(saved) as { status?: string }).status || "" : "");
    } catch { setAttemptState(""); }
  }, [examType, product.id, resultKey]);

  useEffect(() => {
    if (!warningOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setWarningOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [warningOpen]);

  return (
    <main className="wb-rules-page">
      <div className="wb-rules-container">
        <header className="wb-rules-header">
          <div className="wb-rules-brand" aria-label="TCAS 70 Mock Exam">
            <span className="wb-brand-symbol" aria-hidden="true">
              <span className="wb-brand-person wb-brand-yellow">
                <i />
                <b />
              </span>
              <span className="wb-brand-person wb-brand-orange">
                <i />
                <b />
              </span>
              <span className="wb-brand-person wb-brand-blue">
                <i />
                <b />
              </span>
            </span>
            <span>
              <strong>TCAS 70</strong>
              <b>MOCK EXAM</b>
            </span>
          </div>
        </header>

        <h1 className="wb-rules-title">TGAT ความถนัดทั่วไป</h1>

        <section className="wb-rules-facts" aria-label="ข้อมูลชุดข้อสอบ">
          <article>
            <span>ชุดข้อสอบ</span>
            <b>A</b>
          </article>
          <article>
            <span>จำนวนข้อสอบ</span>
            <b>200 ข้อ</b>
          </article>
          <article>
            <span>ระยะเวลาสอบ</span>
            <b>180 นาที</b>
          </article>
          <article>
            <span>ประเภทข้อสอบ</span>
            <b>ปรนัย 4-5 ตัวเลือก</b>
          </article>
          <article>
            <span>คะแนน</span>
            <b>100 คะแนน</b>
          </article>
        </section>

        <section className="wb-rules-guidance">
          <h2>คำแนะนำระบบการสอบ</h2>
          <ol>
            <li>
              <span>1</span>
              <p>
                เมื่อกดปุ่ม <em>เริ่มสอบ</em> จากหน้านี้ไป ระบบจะเริ่มจับเวลา
                ไม่สามารถยกเลิกหรือเริ่มจับเวลาใหม่ได้
                และจะเปลี่ยนไปสอบวิชาอื่นไม่ได้จนกว่าจะหมดเวลา
                หรือกดส่งคำตอบแล้ว
              </p>
            </li>
            <li>
              <span>2</span>
              <p>
                เมื่อทำข้อสอบเสร็จ สามารถกดปุ่ม <em>ส่งคำตอบ</em> ได้เลย
                หลังส่งแล้วจะไม่สามารถกลับมาแก้ไขได้อีก
              </p>
            </li>
            <li>
              <span>3</span>
              <p>
                หากหมดเวลาสอบ แต่ยังไม่ได้กดส่งคำตอบ
                ระบบจะส่งคำตอบที่เลือกไว้ให้อัตโนมัติ
              </p>
            </li>
            <li>
              <span>4</span>
              <p>
                หากเกิดข้อผิดพลาดหรือหลุดจากห้องสอบ ระบบจะล้างคำตอบของรอบนั้น
                และต้องให้ผู้ดูแลอนุมัติเปิดรอบใหม่ก่อนจึงจะเริ่มสอบได้
              </p>
            </li>
            <li>
              <span>5</span>
              <p>
                มีปัญหาระหว่างการสอบ ติดต่อแอดมินทันทีทาง Line :{" "}
                <em>@เรียนต่อมหาลัย</em> โปรดถ่าย/เก็บภาพหน้าจอมาด้วย
              </p>
            </li>
          </ol>
        </section>

        <div className="wb-rules-actions">
          <Link className="wb-rules-back" href={backHref}>
            ย้อนกลับ
          </Link>
          <button
            className="wb-rules-start"
            type="button"
            disabled={!hasEntitlement || ["submitted", "timeout", "interrupted", "in-progress"].includes(attemptState)}
            onClick={() => setWarningOpen(true)}
          >
            {!hasEntitlement ? "ไม่มีสิทธิ์สอบชุดนี้" : attemptState === "interrupted" ? "รอผู้ดูแลอนุมัติสอบใหม่" : ["submitted", "timeout"].includes(attemptState) ? "สอบชุดนี้แล้ว" : attemptState === "in-progress" ? "มีรอบสอบที่กำลังดำเนินการ" : "เริ่มทำข้อสอบ"}
          </button>
        </div>
        {!hasEntitlement && examType === "purchased" && <p className="wb-exam-access-note">ยังไม่มีสิทธิ์ในชุดนี้ <Link href="/webb/products">เลือกซื้อข้อสอบ</Link></p>}
        {attemptState === "interrupted" && <p className="wb-exam-access-note">ระบบรีเซ็ตรอบสอบที่หลุดแล้ว กรุณาติดต่อผู้ดูแลเพื่อขอเปิดสิทธิ์สอบใหม่</p>}
        {["submitted", "timeout"].includes(attemptState) && <p className="wb-exam-access-note">ส่งข้อสอบแล้ว · กลับมาสอบซ้ำไม่ได้ แต่ดูวิดีโอเฉลยได้ตลอด</p>}
        <footer className="wb-rules-copyright">
          © 2569 บริษัท เรียนต่อมหาลัย จำกัด
        </footer>
      </div>

      {warningOpen && (
        <div className="wb-rules-modal-overlay">
          <button
            className="wb-rules-modal-backdrop"
            type="button"
            aria-label="ปิดหน้าต่างแจ้งเตือน"
            onClick={() => setWarningOpen(false)}
          />
          <section
            className="wb-rules-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wb-rules-modal-title"
          >
            <button
              className="wb-rules-modal-close"
              type="button"
              aria-label="ปิด"
              onClick={() => setWarningOpen(false)}
            >
              ×
            </button>
            <span className="wb-rules-warning-icon" aria-hidden="true">
              !
            </span>
            <h2 id="wb-rules-modal-title">โปรดระวัง</h2>
            <ol>
              <li>
                <span>1</span>
                <p>
                  <em>ห้ามเปิดหน้าต่าง หรือ แท็บ วิชามากกว่า 1 หน้าต่าง</em>{" "}
                  เพราะระบบมีการบันทึกคำตอบให้ทุก 15 นาที
                  อาจทำให้เกิดการบันทึกคำตอบระหว่างหน้าต่างซ้อนกัน
                  ทำให้คำตอบหายหรือผิดพลาดได้
                </p>
              </li>
              <li>
                <span>2</span>
                <p>
                  ในขณะที่กำลังทำข้อสอบอยู่
                  ไม่แนะนำให้สลับหน้าจอหรือแอปไปทำอย่างอื่นระหว่างสอบ
                  เพราะอาจทำให้หลุดจากระบบหรือเผลอปิดหน้าต่างทิ้ง
                  ทำให้ข้อมูลการสอบสูญหายได้
                </p>
              </li>
              <li>
                <span>3</span>
                <p>
                  ระบบสอบไม่สามารถใช้งานผ่าน Browser Safari เวอร์ชั่นต่ำกว่า 15
                  ได้
                </p>
              </li>
            </ol>
            <div className="wb-rules-modal-actions">
              <button
                className="wb-rules-back"
                type="button"
                onClick={() => setWarningOpen(false)}
              >
                ย้อนกลับ
              </button>
              <button
                className="wb-rules-start"
                type="button"
                onClick={() => {
                  try {
                    const saved = localStorage.getItem(resultKey);
                    const status = saved
                      ? (JSON.parse(saved) as { status?: string }).status
                      : undefined;
                    if (status === "submitted" || status === "timeout") {
                      window.location.replace(
                        `/webb/${status === "submitted" ? "success" : "error"}?product=${product.id}&type=${examType}`,
                      );
                      return;
                    }
                    if (status === "interrupted" || status === "in-progress") return;
                    if (status === "authorized") {
                      localStorage.removeItem(answerKey);
                    }
                    localStorage.setItem(resultKey, JSON.stringify({ status: "in-progress", startedAt: Date.now() }));
                    if (examType === "purchased") {
                      setPurchaseExamStatus(product.id, "in-progress", true, currentPurchaseForProduct(product.id)?.ref);
                      updateAdminAttempt(product.id, "กำลังสอบ");
                    }
                  } catch {
                    /* Continue to the exam if browser storage is unavailable. */
                  }
                  router.push(examHref);
                }}
              >
                รับทราบเริ่มทำข้อสอบ 
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default function WebBFlow({
  mode,
  productId = "tgat-full",
  examType = "purchased",
  returnTo = "overview",
  interrupted = false,
}: {
  mode: FlowMode;
  productId?: string;
  examType?: ExamType;
  returnTo?: "home" | "overview" | "exam";
  interrupted?: boolean;
}) {
  const product = getProduct(productId);
  if (mode === "status") return <WebBMyPurchases />;

  if (mode === "rules")
    return (
      <RulesScreen
        productId={product.id}
        examType={examType}
        returnTo={returnTo}
      />
    );

  return (
    <ExamStateScreen success={mode === "success"} productId={product.id} interrupted={interrupted} />
  );
}
