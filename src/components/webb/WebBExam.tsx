"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import type { ExamProduct } from "./data";
import { WebBPreviewResultReport } from "./WebBStudentArea";
import { getExamPlan, getExamQuestionDetails, getExamResponseDetails, type ExamPlan, type ExamResponseType } from "./exam-documents";
import PurchasedExamPdfViewer from "./PurchasedExamPdfViewer";
import { addDemoEmail, calculateDemoScore, currentPurchaseForExam, currentPurchaseForRef, examAnswersStorageKey, examResultStorageKey, isDemoContentPublished, readDemoAccount, recordDemoRankingResult, setPurchaseExamStatus, updateAdminAttempt } from "./demo-store";
import {
  MOCK_EXAM_PAGES,
  TOTAL_MOCK_QUESTIONS,
  TOTAL_MOCK_PAGES,
  getPageForQuestion,
} from "./mock-exam-questions";

const TOTAL_QUESTIONS = TOTAL_MOCK_QUESTIONS;
type ExamAnswer = string | string[];
type PreviewAnswerKeyEntry = { value: string; score: number };
const initialAnswers: Record<number, ExamAnswer> = {};

function calculatePreviewScore(
  answers: Record<number, ExamAnswer>,
  answerKey: PreviewAnswerKeyEntry[],
  questionCount: number,
  scoreMaximum?: number,
) {
  const answerRows = answerKey.slice(0, questionCount);
  const keyedCount = answerRows.filter((item) => item.value.trim()).length;
  if (!keyedCount) return { score: null, keyStatus: "missing" as const };
  if (answerRows.length < questionCount || keyedCount < questionCount)
    return { score: null, keyStatus: "incomplete" as const };

  const normalize = (value: string) => value
    .trim()
    .toUpperCase()
    .split(/[,+\s/]+/)
    .filter(Boolean)
    .map((choice) => (({ A: "1", B: "2", C: "3", D: "4", E: "5" } as Record<string, string>)[choice] || choice))
    .sort()
    .join(",");
  const earned = answerRows.reduce((total, item, index) => {
    const selected = answers[index];
    const choices = Array.isArray(selected) ? selected : selected === undefined ? [] : [selected];
    const normalizedSelection = choices
      .map((choice) => String(Number(choice) + 1))
      .sort()
      .join(",");
    return total + (normalizedSelection === normalize(item.value) ? item.score : 0);
  }, 0);
  const maximum = scoreMaximum && scoreMaximum > 0
    ? scoreMaximum
    : answerRows.reduce((total, item) => total + item.score, 0);
  return {
    score: maximum > 0 ? Math.min(100, Math.round((earned / maximum) * 1000) / 10) : 0,
    keyStatus: "ready" as const,
  };
}

function clearTrialAttempt(resultKey: string, answerKey: string, startedAtKey: string) {
  try {
    localStorage.removeItem(resultKey);
    localStorage.removeItem(answerKey);
    localStorage.removeItem(startedAtKey);
  } catch {
    /* Trial data is isolated from the student's saved exam results. */
  }
}

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

