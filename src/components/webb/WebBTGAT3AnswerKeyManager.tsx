"use client";

import { useMemo, useState } from "react";
import {
  LuPlus,
  LuSparkles,
  LuRotateCcw,
  LuCheck,
  LuLink,
  LuInfo,
  LuLayoutGrid,
  LuList,
  LuX,
} from "react-icons/lu";
import AdminSelect from "@/components/ui/AdminSelect";
import WebBAdminInput from "./WebBAdminInput";
import WebBAdminPagination from "./WebBAdminPagination";
import {
  gradeMultipleResponse,
  type TGAT3AnswerRule,
  type TGAT3ScoringType,
} from "./tgat3-scoring";

type WebBTGAT3AnswerKeyManagerProps = {
  rules: TGAT3AnswerRule[];
  onChange: (rules: TGAT3AnswerRule[]) => void;
  questionNumberOffset?: number;
  choiceCount?: number;
  disabled?: boolean;
};

const SCORING_TYPE_OPTIONS = [
  { value: "single", label: "คำตอบเดี่ยว " },
  { value: "weighted", label: "คะแนนลดหลั่น " },
  { value: "multiple", label: "เลือกหลายคำตอบ " },
  { value: "linked", label: "คำตอบสัมพันธ์กัน " },
];

const DEFAULT_ACCEPTED_PAIRS = [
  { q1: "1", q2: "1", score: 2.0 },
  { q1: "2", q2: "3", score: 2.0 },
  { q1: "3", q2: "2", score: 2.0 },
  { q1: "4", q2: "4", score: 2.0 },
];

function getMultipleResponseCaseGroups(rule: TGAT3AnswerRule) {
  const choices = ["1", "2", "3", "4"];
  const scoringRule = { ...rule, maxScore: 1, choiceCount: 4 };
  const cases = Array.from({ length: 16 }, (_, mask) => {
    const selected = choices.filter((_, index) => mask & (1 << index));
    return {
      key: mask,
      selection: selected,
      score: gradeMultipleResponse(scoringRule, selected),
    };
  });

  return Array.from({ length: 5 }, (_, count) => ({
    count,
    label:
      count === 0
        ? "ไม่ฝนเลย"
        : `ฝน ${count} ตัวเลือก`,
    cases: cases.filter((item) => item.selection.length === count),
  }));
}

