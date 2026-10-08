"use client";

import Link from "next/link";
import Image from "next/image";
import {
  LuArrowRight,
  LuChevronRight,
  LuHeadset,
  LuLogOut,
} from "react-icons/lu";
import { useEffect, useState, type FormEvent } from "react";
import { PublicFooter, WebBBrand } from "./PublicShell";
import { getProduct } from "./data";
import { WebBImage } from "./WebBImage";
import { DEMO_ACCOUNT_KEY, readDemoAccount, readSocialSettings, safeWrite } from "./demo-store";

type StudentMode =
  | "student"
  | "profile"
  | "solutions"
  | "results"
  | "ranking"
  | "exam"
  | "detail";
type StudentView =
  | "overview"
  | "exam"
  | "results"
  | "solutions"
  | "ranking"
  | "profile"
  | "detail"
  | "subresults"
  | "personal";

const views: { id: StudentView; label: string }[] = [
  { id: "overview", label: "ภาพรวม" },
  { id: "exam", label: "ห้องสอบ" },
  { id: "results", label: "ผลสอบ" },
  { id: "solutions", label: "เฉลย" },
  { id: "profile", label: "โปรไฟล์ของฉัน" },
];

const homepageLinks = [
  { label: "ทำไมต้องสอบกับเรา", href: "/webb?student=1#why" },
  { label: "วิชาที่เปิดสอบ", href: "/webb?student=1#subjects" },
  { label: "คู่มือการสอบ", href: "/webb?student=1#guide" },
  { label: "ขั้นตอนการสมัคร", href: "/webb?student=1#steps" },
];

function StudentAvatar({ large = false }: { large?: boolean }) {
  return (
    <span
      className={`wb-dashboard-avatar wb-dashboard-avatar-photo${large ? " wb-dashboard-profile-avatar" : ""}`}
    >
      <WebBImage
        className="wb-dashboard-avatar-image"
        alt="ภาพ Mockup นักเรียน"
      />
    </span>
  );
}

const seededScores = [
  {
    id: "tgat1",
    name: "TGAT1 การสื่อสารภาษาอังกฤษ",
    score: 60.7,
    color: "#0066a7",
  },
  {
    id: "tgat2",
    name: "TGAT2 การคิดอย่างมีเหตุผล",
    score: 67.4,
    color: "#ff673f",
  },
  { id: "tgat3", name: "TGAT3 สมรรถนะการทำงาน", score: 54.6, color: "#4168ff" },
];

type ExamSkill = {
  name: string;
  total: number;
  start: number;
  score: string;
  correct: number;
  wrong: number;
};

type ExamPartReport = {
  id: string;
  label: string;
  title: string;
  englishTitle: string;
  score: string;
  correct: number;
  wrong: number;
  total: number;
  color: string;
  skills: ExamSkill[];
};

const examPartReports: Record<string, ExamPartReport> = {
  tgat1: {
    id: "TGAT1",
    label: "TGAT1 · 91",
    title: "การสื่อสารภาษาอังกฤษ",
    englishTitle: "English Communication",
    score: "60.7",
    correct: 36,
    wrong: 14,
    total: 60,
    color: "#0878bd",
    skills: [
      { name: "Speaking Skill", total: 30, start: 1, score: "31.7/50", correct: 19, wrong: 11 },
      { name: "Reading Skill", total: 30, start: 31, score: "29/50", correct: 17, wrong: 13 },
    ],
  },
  tgat2: {
    id: "TGAT2",
    label: "TGAT2 · 92",
    title: "การคิดอย่างมีเหตุผล",
    englishTitle: "Critical & Logical Thinking",
    score: "67.4",
    correct: 54,
    wrong: 14,
    total: 80,
    color: "#ff6638",
    skills: [
      { name: "ความสามารถทางภาษา", total: 20, start: 1, score: "15/20", correct: 13, wrong: 7 },
      { name: "ความสามารถทางตัวเลข", total: 20, start: 21, score: "14/20", correct: 14, wrong: 6 },
      { name: "ความสามารถทางมิติสัมพันธ์", total: 20, start: 41, score: "14/20", correct: 14, wrong: 6 },
      { name: "ความสามารถทางเหตุผล", total: 20, start: 61, score: "13/20", correct: 13, wrong: 7 },
    ],
  },
  tgat3: {
    id: "TGAT3",
    label: "TGAT3 · 93",
    title: "สมรรถนะการทำงาน",
    englishTitle: "Future Workforce Competency",
    score: "54.6",
    correct: 41,
    wrong: 19,
    total: 60,
    color: "#416cff",
    skills: [
      { name: "การสร้างคุณค่าและนวัตกรรม", total: 15, start: 1, score: "15.42/25", correct: 9, wrong: 6 },
      { name: "การแก้ไขปัญหาที่ซับซ้อน", total: 15, start: 16, score: "7.50/25", correct: 7, wrong: 8 },
      { name: "การบริหารจัดการอารมณ์", total: 15, start: 31, score: "15/25", correct: 9, wrong: 6 },
      { name: "การเป็นพลเมืองที่มีส่วนร่วมของสังคม", total: 15, start: 46, score: "16.67/25", correct: 10, wrong: 5 },
    ],
  },
};

type StudentInfo = {
  name: string;
  email: string;
  phone: string;
  grade: string;
  school: string;
  province: string;
  citizenId: string;
};

const defaultStudent: StudentInfo = {
  name: "สมชาย ศิริกุล",
  email: "student@studyunith.local",
  phone: "08X-XXX-XXXX",
  grade: "ม.6",
  school: "โรงเรียนตัวอย่างวิทยา",
  province: "ขอนแก่น",
  citizenId: "1-67xx-xxxxx-34-1",
};

function modeToView(mode: StudentMode): StudentView {
  if (mode === "student") return "overview";
  if (mode === "exam") return "exam";
  if (mode === "ranking") return "results";
  if (mode === "profile") return "personal";
  return mode;
}

function readStudent(): StudentInfo {
  try {
    const value = JSON.parse(localStorage.getItem("webb-demo-profile") ?? "{}");
    return {
      ...defaultStudent,
      name:
        [value.firstName, value.lastName].filter(Boolean).join(" ") ||
        value.name ||
        defaultStudent.name,
      email: value.email || defaultStudent.email,
      phone: value.phone || defaultStudent.phone,
      grade: value.education || value.grade || defaultStudent.grade,
      school: value.school || defaultStudent.school,
      province: value.province || defaultStudent.province,
      citizenId: value.citizenId || defaultStudent.citizenId,
    };
  } catch {
    return defaultStudent;
  }
}

