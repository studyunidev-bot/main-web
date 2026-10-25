"use client";

import { useMemo, useState } from "react";
import {
  LuPlus,
  LuTrash2,
  LuCopy,
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
import {
  type TGAT3AnswerRule,
  type TGAT3ScoringType,
} from "./tgat3-scoring";

type WebBTGAT3AnswerKeyManagerProps = {
  rules: TGAT3AnswerRule[];
  onChange: (rules: TGAT3AnswerRule[]) => void;
  disabled?: boolean;
};

const SCORING_TYPE_OPTIONS = [
  { value: "single", label: "คำตอบเดี่ยว " },
  { value: "weighted", label: "คะแนนลดหลั่น " },
  { value: "multiple", label: "เลือกหลายคำตอบ " },
  { value: "linked", label: "คำตอบสัมพันธ์กัน " },
];

const CHOICE_ITEMS = [
  { key: "1", label: "1" },
  { key: "2", label: "2" },
  { key: "3", label: "3" },
  { key: "4", label: "4" },
];



export default function WebBTGAT3AnswerKeyManager({
  rules,
  onChange,
  disabled = false,
}: WebBTGAT3AnswerKeyManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [page, setPage] = useState(1);
  const pageSize = viewMode === "card" ? 10 : 20;

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
      totalRaw += rule.maxScore;
      const pid = rule.partId || "part1";
      if (!partCounts[pid]) {
        partCounts[pid] = { count: 0, raw: 0, title: rule.partTitle || pid };
      }
      partCounts[pid].count += 1;
      partCounts[pid].raw += rule.maxScore;
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
        String(r.questionNumber).includes(term) ||
        r.partTitle?.toLowerCase().includes(term) ||
        r.responseType.toLowerCase().includes(term)
    );
  }, [rules, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRules.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRules = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRules.slice(start, start + pageSize);
  }, [filteredRules, currentPage, pageSize]);

  // Rule updater
  const updateRule = (id: string, updates: Partial<TGAT3AnswerRule>) => {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  // Add question
  const handleAddQuestion = () => {
    const nextNum = rules.length > 0 ? Math.max(...rules.map((r) => r.questionNumber)) + 1 : 1;
    const newRule: TGAT3AnswerRule = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      questionNumber: nextNum,
      partId: "part1",
      partTitle: "1. การสร้างคุณค่าและนวัตกรรม",
      responseType: "single",
      maxScore: 1.0,
      singleCorrectChoice: "1",
    };
    onChange([...rules, newRule]);
  };

  // Duplicate question
  const handleDuplicateQuestion = (index: number) => {
    const target = rules[index];
    if (!target) return;
    const nextNum = rules.length + 1;
    const duplicated: TGAT3AnswerRule = {
      ...target,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      questionNumber: nextNum,
    };
    onChange([...rules.slice(0, index + 1), duplicated, ...rules.slice(index + 1)]);
  };

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    const nextRules = rules
      .filter((r) => r.id !== id)
      .map((r, i) => ({ ...r, questionNumber: i + 1 }));
    onChange(nextRules);
  };



  // Clear all
  const handleClearAll = () => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างเฉลยทั้งหมด?")) return;
    onChange([]);
    setPage(1);
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
              setPage(1);
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

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium shadow-sm hover:bg-slate-50 disabled:opacity-40"
            >
              ก่อนหน้า
            </button>
            <span className="px-2 font-semibold text-slate-700">
              หน้า {currentPage} จาก {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium shadow-sm hover:bg-slate-50 disabled:opacity-40"
            >
              ถัดไป
            </button>
          </div>
        )}
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
              const fullIndex = rules.findIndex((r) => r.id === rule.id);
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
                        {rule.questionNumber}
                      </div>

                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                        {rule.partTitle || "พาร์ท 1"}
                      </span>

                      <div className="w-64">
                        <AdminSelect
                          value={rule.responseType}
                          disabled={disabled}
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
                                targetChoices: rule.targetChoices || ["1", "3"],
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
                                acceptedPairs: rule.acceptedPairs || [
                                  { q1: "1", q2: "1", score: 2.0 },
                                  { q1: "2", q2: "3", score: 2.0 },
                                  { q1: "3", q2: "2", score: 2.0 },
                                  { q1: "4", q2: "4", score: 2.0 },
                                ],
                                maxScore: 2.0,
                              };
                            }
                            updateRule(rule.id, nextUpdates);
                          }}
                          ariaLabel={`ประเภทการตรวจข้อ ${rule.questionNumber}`}
                          className="w-full text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Right: Max Score & Actions */}
                    <div className="flex items-center gap-3">
                      {!rule.isSecondOfLinkedPair && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <span className="font-medium">คะแนนเต็ม:</span>
                          <WebBAdminInput
                            type="number"
                            step="0.25"
                            min="0.25"
                            max="10"
                            disabled={disabled}
                            value={rule.maxScore}
                            onChange={(e) =>
                              updateRule(rule.id, {
                                maxScore: Number(e.target.value) || 1.0,
                              })
                            }
                            className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center font-bold text-slate-800"
                            aria-label={`คะแนนเต็มข้อ ${rule.questionNumber}`}
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handleDuplicateQuestion(fullIndex)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          title="คัดลอกข้อนี้"
                          aria-label={`คัดลอกข้อ ${rule.questionNumber}`}
                        >
                          <LuCopy className="text-sm" />
                        </button>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handleDeleteQuestion(rule.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          title="ลบข้อนี้"
                          aria-label={`ลบข้อ ${rule.questionNumber}`}
                        >
                          <LuTrash2 className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Body - Spacious Inputs per Type */}
                  <div className="mt-4">
                    {/* 1. SINGLE CHOICE */}
                    {rule.responseType === "single" && (
                      <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-100">
                        <span className="text-xs font-bold text-slate-700">
                          เลือกตัวเลือกที่เป็นคำตอบที่ถูกต้อง:
                        </span>
                        <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                          {CHOICE_ITEMS.map((item) => {
                            const isSelected =
                              (rule.singleCorrectChoice || "1") === item.key;
                            return (
                              <button
                                key={item.key}
                                type="button"
                                disabled={disabled}
                                onClick={() =>
                                  updateRule(rule.id, {
                                    singleCorrectChoice: item.key,
                                  })
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
                    {rule.responseType === "weighted" && (
                      <div className="rounded-xl bg-amber-50/40 p-4 border border-amber-200/60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-950">
                            กำหนดคะแนนลดหลั่นตามความเหมาะสมของแต่ละตัวเลือก:
                          </span>

                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {CHOICE_ITEMS.map((item) => (
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
                                  aria-label={`คะแนนตัวเลือก ${item.key} ข้อ ${rule.questionNumber}`}
                                />
                                <span className="text-xs text-slate-500">คะแนน</span>
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>
                    )}

                    {/* 3. MULTIPLE RESPONSE (Spacious Cards) */}
                    {rule.responseType === "multiple" && (
                      <div className="rounded-xl bg-blue-50/50 p-4 border border-blue-200/60">
                        <span className="text-xs font-bold text-blue-950">
                          คลิกเลือกตัวเลือกที่ต้องตอบ (เลือกได้หลายตัวเลือก):
                        </span>
                        <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {CHOICE_ITEMS.map((item) => {
                            const isChecked = (rule.targetChoices || []).includes(item.key);
                            return (
                              <button
                                key={item.key}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                  const curr = rule.targetChoices || [];
                                  const next = isChecked
                                    ? curr.filter((x) => x !== item.key)
                                    : [...curr, item.key].sort();
                                  updateRule(rule.id, { targetChoices: next });
                                }}
                                className={`flex items-center justify-between rounded-xl border p-3 text-xs font-bold transition-all ${isChecked
                                  ? "border-blue-600 bg-white text-blue-700 shadow-sm ring-2 ring-blue-500/20"
                                  : "border-slate-200 bg-white/70 text-slate-600 hover:bg-white hover:border-slate-300"
                                  }`}
                              >
                                <span>{item.label}</span>
                                <span
                                  className={`flex h-5 w-5 items-center justify-center rounded-md text-xs ${isChecked
                                    ? "bg-blue-600 text-white"
                                    : "border border-slate-300 bg-white"
                                    }`}
                                >
                                  {isChecked && <LuCheck className="text-xs font-black" />}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                      </div>
                    )}

                    {/* 4. LINKED QUESTIONS (Spacious Pair Configuration) */}
                    {rule.responseType === "linked" && (
                      <div>
                        {rule.isSecondOfLinkedPair ? (
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-purple-50 p-4 border border-purple-200">
                            <div className="flex items-center gap-2.5 text-xs text-purple-950">
                              <LuLink className="text-base text-purple-600" />
                              <span>
                                ข้อนี้เป็นคำตอบส่วนที่สอง สัมพันธ์กับ <b>ข้อ {rule.linkedPairQuestionNumber}</b> (คิดคะแนนรวม 2 คะแนนที่ข้อแรก)
                              </span>
                            </div>
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
                                      ข้อ {rule.questionNumber} คู่กับ
                                    </span>
                                    <WebBAdminInput
                                      type="number"
                                      min="0"
                                      disabled={disabled}
                                      value={rule.linkedPairQuestionNumber ?? 0}
                                      onChange={(e) => {
                                        const val = e.target.value === "" ? 0 : Number(e.target.value);
                                        updateRule(rule.id, {
                                          linkedPairQuestionNumber: val,
                                        });
                                      }}
                                      placeholder="0"
                                      className="w-16 rounded-lg border border-purple-300 bg-white px-2 py-1 text-center font-bold text-purple-950 text-xs"
                                      aria-label={`ข้อที่สัมพันธ์กับข้อ ${rule.questionNumber}`}
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
                                  onClick={() => {
                                    const currentPairs = rule.acceptedPairs || [];
                                    updateRule(rule.id, {
                                      acceptedPairs: [
                                        ...currentPairs,
                                        { q1: "1", q2: "1", score: rule.maxScore || 2.0 },
                                      ],
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
                                >
                                  <LuPlus className="text-xs" /> เพิ่มคู่ยอมรับ
                                </button>
                              )}
                            </div>

                            {rule.linkedPairQuestionNumber && rule.linkedPairQuestionNumber > 0 ? (
                              <div className="mt-3">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
                                  {(rule.acceptedPairs || []).map((pair, pIdx) => (
                                    <div
                                      key={pIdx}
                                      className="flex items-center justify-between rounded-xl border border-purple-200 bg-white p-2.5 shadow-sm"
                                    >
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="font-semibold text-slate-500">
                                          คู่ {pIdx + 1}:
                                        </span>
                                        <WebBAdminInput
                                          value={pair.q1}
                                          disabled={disabled}
                                          onChange={(e) => {
                                            const nextPairs = [...(rule.acceptedPairs || [])];
                                            nextPairs[pIdx] = { ...pair, q1: e.target.value.trim() };
                                            updateRule(rule.id, { acceptedPairs: nextPairs });
                                          }}
                                          className="w-8 rounded border border-slate-300 px-1 py-0.5 text-center font-bold text-purple-950"
                                          aria-label={`คู่ข้อที่ ${rule.questionNumber} ตัวเลือกที่ 1`}
                                        />
                                        <span className="font-bold text-purple-400">🔗</span>
                                        <WebBAdminInput
                                          value={pair.q2}
                                          disabled={disabled}
                                          onChange={(e) => {
                                            const nextPairs = [...(rule.acceptedPairs || [])];
                                            nextPairs[pIdx] = { ...pair, q2: e.target.value.trim() };
                                            updateRule(rule.id, { acceptedPairs: nextPairs });
                                          }}
                                          className="w-8 rounded border border-slate-300 px-1 py-0.5 text-center font-bold text-purple-950"
                                          aria-label={`คู่ข้อที่ ${rule.questionNumber} ตัวเลือกที่ 2`}
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => {
                                          const nextPairs = (rule.acceptedPairs || []).filter(
                                            (_, i) => i !== pIdx
                                          );
                                          updateRule(rule.id, { acceptedPairs: nextPairs });
                                        }}
                                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                        title="ลบคู่นี้"
                                        aria-label={`ลบคู่ที่ ${pIdx + 1}`}
                                      >
                                        <LuX aria-hidden="true" className="size-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              null
                            )}
                          </div>
                        )}
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
              <col className="w-[12%]" />
              <col className="w-[18%]" />
              <col className="w-[52%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                <th className="p-3.5">ข้อที่ / พาร์ท</th>
                <th className="p-3.5">รูปแบบการตรวจ</th>
                <th className="p-3.5">เฉลย & กำหนดเกณฑ์คะแนน</th>
                <th className="p-3.5 text-center">คะแนนเต็ม</th>
                <th className="p-3.5 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    ไม่พบข้อสอบ
                  </td>
                </tr>
              ) : (
                pageRules.map((rule) => {
                  const fullIndex = rules.findIndex((r) => r.id === rule.id);
                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/70">
                      {/* Column 1: Number & Part */}
                      <td className="p-3.5 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">
                            {rule.questionNumber}
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
                          disabled={disabled}
                          options={SCORING_TYPE_OPTIONS}
                          onChange={(val) => {
                            const nextType = val as TGAT3ScoringType;
                            updateRule(rule.id, { responseType: nextType });
                          }}
                          ariaLabel={`ประเภทการตรวจข้อ ${rule.questionNumber}`}
                          className="w-full text-xs font-semibold"
                        />
                      </td>

                      {/* Column 3: Answer Inputs (Roomy 52% width) */}
                      <td className="p-3.5 align-top">
                        {rule.responseType === "single" && (
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-700">ตอบถูก:</span>
                            <div className="flex gap-1.5">
                              {CHOICE_ITEMS.map((item) => (
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

                        {rule.responseType === "weighted" && (
                          <div className="flex flex-wrap items-center gap-2">
                            {CHOICE_ITEMS.map((item) => (
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
                                  aria-label={`คะแนนตัวเลือก ${item.key} ข้อ ${rule.questionNumber}`}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {rule.responseType === "multiple" && (
                          <div className="flex items-center gap-2">
                            {CHOICE_ITEMS.map((item) => {
                              const isChecked = (rule.targetChoices || []).includes(item.key);
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => {
                                    const curr = rule.targetChoices || [];
                                    const next = isChecked
                                      ? curr.filter((x) => x !== item.key)
                                      : [...curr, item.key].sort();
                                    updateRule(rule.id, { targetChoices: next });
                                  }}
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
                        )}

                        {rule.responseType === "linked" && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-purple-900 font-semibold text-xs">
                              {rule.linkedPairQuestionNumber && rule.linkedPairQuestionNumber > 0
                                ? `คู่กับข้อ ${rule.linkedPairQuestionNumber}:`
                                : "ไม่มีคู่สัมพันธ์ (0)"}
                            </span>
                            {rule.linkedPairQuestionNumber && rule.linkedPairQuestionNumber > 0 &&
                              (rule.acceptedPairs || []).map((pair, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="rounded bg-purple-100 px-2 py-0.5 font-bold text-purple-900 text-xs"
                                >
                                  {pair.q1}-{pair.q2}
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
                          disabled={disabled}
                          value={rule.maxScore}
                          onChange={(e) =>
                            updateRule(rule.id, {
                              maxScore: Number(e.target.value) || 1.0,
                            })
                          }
                          className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center font-bold"
                          aria-label={`คะแนนเต็มข้อ ${rule.questionNumber}`}
                        />
                      </td>

                      {/* Column 5: Actions */}
                      <td className="p-3.5 text-center align-top">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => handleDuplicateQuestion(fullIndex)}
                            className="rounded p-1 text-slate-500 hover:bg-slate-100"
                            title="คัดลอกข้อนี้"
                            aria-label={`คัดลอกข้อ ${rule.questionNumber}`}
                          >
                            <LuCopy className="text-sm" />
                          </button>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => handleDeleteQuestion(rule.id)}
                            className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            title="ลบข้อนี้"
                            aria-label={`ลบข้อ ${rule.questionNumber}`}
                          >
                            <LuTrash2 className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom Note */}
      <div className="flex items-center justify-end pt-2">
        <span className="text-xs text-slate-500">
          * การบันทึกเฉลยจะมีผลต่อการตรวจข้อสอบทันที
        </span>
      </div>
    </div>
  );
}