function MultipleResponseScoringSummary({
  rule,
}: {
  rule: TGAT3AnswerRule;
}) {
  const groups = getMultipleResponseCaseGroups(rule);

  return (
    <details className="rounded-md border border-slate-200 bg-white">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 text-[11px] hover:bg-slate-50">
        <span className="font-bold text-slate-800">
          ชุดเฉลย: {rule.targetChoices?.length ? rule.targetChoices.join(", ") : "ยังไม่ได้เลือก"}
        </span>
        <span className="text-slate-600">สรุปคะแนนครบ 16 เคส · คะแนนเต็ม 1</span>
      </summary>
      <div className="space-y-2 border-t border-slate-100 px-3 py-2">
        <p className="text-[10px] leading-4 text-slate-600">
          ตัวเลือกที่ฝนถูกและไม่ฝนตัวเลือกที่ผิดได้ข้อละ 0.25 คะแนน · ไม่ฝนเลยได้ 0 คะแนน
        </p>
        {groups.map((group) => (
          <div
            key={group.count}
            className="grid grid-cols-[100px_1fr] gap-2 text-[10px]"
          >
            <span className="pt-1 font-semibold text-slate-600">{group.label}</span>
            <div className="flex flex-wrap gap-1">
              {group.cases.map((item) => (
                <span
                  key={item.key}
                  className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-1 text-slate-700"
                >
                  <span>{item.selection.length ? item.selection.join("+") : "เว้นว่าง"}</span>
                  <span aria-hidden="true">→</span>
                  <b className="text-slate-900">{item.score.toFixed(2)}</b>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function WebBTGAT3AnswerKeyManager({
  rules,
  onChange,
  questionNumberOffset = 0,
  choiceCount = 4,
  disabled = false,
}: WebBTGAT3AnswerKeyManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const choiceItems = Array.from({ length: choiceCount }, (_, index) => ({
    key: String(index + 1),
    label: String(index + 1),
  }));
  const multipleChoiceItems = Array.from({ length: 4 }, (_, index) => ({
    key: String(index + 1),
    label: String(index + 1),
  }));
  const choiceOptions = choiceItems.map((item) => ({
    value: item.key,
    label: `ตัวเลือก ${item.label}`,
  }));

  // Statistics & Part summary (No "ตรวจแล้ว" needed - automatically valid)
  const stats = useMemo(() => {
    let totalRaw = 0;
    const partCounts: Record<string, { count: number; raw: number; title: string }> = {
      part1: { count: 0, raw: 0, title: "1. สร้างคุณค่าและนวัตกรรม" },
      part2: { count: 0, raw: 0, title: "2. แก้ปัญหาที่ซับซ้อน" },
      part3: { count: 0, raw: 0, title: "3. บริหารอารมณ์" },
      part4: { count: 0, raw: 0, title: "4. พลเมืองที่มีส่วนร่วม" },
    };

    rules.forEach((rule) => {
      const maxScore = rule.responseType === "multiple" ? 1 : rule.maxScore;
      totalRaw += maxScore;
      const pid = rule.partId || "part1";
      if (!partCounts[pid]) {
        partCounts[pid] = { count: 0, raw: 0, title: rule.partTitle || pid };
      }
      partCounts[pid].count += 1;
      partCounts[pid].raw += maxScore;
    });

    return {
      totalQuestions: rules.length,
      totalRaw,
      partCounts,
    };
  }, [rules]);

  // Filtered rules for search
  const filteredRules = useMemo(() => {
    if (!searchTerm.trim()) return rules;
    const term = searchTerm.toLowerCase();
    return rules.filter(
      (r) =>
        String(r.questionNumber + questionNumberOffset).includes(term) ||
        r.partTitle?.toLowerCase().includes(term) ||
        r.responseType.toLowerCase().includes(term)
    );
  }, [rules, searchTerm, questionNumberOffset]);

  const totalPages = Math.max(1, Math.ceil(filteredRules.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRules = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredRules.slice(start, start + pageSize);
  }, [filteredRules, currentPage, pageSize]);

  const displayQuestionNumber = (questionNumber?: number) =>
    questionNumber && questionNumber > 0
      ? questionNumber + questionNumberOffset
      : 0;

  // Rule updater
  const updateRule = (id: string, updates: Partial<TGAT3AnswerRule>) => {
    onChange(
      rules.map((r) =>
        r.id === id ? { ...r, ...updates, choiceCount } : { ...r, choiceCount },
      ),
    );
  };

  // Add question
  const handleAddQuestion = () => {
    const nextNum = rules.length > 0 ? Math.max(...rules.map((r) => r.questionNumber)) + 1 : 1;
    const newRule: TGAT3AnswerRule = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      questionNumber: nextNum,
      choiceCount,
      partId: "part1",
      partTitle: "1. การสร้างคุณค่าและนวัตกรรม",
      responseType: "single",
      maxScore: 1.0,
      singleCorrectChoice: "1",
    };
    onChange([...rules, newRule]);
  };

  // Clear all
  const handleClearAll = () => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างเฉลยทั้งหมด?")) return;
    onChange([]);
    setPage(0);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Stats Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-slate-900">
                ตัวจัดการเฉลยและเกณฑ์คะแนน TGAT3
              </h3>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors ${viewMode === "card"
                  ? "bg-white font-bold text-blue-700 shadow-sm"
                  : "hover:text-slate-900"
                  }`}
                title="มุมมองการ์ดแบบสบายตา ไม่เบียด"
              >
                <LuLayoutGrid className="text-sm" /> มุมมองการ์ด
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors ${viewMode === "table"
                  ? "bg-white font-bold text-blue-700 shadow-sm"
                  : "hover:text-slate-900"
                  }`}
                title="มุมมองตารางกว้าง"
              >
                <LuList className="text-sm" /> ตารางกว้าง
              </button>
            </div>

            <button
              type="button"
              disabled={disabled || rules.length === 0}
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 transition-colors"
              title="ล้างข้อสอบทั้งหมด"
            >
              <LuRotateCcw className="text-xs" /> ล้าง
            </button>
          </div>
        </div>

        {/* Live Score & Part Progress (Spacious) */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <span className="text-[11px] font-medium text-slate-500">จำนวนข้อสอบ</span>
            <p className="mt-0.5 text-xl font-extrabold text-slate-800">
              {stats.totalQuestions} <span className="text-xs font-normal text-slate-500">ข้อ</span>
            </p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
            <span className="text-[11px] font-medium text-blue-700">คะแนนทุกข้อรวมกัน</span>
            <p className="mt-0.5 text-xl font-extrabold text-blue-900">
              {stats.totalRaw.toFixed(2)}{" "}
              <span className="text-xs font-normal text-blue-600">คะแนน</span>
            </p>
          </div>
          <div className="col-span-2 lg:col-span-4 text-xs">

            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
              <div className="rounded-lg bg-white px-2.5 py-1.5 border border-slate-200">
                <span className="text-slate-500 block">พาร์ท 1 (นวัตกรรม)</span>
                <span className="font-bold text-slate-800">{stats.partCounts.part1?.count || 0} ข้อ · {stats.partCounts.part1?.raw.toFixed(1) || 0} คะแนน</span>
              </div>
              <div className="rounded-lg bg-white px-2.5 py-1.5 border border-slate-200">
                <span className="text-slate-500 block">พาร์ท 2 (แก้ปัญหา)</span>
                <span className="font-bold text-slate-800">{stats.partCounts.part2?.count || 0} ข้อ · {stats.partCounts.part2?.raw.toFixed(1) || 0} คะแนน</span>
              </div>
              <div className="rounded-lg bg-white px-2.5 py-1.5 border border-slate-200">
                <span className="text-slate-500 block">พาร์ท 3 (อารมณ์)</span>
                <span className="font-bold text-slate-800">{stats.partCounts.part3?.count || 0} ข้อ · {stats.partCounts.part3?.raw.toFixed(1) || 0} คะแนน</span>
              </div>
              <div className="rounded-lg bg-white px-2.5 py-1.5 border border-slate-200">
                <span className="text-slate-500 block">พาร์ท 4 (พลเมือง)</span>
                <span className="font-bold text-slate-800">{stats.partCounts.part4?.count || 0} ข้อ · {stats.partCounts.part4?.raw.toFixed(1) || 0} คะแนน</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Pagination Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <WebBAdminInput
            type="search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            placeholder="ค้นหาข้อ, พาร์ท, หรือประเภท..."
            className="w-72 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs shadow-sm"
          />
          {searchTerm && (
            <span className="text-xs text-slate-500">
              พบ {filteredRules.length} ข้อ
            </span>
          )}
        </div>

      </div>

      {/* VIEW MODE 1: SPACIOUS CARD VIEW (Default - No cramping, breathes easily!) */}
      {viewMode === "card" && (
        <div className="space-y-4">
          {pageRules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
              {rules.length === 0
                ? "ยังไม่มีรายการข้อสอบในชุดนี้"
                : "ไม่พบข้อสอบที่ตรงกับการค้นหา"}
            </div>
          ) : (
            pageRules.map((rule) => {
              const linkedParent = rules.find(
                (candidate) =>
                  candidate.id !== rule.id &&
                  candidate.responseType === "linked" &&
                  !candidate.isSecondOfLinkedPair &&
                  candidate.linkedPairQuestionNumber === rule.questionNumber,
              );
              const isLockedLinkedSecond =
                Boolean(linkedParent) || Boolean(rule.isSecondOfLinkedPair);
              return (
                <div
                  key={rule.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300"
                >
                  {/* Card Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                    {/* Left: Number + Part + Type */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-black text-white shadow-sm">
                        {displayQuestionNumber(rule.questionNumber)}
                      </div>

                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                        {rule.partTitle || "พาร์ท 1"}
                      </span>

                      <div className="w-64">
                        <AdminSelect
                          value={rule.responseType}
                          disabled={disabled || isLockedLinkedSecond}
                          options={SCORING_TYPE_OPTIONS}
                          onChange={(val) => {
                            const nextType = val as TGAT3ScoringType;
                            let nextUpdates: Partial<TGAT3AnswerRule> = {
                              responseType: nextType,
                            };
                            if (nextType === "single") {
                              nextUpdates = {
                                ...nextUpdates,
                                singleCorrectChoice: rule.singleCorrectChoice || "1",
                                maxScore: 1.0,
                                isSecondOfLinkedPair: false,
                              };
                            } else if (nextType === "weighted") {
                              nextUpdates = {
                                ...nextUpdates,
                                weightedScores: rule.weightedScores || {
                                  "1": 0.25,
                                  "2": 0.5,
                                  "3": 0.75,
                                  "4": 1.0,
                                },
                                maxScore: 1.0,
                                isSecondOfLinkedPair: false,
                              };
                            } else if (nextType === "multiple") {
                              nextUpdates = {
                                ...nextUpdates,
                                targetChoices: rule.targetChoices?.length
                                  ? rule.targetChoices
                                  : ["1", "3"],
                                maxScore: 1.0,
                                isSecondOfLinkedPair: false,
                              };
                            } else if (nextType === "linked") {
                              nextUpdates = {
                                ...nextUpdates,
                                linkedPairQuestionNumber:
                                  rule.linkedPairQuestionNumber ||
                                  (rule.questionNumber % 2 === 1
                                    ? rule.questionNumber + 1
                                    : rule.questionNumber - 1),
                                acceptedPairs:
                                  rule.acceptedPairs?.length
                                    ? rule.acceptedPairs
                                    : DEFAULT_ACCEPTED_PAIRS,
                                maxScore: 2.0,
                              };
                            }
                            updateRule(rule.id, nextUpdates);
                          }}
                          ariaLabel={`ประเภทการตรวจข้อ ${displayQuestionNumber(rule.questionNumber)}`}
                          className="w-full text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Right: Max Score & Actions */}
                    <div className="flex items-center gap-3">
                      {!isLockedLinkedSecond && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <span className="font-medium">คะแนนเต็ม:</span>
                          <WebBAdminInput
                            type="number"
                            step="0.25"
                            min="0.25"
                            max="10"
                            disabled={disabled || rule.responseType === "multiple"}
                            value={rule.responseType === "multiple" ? 1 : rule.maxScore}
                            onChange={(e) =>
                              updateRule(rule.id, {
                                maxScore: Number(e.target.value) || 1.0,
                              })
                            }
                            className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center font-bold text-slate-800"
                            aria-label={`คะแนนเต็มข้อ ${displayQuestionNumber(rule.questionNumber)}`}
                          />
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Card Body - Spacious Inputs per Type */}
                  <div className="mt-4">
                    {/* 1. SINGLE CHOICE */}
                    {rule.responseType === "single" && !isLockedLinkedSecond && (
                      <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-100">
                        <span className="text-xs font-bold text-slate-700">
                          เลือกตัวเลือกที่เป็นคำตอบที่ถูกต้อง:
                        </span>
                        <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                          {choiceItems.map((item) => {
                            const isSelected =
                              (rule.singleCorrectChoice || "1") === item.key;
                            return (
                              <button
                                key={item.key}
                                type="button"
                                disabled={
                                  disabled ||
                                  (isSelected && (rule.targetChoices?.length || 0) <= 1)
                                }
                                onClick={() =>
                                  updateRule(rule.id, {
                                    singleCorrectChoice: item.key,
                                  })
                                }
                                title={
                                  isSelected && (rule.targetChoices?.length || 0) <= 1
                                    ? "ต้องกำหนดเฉลยอย่างน้อย 1 ตัวเลือก"
                                    : undefined
                                }
                                className={`flex items-center justify-between rounded-xl border p-3 text-xs font-bold transition-all ${isSelected
                                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                  }`}
                              >
                                <span>{item.label}</span>
                                {isSelected ? (
                                  <LuCheck className="text-base font-black" />
                                ) : (
                                  <span className="h-4 w-4 rounded-full border border-slate-300" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <p className="mt-2 text-[11px] text-slate-500">
                          * ตอบตรงกับเฉลยได้ {rule.maxScore} คะแนนเต็ม · ตอบตัวเลือกอื่นหรือไม่ตอบได้ 0 คะแนน
                        </p>
                      </div>
                    )}

                    {/* 2. WEIGHTED SINGLE CHOICE (Spacious 4-column cards) */}
                    {rule.responseType === "weighted" && !isLockedLinkedSecond && (
                      <div className="rounded-xl bg-amber-50/40 p-4 border border-amber-200/60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-950">
                            กำหนดคะแนนลดหลั่นตามความเหมาะสมของแต่ละตัวเลือก:
                          </span>

                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {choiceItems.map((item) => (
                            <div
                              key={item.key}
                              className="rounded-xl border border-amber-200/80 bg-white p-3 shadow-sm"
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                                <span>{item.label}</span>
                              </div>
                              <div className="mt-2 flex items-center gap-1.5">
                                <span className="text-xs text-slate-500">ได้:</span>
                                <WebBAdminInput
                                  type="number"
                                  step="0.05"
                                  min="0"
                                  max="2"
                                  disabled={disabled}
                                  value={rule.weightedScores?.[item.key] ?? 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    updateRule(rule.id, {
                                      weightedScores: {
                                        ...(rule.weightedScores || {}),
                                        [item.key]: Number.isFinite(val) ? val : 0,
                                      },
                                    });
                                  }}
                                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-xs font-bold text-blue-700 focus:border-blue-500"
                                  aria-label={`คะแนนตัวเลือก ${item.key} ข้อ ${displayQuestionNumber(rule.questionNumber)}`}
                                />
                                <span className="text-xs text-slate-500">คะแนน</span>
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>
                    )}

                    {/* 3. MULTIPLE RESPONSE (Spacious Cards) */}
                    {rule.responseType === "multiple" && !isLockedLinkedSecond && (
                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <MultipleResponseScoringSummary rule={rule} />
                        <div className="flex flex-wrap gap-1.5">
                          {multipleChoiceItems.map((item) => {
                            const isChecked = (rule.targetChoices || []).includes(item.key);
                            return (
                              <button
                                key={item.key}
                                type="button"
                                disabled={
                                  disabled ||
                                  (isChecked && (rule.targetChoices?.length || 0) <= 1)
                                }
                                onClick={() => {
                                  const curr = rule.targetChoices || [];
                                  const next = isChecked
                                    ? curr.filter((x) => x !== item.key)
                                    : [...curr, item.key].sort();
                                  updateRule(rule.id, { targetChoices: next });
                                }}
                                className={`inline-flex min-w-12 items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold transition-colors ${isChecked
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                                  }`}
                                title={
                                  isChecked && (rule.targetChoices?.length || 0) <= 1
                                    ? "ต้องกำหนดเฉลยอย่างน้อย 1 ตัวเลือก"
                                    : undefined
                                }
                              >
                                {isChecked && <LuCheck aria-hidden="true" className="size-3.5" />}
                                ตัวเลือก {item.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 4. LINKED QUESTIONS (Spacious Pair Configuration) */}
                    {rule.responseType === "linked" && (
                      <div>
                        {rule.isSecondOfLinkedPair || linkedParent ? (
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-purple-50 p-4 border border-purple-200">
                            <div className="flex items-center gap-2.5 text-xs text-purple-950">
                              <LuLink className="text-base text-purple-600" />
                              <span>
                                ข้อนี้เป็นคำตอบส่วนที่สอง สัมพันธ์กับ <b>ข้อ {displayQuestionNumber(linkedParent?.questionNumber || rule.linkedPairQuestionNumber)}</b> (ตั้งคำตอบและคิดคะแนนที่ข้อหลัก)
                              </span>
                            </div>
                            {!linkedParent && rule.isSecondOfLinkedPair && (
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() =>
                                  updateRule(rule.id, { isSecondOfLinkedPair: false })
                                }
                                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-purple-700 border border-purple-300 shadow-sm hover:bg-purple-100"
                              >
                                เปลี่ยนเป็นข้อคิดคะแนนหลัก
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-xl bg-purple-50/50 p-4 border border-purple-200/70">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-3">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className="text-xs font-bold text-purple-950">
                                  กำหนดข้อที่สัมพันธ์กัน:
                                </span>

                                {/* สวิตช์ความสัมพันธ์ */}
                                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-purple-200 bg-white px-2.5 py-1 text-xs font-semibold text-purple-900 shadow-sm">
                                  <input
                                    type="checkbox"
                                    disabled={disabled}
                                    checked={Boolean(rule.linkedPairQuestionNumber && rule.linkedPairQuestionNumber > 0)}
                                    onChange={(e) => {
                                      const isChecked = e.target.checked;
                                      updateRule(rule.id, {
                                        linkedPairQuestionNumber: isChecked ? (rule.questionNumber + 1) : 0,
                                      });
                                    }}
                                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  <span>{rule.linkedPairQuestionNumber && rule.linkedPairQuestionNumber > 0 ? "มีข้อสัมพันธ์" : "ไม่มีความสัมพันธ์ (ใส่ 0)"}</span>
                                </label>

                                {rule.linkedPairQuestionNumber && rule.linkedPairQuestionNumber > 0 ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-purple-900">
                                      ข้อ {displayQuestionNumber(rule.questionNumber)} คู่กับ
                                    </span>
                                    <WebBAdminInput
                                      type="number"
                                      min="0"
                                      disabled={disabled}
                                      value={rule.linkedPairQuestionNumber ? displayQuestionNumber(rule.linkedPairQuestionNumber) : 0}
                                      onChange={(e) => {
                                        const val = e.target.value === "" ? 0 : Number(e.target.value);
                                        const targetQuestionNumber = val
                                          ? val - questionNumberOffset
                                          : 0;
                                        const alreadyPairedBy = rules.find(
                                          (candidate) =>
                                            candidate.id !== rule.id &&
                                            candidate.responseType === "linked" &&
                                            !candidate.isSecondOfLinkedPair &&
                                            candidate.linkedPairQuestionNumber === targetQuestionNumber,
                                        );
                                        if (alreadyPairedBy) {
                                          window.alert(
                                            `ข้อ ${displayQuestionNumber(val)} ถูกจับคู่กับข้อ ${displayQuestionNumber(alreadyPairedBy.questionNumber)} แล้ว`,
                                          );
                                          return;
                                        }
                                        updateRule(rule.id, {
                                          linkedPairQuestionNumber: targetQuestionNumber,
                                        });
                                      }}
                                      placeholder="0"
                                      className="w-16 rounded-lg border border-purple-300 bg-white px-2 py-1 text-center font-bold text-purple-950 text-xs"
                                      aria-label={`ข้อที่สัมพันธ์กับข้อ ${displayQuestionNumber(rule.questionNumber)}`}
                                    />
                                  </div>
                                ) : (
                                  <span className="rounded bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-800">
                                    (ข้อเดี่ยว/ไม่มีคู่สัมพันธ์ ค่า: 0)
                                  </span>
                                )}
                              </div>
                              {rule.linkedPairQuestionNumber && rule.linkedPairQuestionNumber > 0 && (
                                <button
                                  type="button"
                                  disabled={disabled}
                                  onClick={() =>
                                    updateRule(rule.id, {
                                      acceptedPairs: [
                                        ...(rule.acceptedPairs || []),
                                        {
                                          q1: "1",
                                          q2: "1",
                                          score: rule.maxScore || 2.0,
                                        },
                                      ],
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50"
                                >
                                  <LuPlus aria-hidden="true" className="size-3.5" />
                                  เพิ่มคู่คำตอบที่ยอมรับ
                                </button>
                              )}
                            </div>

                            {rule.linkedPairQuestionNumber && rule.linkedPairQuestionNumber > 0 ? (
                              <div className="mt-3">
                                <div className="overflow-x-auto rounded-xl border border-purple-200 bg-white">
                                  <div className="min-w-[620px]">
                                    <div className="grid grid-cols-[120px_1fr_44px_1fr_48px] items-center gap-3 border-b border-purple-100 bg-purple-50 px-3 py-2 text-[11px] font-bold text-purple-900">
                                      <span>คู่ที่ยอมรับ</span>
                                      <span>คำตอบข้อ {displayQuestionNumber(rule.questionNumber)}</span>
                                      <span className="text-center">สัมพันธ์</span>
                                      <span>คำตอบข้อ {displayQuestionNumber(rule.linkedPairQuestionNumber)}</span>
                                      <span />
                                    </div>
                                    {(rule.acceptedPairs || []).map((pair, pIdx, visiblePairs) => (
                                      <div
                                        key={`${rule.id}-${pIdx}`}
                                        className="grid grid-cols-[120px_1fr_44px_1fr_48px] items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0"
                                      >
                                        <span className="text-xs font-bold text-slate-700">คู่ {pIdx + 1}</span>
                                        <AdminSelect
                                          value={pair.q1}
                                          disabled={disabled}
                                          onChange={(value) => {
                                            const nextPairs = [{ ...pair, q1: value }];
                                            updateRule(rule.id, { acceptedPairs: nextPairs });
                                          }}
                                          options={choiceOptions}
                                          ariaLabel={`คำตอบข้อ ${displayQuestionNumber(rule.questionNumber)}`}
                                          className="w-full text-xs"
                                        />
                                        <LuLink aria-hidden="true" className="mx-auto text-purple-500" />
                                        <AdminSelect
                                          value={pair.q2}
                                          disabled={disabled}
                                          onChange={(value) => {
                                            const nextPairs = [{ ...pair, q2: value }];
                                            updateRule(rule.id, { acceptedPairs: nextPairs });
                                          }}
                                          options={choiceOptions}
                                          ariaLabel={`คำตอบข้อ ${displayQuestionNumber(rule.linkedPairQuestionNumber)}`}
                                          className="w-full text-xs"
                                        />
                                        <button
                                          type="button"
                                          disabled={disabled || visiblePairs.length <= 1}
                                          onClick={() => {
                                            if (visiblePairs.length <= 1) return;
                                            updateRule(rule.id, {
                                              acceptedPairs: visiblePairs.filter((_, index) => index !== pIdx),
                                            });
                                          }}
                                          className="ml-auto rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                                          title={visiblePairs.length <= 1 ? "ต้องเหลืออย่างน้อย 1 คู่คำตอบ" : "ลบคู่นี้"}
                                          aria-label={`ลบคู่ที่ ${pIdx + 1}`}
                                        >
                                          <LuX aria-hidden="true" className="size-4" />
                                        </button>
                                      </div>
                                    ))}
                                    {(!rule.acceptedPairs || rule.acceptedPairs.length === 0) && (
                                      <p className="px-3 py-4 text-center text-xs text-slate-500">
                                        กำลังเตรียมคู่คำตอบ
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              null
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {isLockedLinkedSecond && rule.responseType !== "linked" && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-purple-200 bg-purple-50 p-4 text-xs text-purple-950">
                        <LuLink className="text-base text-purple-600" />
                        <span>
                          ข้อนี้ถูกล็อกเป็นข้อคู่ของข้อ {displayQuestionNumber(linkedParent?.questionNumber || rule.linkedPairQuestionNumber)} แล้ว ตั้งคำตอบและคะแนนที่ข้อหลักเท่านั้น
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW MODE 2: WIDE ROOMY TABLE VIEW (Without "ตรวจแล้ว" column) */}
      {viewMode === "table" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[1020px] table-fixed text-left text-xs">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[20%]" />
              <col className="w-[56%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                <th className="p-3.5">ข้อที่ / พาร์ท</th>
                <th className="p-3.5">รูปแบบการตรวจ</th>
                <th className="p-3.5">เฉลย & กำหนดเกณฑ์คะแนน</th>
                <th className="p-3.5 text-center">คะแนนเต็ม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRules.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    ไม่พบข้อสอบ
                  </td>
                </tr>
              ) : (
                pageRules.map((rule) => {
                  const linkedParent = rules.find(
                    (candidate) =>
                      candidate.id !== rule.id &&
                      candidate.responseType === "linked" &&
                      !candidate.isSecondOfLinkedPair &&
                      candidate.linkedPairQuestionNumber === rule.questionNumber,
                  );
                  const isLockedLinkedSecond =
                    Boolean(linkedParent) || Boolean(rule.isSecondOfLinkedPair);
                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/70">
                      {/* Column 1: Number & Part */}
                      <td className="p-3.5 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">
                            {displayQuestionNumber(rule.questionNumber)}
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                            {rule.partTitle || "พาร์ท 1"}
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Type */}
                      <td className="p-3.5 align-top">
                        <AdminSelect
                          value={rule.responseType}
                          disabled={disabled || isLockedLinkedSecond}
                          options={SCORING_TYPE_OPTIONS}
                          onChange={(val) => {
                            const nextType = val as TGAT3ScoringType;
                            updateRule(rule.id, { responseType: nextType });
                          }}
                          ariaLabel={`ประเภทการตรวจข้อ ${displayQuestionNumber(rule.questionNumber)}`}
                          className="w-full text-xs font-semibold"
                        />
                      </td>

                      {/* Column 3: Answer Inputs (Roomy 52% width) */}
                      <td className="p-3.5 align-top">
                        {isLockedLinkedSecond ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1.5 font-semibold text-purple-900">
                            <LuLink aria-hidden="true" />
                            ล็อกเป็นข้อคู่ของข้อ {displayQuestionNumber(linkedParent?.questionNumber || rule.linkedPairQuestionNumber)} · ตั้งคำตอบที่ข้อหลัก
                          </span>
                        ) : rule.responseType === "single" && (
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-700">ตอบถูก:</span>
                            <div className="flex gap-1.5">
                              {choiceItems.map((item) => (
                                <button
                                  key={item.key}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() =>
                                    updateRule(rule.id, { singleCorrectChoice: item.key })
                                  }
                                  className={`rounded-lg px-2.5 py-1 font-bold ${(rule.singleCorrectChoice || "1") === item.key
                                    ? "bg-blue-600 text-white"
                                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                    }`}
                                >
                                  {item.key}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {!isLockedLinkedSecond && rule.responseType === "weighted" && (
                          <div className="flex flex-wrap items-center gap-2">
                            {choiceItems.map((item) => (
                              <div
                                key={item.key}
                                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1"
                              >
                                <span className="font-bold text-slate-700">ข้อ {item.key}:</span>
                                <WebBAdminInput
                                  type="number"
                                  step="0.05"
                                  min="0"
                                  max="2"
                                  disabled={disabled}
                                  value={rule.weightedScores?.[item.key] ?? 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    updateRule(rule.id, {
                                      weightedScores: {
                                        ...(rule.weightedScores || {}),
                                        [item.key]: Number.isFinite(val) ? val : 0,
                                      },
                                    });
                                  }}
                                  className="w-14 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-center text-xs font-bold"
                                  aria-label={`คะแนนตัวเลือก ${item.key} ข้อ ${displayQuestionNumber(rule.questionNumber)}`}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {!isLockedLinkedSecond && rule.responseType === "multiple" && (
                          <div className="space-y-2">
                            <MultipleResponseScoringSummary rule={rule} />
                            <div className="flex items-center gap-2">
                            {multipleChoiceItems.map((item) => {
                              const isChecked = (rule.targetChoices || []).includes(item.key);
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  disabled={
                                    disabled ||
                                    (isChecked && (rule.targetChoices?.length || 0) <= 1)
                                  }
                                  onClick={() => {
                                    const curr = rule.targetChoices || [];
                                    const next = isChecked
                                      ? curr.filter((x) => x !== item.key)
                                      : [...curr, item.key].sort();
                                    updateRule(rule.id, { targetChoices: next });
                                  }}
                                  title={
                                    isChecked && (rule.targetChoices?.length || 0) <= 1
                                      ? "ต้องกำหนดเฉลยอย่างน้อย 1 ตัวเลือก"
                                      : undefined
                                  }
                                  className={`rounded-lg px-2.5 py-1 font-bold ${isChecked
                                    ? "bg-blue-600 text-white"
                                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                    }`}
                                >
                                  {isChecked ? "✓ " : ""}{item.label}
                                </button>
                              );
                            })}
                            </div>
                          </div>
                        )}

                        {!isLockedLinkedSecond && rule.responseType === "linked" && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-purple-900 font-semibold text-xs">
                              {rule.linkedPairQuestionNumber && rule.linkedPairQuestionNumber > 0
                                ? `คู่กับข้อ ${displayQuestionNumber(rule.linkedPairQuestionNumber)}:`
                                : "ไม่มีคู่สัมพันธ์ (0)"}
                            </span>
                            {rule.linkedPairQuestionNumber && rule.linkedPairQuestionNumber > 0 &&
                              (rule.acceptedPairs || []).map((pair, pIdx) => (
                                <span
                                  key={`${rule.id}-${pIdx}`}
                                  className="rounded bg-purple-100 px-2 py-0.5 font-bold text-purple-900 text-xs"
                                >
                                  ข้อ {displayQuestionNumber(rule.questionNumber)}: {pair.q1} ↔ ข้อ {displayQuestionNumber(rule.linkedPairQuestionNumber)}: {pair.q2}
                                </span>
                              ))}
                          </div>
                        )}
                      </td>

                      {/* Column 4: Max Score */}
                      <td className="p-3.5 text-center align-top">
                        <WebBAdminInput
                          type="number"
                          step="0.25"
                          min="0.25"
                          max="10"
                          disabled={disabled || isLockedLinkedSecond || rule.responseType === "multiple"}
                          value={isLockedLinkedSecond ? 0 : rule.responseType === "multiple" ? 1 : rule.maxScore}
                          onChange={(e) =>
                            updateRule(rule.id, {
                              maxScore: Number(e.target.value) || 1.0,
                            })
                          }
                          className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center font-bold"
                          aria-label={`คะแนนเต็มข้อ ${displayQuestionNumber(rule.questionNumber)}`}
                        />
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <WebBAdminPagination
        totalItems={filteredRules.length}
        pageSize={pageSize}
        page={currentPage}
        pageCount={totalPages}
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(0);
        }}
        ariaLabel="เปลี่ยนหน้าเฉลย TGAT3"
      />

      {/* Bottom Note */}
      <div className="flex items-center justify-end pt-2">
        <span className="text-xs text-slate-500">
          * การบันทึกเฉลยจะมีผลต่อการตรวจข้อสอบทันที
        </span>
      </div>
    </div>
  );
}