function StudentHeader({
  student,
  menuOpen,
  onMenu,
  onClose,
  onSelect,
}: {
  student: StudentInfo;
  menuOpen: boolean;
  onMenu: () => void;
  onClose: () => void;
  onSelect: (view: StudentView) => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    document.body.classList.add("wb-dashboard-menu-open");
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.classList.remove("wb-dashboard-menu-open");
    };
  }, [menuOpen, onClose]);

  return (
    <>
      <header className="wb-header">
        <div className="wb-container wb-header-inner">
          <WebBBrand />
          <nav className="wb-desktop-nav" aria-label="เมนูหลัก">
            {homepageLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="wb-header-actions wb-dashboard-desktop-user">
            <Link className="wb-pill-button wb-pill-yellow" href="/webb/products">ซื้อข้อสอบเพิ่ม</Link>
            <button
              type="button"
              onClick={onMenu}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="เปิดเมนูบัญชีผู้เข้าสอบ"
            >
              <StudentAvatar />
              <span>{student.name}</span>
              <i>{menuOpen ? "⌃" : "⌄"}</i>
            </button>
            <nav
              className={`wb-dashboard-account-dropdown${menuOpen ? " is-open" : ""}`}
              aria-label="เมนูบัญชี"
              aria-hidden={!menuOpen}
            >
              <button
                className="wb-dashboard-account-profile"
                type="button"
                onClick={() => {
                  onSelect("personal");
                  onClose();
                }}
              >
                <StudentAvatar />
                <span>
                  <b>{student.name}</b>
                  <small>
                    {student.grade} · {student.school}
                  </small>
                </span>
                <LuChevronRight aria-hidden="true" />
              </button>
              <button
                className="wb-dashboard-account-action"
                type="button"
                onClick={() => { onClose(); setHelpOpen(true); }}
              >
                <LuHeadset aria-hidden="true" />
                ขอความช่วยเหลือ
              </button>
              <Link
                className="wb-dashboard-account-action"
                href="/webb"
                onClick={() => {
                  localStorage.removeItem("webb-demo-student-auth");
                  window.dispatchEvent(new Event("webb-demo-auth-updated"));
                  onClose();
                }}
              >
                <LuLogOut aria-hidden="true" />
                ออกจากระบบ
              </Link>
            </nav>
          </div>
          <button
            className="wb-dashboard-menu-button wb-menu-toggle"
            type="button"
            aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={menuOpen}
            aria-controls="wb-dashboard-mobile-menu"
            onClick={onMenu}
          >
            {menuOpen ? (
              <span>×</span>
            ) : (
              <i>
                <b />
                <b />
                <b />
              </i>
            )}
          </button>
        </div>
      </header>
      <div className={`wb-dashboard-mobile-menu${menuOpen ? " is-open" : ""}`}>
        <button
          className="wb-dashboard-menu-backdrop"
          type="button"
          aria-label="ปิดเมนู"
          tabIndex={menuOpen ? 0 : -1}
          onClick={onClose}
        />
        <nav
          id="wb-dashboard-mobile-menu"
          className="wb-dashboard-menu-panel"
          aria-label="เมนูผู้เข้าสอบ"
          aria-hidden={!menuOpen}
          inert={!menuOpen}
        >
          <div className="wb-dashboard-mobile-links" aria-label="เมนูหลัก">
            {homepageLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={onClose}>
                {link.label}
              </Link>
            ))}
            <Link href="/webb/products" onClick={onClose}>ซื้อข้อสอบเพิ่ม</Link>
            <Link href="/webb/status" onClick={onClose}>รายการที่ซื้อแล้ว</Link>
          </div>
          <button
            type="button"
            className="wb-dashboard-menu-profile"
            onClick={() => {
              onSelect("personal");
              onClose();
            }}
          >
            <StudentAvatar />
            <span>
              <b>{student.name}</b>
              <small>
                {student.grade} · {student.school}
              </small>
            </span>
            <i>›</i>
          </button>
          <div className="wb-dashboard-menu-section is-secondary">
            <button type="button" onClick={() => { onClose(); setHelpOpen(true); }}>
              <LuHeadset aria-hidden="true" />
              ขอความช่วยเหลือ
            </button>
            <Link
              href="/webb"
              onClick={() => {
                localStorage.removeItem("webb-demo-student-auth");
                window.dispatchEvent(new Event("webb-demo-auth-updated"));
              }}
            >
              <LuLogOut aria-hidden="true" />
              ออกจากระบบ
            </Link>
          </div>
          {/* Logged-in student menu intentionally has no registration action. */}
        </nav>
      </div>
      {helpOpen && <StudentHelpDialog onClose={() => setHelpOpen(false)} />}
    </>
  );
}

function StudentHelpDialog({ onClose }: { onClose: () => void }) {
  const settings = readSocialSettings();
  const links = [
    ["LINE", settings.lineUrl, settings.lineId],
    ["Facebook", settings.facebookUrl, ""],
    ["Instagram", settings.instagramUrl, ""],
    ["TikTok", settings.tiktokUrl, ""],
    ["YouTube", settings.youtubeUrl, ""],
  ].filter(([, href]) => href);
  return <div className="wb-contact-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="wb-contact-dialog" role="dialog" aria-modal="true" aria-labelledby="wb-student-help-title">
      <button type="button" className="wb-contact-close" aria-label="ปิด" onClick={onClose}>×</button>
      <span className="webb-kicker">STUDY UNITH · SUPPORT</span><h2 id="wb-student-help-title">ขอความช่วยเหลือ</h2><p>เลือกช่องทางติดต่อจากการตั้งค่ากลางของระบบ</p>
      <div className="wb-contact-links">{links.map(([label, href, handle]) => <a href={href} key={label} target="_blank" rel="noreferrer"><i>↗</i><span><b>{label}</b>{handle && <small>{handle}</small>}</span><strong>↗</strong></a>)}{settings.supportEmail && <a href={`mailto:${settings.supportEmail}`}><i>✉</i><span><b>อีเมลช่วยเหลือ</b><small>{settings.supportEmail}</small></span><strong>↗</strong></a>}</div>
    </section>
  </div>;
}

