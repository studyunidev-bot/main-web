"use client";

import React from "react";
import WebBModalPortal from "./WebBModalPortal";
import {
  examPartReports,
  maskCitizenId,
  TGAT1_SPEAKING_QUESTIONS,
  TGAT1_READING_QUESTIONS,
  TGAT3_SKILL1_QUESTIONS,
  TGAT3_SKILL2_QUESTIONS,
  TGAT3_SKILL3_QUESTIONS,
  TGAT3_SKILL4_QUESTIONS,
  getSubResultQuestions,
  type QuestionResult,
} from "./WebBStudentArea";

export type StudentPdfInfo = {
  name: string;
  email?: string;
  phone?: string;
  grade?: string;
  school?: string;
  province?: string;
  citizenId?: string;
  studentCode?: string;
};

export default function WebBFullAnalysisPdfReport({
  student,
  displayScore = 60.7,
}: {
  student: StudentPdfInfo;
  displayScore?: number;
  onClose?: () => void;
}) {
  const roundedScore = displayScore.toFixed(1);

  // TGAT1 questions 1-60 directly from mock data
  const tgat1Q1to30 = TGAT1_SPEAKING_QUESTIONS.map((q) => ({
    no: q.no,
    ans: q.ans,
    correct: q.correct,
    score: q.score,
  }));
  const tgat1Q31to60 = TGAT1_READING_QUESTIONS.map((q, idx) => ({
    no: idx + 31,
    ans: q.ans,
    correct: q.correct,
    score: q.score,
  }));
  const tgat1AllQuestions = [...tgat1Q1to30, ...tgat1Q31to60];

  // TGAT2 questions 1-80 directly from getSubResultQuestions
  const tgat2Part = examPartReports.tgat2;
  const tgat2AllQuestions: QuestionResult[] = [];
  tgat2Part.skills.forEach((skill, idx) => {
    const skillQuestions = getSubResultQuestions("tgat2", skill.name, idx, skill);
    tgat2AllQuestions.push(...skillQuestions);
  });

  // TGAT3 questions 1-60 directly from TGAT3 mock question lists
  const tgat3AllQuestions: QuestionResult[] = [
    ...TGAT3_SKILL1_QUESTIONS,
    ...TGAT3_SKILL2_QUESTIONS,
    ...TGAT3_SKILL3_QUESTIONS,
    ...TGAT3_SKILL4_QUESTIONS,
  ];

  return (
    <WebBModalPortal lockScroll={false}>
      <div id="wb-print-container" aria-hidden="true">
        {/* ========================================================================= */}
        {/* PAGE 1: ข้อมูลทั้งหมดจากหน้า view=detail (ภาพรวมและผลการสอบฉบับสมบูรณ์)     */}
        {/* ========================================================================= */}
        <section className="wb-print-sheet" id="wb-print-page-1">
          {/* Header */}
          <div className="wb-print-header">
            <div className="wb-print-brand">
              <div className="wb-print-logo-box">TGAT</div>
              <div>
                <h1 className="wb-print-title">TGAT ความถนัดทั่วไป</h1>
                <p className="wb-print-subtitle">THAI GENERAL APTITUDE TEST · รายการผลการสอบฉบับสมบูรณ์</p>
              </div>
            </div>
            <div className="wb-print-doc-meta">
              <span className="wb-print-page-badge">หน้าที่ 1 จาก 4</span>
              <p className="wb-print-ref">ชุดข้อสอบ A</p>
            </div>
          </div>

          {/* Exam Specs Bar (จาก Mockup view=detail) */}
          <div className="wb-print-specs-bar">
            <div className="wb-print-spec-item">
              <span>ชุดข้อสอบ</span>
              <strong>A</strong>
            </div>
            <div className="wb-print-spec-item">
              <span>จำนวนข้อสอบ</span>
              <strong>200 ข้อ</strong>
            </div>
            <div className="wb-print-spec-item">
              <span>ระยะเวลาสอบ</span>
              <strong>180 นาที</strong>
            </div>
            <div className="wb-print-spec-item">
              <span>ประเภทข้อสอบ</span>
              <strong>ปรนัย 4-5 ตัวเลือก</strong>
            </div>
            <div className="wb-print-spec-item">
              <span>คะแนนเต็ม</span>
              <strong>100 คะแนน</strong>
            </div>
          </div>

          {/* Detail Columns: ข้อมูลผู้เข้าสอบ + อันดับของคุณ */}
          <div className="wb-print-2col">
            <div className="wb-print-card">
              <h3 className="wb-print-section-title">ข้อมูลผู้เข้าสอบ</h3>
              <dl className="wb-print-dl">
                <div>
                  <dt>ชื่อ-นามสกุล</dt>
                  <dd><strong>{student.name || "สมชาย ศิริกุล"}</strong></dd>
                </div>
                <div>
                  <dt>เลขบัตรประชาชน</dt>
                  <dd>{maskCitizenId(student.citizenId)}</dd>
                </div>
                <div>
                  <dt>วันที่สอบ</dt>
                  <dd>15 ก.ค. 2569</dd>
                </div>
                <div>
                  <dt>เวลาที่ใช้ทำข้อสอบ</dt>
                  <dd>2 ชั่วโมง 41 นาที</dd>
                </div>
                <div>
                  <dt>ระดับชั้น / โรงเรียน</dt>
                  <dd>{student.grade || "ม.6"} · {student.school || "โรงเรียนตัวอย่างวิทยา"} ({student.province || "ขอนแก่น"})</dd>
                </div>
              </dl>
            </div>

            <div className="wb-print-card wb-print-rank-card">
              <h3 className="wb-print-section-title">🏆 อันดับของคุณ (Ranking)</h3>
              <div className="wb-print-rank-body">
                <div className="wb-print-rank-scorebox">
                  <span>คะแนนรวม</span>
                  <b>{roundedScore}<small>/100</small></b>
                </div>
                <div className="wb-print-rank-placebox">
                  <span className="wb-print-label">ลำดับที่ของคุณ</span>
                  <div className="wb-print-rank-num">
                    <strong>415</strong> <small>/ 2709 คน</small>
                  </div>
                  <small className="wb-print-rank-note">*คิดจากการสอบครั้งที่ 1 เท่านั้น</small>
                </div>
              </div>
            </div>
          </div>

          {/* Total Score Scale Bar */}
          <div className="wb-print-card wb-print-total-card">
            <div className="wb-print-total-head">
              <span className="wb-print-total-title">TGAT ความถนัดทั่วไป รวม</span>
              <strong className="wb-print-total-score">{roundedScore} / 100</strong>
            </div>
            <div className="wb-print-bar-bg" style={{ height: 12 }}>
              <div
                className="wb-print-bar-fill"
                style={{ width: `${Math.min(100, Math.max(0, displayScore))}%`, background: "#2563eb" }}
              />
            </div>
            <div className="wb-print-scale-labels">
              <span>0</span>
              <span style={{ fontWeight: 800, color: "#1e3a8a" }}>{roundedScore}</span>
              <span>100</span>
            </div>
          </div>

          {/* 3 Main Parts (TGAT1, TGAT2, TGAT3) from seededScores */}
          <div className="wb-print-card">
            <h3 className="wb-print-section-title">คะแนนแยกตาม 3 วิชาหลัก (TGAT 1-2-3)</h3>
            <div className="wb-print-parts-grid">
              <div className="wb-print-part-box" style={{ borderLeftColor: "#006ab5" }}>
                <div className="wb-print-part-title-row">
                  <span className="wb-print-part-name" style={{ color: "#006ab5" }}>TGAT1 การสื่อสารภาษาอังกฤษ</span>
                  <b>60.7/100</b>
                </div>
                <div className="wb-print-bar-bg">
                  <div className="wb-print-bar-fill" style={{ width: "60.7%", background: "#006ab5" }} />
                </div>
                <small className="wb-print-part-desc">Speaking 31.7/50 · Reading 29/50</small>
              </div>

              <div className="wb-print-part-box" style={{ borderLeftColor: "#ff6638" }}>
                <div className="wb-print-part-title-row">
                  <span className="wb-print-part-name" style={{ color: "#ff6638" }}>TGAT2 การคิดอย่างมีเหตุผล</span>
                  <b>67.4/100</b>
                </div>
                <div className="wb-print-bar-bg">
                  <div className="wb-print-bar-fill" style={{ width: "67.4%", background: "#ff6638" }} />
                </div>
                <small className="wb-print-part-desc">ภาษา 15/20 · ตัวเลข 14/20 · มิติสัมพันธ์ 14/20 · เหตุผล 13/20</small>
              </div>

              <div className="wb-print-part-box" style={{ borderLeftColor: "#3b66ff" }}>
                <div className="wb-print-part-title-row">
                  <span className="wb-print-part-name" style={{ color: "#3b66ff" }}>TGAT3 สมรรถนะการทำงาน</span>
                  <b>54.6/100</b>
                </div>
                <div className="wb-print-bar-bg">
                  <div className="wb-print-bar-fill" style={{ width: "54.6%", background: "#3b66ff" }} />
                </div>
                <small className="wb-print-part-desc">นวัตกรรม 15.42/25 · ปัญหา 7.50/25 · อารมณ์ 15/25 · สังคม 16.67/25</small>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="wb-print-footer">
            <span>เอกสารรายงานผลคะแนนสอบจำลอง TCAS · Web B (Study Unith)</span>
            <span>หน้าที่ 1 จาก 4 (ข้อมูลจากหน้า รายละเอียดผลสอบ view=detail)</span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PAGE 2: ข้อมูลทั้งหมดจากหน้า view=subresults&part=tgat1                      */}
        {/* ========================================================================= */}
        <section className="wb-print-sheet" id="wb-print-page-2">
          {/* Header */}
          <div className="wb-print-header">
            <div className="wb-print-brand">
              <div className="wb-print-logo-box" style={{ background: "#006ab5" }}>91</div>
              <div>
                <h2 className="wb-print-title">TGAT1 · 91 การสื่อสารภาษาอังกฤษ (English Communication)</h2>
                <p className="wb-print-subtitle">รายงานผลคะแนนและการแจกแจงรายข้อ 1–60 (view=subresults&part=tgat1)</p>
              </div>
            </div>
            <div className="wb-print-doc-meta">
              <span className="wb-print-page-badge">หน้าที่ 2 จาก 4</span>
              <p className="wb-print-ref">ผู้สอบ: {student.name || "สมชาย ศิริกุล"}</p>
            </div>
          </div>

          {/* Header Score Strip (ตรงตาม Mockup) */}
          <div className="wb-print-subresults-head-banner" style={{ background: "#006ab5" }}>
            <div>
              <span className="wb-print-head-pill">TGAT1 · 91</span>
              <h3 className="wb-print-head-title">การสื่อสารภาษาอังกฤษ (English Communication)</h3>
              <p className="wb-print-head-meta">· ถูก 36 · ผิด 14 · 60 ข้อ</p>
            </div>
            <div className="wb-print-head-scorebox">
              <strong>60.7</strong>
              <span>/100</span>
            </div>
          </div>

          {/* Skills Breakdown (ตรงตาม Mockup) */}
          <div className="wb-print-card">
            <h3 className="wb-print-section-title">จำแนกตามทักษะ (Skill Breakdown)</h3>
            <div className="wb-print-2col">
              <div className="wb-print-skill-card">
                <div className="wb-print-skill-head">
                  <strong>Speaking Skill</strong>
                  <span className="wb-print-skill-score" style={{ color: "#006ab5" }}>31.7/50</span>
                </div>
                <div className="wb-print-bar-bg">
                  <div className="wb-print-bar-fill" style={{ width: "63.4%", background: "#006ab5" }} />
                </div>
                <div className="wb-print-skill-meta">ข้อ 1–30 · ถูก 19 ข้อ · ผิด 11 ข้อ</div>
              </div>

              <div className="wb-print-skill-card">
                <div className="wb-print-skill-head">
                  <strong>Reading Skill</strong>
                  <span className="wb-print-skill-score" style={{ color: "#006ab5" }}>29/50</span>
                </div>
                <div className="wb-print-bar-bg">
                  <div className="wb-print-bar-fill" style={{ width: "58%", background: "#006ab5" }} />
                </div>
                <div className="wb-print-skill-meta">ข้อ 31–60 · ถูก 17 ข้อ · ผิด 13 ข้อ</div>
              </div>
            </div>
          </div>

          {/* Question-by-Question Diagnostics (1-60) ตรงตาม TGAT1_SPEAKING_QUESTIONS + TGAT1_READING_QUESTIONS */}
          <div className="wb-print-card" style={{ flex: 1 }}>
            <h3 className="wb-print-section-title">ตารางแจกแจงรายข้อ 1–60 (Speaking Skill 1–30, Reading Skill 31–60)</h3>
            <div className="wb-print-grid-6">
              {tgat1AllQuestions.map((q) => (
                <div
                  key={q.no}
                  className={`wb-print-q-cell ${q.correct ? "is-correct" : "is-wrong"}`}
                >
                  <span className="wb-print-q-no">{q.no}.</span>
                  <span className="wb-print-q-ans">{q.ans}</span>
                  <span className="wb-print-q-mark">{q.correct ? "✓" : "✗"}</span>
                  <span className="wb-print-q-score">{q.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="wb-print-footer">
            <span>TGAT1 (91) การสื่อสารภาษาอังกฤษ · ข้อมูลจาก Mockup view=subresults&part=tgat1</span>
            <span>หน้าที่ 2 จาก 4</span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PAGE 3: ข้อมูลทั้งหมดจากหน้า view=subresults&part=tgat2                      */}
        {/* ========================================================================= */}
        <section className="wb-print-sheet" id="wb-print-page-3">
          {/* Header */}
          <div className="wb-print-header">
            <div className="wb-print-brand">
              <div className="wb-print-logo-box" style={{ background: "#ff6638" }}>92</div>
              <div>
                <h2 className="wb-print-title">TGAT2 · 92 การคิดอย่างมีเหตุผล (Critical & Logical Thinking)</h2>
                <p className="wb-print-subtitle">รายงานผลคะแนนและการแจกแจงรายข้อ 1–80 (view=subresults&part=tgat2)</p>
              </div>
            </div>
            <div className="wb-print-doc-meta">
              <span className="wb-print-page-badge">หน้าที่ 3 จาก 4</span>
              <p className="wb-print-ref">ผู้สอบ: {student.name || "สมชาย ศิริกุล"}</p>
            </div>
          </div>

          {/* Header Score Strip (ตรงตาม Mockup) */}
          <div className="wb-print-subresults-head-banner" style={{ background: "#ff6638" }}>
            <div>
              <span className="wb-print-head-pill">TGAT2 · 92</span>
              <h3 className="wb-print-head-title">การคิดอย่างมีเหตุผล (Critical & Logical Thinking)</h3>
              <p className="wb-print-head-meta">· ถูก 54 · ผิด 14 · 80 ข้อ</p>
            </div>
            <div className="wb-print-head-scorebox">
              <strong>67.4</strong>
              <span>/100</span>
            </div>
          </div>

          {/* 4 Skills Breakdown (ตรงตาม examPartReports.tgat2) */}
          <div className="wb-print-card">
            <h3 className="wb-print-section-title">จำแนกตาม 4 ด้านการคิดอย่างมีเหตุผล</h3>
            <div className="wb-print-2col">
              <div className="wb-print-skill-card">
                <div className="wb-print-skill-head">
                  <strong>1. ความสามารถทางภาษา</strong>
                  <span className="wb-print-skill-score" style={{ color: "#ff6638" }}>15/20</span>
                </div>
                <div className="wb-print-bar-bg">
                  <div className="wb-print-bar-fill" style={{ width: "75%", background: "#ff6638" }} />
                </div>
                <div className="wb-print-skill-meta">ข้อ 1–20 · ถูก 13 ข้อ · ผิด 7 ข้อ</div>
              </div>

              <div className="wb-print-skill-card">
                <div className="wb-print-skill-head">
                  <strong>2. ความสามารถทางตัวเลข</strong>
                  <span className="wb-print-skill-score" style={{ color: "#ff6638" }}>14/20</span>
                </div>
                <div className="wb-print-bar-bg">
                  <div className="wb-print-bar-fill" style={{ width: "70%", background: "#ff6638" }} />
                </div>
                <div className="wb-print-skill-meta">ข้อ 21–40 · ถูก 14 ข้อ · ผิด 6 ข้อ</div>
              </div>

              <div className="wb-print-skill-card">
                <div className="wb-print-skill-head">
                  <strong>3. ความสามารถทางมิติสัมพันธ์</strong>
                  <span className="wb-print-skill-score" style={{ color: "#ff6638" }}>14/20</span>
                </div>
                <div className="wb-print-bar-bg">
                  <div className="wb-print-bar-fill" style={{ width: "70%", background: "#ff6638" }} />
                </div>
                <div className="wb-print-skill-meta">ข้อ 41–60 · ถูก 14 ข้อ · ผิด 6 ข้อ</div>
              </div>

              <div className="wb-print-skill-card">
                <div className="wb-print-skill-head">
                  <strong>4. ความสามารถทางเหตุผล</strong>
                  <span className="wb-print-skill-score" style={{ color: "#ff6638" }}>13/20</span>
                </div>
                <div className="wb-print-bar-bg">
                  <div className="wb-print-bar-fill" style={{ width: "65%", background: "#ff6638" }} />
                </div>
                <div className="wb-print-skill-meta">ข้อ 61–80 · ถูก 13 ข้อ · ผิด 7 ข้อ</div>
              </div>
            </div>
          </div>

          {/* Question-by-Question Diagnostics (1-80) ตรงตาม Mockup getSubResultQuestions */}
          <div className="wb-print-card" style={{ flex: 1 }}>
            <h3 className="wb-print-section-title">ตารางแจกแจงรายข้อ 1–80 (จำแนกตามทักษะ 4 ด้าน)</h3>
            <div className="wb-print-grid-8">
              {tgat2AllQuestions.map((q) => (
                <div
                  key={String(q.no)}
                  className={`wb-print-q-cell ${q.correct ? "is-correct" : "is-wrong"}`}
                >
                  <span className="wb-print-q-no">{q.no}.</span>
                  <span className="wb-print-q-ans">{q.ans}</span>
                  <span className="wb-print-q-mark">{q.correct ? "✓" : "✗"}</span>
                  <span className="wb-print-q-score">{q.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="wb-print-footer">
            <span>TGAT2 (92) การคิดอย่างมีเหตุผล · ข้อมูลจาก Mockup view=subresults&part=tgat2</span>
            <span>หน้าที่ 3 จาก 4</span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PAGE 4: ข้อมูลทั้งหมดจากหน้า view=subresults&part=tgat3                      */}
        {/* ========================================================================= */}
        <section className="wb-print-sheet" id="wb-print-page-4">
          {/* Header */}
          <div className="wb-print-header">
            <div className="wb-print-brand">
              <div className="wb-print-logo-box" style={{ background: "#3b66ff" }}>93</div>
              <div>
                <h2 className="wb-print-title">TGAT3 · 93 สมรรถนะการทำงาน (Future Workforce Competency)</h2>
                <p className="wb-print-subtitle">รายงานผลคะแนนและการแจกแจงรายข้อ 1–60 (view=subresults&part=tgat3)</p>
              </div>
            </div>
            <div className="wb-print-doc-meta">
              <span className="wb-print-page-badge">หน้าที่ 4 จาก 4</span>
              <p className="wb-print-ref">สิ้นสุดเอกสาร</p>
            </div>
          </div>

          {/* Header Score Strip (ตรงตาม Mockup) */}
          <div className="wb-print-subresults-head-banner" style={{ background: "#3b66ff" }}>
            <div>
              <span className="wb-print-head-pill">TGAT3 · 93</span>
              <h3 className="wb-print-head-title">สมรรถนะการทำงาน (Future Workforce Competency)</h3>
              <p className="wb-print-head-meta">· ถูก 41 · ผิด 19 · 60 ข้อ</p>
            </div>
            <div className="wb-print-head-scorebox">
              <strong>54.6</strong>
              <span>/100</span>
            </div>
          </div>

          {/* 4 Competency Domains Breakdown (ตรงตาม examPartReports.tgat3 เป๊ะ!) */}
          <div className="wb-print-card">
            <h3 className="wb-print-section-title">จำแนกตาม 4 ด้านสมรรถนะการทำงาน</h3>
            <div className="wb-print-2col">
              <div className="wb-print-skill-card">
                <div className="wb-print-skill-head">
                  <strong>1. การสร้างคุณค่าและนวัตกรรม</strong>
                  <span className="wb-print-skill-score" style={{ color: "#3b66ff" }}>15.42/25</span>
                </div>
                <div className="wb-print-bar-bg">
                  <div className="wb-print-bar-fill" style={{ width: "61.68%", background: "#3b66ff" }} />
                </div>
                <div className="wb-print-skill-meta">ข้อ 1–15 · ถูก 9.25 ข้อ · ผิด 9.58 ข้อ</div>
              </div>

              <div className="wb-print-skill-card">
                <div className="wb-print-skill-head">
                  <strong>2. การแก้ไขปัญหาที่ซับซ้อน</strong>
                  <span className="wb-print-skill-score" style={{ color: "#3b66ff" }}>7.50/25</span>
                </div>
                <div className="wb-print-bar-bg">
                  <div className="wb-print-bar-fill" style={{ width: "30.0%", background: "#3b66ff" }} />
                </div>
                <div className="wb-print-skill-meta">ข้อ 16–30 · ถูก 4.5 ข้อ · ผิด 10.5 ข้อ</div>
              </div>

              <div className="wb-print-skill-card">
                <div className="wb-print-skill-head">
                  <strong>3. การบริหารจัดการอารมณ์</strong>
                  <span className="wb-print-skill-score" style={{ color: "#3b66ff" }}>15/25</span>
                </div>
                <div className="wb-print-bar-bg">
                  <div className="wb-print-bar-fill" style={{ width: "60.0%", background: "#3b66ff" }} />
                </div>
                <div className="wb-print-skill-meta">ข้อ 31–45 · ถูก 9 ข้อ · ผิด 6 ข้อ</div>
              </div>

              <div className="wb-print-skill-card">
                <div className="wb-print-skill-head">
                  <strong>4. การเป็นพลเมืองที่มีส่วนร่วมของสังคม</strong>
                  <span className="wb-print-skill-score" style={{ color: "#3b66ff" }}>16.67/25</span>
                </div>
                <div className="wb-print-bar-bg">
                  <div className="wb-print-bar-fill" style={{ width: "66.68%", background: "#3b66ff" }} />
                </div>
                <div className="wb-print-skill-meta">ข้อ 46–60 · ถูก 10 ข้อ · ผิด 5 ข้อ</div>
              </div>
            </div>
          </div>

          {/* Question-by-Question Diagnostics (1-60) ตรงตาม TGAT3 Mockup (ข้อเดี่ยว ข้อเชื่อมโยง ข้อหลายข้อ) */}
          <div className="wb-print-card" style={{ flex: 1 }}>
            <h3 className="wb-print-section-title">ตารางแจกแจงรายข้อ 1–60 (สมรรถนะการทำงาน 4 ด้าน)</h3>
            <div className="wb-print-grid-6">
              {tgat3AllQuestions.map((q, idx) => {
                const isIncorrect = q.isWrong || q.score === "0.00" || q.badge === "cross" || q.badge === "0";
                return (
                  <div
                    key={`${q.no}-${idx}`}
                    className={`wb-print-q-cell ${isIncorrect ? "is-wrong" : "is-correct"}`}
                  >
                    <span className="wb-print-q-no">{q.no}.</span>
                    <span className="wb-print-q-ans">{q.ans}</span>
                    <span className="wb-print-q-mark">
                      {q.badge === "double-check" ? "✓✓" : q.badge === "cross" || isIncorrect ? "✗" : q.badge ? q.badge : "✓"}
                    </span>
                    <span className="wb-print-q-score">{q.score}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="wb-print-footer">
            <span>TGAT3 (93) สมรรถนะการทำงาน · ข้อมูลจาก Mockup view=subresults&part=tgat3</span>
            <span>หน้าที่ 4 จาก 4 (สิ้นสุดเอกสาร)</span>
          </div>
        </section>

        {/* Global Print Stylesheet */}
        <style jsx global>{`
          @media screen {
            #wb-print-container {
              display: none !important;
            }
          }

          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }

            *, *::before, *::after {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              box-sizing: border-box !important;
            }

            html, body {
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif !important;
              font-size: 11px !important;
              line-height: 1.4 !important;
            }

            /* Hide everything on the web page except the printable report */
            body > *:not(#wb-print-container) {
              display: none !important;
            }

            #wb-print-container {
              display: block !important;
              position: static !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }

            /* Exact 4-page containment */
            .wb-print-sheet {
              width: 100% !important;
              max-width: 190mm !important;
              height: 278mm !important;
              max-height: 278mm !important;
              min-height: 278mm !important;
              margin: 0 auto !important;
              padding: 4mm 6mm !important;
              background: #ffffff !important;
              color: #0f172a !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              overflow: hidden !important;
            }

            .wb-print-sheet:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }

            /* Header */
            .wb-print-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 6px;
              margin-bottom: 8px;
            }

            .wb-print-brand {
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .wb-print-logo-box {
              width: 36px;
              height: 36px;
              border-radius: 6px;
              background: #211d4f;
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 900;
              font-size: 13px;
              letter-spacing: -0.5px;
            }

            .wb-print-title {
              font-size: 13.5px;
              font-weight: 800;
              margin: 0;
              color: #0f172a;
              letter-spacing: -0.2px;
            }

            .wb-print-subtitle {
              font-size: 9.5px;
              color: #64748b;
              margin: 1px 0 0;
            }

            .wb-print-doc-meta {
              text-align: right;
            }

            .wb-print-page-badge {
              display: inline-block;
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 9.5px;
              font-weight: 700;
              color: #334155;
            }

            .wb-print-ref {
              font-size: 9px;
              color: #64748b;
              font-weight: 600;
              margin: 2px 0 0;
            }

            /* Specs Bar */
            .wb-print-specs-bar {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 6px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 6px 10px;
              margin-bottom: 8px;
            }

            .wb-print-spec-item {
              display: flex;
              flex-direction: column;
            }

            .wb-print-spec-item span {
              font-size: 8.5px;
              color: #64748b;
              font-weight: 600;
            }

            .wb-print-spec-item strong {
              font-size: 11px;
              color: #0f172a;
              font-weight: 800;
            }

            /* Cards */
            .wb-print-card {
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              background: #ffffff;
              padding: 8px 10px;
              margin-bottom: 6px;
            }

            .wb-print-section-title {
              font-size: 11px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 6px;
            }

            /* DL in Student Info */
            .wb-print-dl {
              margin: 0;
              display: grid;
              grid-template-columns: 1fr;
              gap: 4px;
              font-size: 10px;
            }

            .wb-print-dl > div {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px dashed #f1f5f9;
              padding-bottom: 2px;
            }

            .wb-print-dl dt {
              color: #64748b;
              font-weight: 600;
            }

            .wb-print-dl dd {
              margin: 0;
              color: #0f172a;
              text-align: right;
            }

            /* Rank Card */
            .wb-print-rank-card {
              background: #fdfefe;
              border-color: #cbd5e1;
            }

            .wb-print-rank-body {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-top: 4px;
            }

            .wb-print-rank-scorebox {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 6px;
              padding: 8px 12px;
              text-align: center;
              flex-shrink: 0;
            }

            .wb-print-rank-scorebox span {
              font-size: 9px;
              font-weight: 700;
              color: #1e40af;
              display: block;
            }

            .wb-print-rank-scorebox b {
              font-size: 20px;
              font-weight: 900;
              color: #1e3a8a;
              line-height: 1.1;
            }

            .wb-print-rank-scorebox b small {
              font-size: 10px;
              font-weight: 600;
              color: #60a5fa;
            }

            .wb-print-rank-placebox {
              flex: 1;
            }

            .wb-print-label {
              font-size: 9px;
              color: #64748b;
              font-weight: 600;
            }

            .wb-print-rank-num {
              font-size: 16px;
              font-weight: 900;
              color: #0f172a;
            }

            .wb-print-rank-num small {
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
            }

            .wb-print-rank-note {
              display: block;
              font-size: 8.5px;
              color: #94a3b8;
              margin-top: 2px;
            }

            /* Total Score Card */
            .wb-print-total-card {
              background: #f8fafc;
              border-color: #cbd5e1;
            }

            .wb-print-total-head {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              font-weight: 800;
              margin-bottom: 4px;
            }

            .wb-print-total-score {
              color: #2563eb;
              font-size: 13px;
            }

            .wb-print-scale-labels {
              display: flex;
              justify-content: space-between;
              font-size: 8.5px;
              color: #64748b;
              margin-top: 2px;
            }

            /* 3 Parts Grid */
            .wb-print-parts-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
            }

            .wb-print-part-box {
              border: 1px solid #e2e8f0;
              border-left-width: 4px;
              border-radius: 6px;
              padding: 6px 8px;
              background: #ffffff;
            }

            .wb-print-part-title-row {
              display: flex;
              justify-content: space-between;
              font-size: 9.5px;
              font-weight: 700;
              margin-bottom: 4px;
            }

            .wb-print-part-desc {
              display: block;
              font-size: 8.5px;
              color: #64748b;
              margin-top: 3px;
            }

            /* Banner on Subresults Pages (TGAT1, TGAT2, TGAT3) */
            .wb-print-subresults-head-banner {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 12px;
              border-radius: 6px;
              color: #ffffff;
              margin-bottom: 8px;
            }

            .wb-print-head-pill {
              display: inline-block;
              background: rgba(255, 255, 255, 0.25);
              padding: 1px 6px;
              border-radius: 9999px;
              font-size: 9px;
              font-weight: 700;
              margin-bottom: 2px;
            }

            .wb-print-head-title {
              font-size: 13px;
              font-weight: 800;
              margin: 0;
              line-height: 1.2;
            }

            .wb-print-head-meta {
              font-size: 9.5px;
              margin: 2px 0 0;
              opacity: 0.9;
            }

            .wb-print-head-scorebox {
              text-align: right;
            }

            .wb-print-head-scorebox strong {
              font-size: 26px;
              font-weight: 900;
              line-height: 1;
            }

            .wb-print-head-scorebox span {
              font-size: 11px;
              opacity: 0.85;
            }

            /* Skill Cards */
            .wb-print-skill-card {
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 5px 8px;
              background: #ffffff;
            }

            .wb-print-skill-head {
              display: flex;
              justify-content: space-between;
              font-size: 9.5px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 3px;
            }

            .wb-print-skill-score {
              font-weight: 800;
            }

            .wb-print-skill-meta {
              font-size: 8.5px;
              color: #64748b;
              margin-top: 3px;
            }

            /* 2 Columns */
            .wb-print-2col {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              margin-bottom: 6px;
            }

            /* Bars */
            .wb-print-bar-bg {
              width: 100%;
              height: 6px;
              background: #e2e8f0;
              border-radius: 9999px;
              overflow: hidden;
            }

            .wb-print-bar-fill {
              height: 100%;
              border-radius: 9999px;
            }

            /* Diagnostic Grids */
            .wb-print-grid-6 {
              display: grid;
              grid-template-columns: repeat(6, 1fr);
              gap: 2.5px;
            }

            .wb-print-grid-8 {
              display: grid;
              grid-template-columns: repeat(8, 1fr);
              gap: 2px;
            }

            .wb-print-q-cell {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 2px 4px;
              border-radius: 3px;
              font-size: 8.5px;
              border: 1px solid #e2e8f0;
            }

            .wb-print-q-cell.is-correct {
              background: #ecfdf5;
              border-color: #a7f3d0;
              color: #065f46;
            }

            .wb-print-q-cell.is-wrong {
              background: #fff1f2;
              border-color: #fecdd3;
              color: #9f1239;
            }

            .wb-print-q-no {
              font-weight: 700;
            }

            .wb-print-q-ans {
              font-weight: 600;
              font-size: 8px;
              color: #475569;
            }

            .wb-print-q-mark {
              font-weight: 900;
              font-size: 9px;
            }

            .wb-print-q-score {
              font-size: 8px;
              opacity: 0.8;
            }

            /* Footers */
            .wb-print-footer {
              display: flex;
              justify-content: space-between;
              border-top: 1px solid #cbd5e1;
              padding-top: 4px;
              margin-top: 4px;
              font-size: 8.5px;
              color: #64748b;
            }
          }
        `}</style>
      </div>
    </WebBModalPortal>
  );
}
