"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LuCheck, LuRotateCcw } from "react-icons/lu";
import WebBMyPurchases from "./WebBMyPurchases";
import { getProduct } from "./data";
import { getExamPlan } from "./exam-documents";
import { currentPurchaseForExam, currentPurchaseForRef, examAnswersStorageKey, examResultStorageKey, setPurchaseExamStatus, updateAdminAttempt } from "./demo-store";
type FlowMode = "status" | "rules" | "success" | "error";
type ExamType = "purchased" | "trial";

function ExamStateScreen({
  success,
  productId,
  examSet = "A",
  purchaseRef,
  examType = "purchased",
  interrupted = false,
}: {
  success: boolean;
  productId: string;
  examSet?: string;
  purchaseRef?: string;
  examType?: ExamType;
  interrupted?: boolean;
}) {
  const solutionHref = `/webb/solutions?product=${productId}&set=${encodeURIComponent(examSet)}&ref=${encodeURIComponent(purchaseRef || "")}`;
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
        {success && examType === "purchased" && <p className="wb-exam-state-solution-link"><Link href={solutionHref}>ดูเฉลย PDF →</Link></p>}
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <Link
            href={`/webb/rules?product=${productId}&type=trial&back=exam`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: "#2563eb",
              textDecoration: "underline",
            }}
          >
            🔄 กลับไปหน้ากติกาเพื่อทดสอบสอบใหม่อีกครั้ง (Mockup)
          </Link>
        </div>
      </section>
    </main>
  );
}

