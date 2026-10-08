"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicShell } from "./PublicShell";
import { WebBImage } from "./WebBImage";
import { DEMO_AUTH_KEY } from "./demo-store";

const benefits = [
  {
    title: "จำลองบรรยากาศสอบจริง",
    detail:
      "ฝึกทำข้อสอบเสมือนจริง คุ้นเคยกับบรรยากาศการสอบ ลดความตื่นเต้น และเพิ่มความมั่นใจก่อนลงสนามจริง",
  },
  {
    title: "แนวข้อสอบอัปเดตล่าสุด",
    detail:
      "ฝึกฝนข้อสอบคุณภาพที่อัปเดตตามโครงสร้างปีล่าสุด คัดสรรโดยทีมติวเตอร์ผู้เชี่ยวชาญ เพื่อให้พร้อมกับข้อสอบจริง",
  },
  {
    title: "สอบ ONLINE ทุกที่เวลา",
    detail:
      "สอบออนไลน์ได้ทุกที่ ทุกเวลา สะดวกและยืดหยุ่น พร้อมเลือกเวลาที่สอบได้ทันที ไม่ต้องเสียเวลาเดินทาง",
  },
  {
    title: "วิเคราะห์ผลและ Ranking",
    detail:
      "วิเคราะห์ผลสอบอย่างละเอียด พร้อมดู Ranking เทียบกับผู้สอบทั่วประเทศ เพื่อรู้จุดที่ต้องพัฒนาและวางแผนเพิ่มคะแนน",
  },
];

const subjects = [
  { code: "TGAT", name: "ความถนัดทั่วไป", active: true },
  { code: "TPAT", name: "ความถนัดทางวิชาชีพ", active: false },
  { code: "A-Level", name: "ความถนัดทางวิชาชีพ", active: true },
  { code: "NETSAT", name: "มหาวิทยาลัยขอนแก่น", active: false },
];

const guide = [
  {
    icon: "✍️",
    title: "การเตรียมตัวก่อนสอบ",
    detail:
      "แนะนำให้ใช้คอมพิวเตอร์ แล็ปท็อป หรือแท็บเล็ตตรวจสอบแบตเตอรี่และการเชื่อมต่ออินเทอร์เน็ตให้เสถียร",
  },
  {
    icon: "⏰",
    title: "ระหว่างการสอบ",
    detail:
      "เวลาเริ่มนับถอยหลังทันทีที่กด “เริ่มทำข้อสอบ” ระบบบันทึกคำตอบอัตโนมัติ (Auto-save) หากหลุดสามารถล็อกอินกลับมาทำต่อได้",
  },
  {
    icon: "✅",
    title: "การส่งข้อสอบ",
    detail:
      "ทบทวนคำตอบอีกครั้งก่อนกด “ส่งข้อสอบ” หากหมดเวลาแต่ยังไม่กดส่ง ระบบจะส่งและบันทึกคำตอบล่าสุดให้โดยอัตโนมัติ",
  },
  {
    icon: "⁉️",
    title: "กรณีพบปัญหา",
    detail:
      "หากระบบมีปัญหา ถ่ายภาพหน้าจอหรือวิดีโอพร้อมเวลาที่เกิดเหตุ ระบุชื่อและอีเมล แจ้งแอดมินทันที",
  },
];

const steps = [
  { icon: "☝️", title: "สมัครสอบ", detail: "สร้างบัญชีและรหัสผ่าน" },
  {
    icon: "📄",
    title: "กรอกข้อมูลผู้สมัคร",
    detail: "กรอกข้อมูลเพื่อสมัครสอบ",
  },
  {
    icon: "☷",
    title: "เลือกวิชาสอบ",
    detail: "สมัครสอบได้ตั้งแต่ 1 วิชาขึ้นไป",
  },
  { icon: "▦", title: "ชำระเงิน", detail: "ชำระผ่าน QR Payment" },
  { icon: "✓", title: "สำเร็จ", detail: "พร้อมลุย ทำข้อสอบ" },
];