function StudentSidebar({
  student,
  onSelect,
}: {
  student: StudentInfo;
  onSelect: (view: StudentView) => void;
}) {
  return (
    <aside className="wb-dashboard-sidebar">
      <section className="wb-dashboard-profile-card">
        <StudentAvatar large />
        <h2>{student.name}</h2>
        <p>
          {student.grade} · {student.school}
        </p>
        <span className="wb-dashboard-location">⌖ {student.province}</span>
        <button type="button" onClick={() => onSelect("personal")}>
          โปรไฟล์ของฉัน
        </button>
      </section>
      <section className="wb-dashboard-enroll-card">
        <h3>ข้อสอบชุดที่สมัครสอบ</h3>
        <button
          type="button"
          className="is-active"
          onClick={() => onSelect("exam")}
        >
          TGAT ความถนัดทั่วไป
        </button>
        <button type="button" onClick={() => onSelect("exam")}>
          TPAT ความถนัดทางวิชาชีพ
        </button>
      </section>
    </aside>
  );
}

function StudentBanner() {
  return (
    <div className="wb-dashboard-banner">
      <Image
        src="/images/webb/student-hero.png"
        width={1654}
        height={423}
        className="wb-dashboard-banner-image"
        alt="เตรียมพร้อมสู่ความสำเร็จด้วยการสอบ TCAS MOCK EXAM"
        priority
      />
    </div>
  );
}

function StudentOverview({
  productId,
  onSelect,
}: {
  productId: string;
  onSelect: (view: StudentView) => void;
}) {
  const product = getProduct(productId);
  return (
    <div className="wb-dashboard-view wb-overview-view">
      <section className="wb-progress-card">
        <div className="wb-progress-ring">
          <b>1/2</b>
          <small>ชุดสอบ</small>
        </div>
        <div className="wb-progress-copy">
          <span>ภาพรวมความคืบหน้า</span>
          <h2>สอบไปแล้ว 1 จาก 2 ที่สมัคร</h2>
          <p>
            สมัครสอบทั้งหมด 2 รายวิชา (2 ชุดข้อสอบ) - เหลืออีก 1 ชุดยังไม่ได้สอบ
            ทำให้ครบเพื่อดูภาพรวมคะแนนของตัวเอง
          </p>
        </div>
        <div className="wb-progress-stats">
          <b>
            2<small>รายวิชาที่สมัคร</small>
          </b>
          <b>
            2<small>ชุดข้อสอบทั้งหมด</small>
          </b>
          <b>
            1<small>สอบเสร็จแล้ว</small>
          </b>
          <b>
            1<small>รอเข้าสอบ</small>
          </b>
        </div>
      </section>
      <section className="wb-dashboard-card wb-upcoming-card">
        <div className="wb-dashboard-card-heading">
          <h2>การสอบที่กำลังจะมาถึง</h2>
        </div>
        <article className="wb-exam-mini-card">
          <div>
            <span className="wb-subject-chip">
              TPAT ความถนัดทางวิชาชีพ · ชุด A
            </span>
            <p>⏱ 180 นาที · 📝 60 ข้อ</p>
          </div>
          <Link
            href={`/webb/rules?product=${product.id}&type=purchased&back=overview`}
          >
            เริ่มสอบ
          </Link>
        </article>
      </section>
      <section className="wb-dashboard-card wb-history-card">
        <h2>ประวัติการเข้าสอบ</h2>
        {[
          ["A-Level คณิตศาสตร์ประยุกต์ 1 · ชุด A", "19 ธ.ค. 68", 82],
          ["ทดลองระบบ", "04 ธ.ค. 69", 78],
        ].map(([title, date, score]) => (
          <article key={String(title)}>
            <div>
              <b>{title}</b>
              <span>· {date}</span>
            </div>
            <i>
              <em style={{ width: `${score}%` }} />
            </i>
            <button onClick={() => onSelect("detail")}>ดูรายละเอียด</button>
          </article>
        ))}
      </section>
      <section className="wb-dashboard-promo">
        <span className="wb-dashboard-promo-icon" aria-hidden="true">
          🛍️
        </span>
        <div className="wb-dashboard-promo-copy">
          <h2>แนะนำชุดข้อสอบเพิ่มเติมบน Shopee</h2>
          <p>รวมแนวข้อสอบอัปเดตล่าสุด พร้อมเฉลยละเอียด สั่งซื้อได้ที่ร้านค้า</p>
        </div>
        <a href="https://shopee.co.th/" target="_blank" rel="noreferrer">
          ซื้อเลยที่ Shopee <LuArrowRight aria-hidden="true" />
        </a>
      </section>
    </div>
  );
}