function RulesScreen({
  productId,
  examSet,
  purchaseRef,
  examType,
  returnTo,
}: {
  productId: string;
  examSet: string;
  purchaseRef?: string;
  examType: ExamType;
  returnTo: "home" | "overview" | "exam";
}) {
  const product = getProduct(productId);
  const examPlan = getExamPlan(product.id, examSet);
  const canUseExam = examType === "trial" || examPlan.hasSuppliedExam;
  const questionCount = examType === "trial" ? 60 : examPlan.questionCount;
  const durationMinutes = examType === "trial" ? 180 : examPlan.durationMinutes;
  const examTitle = product.id === "tgat-full"
    ? "TGAT ความถนัดทั่วไป"
    : `${product.name} ${product.parts}`;
  const router = useRouter();
  const [warningOpen, setWarningOpen] = useState(false);
  const [hasEntitlement, setHasEntitlement] = useState(examType === "trial");
  const [attemptState, setAttemptState] = useState("");
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const examHref = `/webb/exam?product=${product.id}&set=${encodeURIComponent(examSet)}&ref=${encodeURIComponent(purchaseRef || "")}&type=${examType}`;
  const backHref =
    returnTo === "home" ? "/webb" : `/webb/student?view=${returnTo}`;
  const resultKey = examResultStorageKey(product.id, examType, undefined, examSet);
  const answerKey = examAnswersStorageKey(product.id, examType, undefined, examSet);
  const selectedPurchase = currentPurchaseForRef(purchaseRef) || currentPurchaseForExam(product.id, examSet);

  useEffect(() => {
    const readAttemptStatus = () => {
      let saved = localStorage.getItem(resultKey);
      if (!saved) {
        const legacyKey = examResultStorageKey(product.id, examType);
        saved = localStorage.getItem(legacyKey);
        if (saved) localStorage.setItem(resultKey, saved);
      }
      return saved
        ? (JSON.parse(saved) as { status?: string }).status || ""
        : examType === "purchased" ? selectedPurchase?.examStatus || "" : "";
    };

    if (examType === "trial") {
      setHasEntitlement(true);
      try {
        setAttemptState(readAttemptStatus());
      } catch { setAttemptState(""); }
      return;
    }
    setHasEntitlement(!!(currentPurchaseForRef(purchaseRef) || currentPurchaseForExam(product.id, examSet)));
    try {
      setAttemptState(readAttemptStatus());
    } catch { setAttemptState(""); }
  }, [examType, product.id, examSet, purchaseRef, resultKey, selectedPurchase?.examStatus]);

  function handleResetMockup() {
    try {
      localStorage.removeItem(resultKey);
      localStorage.removeItem(answerKey);
      localStorage.removeItem(examResultStorageKey(product.id, "trial", undefined, examSet));
      localStorage.removeItem(examAnswersStorageKey(product.id, "trial", undefined, examSet));
      localStorage.removeItem(examResultStorageKey(product.id, "purchased", undefined, examSet));
      localStorage.removeItem(examAnswersStorageKey(product.id, "purchased", undefined, examSet));
      localStorage.removeItem(`webb-demo-started:${product.id}:${examType}:${examSet}`);
      localStorage.removeItem(`webb-demo-started:${product.id}:trial:${examSet}`);
      localStorage.removeItem(`webb-demo-started:${product.id}:purchased:${examSet}`);

      try {
        setPurchaseExamStatus(product.id, "available", false, selectedPurchase?.ref);
      } catch {
        /* ignore */
      }

      setAttemptState("");
      setResetNotice("ล้างประวัติการสอบของวิชานี้เรียบร้อยแล้ว สามารถกด 'เริ่มทำข้อสอบ' ใหม่ได้ทันที");
      setTimeout(() => setResetNotice(null), 4000);
    } catch (err) {
      console.error("Failed to reset mockup exam data:", err);
    }
  }

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

        <h1 className="wb-rules-title">{examTitle}</h1>

        <section className="wb-rules-facts" aria-label="ข้อมูลชุดข้อสอบ">
          <article>
            <span>ชุดข้อสอบ</span>
            <b>{examSet}</b>
          </article>
          <article>
            <span>จำนวนข้อสอบ</span>
            <b>{questionCount} ข้อ</b>
          </article>
          <article>
            <span>ระยะเวลาสอบ</span>
            <b>{durationMinutes} นาที</b>
          </article>
          <article>
            <span>ประเภทข้อสอบ</span>
            <b>{examPlan.sections.some((section) => section.choiceCount === 5) ? "ปรนัย 4-5 ตัวเลือก" : "ปรนัย 4 ตัวเลือก"}</b>
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
                {attemptState === "in-progress" ? (
                  <>การสอบชุดนี้เริ่มแล้ว เมื่อกดทำต่อจะกลับไปยังข้อสอบเดิม และเวลายังคงนับต่อเนื่อง</>
                ) : (
                  <>เมื่อกดปุ่ม <em>เริ่มสอบ</em> จากหน้านี้ไป ระบบจะเริ่มจับเวลา ไม่สามารถยกเลิกหรือเริ่มจับเวลาใหม่ได้ และจะเปลี่ยนไปสอบวิชาอื่นไม่ได้จนกว่าจะหมดเวลาหรือกดส่งคำตอบแล้ว</>
                )}
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
            disabled={!hasEntitlement || !canUseExam}
            onClick={() => setWarningOpen(true)}
          >
            {!hasEntitlement
              ? "ไม่มีสิทธิ์สอบชุดนี้"
            : !canUseExam
              ? "ไฟล์ข้อสอบยังไม่พร้อม"
            : attemptState === "in-progress"
              ? "ทำข้อสอบต่อ"
              : attemptState === "submitted" || attemptState === "timeout"
                ? "เริ่มทำข้อสอบ (สอบใหม่)"
                : "เริ่มทำข้อสอบ"}
          </button>
        </div>

        <div className="wb-rules-mockup-bar">
          <button
            type="button"
            className="wb-rules-mockup-btn"
            onClick={handleResetMockup}
            title="ล้างข้อมูลการสอบทั้งหมดของวิชานี้ เพื่อให้สามารถเริ่มสอบใหม่ได้อีกครั้งสำหรับการทดสอบ Mockup"
          >
            <LuRotateCcw className="wb-mockup-icon" aria-hidden="true" />
            <span>เคลียร์ค่าที่เคยสอบ (สำหรับทดสอบ Mockup เพื่อสอบใหม่)</span>
          </button>
          {resetNotice && (
            <p className="wb-rules-mockup-notice" role="status">
              <LuCheck className="wb-mockup-notice-icon" aria-hidden="true" />
              <span>{resetNotice}</span>
            </p>
          )}
        </div>

        {!hasEntitlement && examType === "purchased" && <p className="wb-exam-access-note">ยังไม่มีสิทธิ์ในชุดนี้ <Link href="/webb/products">เลือกซื้อข้อสอบ</Link></p>}
        {hasEntitlement && examType === "purchased" && !canUseExam && <p className="wb-exam-access-note">ยังไม่มีไฟล์ข้อสอบสำหรับรายการนี้ · ตอนนี้รองรับไฟล์ TGAT1, TGAT2 และ TGAT3 ชุด A</p>}
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
                  setWarningOpen(false);
                  if (attemptState !== "in-progress") {
                    try {
                      localStorage.removeItem(answerKey);
                      localStorage.removeItem(resultKey);
                      localStorage.setItem(
                        resultKey,
                        JSON.stringify({ status: "in-progress", startedAt: Date.now() }),
                      );
                      if (examType === "purchased") {
                        setPurchaseExamStatus(
                          product.id,
                          "in-progress",
                          true,
                          selectedPurchase?.ref,
                        );
                        updateAdminAttempt(product.id, "กำลังสอบ");
                      }
                    } catch {
                      /* Continue to the exam if browser storage is unavailable. */
                    }
                  }
                  router.push(examHref);
                }}
              >
                {attemptState === "in-progress" ? "รับทราบ ทำข้อสอบต่อ" : "รับทราบเริ่มทำข้อสอบ"}
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
  examSet = "A",
  purchaseRef,
  examType = "purchased",
  returnTo = "overview",
  interrupted = false,
}: {
  mode: FlowMode;
  productId?: string;
  examSet?: string;
  purchaseRef?: string;
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
        examSet={examSet}
        purchaseRef={purchaseRef}
        examType={examType}
        returnTo={returnTo}
      />
    );

  return (
    <ExamStateScreen success={mode === "success"} productId={product.id} examSet={examSet} purchaseRef={purchaseRef} examType={examType} interrupted={interrupted} />
  );
}