function MockExamPdf({ page }: { page: number }) {
  const viewerRef = useRef<HTMLElement>(null);
  const currentPageData =
    MOCK_EXAM_PAGES.find((p) => p.pageNumber === page) || MOCK_EXAM_PAGES[0];

  useEffect(() => {
    viewerRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);

  return (
    <section className="wb-pdf-viewer" ref={viewerRef} aria-label="เอกสารข้อสอบ">
      <article
        className="wb-pdf-sheet"
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
  questionCount,
  examPlan,
  pdfBacked,
  demoPageData,
  answers,
  onAnswer,
  expanded,
  onToggle,
  page,
  totalPages,
  onPageChange,
  questionOffset = 0,
  activeSectionIndex = 0,
  sectionCount = 1,
  onSectionChange,
}: {
  questionCount: number;
  examPlan: ExamPlan | null;
  pdfBacked: boolean;
  demoPageData?: (typeof MOCK_EXAM_PAGES)[number] | null;
  answers: Record<number, ExamAnswer>;
  onAnswer: (question: number, choice: number, responseType: ExamResponseType) => void;
  expanded: boolean;
  onToggle: () => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  questionOffset?: number;
  activeSectionIndex?: number;
  sectionCount?: number;
  onSectionChange?: (index: number) => void;
}) {
  const [filter, setFilter] = useState<"all" | "answered" | "unanswered">("all");
  const answeredCount = Object.keys(answers).filter((question) => {
    const index = Number(question);
    return index >= questionOffset && index < questionOffset + questionCount;
  }).length;
  const unansweredCount = questionCount - answeredCount;
  const gridScrollRef = useRef<HTMLDivElement>(null);

  const filteredQuestions = useMemo(() => {
    return Array.from({ length: questionCount }, (_, i) => i)
      .filter((q) => {
        const answer = answers[questionOffset + q];
        const isAnswered = Array.isArray(answer) ? answer.length > 0 : answer !== undefined;
        if (filter === "answered") return isAnswered;
        if (filter === "unanswered") return !isAnswered;
        return true;
      })
      .slice(pdfBacked || demoPageData ? 0 : (page - 1) * 10, pdfBacked || demoPageData ? undefined : page * 10);
  }, [filter, answers, questionCount, questionOffset, pdfBacked, demoPageData, page]);

  useEffect(() => {
    if (pdfBacked || demoPageData) return;
    const pageData = MOCK_EXAM_PAGES.find((p) => p.pageNumber === page);
    if (pageData && pageData.questions.length > 0) {
      const firstQ = pageData.questions[0].number;
      const targetRow = document.getElementById(`wb-answer-row-${firstQ}`);
      if (targetRow && gridScrollRef.current) {
        targetRow.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    }
  }, [page, pdfBacked, demoPageData]);

  return (
    <aside
      className={`wb-answer-panel${expanded ? " is-expanded" : " is-collapsed"}`}
    >
      <header className="wb-answer-panel-header">
        <strong>กระดาษคำตอบ</strong>
        <span>
          <em>{answeredCount}</em>/{questionCount}
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
          {examPlan ? (
            <div className="wb-answer-legend wb-answer-legend-static" aria-label="สถานะคำตอบ">
              <span><i className="is-answered" />ตอบแล้ว</span>
              <span><i />ยังไม่ตอบ</span>
            </div>
          ) : <div className="wb-answer-legend" role="tablist" aria-label="กรองสถานะข้อสอบ">
            <button
              type="button"
              className={`wb-legend-filter-btn ${filter === "all" ? "is-active" : ""}`}
              onClick={() => setFilter("all")}
            >
              ทั้งหมด ({questionCount})
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
          </div>}
          {examPlan && (
            <div className="wb-answer-instruction">
              <b>{demoPageData?.section || examPlan.sections[activeSectionIndex]?.title}</b>
              <small>
                {demoPageData
                  ? `${demoPageData.questions[0]?.choices.length || 4} ตัวเลือก (1–${demoPageData.questions[0]?.choices.length || 4}) · เลือกคำตอบที่ถูกต้อง`
                  : examPlan.sections[activeSectionIndex]?.id === "tgat3"
                    ? `${examPlan.sections[activeSectionIndex]?.choiceCount} ตัวเลือก · เลือกตอบได้หลายตัวเลือกในทุกข้อ`
                    : `${examPlan.sections[activeSectionIndex]?.choiceCount} ตัวเลือก (1–${examPlan.sections[activeSectionIndex]?.choiceCount}) · เลือกคำตอบที่ถูกต้อง`}
              </small>
            </div>
          )}
          <div className="wb-answer-grid-scroll" ref={gridScrollRef}>
            {filteredQuestions.length === 0 ? (
              <div className="wb-filter-empty-message">
                {filter === "unanswered" ? "ตอบครบทุกข้อแล้ว 🎉" : "ยังไม่มีข้อที่ตอบ"}
              </div>
            ) : (
              <div className="wb-answer-grid">
                {filteredQuestions.map((question, idx) => {
                  const answerIndex = questionOffset + question;
                  const demoQuestion = demoPageData?.questions.find((item) => item.id === answerIndex);
                  const questionDetails = demoQuestion
                    ? { questionNumber: demoQuestion.number, choiceCount: demoQuestion.choices.length }
                    : examPlan
                    ? getExamQuestionDetails(examPlan, answerIndex)
                    : { questionNumber: answerIndex + 1, choiceCount: 4 };
                  const questionNumber = questionDetails.questionNumber;
                  const responseDetails = examPlan
                    ? getExamResponseDetails(examPlan, answerIndex)
                    : { responseType: "single" as const, linkedQuestionNumber: undefined };
                  const selectedAnswer = answers[answerIndex];
                  const pageNum = pdfBacked ? null : demoPageData?.pageNumber ?? getPageForQuestion(question);
                  const isFirstOfPage =
                    !pdfBacked && !demoPageData &&
                    filter === "all" &&
                    (idx === 0 ||
                      getPageForQuestion(filteredQuestions[idx - 1]) !== pageNum);

                  return (
                    <div key={answerIndex} style={{ display: "contents" }}>
                      {isFirstOfPage && pageNum !== null && (
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
                        data-response-type={responseDetails.responseType}
                        data-choice-count={questionDetails.choiceCount}
                        id={`wb-answer-row-${questionNumber}`}
                      >
                        <b
                          style={{ cursor: "pointer" }}
                          title={`คลิกเพื่อเปิดหน้าที่มีข้อ ${questionNumber}`}
                          onClick={() => pageNum !== null && onPageChange(pageNum)}
                        >
                          {questionNumber}
                          {responseDetails.responseType === "multiple" && <small>หลายคำตอบ</small>}
                          {responseDetails.responseType === "linked" && <small>คู่ข้อ {responseDetails.linkedQuestionNumber}</small>}
                        </b>
                        {Array.from({ length: questionDetails.choiceCount }, (_, choice) => choice).map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            className={(Array.isArray(selectedAnswer)
                              ? selectedAnswer.includes(String(choice))
                              : selectedAnswer === String(choice)) ? "is-selected" : ""}
                            aria-label={`ข้อ ${questionNumber} ตัวเลือก ${choice + 1}`}
                            aria-pressed={Array.isArray(selectedAnswer)
                              ? selectedAnswer.includes(String(choice))
                              : selectedAnswer === String(choice)}
                            onClick={() => onAnswer(answerIndex, choice, responseDetails.responseType)}
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
          {(pdfBacked || demoPageData) && <footer className="wb-answer-panel-actions">
            <button
              type="button"
              onClick={() => demoPageData ? onPageChange(page - 1) : onSectionChange?.(activeSectionIndex - 1)}
              disabled={demoPageData ? page <= 1 : activeSectionIndex <= 0}
              aria-label="ย้อนกลับ"
            >
              ย้อนกลับ
            </button>
            <button
              type="button"
              onClick={() => demoPageData ? onPageChange(page + 1) : onSectionChange?.(activeSectionIndex + 1)}
              disabled={demoPageData ? page >= totalPages : activeSectionIndex >= sectionCount - 1}
              aria-label="ถัดไป"
            >
              ถัดไป <span aria-hidden="true">→</span>
            </button>
          </footer>}
        </>
      )}
    </aside>
  );
}

function PurchasedExamDocuments({
  plan,
  activeSectionIndex = 0,
}: {
  plan: ExamPlan;
  activeSectionIndex?: number;
}) {
  if (!plan.hasSuppliedExam || plan.sections.length === 0) {
    return (
      <section className="wb-purchased-exam-unavailable" role="status">
        <h2>ยังไม่มีไฟล์ข้อสอบสำหรับรายการนี้</h2>
        <p>ไฟล์ที่เตรียมไว้ตอนนี้ครอบคลุม TGAT1, TGAT2 และ TGAT3 ชุด A เท่านั้น</p>
        <Link href="/webb/student?view=exam">กลับรายการสอบของคุณ</Link>
      </section>
    );
  }

  const section = plan.sections[activeSectionIndex] || plan.sections[0];

  return (
    <div className="wb-purchased-exam-documents">
      <section className="wb-purchased-exam-document" key={section.id}>
        <PurchasedExamPdfViewer
          src={section.examPdf}
          title={`ข้อสอบ ${section.title} ชุด 4`}
        />
      </section>
    </div>
  );
}

export default function WebBExam({
  product,
  examType = "purchased",
  examSet = "A",
  purchaseRef,
  previewMode = false,
  previewAnswerKey = [],
  previewScoreMaximum,
  onPreviewExit,
}: {
  product: ExamProduct;
  examType?: "purchased" | "trial";
  examSet?: string;
  purchaseRef?: string;
  previewMode?: boolean;
  previewAnswerKey?: PreviewAnswerKeyEntry[];
  previewScoreMaximum?: number;
  onPreviewExit?: () => void;
}) {
  const answerStorageKey = examAnswersStorageKey(product.id, examType, undefined, examSet);
  const resultKey = examResultStorageKey(product.id, examType, undefined, examSet);
  const startedAtKey = `webb-demo-started:${product.id}:${examType}:${examSet}`;
  const selectedPurchase = currentPurchaseForRef(purchaseRef) || currentPurchaseForExam(product.id, examSet);
  const examPlan = getExamPlan(product.id, examSet);
  const pdfBacked = examType === "purchased";
  const questionCount = pdfBacked ? examPlan.questionCount : Math.min(TOTAL_QUESTIONS, examPlan.questionCount);
  const examDurationSeconds = examPlan.durationMinutes * 60;
  const [answers, setAnswers] =
    useState<Record<number, ExamAnswer>>(initialAnswers);
  const [remaining, setRemaining] = useState(examDurationSeconds);
  const [deadlineAt, setDeadlineAt] = useState<number | null>(null);
  const [attemptStatus, setAttemptStatus] = useState<
    "checking" | "ready" | "submitted" | "timeout" | "unsupported"
  >("checking");
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [previewSummary, setPreviewSummary] = useState<{
    score: number | null;
    keyStatus: "ready" | "missing" | "incomplete";
    answeredCount: number;
    questionCount: number;
    timedOut: boolean;
    durationSeconds: number;
  } | null>(null);
  const [answerPaperExpanded, setAnswerPaperExpanded] = useState(true);
  const [page, setPage] = useState(1);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const activeExamSection = pdfBacked
    ? examPlan.sections[activeSectionIndex] || examPlan.sections[0]
    : null;
  const activeDemoPage = pdfBacked
    ? null
    : MOCK_EXAM_PAGES[page - 1] || MOCK_EXAM_PAGES[0];

  function handleAutoFill() {
    const newAnswers: Record<number, ExamAnswer> = {};
    for (let i = 0; i < questionCount; i++) {
      newAnswers[i] = String(Math.floor(Math.random() * getExamQuestionDetails(examPlan, i).choiceCount));
    }
    setAnswers(newAnswers);
  }

  function testExamExpiry() {
    const nextDeadline = Date.now() + 5_000;
    setDeadlineAt(nextDeadline);
    setRemaining(5);
    try {
      const saved = localStorage.getItem(resultKey);
      const attempt = saved ? JSON.parse(saved) as Record<string, unknown> : {};
      localStorage.setItem(resultKey, JSON.stringify({
        ...attempt,
        status: "in-progress",
        startedAt: attempt.startedAt || Date.now(),
        deadlineAt: nextDeadline,
      }));
    } catch {
      // The countdown still works for this page if browser storage is unavailable.
    }
  }

  useEffect(() => {
    if (previewMode) {
      setAttemptStatus("ready");
      return;
    }
    const redirectIfCompleted = () => {
      try {
        if (examType === "purchased" && !selectedPurchase) {
          setAttemptStatus("submitted");
          window.location.replace("/webb/products");
          return true;
        }
        if (examType === "purchased" && !examPlan.hasSuppliedExam) {
          setAttemptStatus("unsupported");
          return true;
        }
        if (examType === "purchased" && !isDemoContentPublished(product.id)) {
          setAttemptStatus("unsupported");
          return true;
        }
        let saved = localStorage.getItem(resultKey);
        if (!saved) {
          const legacyKey = examResultStorageKey(product.id, examType);
          saved = localStorage.getItem(legacyKey);
          if (saved) localStorage.setItem(resultKey, saved);
        }
        const status = saved
          ? (JSON.parse(saved) as { status?: string }).status
          : selectedPurchase?.examStatus;
        if (status === "interrupted") {
          setAttemptStatus("submitted");
          window.location.replace(`/webb/error?product=${product.id}&set=${encodeURIComponent(examSet)}&ref=${encodeURIComponent(purchaseRef || "")}&type=${examType}&reason=interrupted`);
          return true;
        }
        if (status === "authorized") {
          localStorage.removeItem(resultKey);
          localStorage.removeItem(answerStorageKey);
          localStorage.setItem(resultKey, JSON.stringify({ status: "in-progress", startedAt: Date.now() }));
          setPurchaseExamStatus(product.id, "in-progress", true, selectedPurchase?.ref);
          updateAdminAttempt(product.id, "กำลังสอบ", "—", examSet);
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
  }, [resultKey, answerStorageKey, product.id, examType, examSet, purchaseRef, examPlan.hasSuppliedExam, previewMode]);

  useEffect(() => {
    if (!previewMode) return;
    const closeAfterSummary = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      if (previewSummary) onPreviewExit?.();
    };
    window.addEventListener("keydown", closeAfterSummary);
    return () => window.removeEventListener("keydown", closeAfterSummary);
  }, [previewMode, previewSummary, onPreviewExit]);

  useEffect(() => {
    if (previewMode) {
      setAnswers({});
      const nextDeadline = Date.now() + examDurationSeconds * 1000;
      setDeadlineAt(nextDeadline);
      setRemaining(examDurationSeconds);
      setAttemptStatus("ready");
      return;
    }
    if (pdfBacked && !examPlan.hasSuppliedExam) return;
    try {
      let stored = localStorage.getItem(answerStorageKey);
      if (!stored) {
        const legacyKey = examAnswersStorageKey(product.id, examType);
        stored = localStorage.getItem(legacyKey);
        if (stored) localStorage.setItem(answerStorageKey, stored);
      }
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, ExamAnswer>;
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
                ([key]) => Number(key) < questionCount,
              ),
            ),
          );
        }
      } else {
        setAnswers({});
      }
      const savedResult = localStorage.getItem(resultKey);
      const savedAttempt = savedResult
        ? (JSON.parse(savedResult) as { status?: string; startedAt?: number; deadlineAt?: number })
        : null;
      const startedAt = savedAttempt?.startedAt || Number(localStorage.getItem(startedAtKey)) || Date.now();
      const nextDeadline = savedAttempt?.deadlineAt || startedAt + examDurationSeconds * 1000;
      if (!localStorage.getItem(startedAtKey)) localStorage.setItem(startedAtKey, String(startedAt));
      if (!savedAttempt || (savedAttempt.status === "in-progress" && !savedAttempt.deadlineAt)) {
        localStorage.setItem(resultKey, JSON.stringify({
          ...savedAttempt,
          status: "in-progress",
          startedAt,
          deadlineAt: nextDeadline,
        }));
      }
      setDeadlineAt(nextDeadline);
      setRemaining(Math.max(0, Math.ceil((nextDeadline - Date.now()) / 1000)));
    } catch {
      /* Exam answers remain usable when browser storage is unavailable. */
    }
  }, [answerStorageKey, resultKey, startedAtKey, product.id, examType, examSet, examDurationSeconds, pdfBacked, examPlan.hasSuppliedExam, questionCount, previewMode]);

  useEffect(() => {
    if (previewMode) return;
    try {
      localStorage.setItem(answerStorageKey, JSON.stringify(answers));
    } catch {
      /* Exam answers remain usable when browser storage is unavailable. */
    }
  }, [answers, answerStorageKey, previewMode]);

  useEffect(() => {
    if (attemptStatus !== "ready" || deadlineAt === null) return;
    const timer = window.setInterval(
      () => setRemaining(Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000))),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [attemptStatus, deadlineAt]);

  useEffect(() => {
    if (remaining !== 0 || attemptStatus !== "ready") return;
    if (previewMode) {
      setConfirmSubmit(false);
      const result = calculatePreviewScore(answers, previewAnswerKey, questionCount, previewScoreMaximum);
      setPreviewSummary({
        score: result.score,
        keyStatus: result.keyStatus,
        answeredCount,
        questionCount,
        timedOut: true,
        durationSeconds: examDurationSeconds - remaining,
      });
      setAttemptStatus("timeout");
      return;
    }
    if (examType === "purchased") {
      const score = calculateDemoScore(answers, product.id, examSet);
      localStorage.setItem(
        resultKey,
        JSON.stringify({ answers, answeredCount, score, status: "timeout" }),
      );
      setPurchaseExamStatus(product.id, "submitted", false, selectedPurchase?.ref);
      updateAdminAttempt(product.id, "ส่งแล้ว", `${score}/100`, examSet);
      recordDemoRankingResult(product.id, score, examSet);
      const account = readDemoAccount();
      if (account?.email) addDemoEmail(account.email, `หมดเวลาสอบ ${product.name}`, `ระบบส่งคำตอบล่าสุดของคุณแล้ว · ดูผลสอบและวิดีโอเฉลยได้ในบัญชีผู้เรียน (อีเมลนี้เป็นการจำลอง)`);
    } else {
      clearTrialAttempt(resultKey, answerStorageKey, startedAtKey);
    }
    setConfirmSubmit(false);
    setAttemptStatus("timeout");
  }, [
    remaining,
    attemptStatus,
    resultKey,
    product.id,
    examType,
    answers,
    answeredCount,
    questionCount,
    answerStorageKey,
    startedAtKey,
    previewMode,
  ]);


  useEffect(() => {
    if (previewMode || attemptStatus !== "timeout") return;
    const timer = window.setTimeout(() => {
      if (examType === "trial") {
        clearTrialAttempt(resultKey, answerStorageKey, startedAtKey);
        window.location.replace("/webb/student?view=exam");
      } else {
        window.location.replace(
          `/webb/error?product=${product.id}&set=${encodeURIComponent(examSet)}&ref=${encodeURIComponent(purchaseRef || "")}&type=${examType}`,
        );
      }
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [attemptStatus, product.id, examSet, purchaseRef, examType, resultKey, answerStorageKey, startedAtKey, previewMode]);

  function chooseAnswer(question: number, choice: number, responseType: ExamResponseType = "single") {
    setAnswers((current) => {
      const next = { ...current };
      if (responseType === "multiple") {
        const currentChoices = Array.isArray(next[question])
          ? (next[question] as string[])
          : next[question] !== undefined && next[question] !== ""
            ? [String(next[question])]
            : [];
        const selectedChoices = currentChoices.includes(String(choice))
          ? currentChoices.filter((item) => item !== String(choice))
          : [...currentChoices, String(choice)].sort((left, right) => Number(left) - Number(right));
        if (selectedChoices.length) next[question] = selectedChoices;
        else delete next[question];
      } else if (next[question] === String(choice)) {
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
    if (previewMode) {
      setConfirmSubmit(false);
      const result = calculatePreviewScore(answers, previewAnswerKey, questionCount, previewScoreMaximum);
      setPreviewSummary({
        score: result.score,
        keyStatus: result.keyStatus,
        answeredCount,
        questionCount,
        timedOut: false,
        durationSeconds: examDurationSeconds - remaining,
      });
      return;
    }
    if (examType === "trial") {
      clearTrialAttempt(resultKey, answerStorageKey, startedAtKey);
      window.location.replace("/webb/student?view=exam");
      return;
    }
    const score = calculateDemoScore(answers, product.id, examSet);
    localStorage.setItem(
      resultKey,
      JSON.stringify({ answers, answeredCount, score, status: "submitted" }),
    );
    setPurchaseExamStatus(product.id, "submitted", false, selectedPurchase?.ref);
    updateAdminAttempt(product.id, "ส่งแล้ว", `${score}/100`, examSet);
    recordDemoRankingResult(product.id, score, examSet);
    const account = readDemoAccount();
    if (account?.email) addDemoEmail(account.email, `ส่งข้อสอบ ${product.name} สำเร็จ`, `ระบบบันทึกคำตอบ ${answeredCount} ข้อแล้ว · ดูผลสอบและวิดีโอเฉลยได้ในบัญชีผู้เรียน (อีเมลนี้เป็นการจำลอง)`);
    setAttemptStatus("submitted");
    window.location.replace(
      `/webb/success?product=${product.id}&set=${encodeURIComponent(examSet)}&ref=${encodeURIComponent(purchaseRef || "")}&type=${examType}`,
    );
  }

  if (attemptStatus === "unsupported") {
    return <main className="wb-answer-page"><PurchasedExamDocuments plan={examPlan} /></main>;
  }

  if (attemptStatus !== "ready" && attemptStatus !== "timeout") {
    return (
      <main className="wb-answer-page" aria-busy="true">
        <p className="wb-answer-checking" role="status">
          กำลังตรวจสอบสถานะการสอบ…
        </p>
      </main>
    );
  }

  if (previewMode && previewSummary) {
    return (
      <div className="wb-answer-page wb-preview-summary-page" aria-label="รายงานผลสอบ Preview">
        <WebBPreviewResultReport
          productId={product.id}
          examSet={examSet}
          onClose={() => onPreviewExit?.()}
        />
      </div>
    );
  }

  return (
    <main className="wb-answer-page">
      <header className="wb-answer-header">
        <div className="wb-answer-header-person">
          <ExamMark />
          <div>
            <strong>
              {product.id === "tgat-full" ? "TGAT ความถนัดทั่วไป" : `${product.name} ${product.parts}`} · ชุด {examSet}
            </strong>
            <span>{readDemoAccount() ? `${readDemoAccount()?.firstName} ${readDemoAccount()?.lastName}` : "สมชาย ศิริกุล"}</span>
          </div>
        </div>
        <div className="wb-answer-time-tools">
          <div className="wb-answer-clock" aria-label="เวลาที่เหลือ">
            {formatTime(remaining)}
          </div>
          {!previewMode && (
            <button type="button" className="wb-answer-test-expiry" onClick={testExamExpiry}>
              ทดสอบหมดเวลา (5 วิ)
            </button>
          )}
        </div>
        <button
          type="button"
          className="wb-answer-submit"
          onClick={() => setConfirmSubmit(true)}
        >
         ส่งคำตอบ
        </button>
      </header>

      {((remaining <= 300 && remaining > 0) || attemptStatus === "timeout") && (
        <div className="wb-answer-alert-stack" role="status" aria-live="polite">
          <section className="wb-answer-warning">
            <svg className="wb-answer-warning-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <b>
              เหลือเวลาอีก {attemptStatus === "timeout" ? "5 นาที" : examDurationSeconds <= 300 ? `${remaining} วินาที` : "5 นาที"}
            </b>
            <small>กรุณาเตรียมตัวส่งกระดาษคำตอบ</small>
          </section>
          {attemptStatus === "timeout" && (
            <section className="wb-timeout-modal" aria-labelledby="wb-timeout-title" aria-describedby="wb-timeout-description">
              <svg className="wb-timeout-hourglass" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 3h12M6 21h12M7 3c0 4 1.7 6 5 9-3.3 3-5 5-5 9m10-18c0 4-1.7 6-5 9 3.3 3 5 5 5 9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 6h6l-3 4-3-4Zm0 12h6l-3-4-3 4Z" fill="currentColor" opacity=".28" />
              </svg>
              <h2 id="wb-timeout-title">หมดเวลาทำข้อสอบ</h2>
              <p id="wb-timeout-description">กรุณาเตรียมตัวส่งกระดาษคำตอบ</p>
            </section>
          )}
        </div>
      )}

      <div className="wb-answer-container">
        <div className="wb-answer-layout">
          {pdfBacked ? <PurchasedExamDocuments
            plan={examPlan}
            activeSectionIndex={activeSectionIndex}
          /> : <MockExamPdf page={page} />}
          <AnswerPaper
            questionCount={activeExamSection?.questionCount || activeDemoPage?.questions.length || questionCount}
            examPlan={examPlan}
            pdfBacked={pdfBacked}
            demoPageData={activeDemoPage}
            questionOffset={activeExamSection?.answerIndexStart ?? activeDemoPage?.questions[0]?.id ?? 0}
            activeSectionIndex={activeSectionIndex}
            sectionCount={examPlan.sections.length}
            onSectionChange={setActiveSectionIndex}
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
            <h2 id="wb-confirm-title">{previewMode ? "จบการทดลองสอบ?" : "ยืนยันการส่งคำตอบ?"}</h2>
            <p>{previewMode ? "ระบบจะแสดงสรุปคะแนน โดยไม่บันทึกเป็นผลสอบจริง" : "เมื่อส่งแล้วจะไม่สามารถกลับมาแก้ไขได้"}</p>
            <div className="wb-confirm-actions">
              <button
                type="button"
                className="wb-confirm-review"
                onClick={() => setConfirmSubmit(false)}
              >
                {previewMode ? "ทำข้อสอบต่อ" : "ตรวจทานอีกครั้ง"}
              </button>
              <button
                type="button"
                className="wb-confirm-send"
                onClick={submit}
              >
                {previewMode ? "ดูสรุปคะแนน" : "ยืนยันส่งคำตอบ"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