function ExamRoom({ productId }: { productId: string }) {
  const product = getProduct(productId);
  return (
    <div className="wb-dashboard-view">
      <section className="wb-dashboard-card wb-exam-rules">
        <div>
          <h2>⚠ เงื่อนไขสำคัญก่อนเข้าสอบ</h2>
          <ol>
            <li>เวลาจะเริ่มนับถอยหลังทันทีที่กด “เริ่มทำข้อสอบ”</li>
            <li>ระบบบันทึกคำตอบอัตโนมัติ (Auto-save) ทุกครั้งที่เลือกคำตอบ</li>
            <li>
              หากหลุดออกจากระบบ สามารถเข้ามาทำต่อได้ แต่เวลายังคงเดินต่อเนื่อง
            </li>
            <li>
              ระบบจะแจ้งเตือนเมื่อเหลือ 5 นาที และส่งคำตอบอัตโนมัติเมื่อหมดเวลา
            </li>
          </ol>
        </div>
        <div className="wb-exam-trial">
          <h3>ยังไม่พร้อม? ลองก่อน!</h3>
          <p>ทดลองหน้าจอทำข้อสอบและระบบจับเวลา ฟรี</p>
          <Link href="/webb/rules?product=tgat1&type=trial&back=exam">
            ทดลองระบบสอบ 
          </Link>
        </div>
      </section>
      <section className="wb-dashboard-card wb-exam-table">
        <h2>▤ รายการสอบของคุณ</h2>
        <div className="wb-exam-table-head">
          <span>วิชาที่สอบ</span>
          <span>ชุดข้อสอบ</span>
          <span>เวลาสอบ</span>
          <span>จำนวนข้อ</span>
          <span>สถานะ</span>
          <span />
        </div>
        {["A", "B", "C"].map((set, index) => (
          <article key={set}>
            <div>
              <b>{product.name} ความถนัดทั่วไป</b>
              <small>
                {
                  [
                    "TGAT1 การสื่อสารภาษาอังกฤษ",
                    "TGAT2 การคิดอย่างมีเหตุผล",
                    "TGAT3 สมรรถนะการทำงาน",
                  ][index]
                }
              </small>
            </div>
            <span className="wb-mobile-table-label">{set}</span>
            <span className="wb-mobile-table-label">180 นาที</span>
            <span className="wb-mobile-table-label">60 ข้อ</span>
            <em>ยังไม่ได้สอบ</em>
            <Link
              href={`/webb/rules?product=${product.id}&type=purchased&back=exam`}
            >
              เริ่มสอบ
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}

function ExamResults({ onSelect }: { onSelect: (view: StudentView) => void }) {
  return (
    <div className="wb-dashboard-view">
      <section className="wb-dashboard-card wb-result-summary">
        <div>
          <span className="wb-subject-chip">
            TGAT 90 ความถนัดทั่วไป · ชุด A
          </span>
          <small>สอบเมื่อ: 15 ก.ค. 2569</small>
          <div className="wb-score-pills">
            {seededScores.map((part) => (
              <span key={part.id}>
                <i style={{ background: part.color }} />
                {part.name} · {part.score}/100
              </span>
            ))}
          </div>
        </div>
        <strong>
          60.7<small>/100</small>
        </strong>
        <footer>
          <button onClick={() => window.print()}>
            ↓ ดาวน์โหลดใบวิเคราะห์ (PDF)
          </button>
          <button onClick={() => onSelect("ranking")}>🏆 จัดคะแนนอันดับ</button>
          <button className="is-primary" onClick={() => onSelect("detail")}>
            ดูคะแนนสอบ →
          </button>
        </footer>
      </section>
    </div>
  );
}

function ResultDetails({
  student,
  onSelect,
  onOpenPart,
}: {
  student: StudentInfo;
  onSelect: (view: StudentView) => void;
  onOpenPart: (part: string) => void;
}) {
  return (
    <div className="wb-dashboard-view wb-detail-view">
      <div className="wb-detail-back">
        <button onClick={() => onSelect("results")}>ผลสอบทั้งหมด</button>
        <button onClick={() => window.print()}>
          ↓ ดาวน์โหลดใบวิเคราะห์ (PDF)
        </button>
      </div>
      <section className="wb-detail-exam-head">
        <WebBBrand />
        <h2>TGAT ความถนัดทั่วไป</h2>
        <p>THAI GENERAL APTITUDE TEST · รายการผลการสอบฉบับสมบูรณ์</p>
        <div>
          {[
            ["ชุดข้อสอบ", "A"],
            ["จำนวนข้อสอบ", "200 ข้อ"],
            ["ระยะเวลาสอบ", "180 นาที"],
            ["ประเภทข้อสอบ", "ปรนัย 4-5 ตัวเลือก"],
            ["คะแนน", "100 คะแนน"],
          ].map(([label, value]) => (
            <article key={label}>
              <small>{label}</small>
              <b>{value}</b>
            </article>
          ))}
        </div>
      </section>
      <div className="wb-detail-columns">
        <section className="wb-dashboard-card">
          <h2>ข้อมูลผู้เข้าสอบ</h2>
          <dl>
            <dt>ชื่อ-นามสกุล</dt>
            <dd>{student.name}</dd>
            <dt>เลขบัตรประชาชน</dt>
            <dd>{student.citizenId}</dd>
            <dt>วันที่สอบ</dt>
            <dd>15 ก.ค. 2569</dd>
            <dt>เวลาที่ใช้ทำข้อสอบ</dt>
            <dd>2 ชั่วโมง 41 นาที</dd>
          </dl>
        </section>
        <section className="wb-detail-rank">
          <h2>
            อันดับของคุณ{" "}
            <button onClick={() => onSelect("ranking")}>
              🏆 จัดคะแนนอันดับ →
            </button>
          </h2>
          <div className="wb-detail-score">
            คะแนน <b>60.7/100</b>
          </div>
          <p>
            ลำดับที่ <strong>415</strong>/2709
          </p>
          <small>*คิดจากการสอบครั้งที่ 1 เท่านั้น</small>
        </section>
      </div>
      <section className="wb-dashboard-card wb-total-score">
        <h2>
          TGAT ความถนัดทั่วไป <b>60.7 / 100</b>
        </h2>
        <i>
          <em style={{ width: "60.7%" }} />
        </i>
        <div>
          <span>0</span>
          <span>60.7</span>
          <span>100</span>
        </div>
      </section>
      <div className="wb-score-detail-grid">
        {seededScores.map((part) => (
          <article className="wb-dashboard-card" key={part.id}>
            <h3>
              <i style={{ background: part.color }} />
              {part.name}
              <b>{part.score}/100</b>
            </h3>
            <i className="wb-score-line">
              <em style={{ width: `${part.score}%`, background: part.color }} />
            </i>
            <button
              style={{ background: part.color }}
              onClick={() => onOpenPart(part.id)}
            >
              ดูรายละเอียดรายข้อ →
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function ExamPartDetails({
  partId,
  onBack,
}: {
  partId: string;
  onBack: () => void;
}) {
  const part = examPartReports[partId] ?? examPartReports.tgat1;
  const answerChoices = ["A", "C", "B", "C", "B", "C", "A", "C", "A", "C"];

  return (
    <div className={`wb-dashboard-view wb-detail-view wb-part-report wb-part-${part.id.toLowerCase()}`}>
      <div className="wb-detail-back">
        <button type="button" onClick={onBack}>กลับไปวิเคราะห์รวม</button>
        <button type="button" onClick={() => window.print()}>
          ↓ ดาวน์โหลดใบวิเคราะห์ (PDF)
        </button>
      </div>
      <header className="wb-part-report-header" style={{ background: part.color }}>
        <div>
          <small>{part.label}</small>
          <h1>{part.title} ({part.englishTitle})</h1>
        </div>
        <div className="wb-part-report-total">
          <strong>{part.score}<small>/100</small></strong>
          <span>ถูก {part.correct} · ผิด {part.wrong} · {part.total} ข้อ</span>
        </div>
      </header>

      <div className={`wb-part-skill-grid is-${part.skills.length}-skills`}>
        {part.skills.map((skill, skillIndex) => (
          <details className="wb-part-skill" key={skill.name} open={skillIndex === 0}>
            <summary>
              <span>
                <b>{skill.name}</b>
                <small>
                  {skill.total} ข้อ · {part.id === "TGAT1" ? "50" : part.id === "TGAT3" ? "25" : "20"} คะแนน
                </small>
                <span className="wb-part-skill-meta">
                  <i>☑ ถูก {skill.correct}</i><i>× ผิด {skill.wrong}</i>
                </span>
              </span>
              <strong>{skill.score}</strong>
            </summary>
            <div className="wb-part-skill-content">
              <div className="wb-part-progress"><i style={{ width: `${Math.min(100, (skill.correct / skill.total) * 100)}%`, background: part.color }} /></div>
              <table>
                <thead><tr><th>ข้อ</th><th>คำตอบ</th><th>ผล</th><th>คะแนน</th></tr></thead>
                <tbody>
                  {Array.from({ length: skill.total }, (_, index) => {
                    const correct = ((index * 13) % skill.total) < skill.correct;
                    const answer = answerChoices[(index + skillIndex * 3) % answerChoices.length];
                    return (
                      <tr key={index}>
                        <td>{skill.start + index}</td>
                        <td>{answer}</td>
                        <td className={correct ? "is-correct" : "is-wrong"}>{correct ? "☑" : "×"}</td>
                        <td className={correct ? "is-correct" : "is-wrong"}>{correct ? "1.00" : "0.00"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>

      <section className="wb-dashboard-card wb-part-radar">
        <div>
          <h2>โปรไฟล์ความถนัดโดยรวม (Competency Radar)</h2>
          <p>เทียบสัดส่วน % ของคะแนนแต่ละพาร์ทย่อย</p>
        </div>
        <div className="wb-part-radar-layout">
          <div className="wb-part-radar-chart" aria-label={`กราฟความถนัด ${part.title}`}>
            <svg viewBox="0 0 440 250" role="img" aria-hidden="true">
              <g className="wb-radar-grid">
                <polygon points="220,32 346,125 220,218 94,125" />
                <polygon points="220,60 308,125 220,190 132,125" />
                <polygon points="220,88 270,125 220,162 170,125" />
                <line x1="220" y1="32" x2="220" y2="218" />
                <line x1="94" y1="125" x2="346" y2="125" />
              </g>
              <polygon className="wb-radar-area" points={part.skills.length === 2 ? "220,70 220,175" : "220,76 290,125 220,183 145,125"} style={{ stroke: part.color, fill: `${part.color}22` }} />
              {(part.skills.length === 2 ? [[220, 70], [220, 175]] : [[220, 76], [290, 125], [220, 183], [145, 125]]).map(([x, y], index) => (
                <circle key={index} cx={x} cy={y} r="5" style={{ fill: part.color }} />
              ))}
              <text x="220" y="21" textAnchor="middle">{part.skills[0].name}</text>
              <text x="220" y="243" textAnchor="middle">{part.skills[part.skills.length - 1].name}</text>
            </svg>
          </div>
          <div className="wb-part-radar-summary">
            <h3>เรียงจากพาร์ทที่ทำได้ดีที่สุด → ควรพัฒนา</h3>
            {part.skills.map((skill, index) => (
              <div key={skill.name}>
                <b>{index + 1}. {skill.name}<span>{skill.score}</span></b>
                <i><em style={{ width: `${Math.min(100, (skill.correct / skill.total) * 100)}%`, background: part.color }} /></i>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Ranking({
  student,
  onClose,
}: {
  student: StudentInfo;
  onClose: () => void;
}) {
  const [grade, setGrade] = useState("ทุกระดับชั้น");
  const [province, setProvince] = useState("ทุกจังหวัด");
  const [period, setPeriod] = useState("ทุกช่วงเวลา");
  const [search, setSearch] = useState("");
  const [candidateMode, setCandidateMode] = useState<"actual" | "under" | "over">("actual");
  const [currentUsername, setCurrentUsername] = useState("");
  const [rankRecords, setRankRecords] = useState<{ username: string; email: string; student: string; grade: string; province: string; productId: string; version: string; score: number; submittedAt: number }[]>([]);
  const minimumRank = 100;
  useEffect(() => {
    const refresh = () => {
      try { setRankRecords(JSON.parse(localStorage.getItem("webb-demo-ranking-results") || "[]")); }
      catch { setRankRecords([]); }
      setCurrentUsername(readDemoAccount()?.username || "");
    };
    refresh();
    window.addEventListener("webb-demo-ranking-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("webb-demo-ranking-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const ownResult = rankRecords.find((row) => currentUsername ? row.username.toLowerCase() === currentUsername.toLowerCase() : row.email.toLowerCase() === student.email.toLowerCase());
  const rankingProductId = ownResult?.productId || "tgat1";
  const rankingVersion = ownResult?.version;
  const actualRows = rankRecords.filter((row) => row.productId === rankingProductId && (!rankingVersion || row.version === rankingVersion));
  const candidates = candidateMode === "actual" ? actualRows.length : candidateMode === "under" ? 96 : 124;
  const canFilter = candidates > minimumRank;
  const mockRows = Array.from({ length: candidateMode === "under" ? 96 : 124 }, (_, index) => ({
    username: `sample-${index + 1}`,
    email: `candidate-${index + 1}@example.test`,
    name: `${[`ศิรศักดิ์ ผ.`, `กมลชนก ต.`, `ธนกร ส.`, `ปาริชาติ ว.`, `ณัฐชา ก.`][index % 5]} ${String(index + 1).padStart(3, "0")}`,
    grade: index % 3 === 0 ? "มัธยมศึกษาปีที่ 5" : "มัธยมศึกษาปีที่ 6",
    province: ["ขอนแก่น", "กรุงเทพมหานคร", "เชียงใหม่"][index % 3],
    period: index % 2 === 0 ? "เดือนนี้" : "สัปดาห์นี้",
    score: Math.round((45 + ((index * 37) % 520) / 10) * 10) / 10,
    submittedAt: Date.now() - (index % 25) * 86400000,
  }));
  const ownRankRow = ownResult ? {
    username: ownResult.username, email: ownResult.email, name: ownResult.student, grade: ownResult.grade,
    province: ownResult.province, period: Date.now() - ownResult.submittedAt < 7 * 86400000 ? "สัปดาห์นี้" : "เดือนนี้",
    score: ownResult.score, submittedAt: ownResult.submittedAt,
  } : null;
  const sampleOwnRow = ownRankRow || {
    username: currentUsername || "current-demo-student", email: student.email, name: student.name,
    grade: student.grade.includes("6") ? "มัธยมศึกษาปีที่ 6" : student.grade.includes("5") ? "มัธยมศึกษาปีที่ 5" : "มัธยมศึกษาปีที่ 4",
    province: student.province, period: "เดือนนี้", score: 60.7, submittedAt: Date.now(),
  };
  const rows = candidateMode === "actual" ? actualRows.map((row) => ({ ...row, name: row.student, period: Date.now() - row.submittedAt < 7 * 86400000 ? "สัปดาห์นี้" : "เดือนนี้" })) : [
    ...mockRows.slice(0, Math.max(0, candidates - 1)),
    sampleOwnRow,
  ];
  const ownScore = candidateMode === "actual" ? ownResult?.score : sampleOwnRow.score;
  const ownRank = ownScore === undefined ? null : rows.filter((row) => row.score > ownScore).length + 1;
  const filteredRows = rows.filter((row) => {
    if (!canFilter) return true;
    return (grade === "ทุกระดับชั้น" || row.grade === grade) &&
      (province === "ทุกจังหวัด" || row.province === province) &&
      (period === "ทุกช่วงเวลา" || row.period === period) &&
      row.name.toLowerCase().includes(search.toLowerCase());
  });
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onClose]);
  return (
    <div
      className="wb-ranking-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="wb-ranking-view"
        role="dialog"
        aria-modal="true"
        aria-label="อันดับผู้เข้าสอบ"
      >
        <button
          type="button"
          className="wb-ranking-close"
          onClick={onClose}
          aria-label="ปิดหน้าจัดอันดับ"
        >
          ×
        </button>
        <div className="wb-ranking-brand">
          <WebBBrand />
        </div>
        <h2>{student.name}</h2>
        <p>วิชา TGAT ความถนัดทั่วไป</p>
        <div className="wb-ranking-score"><span>คะแนน</span><b>{ownScore === undefined ? "—" : `${ownScore.toFixed(1)}/100`}</b></div>
        <div className="wb-ranking-place">อันดับของคุณ <strong>{ownRank ?? "—"}</strong>/{candidates}<small>คำนวณจากผู้ส่งข้อสอบสำเร็จในชุดและเวอร์ชันเดียวกัน</small></div>
        <div className="wb-ranking-demo-cases" aria-label="กรณีตัวอย่างจำนวนผู้สอบ">
          <b>ข้อมูล Ranking</b>
          <button type="button" className={candidateMode === "actual" ? "is-active" : ""} onClick={() => setCandidateMode("actual")}>ผลสอบที่ส่งแล้ว · {actualRows.length} คน</button>
          <button type="button" className={candidateMode === "under" ? "is-active" : ""} onClick={() => setCandidateMode("under")}>ตัวอย่าง 96 คน · ยังไม่เกิน 100</button>
          <button type="button" className={candidateMode === "over" ? "is-active" : ""} onClick={() => setCandidateMode("over")}>ตัวอย่าง 124 คน · เกิน 100</button>
        </div>
        {canFilter ? <>
          <h3>กรองและค้นหา Ranking</h3>
          <div className="wb-ranking-filters">
            <label>ระดับชั้น<select value={grade} onChange={(e) => setGrade(e.target.value)}><option>ทุกระดับชั้น</option><option>มัธยมศึกษาปีที่ 4</option><option>มัธยมศึกษาปีที่ 5</option><option>มัธยมศึกษาปีที่ 6</option></select></label>
            <label>จังหวัด<select value={province} onChange={(e) => setProvince(e.target.value)}><option>ทุกจังหวัด</option><option>ขอนแก่น</option><option>กรุงเทพมหานคร</option><option>เชียงใหม่</option></select></label>
            <label>ช่วงเวลา<select value={period} onChange={(e) => setPeriod(e.target.value)}><option>ทุกช่วงเวลา</option><option>เดือนนี้</option><option>สัปดาห์นี้</option></select></label>
          </div>
          <input className="wb-ranking-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาผู้สอบในชุดนี้" aria-label="ค้นหาผู้สอบในชุดนี้" />
          <div className="wb-ranking-sample-list">{[...filteredRows].sort((left, right) => right.score - left.score).map((row, index) => <div key={row.username || row.name}><span>{index + 1}</span><b>{row.name}</b><small>{row.grade} · {row.province}</small><strong>{row.score.toFixed(1)}</strong></div>)}{filteredRows.length === 0 && <p>ไม่พบผู้สอบตามตัวกรองนี้</p>}</div>
        </> : <div className="wb-ranking-locked"><b>ตัวกรองและค้นหาจะเปิดเมื่อเกิน {minimumRank} คน</b><span>{candidateMode === "actual" && candidates === 0 ? "ยังไม่มีผลสอบที่ส่งสำเร็จในชุดและเวอร์ชันนี้" : `ตอนนี้แสดงอันดับเทียบกับผู้สอบทั้งหมด ${candidates} คน`}</span></div>}
      </section>
    </div>
  );
}

function StudentSolutions({
  onAction,
}: {
  onAction: (message: string) => void;
}) {
  const solutions = [
    { id: "tgat1", name: "TGAT1 การสื่อสารภาษาอังกฤษ", duration: "32:10 นาที" },
    { id: "tgat2", name: "TGAT2 การคิดอย่างมีเหตุผล", duration: "28:45 นาที" },
    { id: "tgat3", name: "TGAT3 สมรรถนะการทำงาน", duration: "25:30 นาที" },
  ];
  return (
    <div className="wb-dashboard-view">
      <section className="wb-dashboard-card wb-solutions-view">
        <div className="wb-solutions-head">
          <span className="wb-subject-chip">TGAT 90 ความถนัดทั่วไป · ชุด A</span>
          <button
            className="wb-solutions-download"
            type="button"
            onClick={() => {
              window.print();
              onAction("เปิดหน้าพิมพ์ไฟล์เฉลยตัวอย่างแล้ว");
            }}
          >
            ↓ ดาวน์โหลด PDF
          </button>
        </div>
        <p>อัปเดตเมื่อ: 15 ก.ค. 2568</p>
        <table className="wb-solutions-table">
          <thead>
            <tr><th>ข้อ</th><th>เนื้อหา</th><th aria-label="วิดีโอเฉลย" /></tr>
          </thead>
          <tbody>
            {solutions.map((part, index) => (
              <tr key={part.id}>
                <td>{index + 1}</td>
                <td>
                  <b>{part.name}</b>
                  <small>ความยาว {part.duration}</small>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() =>
                      onAction(`กำลังเปิดวิดีโอเฉลย ${part.id.toUpperCase()} (Demo)`)
                    }
                  >
                    ดูวิดีโอเฉลย <span>▷</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function StudentProfile({
  student,
  onSave,
  onCancel,
  onPasswordSaved,
}: {
  student: StudentInfo;
  onSave: (student: StudentInfo) => void;
  onCancel: () => void;
  onPasswordSaved: () => void;
}) {
  const [personalOpen, setPersonalOpen] = useState(true);
  const [passwordOpen, setPasswordOpen] = useState(true);
  const [visiblePassword, setVisiblePassword] = useState<Record<string, boolean>>({});
  const [passwordError, setPasswordError] = useState("");
  const [firstName, ...lastNameParts] = student.name.split(" ");
  const lastName = lastNameParts.join(" ");

  function savePersonal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    const saved: StudentInfo = {
      ...student,
      name: [data.firstName, data.lastName].filter(Boolean).join(" "),
      citizenId: String(data.citizenId),
      phone: String(data.phone),
      email: String(data.email),
      province: String(data.province),
      school: String(data.school),
      grade: String(data.education),
    };
    localStorage.setItem(
      "webb-demo-profile",
      JSON.stringify({
        ...data,
        name: saved.name,
        education: saved.grade,
      }),
    );
    const account = readDemoAccount();
    if (account) safeWrite(DEMO_ACCOUNT_KEY, {
      ...account,
      citizenId: saved.citizenId,
      firstName: String(data.firstName),
      lastName: String(data.lastName),
      phone: saved.phone,
      email: saved.email,
      province: saved.province,
      school: saved.school,
      education: saved.grade,
    });
    onSave(saved);
  }

  function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const newPassword = String(data.get("newPassword") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");
    if (newPassword !== confirmPassword) {
      setPasswordError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    setPasswordError("");
    event.currentTarget.reset();
    onPasswordSaved();
  }

  function passwordField(name: string, label: string, note?: string) {
    const visible = visiblePassword[name] ?? false;
    return (
      <label className="wb-profile-password-field">
        {label}
        <span>
          <input
            name={name}
            type={visible ? "text" : "password"}
            placeholder={label}
            minLength={name === "currentPassword" ? undefined : 8}
            required
          />
          <button
            type="button"
            aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            onClick={() =>
              setVisiblePassword((current) => ({
                ...current,
                [name]: !visible,
              }))
            }
          >
            {visible ? "◉" : "◉̸"}
          </button>
        </span>
        {note && <small>{note}</small>}
      </label>
    );
  }

  return (
    <div className="wb-personal-profile">
      <form className="wb-dashboard-card wb-profile-form" onSubmit={savePersonal}>
        <button
          type="button"
          className="wb-profile-section-heading"
          aria-expanded={personalOpen}
          onClick={() => setPersonalOpen((open) => !open)}
        >
          <span>ข้อมูลส่วนตัว</span>
          <i aria-hidden="true">{personalOpen ? "⌃" : "⌄"}</i>
        </button>
        {personalOpen && (
          <>
            <div className="wb-profile-fields">
              <label>
                ชื่อผู้ใช้งาน
                <input value={readDemoAccount()?.username ?? student.name} readOnly />
              </label>
              <label>
                บัตรประชาชน
                <input name="citizenId" defaultValue={student.citizenId} readOnly />
              </label>
              <label>
                ชื่อ
                <input name="firstName" defaultValue={firstName} required />
              </label>
              <label>
                นามสกุล
                <input name="lastName" defaultValue={lastName} required />
              </label>
              <label>
                เบอร์โทรศัพท์
                <input name="phone" type="tel" defaultValue={student.phone} required />
              </label>
              <label>
                อีเมล
                <input name="email" type="email" defaultValue={student.email} required />
              </label>
              <label>
                จังหวัด
                <select name="province" defaultValue={student.province}>
                  {[student.province, "กรุงเทพมหานคร", "ขอนแก่น", "เชียงใหม่"].filter((value, index, all) => all.indexOf(value) === index).map((province) => (
                    <option key={province}>{province}</option>
                  ))}
                </select>
              </label>
              <label>
                โรงเรียน
                <select name="school" defaultValue={student.school}>
                  <option>{student.school}</option>
                  <option>โรงเรียนตัวอย่างวิทยา</option>
                  <option>โรงเรียนเตรียมอุดมศึกษา</option>
                </select>
              </label>
              <label>
                ระดับการศึกษา
                <select name="education" defaultValue={student.grade}>
                  {["ม.4", "ม.5", "ม.6", "เทียบเท่า"].map((grade) => (
                    <option key={grade}>{grade}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="wb-profile-form-actions">
              <button type="button" className="wb-profile-cancel" onClick={onCancel}>ยกเลิก</button>
              <button type="submit" className="wb-profile-save">บันทึกแก้ไข</button>
            </div>
          </>
        )}
      </form>

      <form className="wb-dashboard-card wb-profile-password" onSubmit={savePassword}>
        <button
          type="button"
          className="wb-profile-section-heading"
          aria-expanded={passwordOpen}
          onClick={() => setPasswordOpen((open) => !open)}
        >
          <span>เปลี่ยนรหัสผ่าน</span>
          <i aria-hidden="true">{passwordOpen ? "⌃" : "⌄"}</i>
        </button>
        {passwordOpen && (
          <>
            <p>เพิ่มความปลอดภัยให้บัญชีของคุณด้วยการเปลี่ยนรหัสผ่านอยู่เสมอ</p>
            <div className="wb-profile-password-fields">
              {passwordField("currentPassword", "รหัสผ่านปัจจุบัน")}
              {passwordField(
                "newPassword",
                "รหัสผ่านใหม่",
                "รหัสผ่านใหม่ (อักขระ 8-20 ตัว รวมทั้งตัวเลขอย่างน้อย 1 ตัว, ตัวอักษร 1 ตัว และสัญลักษณ์พิเศษ 1 ตัว)",
              )}
              {passwordField("confirmPassword", "ยืนยันรหัสผ่าน")}
            </div>
            {passwordError && <p className="wb-profile-error" role="alert">{passwordError}</p>}
            <div className="wb-profile-form-actions">
              <button type="button" className="wb-profile-cancel" onClick={onCancel}>ยกเลิก</button>
              <button type="submit" className="wb-profile-save">บันทึกแก้ไข</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

export default function WebBStudentArea({ mode }: { mode: StudentMode }) {
  const [activeView, setActiveView] = useState<StudentView>(modeToView(mode));
  const [student, setStudent] = useState(defaultStudent);
  const [productId, setProductId] = useState("tgat-full");
  const [selectedPart, setSelectedPart] = useState("tgat1");
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(mode === "ranking");
  const [rankingReturnView, setRankingReturnView] =
    useState<StudentView>("results");

  useEffect(() => {
    setStudent(readStudent());
    try {
      const saved = localStorage.getItem("webb-demo-order");
      if (saved) setProductId(JSON.parse(saved).product ?? "tgat-full");
    } catch {
      /* Keep the seeded Demo information. */
    }
    const queryView = new URLSearchParams(window.location.search).get(
      "view",
    ) as StudentView | null;
    if (queryView === "ranking") {
      setActiveView("results");
      setRankingOpen(true);
    } else if (queryView === "profile") {
      setActiveView("personal");
    } else if (
      queryView &&
      [
        "overview",
        "exam",
        "results",
        "solutions",
        "detail",
        "subresults",
        "personal",
      ].includes(queryView)
    ) {
      setActiveView(queryView);
      setSelectedPart(
        new URLSearchParams(window.location.search).get("part") ?? "tgat1",
      );
    }
  }, []);

  function selectView(view: StudentView) {
    if (view === "ranking") {
      setRankingReturnView(activeView === "ranking" ? "results" : activeView);
      setRankingOpen(true);
      window.history.replaceState(null, "", "/webb/student?view=ranking");
      return;
    }
    setActiveView(view);
    setNotice("");
    window.history.replaceState(null, "", `/webb/student?view=${view}`);
  }

  function selectPart(part: string) {
    setSelectedPart(part);
    setActiveView("subresults");
    window.history.replaceState(
      null,
      "",
      `/webb/student?view=subresults&part=${part}`,
    );
  }

  const activeTab =
    activeView === "detail" || activeView === "subresults"
      ? "results"
      : activeView === "personal"
        ? "profile"
      : activeView;

  return (
    <div
      className={`webb-site wb-shell wb-dashboard${activeView === "detail" || activeView === "subresults" ? " is-detail-view" : ""}`}
    >
      <StudentHeader
        student={student}
        menuOpen={menuOpen}
        onMenu={() => setMenuOpen((open) => !open)}
        onClose={() => setMenuOpen(false)}
        onSelect={selectView}
      />
      <div className="wb-dashboard-profilebar">
        <div className="wb-dashboard-container">
          <button onClick={() => selectView("personal")}>
            <StudentAvatar />
            <span>
              <b>{student.name}</b>
              <small>
                {student.grade} · {student.school}
                <br />⌖ {student.province}
              </small>
            </span>
            <i>›</i>
          </button>
        </div>
      </div>
      <main className="wb-dashboard-container wb-dashboard-layout">
        <StudentSidebar student={student} onSelect={selectView} />
        <section className="wb-dashboard-main">
          <nav className="wb-dashboard-tabs" aria-label="ส่วนผู้เข้าสอบ">
            {views.map((view) => (
              <button
                type="button"
                key={view.id}
                className={activeTab === view.id ? "is-active" : ""}
                aria-current={activeTab === view.id ? "page" : undefined}
                onClick={() => selectView(view.id === "profile" ? "personal" : view.id)}
              >
                {view.label}
              </button>
            ))}
          </nav>
          <StudentBanner />
          {activeView === "overview" ? (
            <StudentOverview productId={productId} onSelect={selectView} />
          ) : activeView === "exam" ? (
            <ExamRoom productId={productId} />
          ) : activeView === "results" ? (
            <ExamResults onSelect={selectView} />
          ) : activeView === "subresults" ? (
            <ExamPartDetails
              partId={selectedPart}
              onBack={() => selectView("detail")}
            />
          ) : activeView === "detail" || activeView === "profile" ? (
            <ResultDetails
              student={student}
              onSelect={selectView}
              onOpenPart={selectPart}
            />
          ) : activeView === "personal" ? (
            <StudentProfile
              student={student}
              onSave={(saved) => {
                setStudent(saved);
                setNotice("บันทึกข้อมูลส่วนตัวแล้ว");
              }}
              onCancel={() => selectView("overview")}
              onPasswordSaved={() => setNotice("บันทึกรหัสผ่านแล้ว (Demo)")}
            />
          ) : activeView === "solutions" ? (
            <StudentSolutions onAction={setNotice} />
          ) : activeView === "ranking" ? (
            <ExamResults onSelect={selectView} />
          ) : null}
          {notice && (
            <p className="wb-dashboard-notice" role="status">
              {notice}
            </p>
          )}
        </section>
      </main>
      <PublicFooter />
      {rankingOpen && (
        <Ranking
          student={student}
          onClose={() => {
            setRankingOpen(false);
            setActiveView(rankingReturnView);
            window.history.replaceState(
              null,
              "",
              `/webb/student?view=${rankingReturnView}`,
            );
          }}
        />
      )}
    </div>
  );
}