const conditions = [
  {
    icon: "♟",
    title: "การสมัครสอบ",
    detail:
      "ผู้สมัครต้องตรวจสอบรายวิชา แพ็กเกจ และสิทธิ์การใช้งานให้ถูกต้องก่อนชำระเงิน เมื่อชำระเงินสำเร็จถือว่าการสมัครเสร็จสมบูรณ์ สิทธิ์สอบเป็นสิทธิ์ส่วนบุคคล ไม่สามารถโอน ยกเลิก หรือขอคืนเงินได้ทุกกรณี",
  },
  {
    icon: "✍️",
    title: "การเข้าสอบ",
    detail:
      "หากเกิดปัญหาทางเทคนิคจากฝั่งระบบ/แพลตฟอร์ม เช่น ระบบล่ม ข้อสอบไม่สมบูรณ์ ระบบจับเวลาผิดพลาด บริษัทจะพิจารณาให้สิทธิ์สอบใหม่ตามหลักเกณฑ์ที่ระบุ",
  },
  {
    icon: "⁉️",
    title: "ปัญหาจากอุปกรณ์ผู้สอบ",
    detail:
      "กรณีปัญหาจากอุปกรณ์หรืออินเทอร์เน็ตของผู้สอบเอง ระบบมี Auto-Save ให้กลับเข้ามาทำต่อได้ แต่เวลาสอบจะยังคงเดินต่อเนื่อง ไม่สามารถขอชดเชยเวลาหรือคืนเงินได้",
  },
];

const faculties = [
  "คณะแพทย์",
  "คณะทันตแพทย์",
  "คณะเภสัช",
  "คณะสัตวแพทย์",
  "คณะพยาบาล",
  "คณะวิศวกรรม",
  "คณะนิติศาสตร์",
  "คณะบริหาร",
  "คณะนิเทศศาสตร์",
  "คณะเศรษฐศาสตร์",
  "คณะรัฐศาสตร์",
  "คณะครุศาสตร์",
  "คณะจิตวิทยา",
  "คณะสถาปัตย์",
  "คณะวิทยาศาสตร์",
  "คณะเทคโนโลยี",
  "คณะศิลปกรรม",
  "คณะเกษตรศาสตร์",
];
const subjectColumns = [
  "TGAT",
  "TPAT1 กสพท",
  "TPAT2 ศิลปกรรม",
  "TPAT3 วิศวกรรม",
  "TPAT4 สถาปัตย์",
  "TPAT5 ครุ",
  "คณิต1",
  "คณิต2",
  "ภาษาอังกฤษ",
  "ฟิสิกส์",
  "เคมี",
  "ชีวะ",
  "ไทย",
  "สังคม",
];

