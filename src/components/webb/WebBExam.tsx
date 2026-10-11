"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { MOCK_EXAM_PAGES, TOTAL_MOCK_QUESTIONS, TOTAL_MOCK_PAGES, getPageForQuestion } from "./mock-exam-questions";

const TOTAL_QUESTIONS = TOTAL_MOCK_QUESTIONS;
const initialAnswers: Record<number, string> = {};

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

function MockExamPdf({
  page,
  onPageChange,
  zoom,
  onZoomChange,
}: {
  page: number;
  onPageChange: (newPage: number) => void;
  zoom: number;
  onZoomChange: (delta: number) => void;
}) {
  const viewerRef = useRef<HTMLElement>(null);
  const currentPageData =
    MOCK_EXAM_PAGES.find((p) => p.pageNumber === page) || MOCK_EXAM_PAGES[0];

  useEffect(() => {
    viewerRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);

  return (
    <section className="wb-pdf-viewer" ref={viewerRef} aria-label="เอกสารข้อสอบ">
      <div className="wb-pdf-toolbar">
        <LuSearch />
        <button
          type="button"
          title="หน้าก่อนหน้า"
          aria-label="หน้าก่อนหน้า"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <LuArrowUp />
        </button>
        <button
          type="button"
          title="หน้าถัดไป"
          aria-label="หน้าถัดไป"
          disabled={page >= TOTAL_MOCK_PAGES}
          onClick={() => onPageChange(page + 1)}
        >
          <LuArrowDown />
        </button>
        <span className="wb-pdf-page-count">
          {page} <i>of</i> {TOTAL_MOCK_PAGES}
        </span>
        <span className="wb-pdf-toolbar-spacer" />
        <button
          type="button"
          title="ลดขนาดตัวหนังสือ"
          aria-label="ลดขนาดตัวหนังสือ"
          disabled={zoom <= 80}
          onClick={() => onZoomChange(-10)}
        >
          <LuMinus />
        </button>
        <button
          type="button"
          title="เพิ่มขนาดตัวหนังสือ"
          aria-label="เพิ่มขนาดตัวหนังสือ"
          disabled={zoom >= 140}
          onClick={() => onZoomChange(10)}
        >
          <LuPlus />
        </button>
        <span
          style={{ cursor: "pointer", userSelect: "none" }}
          title="รีเซ็ตขนาด 100%"
          onClick={() => onZoomChange(100 - zoom)}
        >
          {zoom}%
        </span>
      </div>
      <article
        className="wb-pdf-sheet"
        style={{
          zoom: zoom / 100,
        }}
      >
        <h2>{currentPageData.section}</h2>
        {currentPageData.subSection && (
          <p style={{ fontWeight: 600, color: "#444", marginBottom: 8 }}>
            {currentPageData.subSection}
          </p>
        )}
        {currentPageData.dialogue && (
          <div style={{ marginBottom: 16 }}>
            {currentPageData.dialogue.map((d, index) => (
              <p key={index} style={{ marginBottom: 4 }}>
                <b>{d.speaker}</b> : {d.text}
              </p>
            ))}
          </div>
        )}
        {currentPageData.passage && (
          <p className="wb-pdf-passage">{currentPageData.passage}</p>
        )}

        {currentPageData.questions.map((question) => (
          <section className="wb-pdf-question" key={question.id}>
            <b>{question.number}.</b>
            <div>
              <p style={{ gridColumn: "1 / -1", marginBottom: 6 }}>
                {question.prompt}
              </p>
              <div className="wb-pdf-choices">
                {question.choices.map((choiceText, cIndex) => (
                  <div key={cIndex} className="wb-pdf-choice-item">
                    <span className="wb-choice-num">{cIndex + 1}.</span>
                    <span>{choiceText}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </article>
    </section>
  );
}

function AnswerPaper({
  answers,
  onAnswer,
  expanded,
  onToggle,
  page,
  totalPages,
  onPageChange,
}: {
  answers: Record<number, string>;
  onAnswer: (question: number, choice: number) => void;
  expanded: boolean;
  onToggle: () => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const [filter, setFilter] = useState<"all" | "answered" | "unanswered">("all");
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = TOTAL_QUESTIONS - answeredCount;
  const gridScrollRef = useRef<HTMLDivElement>(null);

  const filteredQuestions = useMemo(() => {
    return Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i).filter((q) => {
      const isAnswered = answers[q] !== undefined;
      if (filter === "answered") return isAnswered;
      if (filter === "unanswered") return !isAnswered;
      return true;
    });
  }, [filter, answers]);

  useEffect(() => {
    const pageData = MOCK_EXAM_PAGES.find((p) => p.pageNumber === page);
    if (pageData && pageData.questions.length > 0) {
      const firstQ = pageData.questions[0].number;
      const targetRow = document.getElementById(`wb-answer-row-${firstQ}`);
      if (targetRow && gridScrollRef.current) {
        targetRow.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    }
  }, [page]);

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
          <div className="wb-answer-legend" role="tablist" aria-label="กรองสถานะข้อสอบ">
            <button
              type="button"
              className={`wb-legend-filter-btn ${filter === "all" ? "is-active" : ""}`}
              onClick={() => setFilter("all")}
            >
              ทั้งหมด ({TOTAL_QUESTIONS})
            </button>
            <button
              type="button"
              className={`wb-legend-filter-btn ${filter === "answered" ? "is-active" : ""}`}
              onClick={() => setFilter(filter === "answered" ? "all" : "answered")}
            >
              <i className="is-answered" />
              ตอบแล้ว ({answeredCount})
            </button>
            <button
              type="button"
              className={`wb-legend-filter-btn ${filter === "unanswered" ? "is-active" : ""}`}
              onClick={() => setFilter(filter === "unanswered" ? "all" : "unanswered")}
            >
              <i />
              ยังไม่ตอบ ({unansweredCount})
            </button>
          </div>
          <div className="wb-answer-grid-scroll" ref={gridScrollRef}>
            {filteredQuestions.length === 0 ? (
              <div className="wb-filter-empty-message">
                {filter === "unanswered" ? "ตอบครบทุกข้อแล้ว 🎉" : "ยังไม่มีข้อที่ตอบ"}
              </div>
            ) : (
              <div className="wb-answer-grid">
                {filteredQuestions.map((question, idx) => {
                  const questionNumber = question + 1;
                  const pageNum = getPageForQuestion(question);
                  const isFirstOfPage =
                    filter === "all" &&
                    (idx === 0 ||
                      getPageForQuestion(filteredQuestions[idx - 1]) !== pageNum);

                  return (
                    <div key={question} style={{ display: "contents" }}>
                      {isFirstOfPage && (
                        <div
                          className={`wb-answer-page-divider ${pageNum === page ? "is-current-page" : ""}`}
                          onClick={() => onPageChange(pageNum)}
                          title={`เปิดดูข้อสอบหน้า ${pageNum}`}
                        >
                          <span>หน้า {pageNum}</span>
                          <small>{pageNum === page ? "กำลังดูหน้านี้" : `คลิกเพื่อไปหน้า ${pageNum}`}</small>
                        </div>
                      )}
                      <div
                        className="wb-answer-row"
                        id={`wb-answer-row-${questionNumber}`}
                      >
                        <b
                          style={{ cursor: "pointer" }}
                          title={`คลิกเพื่อเปิดหน้าที่มีข้อ ${questionNumber}`}
                          onClick={() => onPageChange(pageNum)}
                        >
                          {questionNumber}
                        </b>
                        {[0, 1, 2, 3].map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            className={
                              answers[question] === String(choice)
                                ? "is-selected"
                                : ""
                            }
                            aria-label={`ข้อ ${questionNumber} ตัวเลือก ${choice + 1}`}
                            aria-pressed={answers[question] === String(choice)}
                            onClick={() => onAnswer(question, choice)}
                          >
                            {choice + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <footer className="wb-answer-panel-actions">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="ย้อนกลับหน้า"
            >
              ย้อนกลับ
            </button>
            <span className="wb-answer-page-badge">
              หน้า {page}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="ถัดไปหน้า"
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
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  function handleAutoFill() {
    const newAnswers: Record<number, string> = {};
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      newAnswers[i] = String(Math.floor(Math.random() * 4));
    }
    setAnswers(newAnswers);
  }

  function handleClearAll() {
    setAnswers({});
    try {
      localStorage.removeItem(answerStorageKey);
    } catch {}
  }

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
        // If the stored data was the old default mock { "0": "0", "1": "1" }, purge it
        const isOldMockDefault =
          Object.keys(parsed).length === 2 &&
          parsed["0"] === "0" &&
          parsed["1"] === "1";
        if (isOldMockDefault) {
          localStorage.removeItem(answerStorageKey);
          setAnswers({});
        } else {
          setAnswers(
            Object.fromEntries(
              Object.entries(parsed).filter(
                ([key]) => Number(key) < TOTAL_QUESTIONS,
              ),
            ),
          );
        }
      } else {
        setAnswers({});
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
    setAnswers((current) => {
      const next = { ...current };
      if (next[question] === String(choice)) {
        delete next[question];
      } else {
        next[question] = String(choice);
      }
      return next;
    });
  }

  function handlePageChange(newPage: number) {
    setPage(Math.min(TOTAL_MOCK_PAGES, Math.max(1, newPage)));
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

      <div className="wb-exam-mockup-toolbar">
        <div className="wb-exam-toolbar-inner">
          <div className="wb-exam-info-badge">
            <strong className="wb-exam-info-subject">TGAT1 การสื่อสารภาษาอังกฤษ</strong>
            <span className="wb-exam-info-desc">4 ตัวเลือก (1–4) เลือกคำตอบที่ถูกต้อง</span>
          </div>
          <div className="wb-mockup-btn-group">
            <button
              type="button"
              className="wb-mockup-action-btn"
              onClick={handleClearAll}
              title="ล้างคำตอบที่ตอบไว้ทั้งหมด"
            >
              ล้างคำตอบ
            </button>
            <button
              type="button"
              className="wb-mockup-action-btn"
              onClick={() => setRemaining(10)}
              title="ตั้งเวลาเหลือ 10 วินาที เพื่อดูหน้าจอเตือนและระบบส่งอัตโนมัติ"
            >
              ทดสอบหมดเวลา (10 วิ)
            </button>
            <Link
              href={`/webb/rules?product=${product.id}&type=${examType}&back=exam`}
              className="wb-mockup-action-btn wb-mockup-exit-btn"
              title="กลับไปยังหน้ากติกาการสอบ"
            >
              ออกจากห้องสอบ
            </Link>
          </div>
        </div>
      </div>

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
          <MockExamPdf
            page={page}
            onPageChange={handlePageChange}
            zoom={zoom}
            onZoomChange={(delta) =>
              setZoom((z) => Math.min(140, Math.max(80, z + delta)))
            }
          />
          <AnswerPaper
            answers={answers}
            onAnswer={chooseAnswer}
            expanded={answerPaperExpanded}
            onToggle={() => setAnswerPaperExpanded((value) => !value)}
            page={page}
            totalPages={TOTAL_MOCK_PAGES}
            onPageChange={handlePageChange}
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
