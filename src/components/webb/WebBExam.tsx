"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LuArrowDown,
  LuArrowUp,
  LuChevronDown,
  LuChevronUp,
  LuMinus,
  LuPlus,
  LuSearch,
} from "react-icons/lu";
import type { ExamProduct } from "./data";
import { addDemoEmail, currentPurchaseForProduct, examAnswersStorageKey, examResultStorageKey, readDemoAccount, recordDemoRankingResult, setPurchaseExamStatus, updateAdminAttempt } from "./demo-store";

const TOTAL_QUESTIONS = 60;
const initialAnswers: Record<number, string> = { 0: "0", 1: "1" };

function ExamMark() {
  return (
    <span className="wb-answer-mark" aria-hidden="true">
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
  );
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return [hours, minutes, rest]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

function MockExamPdf() {
  return (
    <section className="wb-pdf-viewer" aria-label="เอกสารข้อสอบตัวอย่าง">
      <div className="wb-pdf-toolbar" aria-hidden="true">
        <LuSearch />
        <LuArrowUp />
        <LuArrowDown />
        <span className="wb-pdf-page-count">
          3 <i>of</i> 5
        </span>
        <span className="wb-pdf-toolbar-spacer" />
        <LuMinus />
        <LuPlus />
        <span>100%</span>
      </div>
      <article className="wb-pdf-sheet">
        <h2>In a common room (4-6)</h2>
        <p>Seth　: Do you know (4) __________ in the theater?</p>
        <p>Amber : (5) __________ What type of movies do you like?</p>
        <p>
          Seth　: Horror films. Others are just too boring and make me feel
          sleepy. How about you?
        </p>
        <p>
          Amber : (6) __________. I prefer reading books, for my imagination
          will not be circumscribed.
        </p>
        <p className="wb-pdf-passage">
          So many times have I been disappointed with the movies just because
          they were not the same as how I imagined them while reading from the
          books.
        </p>
        {[4, 5, 6].map((question) => (
          <section className="wb-pdf-question" key={question}>
            <b>{question}.</b>
            <div>
              <span>1. what I like</span>
              <span>2. which show is popular</span>
              <span>3. if there’s anything good</span>
              <span>4. how long that film has been</span>
              <span>5. when the movie will be</span>
            </div>
          </section>
        ))}
        <h2>A person new in town (7-10)</h2>
        <p>
          Karen　: Excuse me. (7) __________. Could you tell me how to go to the
          bus terminal?
        </p>
        <p>
          Susan : Of course. Keep walking along the street and take the third
          left. The terminal is a few meters away from that corner. You can’t
          miss it.
        </p>
        <p>
          Karen　: (8) __________. I have only been here for three days, and the
          city is too big.
        </p>
        <p>Susan : I agree. (9) __________.</p>
      </article>
    </section>
  );
}

function AnswerPaper({
  answers,
  onAnswer,
  expanded,
  onToggle,
  activeQuestion,
  onMove,
}: {
  answers: Record<number, string>;
  onAnswer: (question: number, choice: number) => void;
  expanded: boolean;
  onToggle: () => void;
  activeQuestion: number;
  onMove: (direction: -1 | 1) => void;
}) {
  const answeredCount = Object.keys(answers).length;
  return (
    <aside
      className={`wb-answer-panel${expanded ? " is-expanded" : " is-collapsed"}`}
    >
      <header className="wb-answer-panel-header">
        <strong>กระดาษคำตอบ</strong>
        <span>
          <em>{answeredCount}</em>/{TOTAL_QUESTIONS}
        </span>
        <button
          type="button"
          className="wb-answer-collapse"
          onClick={onToggle}
          aria-label={expanded ? "ย่อกระดาษคำตอบ" : "ขยายกระดาษคำตอบ"}
        >
          {expanded ? <LuChevronUp /> : <LuChevronDown />}
        </button>
      </header>
      {expanded && (
        <>
          <div className="wb-answer-legend">
            <span>
              <i className="is-answered" />
              ตอบแล้ว
            </span>
            <span>
              <i />
              ยังไม่ตอบ
            </span>
          </div>
          <div className="wb-answer-instruction">
            <b>TGAT1 การสื่อสารภาษาอังกฤษ</b>
            <small>4 ตัวเลือก (1–4) เลือกคำตอบที่ถูกต้อง</small>
          </div>
          <div className="wb-answer-grid-scroll">
            <div className="wb-answer-grid">
              {Array.from({ length: TOTAL_QUESTIONS }, (_, question) => (
                <div
                  className={`wb-answer-row${question === activeQuestion ? " is-active" : ""}`}
                  key={question}
                >
                  <b>{question + 1}</b>
                  {[0, 1, 2, 3].map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className={
                        answers[question] === String(choice)
                          ? "is-selected"
                          : ""
                      }
                      aria-label={`ข้อ ${question + 1} ตัวเลือก ${choice + 1}`}
                      aria-pressed={answers[question] === String(choice)}
                      onClick={() => onAnswer(question, choice)}
                    >
                      {choice + 1}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <footer className="wb-answer-panel-actions">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={activeQuestion === 0}
            >
              ย้อนกลับ
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={activeQuestion === TOTAL_QUESTIONS - 1}
            >
              ถัดไป 
            </button>
          </footer>
        </>
      )}
    </aside>
  );
}

export default function WebBExam({
  product,
  examType = "purchased",
}: {
  product: ExamProduct;
  examType?: "purchased" | "trial";
}) {
  const answerStorageKey = examAnswersStorageKey(product.id, examType);
  const resultKey = examResultStorageKey(product.id, examType);
  const examDurationSeconds =
    product.id === "tgat-full" && examType === "purchased" ? 10 : 180 * 60;
  // const examDurationSeconds = 10;
  const [answers, setAnswers] =
    useState<Record<number, string>>(initialAnswers);
  const [remaining, setRemaining] = useState(examDurationSeconds);
  const [attemptStatus, setAttemptStatus] = useState<
    "checking" | "ready" | "submitted" | "timeout"
  >("checking");
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [answerPaperExpanded, setAnswerPaperExpanded] = useState(true);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  useEffect(() => {
    const redirectIfCompleted = () => {
      try {
        if (examType === "purchased" && !currentPurchaseForProduct(product.id)) {
          setAttemptStatus("submitted");
          window.location.replace("/webb/products");
          return true;
        }
        const saved = localStorage.getItem(resultKey);
        const status = saved
          ? (JSON.parse(saved) as { status?: string }).status
          : undefined;
        if (status === "submitted" || status === "timeout") {
          setAttemptStatus(status);
          window.location.replace(
            `/webb/${status === "submitted" ? "success" : "error"}?product=${product.id}&type=${examType}`,
          );
          return true;
        }
        if (status === "interrupted") {
          setAttemptStatus("submitted");
          window.location.replace(`/webb/error?product=${product.id}&type=${examType}&reason=interrupted`);
          return true;
        }
        if (status === "authorized") {
          localStorage.removeItem(resultKey);
          localStorage.removeItem(answerStorageKey);
          localStorage.setItem(resultKey, JSON.stringify({ status: "in-progress", startedAt: Date.now() }));
          setPurchaseExamStatus(product.id, "in-progress", true, currentPurchaseForProduct(product.id)?.ref);
          updateAdminAttempt(product.id, "กำลังสอบ");
        }
      } catch {
        /* Continue the demo exam if browser storage is unavailable. */
      }
      return false;
    };

    if (!redirectIfCompleted()) setAttemptStatus("ready");
    const onPageShow = () => redirectIfCompleted();
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [resultKey, answerStorageKey, product.id, examType]);

  useEffect(() => {
    if (attemptStatus !== "ready" || examType !== "purchased") return;
    const markInterrupted = () => {
      try {
        const saved = localStorage.getItem(resultKey);
        const status = saved ? (JSON.parse(saved) as { status?: string }).status : undefined;
        if (status === "submitted" || status === "timeout" || status === "authorized") return;
        localStorage.setItem(resultKey, JSON.stringify({ status: "interrupted", interruptedAt: Date.now() }));
        localStorage.removeItem(answerStorageKey);
        setPurchaseExamStatus(product.id, "interrupted", false, currentPurchaseForProduct(product.id)?.ref);
        updateAdminAttempt(product.id, "ผิดปกติ");
      } catch { /* Keep the interruption visible when storage is available. */ }
    };
    window.addEventListener("pagehide", markInterrupted);
    return () => window.removeEventListener("pagehide", markInterrupted);
  }, [attemptStatus, examType, resultKey, answerStorageKey, product.id]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(answerStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        setAnswers(
          Object.fromEntries(
            Object.entries(parsed).filter(
              ([key]) => Number(key) < TOTAL_QUESTIONS,
            ),
          ),
        );
      } else {
        localStorage.setItem(answerStorageKey, JSON.stringify(initialAnswers));
      }
      const startedAtKey = `webb-demo-started:${product.id}:${examType}`;
      if (!localStorage.getItem(startedAtKey))
        localStorage.setItem(startedAtKey, String(Date.now()));
    } catch {
      /* Exam answers remain usable when browser storage is unavailable. */
    }
  }, [answerStorageKey, product.id, examType]);

  useEffect(() => {
    try {
      localStorage.setItem(answerStorageKey, JSON.stringify(answers));
    } catch {
      /* Exam answers remain usable when browser storage is unavailable. */
    }
  }, [answers, answerStorageKey]);

  useEffect(() => {
    if (attemptStatus !== "ready") return;
    const timer = window.setInterval(
      () => setRemaining((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [attemptStatus]);

  useEffect(() => {
    if (remaining !== 0 || attemptStatus !== "ready") return;
    localStorage.setItem(
      resultKey,
      JSON.stringify({ answers, answeredCount, status: "timeout" }),
    );
    if (examType === "purchased") {
      setPurchaseExamStatus(product.id, "submitted", false, currentPurchaseForProduct(product.id)?.ref);
      updateAdminAttempt(product.id, "ส่งแล้ว", `${answeredCount}/${TOTAL_QUESTIONS}`);
      recordDemoRankingResult(product.id, 60.7);
      const account = readDemoAccount();
      if (account?.email) addDemoEmail(account.email, `หมดเวลาสอบ ${product.name}`, `ระบบส่งคำตอบล่าสุดของคุณแล้ว · ดูผลสอบและวิดีโอเฉลยได้ในบัญชีผู้เรียน (อีเมลนี้เป็นการจำลอง)`);
    }
    setAttemptStatus("timeout");
    window.location.replace(
      `/webb/error?product=${product.id}&type=${examType}`,
    );
  }, [
    remaining,
    attemptStatus,
    resultKey,
    product.id,
    examType,
    answers,
    answeredCount,
  ]);

  function chooseAnswer(question: number, choice: number) {
    setActiveQuestion(question);
    setAnswers((current) => ({ ...current, [question]: String(choice) }));
  }

  function moveQuestion(direction: -1 | 1) {
    setActiveQuestion((current) =>
      Math.min(TOTAL_QUESTIONS - 1, Math.max(0, current + direction)),
    );
  }

  function submit() {
    if (attemptStatus !== "ready") return;
    localStorage.setItem(
      resultKey,
      JSON.stringify({ answers, answeredCount, status: "submitted" }),
    );
    if (examType === "purchased") {
      setPurchaseExamStatus(product.id, "submitted", false, currentPurchaseForProduct(product.id)?.ref);
      updateAdminAttempt(product.id, "ส่งแล้ว", `${answeredCount}/${TOTAL_QUESTIONS}`);
      recordDemoRankingResult(product.id, 60.7);
      const account = readDemoAccount();
      if (account?.email) addDemoEmail(account.email, `ส่งข้อสอบ ${product.name} สำเร็จ`, `ระบบบันทึกคำตอบ ${answeredCount} ข้อแล้ว · ดูผลสอบและวิดีโอเฉลยได้ในบัญชีผู้เรียน (อีเมลนี้เป็นการจำลอง)`);
    }
    setAttemptStatus("submitted");
    window.location.replace(
      `/webb/success?product=${product.id}&type=${examType}`,
    );
  }

  if (attemptStatus !== "ready") {
    return (
      <main className="wb-answer-page" aria-busy="true">
        <p className="wb-answer-checking" role="status">
          กำลังตรวจสอบสถานะการสอบ…
        </p>
      </main>
    );
  }

  return (
    <main className="wb-answer-page">
      <header className="wb-answer-header">
        <div className="wb-answer-header-person">
          <ExamMark />
          <div>
            <strong>
              {product.id === "tgat-full" ? "TGAT" : product.name}{" "}
              ความถนัดทั่วไป · ชุด A
            </strong>
            <span>{readDemoAccount() ? `${readDemoAccount()?.firstName} ${readDemoAccount()?.lastName}` : "สมชาย ศิริกุล"}</span>
          </div>
        </div>
        <div className="wb-answer-clock" aria-label="เวลาที่เหลือ">
          {formatTime(remaining)}
        </div>
        <button
          type="button"
          className="wb-answer-submit"
          onClick={() => setConfirmSubmit(true)}
        >
          ส่งคำตอบ
        </button>
      </header>
      {remaining <= 300 && remaining > 0 && (
        <div className="wb-answer-warning" role="status">
          <b>
            ◷ เหลือเวลาอีก{" "}
            {examDurationSeconds <= 300 ? `${remaining} วินาที` : "5 นาที"}
          </b>
          <small>กรุณาเตรียมตัวส่งกระดาษคำตอบ</small>
        </div>
      )}
      <div className="wb-answer-container">
        <div className="wb-answer-layout">
          <MockExamPdf />
          <AnswerPaper
            answers={answers}
            onAnswer={chooseAnswer}
            expanded={answerPaperExpanded}
            onToggle={() => setAnswerPaperExpanded((value) => !value)}
            activeQuestion={activeQuestion}
            onMove={moveQuestion}
          />
        </div>
      </div>
      <footer className="wb-answer-copyright">
        © 2569 บริษัท เรียนต่อมหาลัย จำกัด
      </footer>

      {confirmSubmit && (
        <div className="wb-confirm-overlay">
          <button
            className="wb-confirm-backdrop"
            type="button"
            aria-label="ปิดหน้าต่างยืนยัน"
            onClick={() => setConfirmSubmit(false)}
          />
          <section
            className="wb-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wb-confirm-title"
          >
            <span className="wb-confirm-icon" aria-hidden="true">
              ✏️
            </span>
            <h2 id="wb-confirm-title">ยืนยันการส่งคำตอบ?</h2>
            <p>เมื่อส่งแล้วจะไม่สามารถกลับมาแก้ไขได้</p>
            <div className="wb-confirm-actions">
              <button
                type="button"
                className="wb-confirm-review"
                onClick={() => setConfirmSubmit(false)}
              >
                ตรวจทานอีกครั้ง
              </button>
              <button
                type="button"
                className="wb-confirm-send"
                onClick={submit}
              >
                ยืนยันส่งคำตอบ
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