function BrandMark() {
  return (
    <span className="wb-hero-brand-mark" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

function MatrixPreview() {
  return (
    <section
      className="wb-matrix wb-container"
      aria-label="ตารางแนวทางรายวิชาที่ใช้ยื่นคณะ ตัวอย่าง"
    >
      <div className="wb-matrix-banner">
        <div className="wb-matrix-title">
          <BrandMark />
          <div>
            <span>เรียนต่อมหาลัย</span>
            <strong>
              TCAS 70
              <br />
              MOCK Exam
            </strong>
            <small>เช็กก่อน อ่านก่อน เตรียมพร้อมก่อนสอบจริง!</small>
          </div>
        </div>
        <div className="wb-matrix-photo">
          <WebBImage className="wb-image" alt="ภาพตัวอย่างสำหรับตาราง TCAS" />
        </div>
      </div>
      <div className="wb-matrix-paper">
        <div className="wb-matrix-scroll">
          <table>
            <thead>
              <tr>
                <th className="wb-faculty-head" rowSpan={2}>
                  คณะ
                </th>
                <th className="wb-group-head wb-group-blue" colSpan={6}>
                  TGAT / TPAT ความถนัด
                </th>
                <th className="wb-group-head wb-group-purple" colSpan={8}>
                  A-Level วิชาการ
                </th>
              </tr>
              <tr>
                {subjectColumns.map((subject, index) => (
                  <th
                    className={index < 6 ? "wb-col-blue" : "wb-col-purple"}
                    key={subject}
                  >
                    <span>{subject}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {faculties.map((faculty, row) => (
                <tr key={faculty}>
                  <th>{faculty}</th>
                  {subjectColumns.map((subject, col) => {
                    const marked =
                      col === 0 || col === 8 || (row * 7 + col * 5) % 11 < 4;
                    return (
                      <td key={subject}>
                        {marked ? (
                          <span
                            className={
                              col === 6 || col === 7
                                ? "wb-matrix-check is-red"
                                : "wb-matrix-check"
                            }
                          >
                            ✓
                          </span>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="wb-matrix-legend">
          <span>
            <i className="wb-matrix-check">✓</i> เหมาะสม ส่วนใหญ่ใช้
          </span>
          <span>
            <i className="wb-matrix-check is-red">✓</i> ใช้งานมหาวิทยาลัย{" "}
            <em>(เช็กกับ MyTCAS เพื่อความชัวร์)</em>
          </span>
        </div>
      </div>
    </section>
  );
}

export default function WebBHome() {
  const [studentLoggedIn, setStudentLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const syncLogin = () => {
      setStudentLoggedIn(localStorage.getItem(DEMO_AUTH_KEY) === "true");
      setAuthChecked(true);
    };
    syncLogin();
    window.addEventListener("storage", syncLogin);
    window.addEventListener("webb-demo-auth-updated", syncLogin);
    window.addEventListener("pageshow", syncLogin);
    window.addEventListener("popstate", syncLogin);
    return () => {
      window.removeEventListener("storage", syncLogin);
      window.removeEventListener("webb-demo-auth-updated", syncLogin);
      window.removeEventListener("pageshow", syncLogin);
      window.removeEventListener("popstate", syncLogin);
    };
  }, []);

  if (!authChecked) return null;

  return (
    <PublicShell>
      <main className="wb-home">
        <section className="wb-hero wb-container">
          <div className="wb-hero-intro">
            <span className="wb-eyebrow">TCAS 70 · MOCK EXAM</span>
            <div className="wb-hero-lockup">
              <BrandMark />
              <div>
                <strong>TCAS 70</strong>
                <b>MOCK EXAM</b>
              </div>
            </div>
            <h1>เพิ่มความมั่นใจ ก่อนสอบจริง!</h1>
            <p>
              ข้อสอบใหม่ อัปเดตจากข้อสอบปีล่าสุด
              ออกข้อสอบโดยติวเตอร์ผู้เชี่ยวชาญ
            </p>
            <div className="wb-hero-actions">
              {studentLoggedIn ? (
                null
              ) : (
                <>
                  <Link className="wb-pill-button wb-pill-outline" href="/webb/login">
                    เข้าสอบ
                  </Link>
                  <Link className="wb-pill-button wb-pill-yellow" href="/webb/register">
                    สมัคร
                  </Link>
                </>
              )}
            </div>
          </div>
          <figure className="wb-hero-photo">
            <WebBImage
              className="wb-image"
              alt="ภาพตัวอย่างนักเรียนเตรียมสอบ"
            />
          </figure>
          <div className="wb-hero-stats">
            <div>
              <strong>2,700+</strong>
              <span>ผู้เข้าสอบแล้ว</span>
            </div>
            <div>
              <strong>Online</strong>
              <span>เข้าสอบได้ทุกเมื่อ</span>
            </div>
            <div>
              <strong>ข้อสอบใหม่</strong>
              <span>ไม่ซ้ำกับสนามสอบ</span>
            </div>
          </div>
        </section>
        <section className="wb-trial wb-container">
          <div className="wb-trial-photo">
            <WebBImage className="wb-image" alt="ภาพตัวอย่างบรรยากาศทำข้อสอบ" />
          </div>
          <div className="wb-trial-copy">
            <h2>ทดลองระบบสอบฟรี</h2>
            <p>
              ลองสัมผัสหน้าจอทำข้อสอบ ระบบจับเวลา
              และกระดาษคำตอบเสมือนจริงก่อนสมัครสอบจริง
            </p>
            <Link
              className="wb-pill-button wb-pill-yellow "
              href="/webb/rules?product=tgat1&type=trial&back=home"
            >
              ทดลองระบบสอบ 
            </Link>
          </div>
        </section>
        <section className="wb-why wb-container" id="why">
          <h2>ทำไมต้องสอบกับเรา?</h2>
          <div className="wb-benefit-grid">
            {benefits.map((benefit) => (
              <article className="wb-benefit-card" key={benefit.title}>
                <div className="wb-benefit-image">
                  <WebBImage
                    className="wb-image"
                    alt="ภาพ Mockup จุดเด่นระบบสอบ"
                  />
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.detail}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="wb-subjects wb-container" id="subjects">
          <h2>เลือกวิชาที่ใช่ แล้วเริ่มติวได้เลย</h2>
          <p className="wb-section-lead">
            เลือกสอบได้ทีละวิชาหรือหลายวิชา เริ่มต้นด้วย TGAT และเปิดวิชาอื่นๆ
            เพิ่มใน Phase ถัดไป
          </p>
          <div className="wb-subject-grid">
            {subjects.map((subject) => (
              <article className="wb-subject-card" key={subject.code}>
                <div className="wb-subject-image">
                  <WebBImage
                    className="wb-image"
                    alt={`ภาพตัวอย่าง ${subject.code}`}
                  />
                </div>
                <h3>
                  {subject.code}
                  <span>{subject.name}</span>
                </h3>
                {subject.active ? (
                  <Link
                    className="wb-pill-button wb-pill-yellow"
                    href={subject.code === "A-Level" ? "/webb/a-level" : "/webb/tgat"}
                  >
                    ดูรายละเอียด 
                  </Link>
                ) : (
                  <span
                    className="wb-pill-button wb-pill-disabled"
                    aria-label={`${subject.code} ยังไม่เปิดสอบ`}
                  >
                    ดูรายละเอียด 
                  </span>
                )}
              </article>
            ))}
          </div>
        </section>
        <MatrixPreview />
        <section className="wb-guide wb-container" id="guide">
          <h2>คู่มือการสอบ</h2>
          <div className="wb-guide-grid">
            {guide.map((item, index) => (
              <div className="wb-guide-item" key={item.title}>
                <span className="wb-guide-number">0{index + 1}</span>
                <article className="wb-guide-card">
                  <span className={`wb-guide-icon wb-guide-icon-${index}`}>
                    {item.icon}
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </section>
        <section className="wb-steps" id="steps">
          <div className="wb-container">
            <h2>ขั้นตอนการสมัคร</h2>
            <p className="wb-section-lead">สมัครง่าย ใช้เวลาไม่เกิน 5 นาที</p>
            <div className="wb-step-list">
              {steps.map((step, index) => (
                <div className="wb-step-pair" key={step.title}>
                  <article className="wb-step-card">
                    <span className="wb-step-icon">{step.icon}</span>
                    <h3>{step.title}</h3>
                    <p>{step.detail}</p>
                  </article>
                  {index < steps.length - 1 && (
                    <span className="wb-step-arrow">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="wb-conditions wb-container">
          <h2>เงื่อนไข</h2>
          <div className="wb-condition-grid">
            {conditions.map((condition) => (
              <details className="wb-condition-card" open key={condition.title}>
                <summary>
                  <span className="wb-condition-icon">{condition.icon}</span>
                  <strong>{condition.title}</strong>
                  <span className="wb-condition-plus">+</span>
                </summary>
                <p>{condition.detail}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="wb-final-cta wb-container">
          <h2>พร้อมพิชิตคะแนนหรือยัง? 🚀</h2>
          <p>
            สมัครวันนี้ เริ่มสอบได้ทันที ไม่ต้องรอรอบ
            เพิ่มความมั่นใจก่อนสนามจริง
          </p>
          <Link
            className="wb-pill-button wb-pill-yellow wb-arrow-button"
            href="/webb/rules?product=tgat1&type=trial&back=home"
          >
            ทดลองระบบสอบ 
          </Link>
        </section>
      </main>
    </PublicShell>
  );
}
