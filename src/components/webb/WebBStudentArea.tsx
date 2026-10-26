"use client";

import Link from "next/link";
import Image from "next/image";
import {
  LuArrowLeft,
  LuArrowRight,
  LuCamera,
  LuCheck,
  LuChevronDown,
  LuChevronRight,
  LuChevronUp,
  LuClock,
  LuDownload,
  LuEye,
  LuEyeOff,
  LuFileText,
  LuHeadset,
  LuLogOut,
  LuMapPin,
  LuMaximize2,
  LuPause,
  LuPlay,
  LuRotateCcw,
  LuUpload,
  LuVolume2,
  LuX,
} from "react-icons/lu";
import { useEffect, useState, useRef, type FormEvent } from "react";
import { FaFacebookF, FaInstagram, FaLine, FaTiktok, FaYoutube } from "react-icons/fa6";
import Select from "react-select";
import { QRCodeSVG } from "qrcode.react";
import { PublicFooter, WebBBrand } from "./PublicShell";
import { getProduct } from "./data";
import { WebBImage } from "./WebBImage";
import WebBFullAnalysisPdfReport from "./WebBFullAnalysisPdfReport";
import {
  areDemoResultsPublished,
  setDemoResultsPublished,
  DEMO_ACCOUNT_KEY,
  DEMO_AUTH_KEY,
  DEMO_RANKINGS_KEY,
  examAnswersStorageKey,
  examResultStorageKey,
  readCurrentDemoPurchases,
  readDemoAccount,
  readSocialSettings,
  isDemoStudentSuspended,
  isDemoSolutionPublished,
  productsOverlap,
  safeRead,
  safeWrite,
  setPurchaseExamStatus,
} from "./demo-store";
import { adminMockKey, WEBB_ADMIN_MOCK_UPDATED } from "./webb-admin-mock-store";
import { getExamPlan } from "./exam-documents";
import { confirmWebBAction } from "./confirm";
import WebBProvinceSelect, {
  WEBB_PROVINCES,
  WEBB_SELECT_STYLES,
} from "./WebBProvinceSelect";

const WEBB_SOLUTION_UPDATED_AT = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date("2025-07-15T12:00:00+07:00"));

type StudentMode =
  | "student"
  | "overview"
  | "profile"
  | "personal"
  | "solutions"
  | "results"
  | "ranking"
  | "exam"
  | "detail"
  | "subresults";
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

const educationOptions = [
  "มัธยมศึกษาปีที่ 4",
  "มัธยมศึกษาปีที่ 5",
  "มัธยมศึกษาปีที่ 6",
  "มัธยมศึกษาตอนต้น",
  "เด็กซิ่ว",
  "อื่นๆ (ผู้ปกครอง, คุณครู)",
];

function normalizeEducation(value: string) {
  if (educationOptions.includes(value)) return value;
  if (value.includes("6")) return educationOptions[2];
  if (value.includes("5")) return educationOptions[1];
  if (value.includes("4")) return educationOptions[0];
  if (value.includes("ต้น")) return educationOptions[3];
  return educationOptions[5];
}

const views: { id: StudentView; label: string }[] = [
  { id: "overview", label: "ภาพรวม" },
  { id: "exam", label: "ห้องสอบ" },
  { id: "results", label: "ผลสอบ" },
  { id: "solutions", label: "เฉลย" },
  { id: "personal", label: "ข้อมูลผู้เข้าสอบ" },
];

const homepageLinks = [
  { label: "ทำไมต้องสอบกับเรา", href: "/webb?student=1#why" },
  { label: "วิชาที่เปิดสอบ", href: "/webb?student=1#subjects" },
  { label: "คู่มือการสอบ", href: "/webb?student=1#guide" },
  { label: "ขั้นตอนการสมัคร", href: "/webb?student=1#steps" },
];

function StudentAvatar({
  large = false,
  withCamera = false,
  avatarUrl,
  onCameraClick,
}: {
  large?: boolean;
  withCamera?: boolean;
  avatarUrl?: string;
  onCameraClick?: () => void;
}) {
  return (
    <span
      className={`wb-dashboard-avatar wb-dashboard-avatar-photo${large ? " wb-dashboard-profile-avatar" : ""}`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="ภาพโปรไฟล์นักเรียน"
          className="wb-dashboard-avatar-image"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "50%",
          }}
        />
      ) : (
        <WebBImage
          className="wb-dashboard-avatar-image"
          alt="ภาพตัวอย่างนักเรียน"
        />
      )}
      {withCamera && (
        <button
          type="button"
          className="wb-avatar-camera-btn"
          aria-label="เปลี่ยนรูปโปรไฟล์"
          title="เปลี่ยนรูปโปรไฟล์"
          onClick={(e) => {
            e.stopPropagation();
            onCameraClick?.();
          }}
        >
          <LuCamera aria-hidden="true" />
        </button>
      )}
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
  correctText?: string;
  wrongText?: string;
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

export const examPartReports: Record<string, ExamPartReport> = {
  tgat1: {
    id: "TGAT1",
    label: "TGAT1 · 91",
    title: "การสื่อสารภาษาอังกฤษ",
    englishTitle: "English Communication",
    score: "60.7",
    correct: 36,
    wrong: 14,
    total: 60,
    color: "#006ab5",
    skills: [
      {
        name: "Speaking Skill",
        total: 30,
        start: 1,
        score: "31.7/50",
        correct: 19,
        wrong: 11,
      },
      {
        name: "Reading Skill",
        total: 30,
        start: 1,
        score: "29/50",
        correct: 17,
        wrong: 13,
      },
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
      {
        name: "ความสามารถทางภาษา",
        total: 20,
        start: 1,
        score: "15/20",
        correct: 13,
        wrong: 7,
      },
      {
        name: "ความสามารถทางตัวเลข",
        total: 20,
        start: 21,
        score: "14/20",
        correct: 14,
        wrong: 6,
      },
      {
        name: "ความสามารถทางมิติสัมพันธ์",
        total: 20,
        start: 41,
        score: "14/20",
        correct: 14,
        wrong: 6,
      },
      {
        name: "ความสามารถทางเหตุผล",
        total: 20,
        start: 61,
        score: "13/20",
        correct: 13,
        wrong: 7,
      },
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
    color: "#3b66ff",
    skills: [
      {
        name: "การสร้างคุณค่าและนวัตกรรม",
        total: 15,
        start: 1,
        score: "15.42/25",
        correct: 9.25,
        wrong: 9.58,
        correctText: "9.25",
        wrongText: "9.58",
      },
      {
        name: "การแก้ไขปัญหาที่ซับซ้อน",
        total: 15,
        start: 16,
        score: "7.50/25",
        correct: 4.5,
        wrong: 10.5,
        correctText: "4.5",
        wrongText: "10.5",
      },
      {
        name: "การบริหารจัดการอารมณ์",
        total: 15,
        start: 31,
        score: "15/25",
        correct: 9,
        wrong: 6,
        correctText: "9",
        wrongText: "6",
      },
      {
        name: "การเป็นพลเมืองที่มีส่วนร่วมของสังคม",
        total: 15,
        start: 46,
        score: "16.67/25",
        correct: 10,
        wrong: 5,
        correctText: "10",
        wrongText: "5",
      },
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
  avatarUrl?: string;
};

const defaultStudent: StudentInfo = {
  name: "สมชาย ศิริกุล",
  email: "student@studyunith.local",
  phone: "08X-XXX-XXXX",
  grade: "ม.6",
  school: "โรงเรียนตัวอย่างวิทยา",
  province: "ขอนแก่น",
  citizenId: "1-67**-*****-34-1",
};

export function maskCitizenId(id?: string): string {
  if (!id) return "1-67**-*****-34-1";
  const raw = id.trim();
  const withAsterisks = raw.replace(/[xX]/g, "*");
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 13) {
    return `${digits[0]}-${digits.slice(1, 3)}**-*****-${digits.slice(10, 12)}-${digits[12]}`;
  }
  if (/^\d-\d{2}[*\d]{2}-[*\d]{5}-\d{2}-\d$/.test(withAsterisks)) {
    return withAsterisks.replace(
      /^(\d-\d{2})[*\d]{2}-[*\d]{5}(-\d{2}-\d)$/,
      "$1**-*****$2",
    );
  }
  if (withAsterisks.includes("-")) {
    const parts = withAsterisks.split("-");
    if (parts.length === 5) {
      const p1 =
        parts[1].length >= 2 ? `${parts[1].slice(0, 2)}**` : `${parts[1]}**`;
      return `${parts[0]}-${p1}-*****-${parts[3]}-${parts[4]}`;
    }
  }
  return withAsterisks.length > 5 ? withAsterisks : "1-67**-*****-34-1";
}

function modeToView(mode: StudentMode): StudentView {
  if (mode === "student" || mode === "overview") return "overview";
  if (mode === "exam") return "exam";
  if (mode === "ranking") return "results";
  if (mode === "profile" || mode === "personal") return "personal";
  if (mode === "subresults") return "subresults";
  return mode;
}

function readStudent(): StudentInfo {
  try {
    const value = JSON.parse(localStorage.getItem("webb-demo-profile") ?? "{}");
    const customAvatar =
      localStorage.getItem("webb-demo-avatar") || value.avatarUrl || "";
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
      avatarUrl: customAvatar || undefined,
    };
  } catch {
    return defaultStudent;
  }
}

type EnrolledExam = {
  subjectId: string;
  productId: string;
  title: string;
  detail: string;
  set: string;
  duration: string;
  questions: string;
  status: "available" | "in-progress" | "submitted" | "interrupted";
  purchaseRef?: string;
};

const examSubjects: Record<
  string,
  { productId: string; title: string; detail: string }
> = {
  tgat: {
    productId: "tgat-full",
    title: "TGAT ความถนัดทั่วไป",
    detail:
      "TGAT1 การสื่อสารภาษาอังกฤษ · TGAT2 การคิดอย่างมีเหตุผล · TGAT3 สมรรถนะการทำงาน",
  },
  "tgat-full": {
    productId: "tgat-full",
    title: "TGAT ความถนัดทั่วไป",
    detail:
      "TGAT1 การสื่อสารภาษาอังกฤษ · TGAT2 การคิดอย่างมีเหตุผล · TGAT3 สมรรถนะการทำงาน",
  },
  tgat1: {
    productId: "tgat1",
    title: "TGAT1 การสื่อสารภาษาอังกฤษ",
    detail: "การสื่อสารภาษาอังกฤษ",
  },
  tgat2: {
    productId: "tgat2",
    title: "TGAT2 การคิดอย่างมีเหตุผล",
    detail: "การคิดอย่างมีเหตุผล",
  },
  tgat3: {
    productId: "tgat3",
    title: "TGAT3 สมรรถนะการทำงาน",
    detail: "สมรรถนะการทำงาน",
  },
  tgat23: {
    productId: "tgat23",
    title: "TGAT2 + TGAT3",
    detail: "การคิดอย่างมีเหตุผล · สมรรถนะการทำงาน",
  },
  tpat1: {
    productId: "tpat1",
    title: "TPAT1 ความถนัดแพทย์",
    detail: "ความถนัดแพทย์",
  },
  tpat2: {
    productId: "tpat2",
    title: "TPAT2 ความถนัดศิลปกรรมศาสตร์",
    detail: "ความถนัดทางศิลปกรรม",
  },
  tpat3: {
    productId: "tpat3",
    title: "TPAT3 ความถนัดด้านวิทยาศาสตร์ เทคโนโลยี และวิศวกรรมศาสตร์",
    detail: "วิทยาศาสตร์ เทคโนโลยี และวิศวกรรมศาสตร์",
  },
  tpat4: {
    productId: "tpat4",
    title: "TPAT4 ความถนัดทางสถาปัตยกรรมศาสตร์",
    detail: "ความถนัดทางสถาปัตยกรรมศาสตร์",
  },
};

function readEnrolledExams(): EnrolledExam[] {
  try {
    return readCurrentDemoPurchases().flatMap((purchase) => {
      const subjectId =
        purchase.productId === "tgat" ? "tgat-full" : purchase.productId;
      const config = examSubjects[subjectId];
      if (!config) return [];
      const set = purchase.examSet || "A";
      const plan = getExamPlan(config.productId, set);
      let savedAttempt = localStorage.getItem(
        examResultStorageKey(config.productId, "purchased", undefined, set),
      );
      if (!savedAttempt) {
        const legacyKey = examResultStorageKey(config.productId, "purchased");
        savedAttempt = localStorage.getItem(legacyKey);
        if (savedAttempt)
          localStorage.setItem(
            examResultStorageKey(config.productId, "purchased", undefined, set),
            savedAttempt,
          );
      }
      const savedStatus = savedAttempt
        ? (JSON.parse(savedAttempt) as { status?: EnrolledExam["status"] })
            .status
        : undefined;
      return [
        {
          subjectId,
          ...config,
          set,
          duration: plan.hasSuppliedExam ? `${plan.durationMinutes} นาที` : "—",
          questions: plan.hasSuppliedExam ? `${plan.questionCount} ข้อ` : "—",
          status: savedStatus || purchase.examStatus || "available",
          purchaseRef: purchase.ref,
        },
      ];
    });
  } catch {
    return [];
  }
}

function useEnrolledExams() {
  const [items, setItems] = useState<EnrolledExam[]>([]);
  useEffect(() => {
    const refresh = () => setItems(readEnrolledExams());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("webb-demo-purchases-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("webb-demo-purchases-updated", refresh);
    };
  }, []);
  return items;
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
  function handleLogout() {
    localStorage.removeItem(DEMO_AUTH_KEY);
    window.dispatchEvent(new Event("webb-demo-auth-updated"));
    onClose();
  }
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
          <WebBBrand onClick={() => onSelect("overview")} />
          <nav className="wb-desktop-nav" aria-label="เมนูหลัก">
            {homepageLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="wb-header-actions wb-dashboard-desktop-user">
            <Link
              className="wb-pill-button wb-pill-yellow"
              href="/webb/products"
            >
              สมัครสอบ
            </Link>
            <button
              type="button"
              onClick={onMenu}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="เปิดเมนูบัญชีผู้เข้าสอบ"
            >
              <StudentAvatar avatarUrl={student.avatarUrl} />
              <span>{student.name}</span>
              <i>
                {menuOpen ? (
                  <LuChevronUp aria-hidden="true" />
                ) : (
                  <LuChevronDown aria-hidden="true" />
                )}
              </i>
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
                <StudentAvatar avatarUrl={student.avatarUrl} />
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
                onClick={() => {
                  onClose();
                  setHelpOpen(true);
                }}
              >
                <LuHeadset aria-hidden="true" />
                ขอความช่วยเหลือ
              </button>
              <Link
                className="wb-dashboard-account-action"
                href="/webb"
                onClick={handleLogout}
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
              <LuX aria-hidden="true" className="size-5" />
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
          </div>
          <button
            type="button"
            className="wb-dashboard-menu-profile"
            onClick={() => {
              onSelect("personal");
              onClose();
            }}
          >
            <StudentAvatar avatarUrl={student.avatarUrl} />
            <span>
              <b>{student.name}</b>
              <small>
                {student.grade} · {student.school}
              </small>
            </span>
            <i>
              <LuChevronRight aria-hidden="true" />
            </i>
          </button>
          <div className="wb-dashboard-menu-section is-secondary">
            <button
              type="button"
              onClick={() => {
                onClose();
                setHelpOpen(true);
              }}
            >
              <LuHeadset aria-hidden="true" />
              ขอความช่วยเหลือ
            </button>
            <Link href="/webb" onClick={handleLogout}>
              <LuLogOut aria-hidden="true" />
              ออกจากระบบ
            </Link>
            <Link
              className="wb-dashboard-mobile-register"
              href="/webb/products"
              onClick={onClose}
            >
              สมัครสอบ
            </Link>
          </div>
        </nav>
      </div>
      {helpOpen && <StudentHelpDialog onClose={() => setHelpOpen(false)} />}
    </>
  );
}

function StudentHelpDialog({ onClose }: { onClose: () => void }) {
  const settings = readSocialSettings();
  const links = [
    ["", settings.lineUrl, settings.lineId],
    ["", settings.facebookUrl, ""],
    ["", settings.instagramUrl, ""],
    ["", settings.tiktokUrl, ""],
    ["", settings.youtubeUrl, ""],
  ].filter(([, href]) => href);
  return (
    <div
      className="wb-contact-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="wb-contact-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wb-student-help-title"
      >
        <button
          type="button"
          className="wb-contact-close"
          aria-label="ปิด"
          onClick={onClose}
        >
          <LuX aria-hidden="true" className="size-5" />
        </button>
        <span className="webb-kicker">STUDY UNITH · SUPPORT</span>
        <h2 id="wb-student-help-title">ขอความช่วยเหลือ</h2>
        <p>เลือกช่องทางติดต่อจากการตั้งค่ากลางของระบบ</p>
        <div className="wb-contact-links">
          {links.map(([label, href, handle]) => (
            <a href={href} key={label} target="_blank" rel="noreferrer">
              <i>↗</i>
              <span>
                <b>{label}</b>
                {handle && <small>{handle}</small>}
              </span>
              <strong>↗</strong>
            </a>
          ))}
          {settings.supportEmail && (
            <a href={`mailto:${settings.supportEmail}`}>
              <i>✉</i>
              <span>
                <b>อีเมลช่วยเหลือ</b>
                <small>{settings.supportEmail}</small>
              </span>
              <strong>↗</strong>
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

function StudentSidebar({
  student,
  onSelect,
  onOpenAvatarModal,
}: {
  student: StudentInfo;
  onSelect: (view: StudentView) => void;
  onOpenAvatarModal?: () => void;
}) {
  const enrolledExams = useEnrolledExams();
  const enrolledSubjects = [
    ...new Map(enrolledExams.map((item) => [item.subjectId, item])).values(),
  ];
  return (
    <aside className="wb-dashboard-sidebar">
      <section className="wb-dashboard-profile-card">
        <StudentAvatar
          large
          withCamera
          avatarUrl={student.avatarUrl}
          onCameraClick={onOpenAvatarModal}
        />
        <h2>{student.name}</h2>
        <p>
          {student.grade} · {student.school}
        </p>
        <span className="wb-dashboard-location">
          <LuMapPin className="wb-location-icon" aria-hidden="true" />{" "}
          {student.province}
        </span>
        <button type="button" onClick={() => onSelect("personal")}>
          ข้อมูลผู้เข้าสอบ
        </button>
      </section>
      <section className="wb-dashboard-enroll-card">
        <h3>ข้อสอบชุดที่สมัครสอบ</h3>
        {enrolledSubjects.length ? (
          enrolledSubjects.map((item, index) => (
            <button
              type="button"
              className={index === 0 ? "is-active" : ""}
              key={item.subjectId}
              onClick={() => onSelect("exam")}
            >
              {item.title}
            </button>
          ))
        ) : (
          <p>ยังไม่มีชุดข้อสอบที่สมัคร</p>
        )}
      </section>
    </aside>
  );
}

function MobileEnrollCard({
  onSelect,
}: {
  onSelect: (view: StudentView) => void;
}) {
  const enrolledExams = useEnrolledExams();
  const enrolledSubjects = [
    ...new Map(enrolledExams.map((item) => [item.subjectId, item])).values(),
  ];
  const [isOpen, setIsOpen] = useState(false);
  return (
    <section className="wb-dashboard-card wb-mobile-enroll-card">
      <button
        type="button"
        className="wb-mobile-enroll-toggle"
        aria-expanded={isOpen}
        aria-controls="wb-mobile-enroll-pills"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>ข้อสอบชุดที่สมัครสอบ</span>
        {isOpen ? (
          <LuChevronUp aria-hidden="true" />
        ) : (
          <LuChevronDown aria-hidden="true" />
        )}
      </button>
      <div
        className="wb-mobile-enroll-pills"
        id="wb-mobile-enroll-pills"
        hidden={!isOpen}
      >
        {enrolledSubjects.length ? (
          enrolledSubjects.map((item, index) => (
            <button
              type="button"
              className={index === 0 ? "is-active" : ""}
              key={item.subjectId}
              onClick={() => onSelect("exam")}
            >
              {item.title}
            </button>
          ))
        ) : (
          <p>ยังไม่มีชุดข้อสอบที่สมัคร</p>
        )}
      </div>
    </section>
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
  onSelect,
}: {
  onSelect: (view: StudentView) => void;
}) {
  const examItems = useEnrolledExams();
  const completed = examItems.filter(
    (item) => item.status === "submitted",
  ).length;
  const upcoming = examItems.find(
    (item) => item.status === "available" || item.status === "in-progress",
  );
  const enrolledSubjectCount = new Set(examItems.map((item) => item.subjectId))
    .size;
  const history = examItems.filter((item) => item.status === "submitted");
  return (
    <div className="wb-dashboard-view wb-overview-view">
      <section className="wb-progress-card">
        <div className="wb-progress-ring">
          <b>
            {completed}/{examItems.length}
          </b>
          <small>ชุดสอบ</small>
        </div>
        <div className="wb-progress-copy">
          <span>ภาพรวมความคืบหน้า</span>
          <h2>
            สอบไปแล้ว {completed} จาก {examItems.length} ชุดที่สมัคร
          </h2>
          <p>
            {examItems.length
              ? `สมัครสอบทั้งหมด ${enrolledSubjectCount} รายวิชา (${examItems.length} ชุดข้อสอบ) · เหลืออีก ${examItems.length - completed} ชุดที่ยังไม่เสร็จ`
              : "ยังไม่มีรายการสมัครสอบ เมื่อเลือกซื้อข้อสอบแล้ว รายการและความคืบหน้าจะแสดงที่นี่"}
          </p>
        </div>
        <div className="wb-progress-stats">
          <b>
            {enrolledSubjectCount}
            <small>รายวิชาที่สมัคร</small>
          </b>
          <b>
            {examItems.length}
            <small>ชุดข้อสอบทั้งหมด</small>
          </b>
          <b>
            {completed}
            <small>สอบเสร็จแล้ว</small>
          </b>
          <b>
            {examItems.filter((item) => item.status === "available").length}
            <small>รอเข้าสอบ</small>
          </b>
        </div>
      </section>
      <section className="wb-dashboard-card wb-upcoming-card">
        <div className="wb-dashboard-card-heading">
          <h2>การสอบที่กำลังจะมาถึง</h2>
        </div>
        {upcoming ? (
          <article className="wb-exam-mini-card">
            <div>
              <span className="wb-subject-chip">
                {upcoming.title} · ชุด {upcoming.set}
              </span>
              <p>
                ⏱ {upcoming.duration} · 📝 {upcoming.questions}
              </p>
            </div>
            {getExamPlan(upcoming.productId, upcoming.set).hasSuppliedExam ? (
              <Link
                href={`/webb/rules?product=${upcoming.productId}&set=${upcoming.set}&ref=${encodeURIComponent(upcoming.purchaseRef || "")}&type=purchased&back=overview`}
              >
                {upcoming.status === "in-progress" ? "ทำข้อสอบต่อ" : "เริ่มสอบ"}
              </Link>
            ) : (
              <span className="wb-exam-unavailable-label">
                ไฟล์ข้อสอบยังไม่พร้อม
              </span>
            )}
          </article>
        ) : (
          <p className="wb-empty-state">
            {examItems.length
              ? "สมัครครบทุกชุดแล้ว"
              : "ยังไม่มีรายการสอบที่กำลังจะมาถึง"}
          </p>
        )}
      </section>
      <section className="wb-dashboard-card wb-history-card">
        <h2>ประวัติการเข้าสอบ</h2>
        {history.length ? (
          history.map((item) => (
            <article key={item.purchaseRef || `${item.subjectId}-${item.set}`}>
              <div>
                <b>
                  {item.title} · ชุด {item.set}
                </b>
                <span>· สอบเสร็จแล้ว</span>
              </div>
              <i>
                <em style={{ width: "100%" }} />
              </i>
              <button onClick={() => onSelect("results")}>ดูผลสอบ</button>
            </article>
          ))
        ) : (
          <p className="wb-empty-state">ยังไม่มีประวัติการสอบที่เสร็จสมบูรณ์</p>
        )}
      </section>
      <section className="wb-dashboard-promo">
        <div className="wb-dashboard-promo-left">
          <span className="wb-dashboard-promo-icon" aria-hidden="true">
            🛍️
          </span>
          <div className="wb-dashboard-promo-copy">
            <h2>แนะนำชุดข้อสอบเพิ่มเติม บน Shopee</h2>
            <p>
              รวมแนวข้อสอบอัปเดตล่าสุด พร้อมเฉลยละเอียด สั่งซื้อได้ที่ร้านค้า
            </p>
          </div>
        </div>
        <a
          href="https://shopee.co.th/"
          target="_blank"
          rel="noreferrer"
          className="wb-dashboard-promo-btn"
        >
          <span>ซื้อเลยที่ Shopee</span>
          {/* <LuArrowRight aria-hidden="true" /> */}
        </a>
      </section>
    </div>
  );
}

function ExamRoom() {
  const [rulesOpen, setRulesOpen] = useState(true);
  const examItems = useEnrolledExams();

  async function resetExam(item: EnrolledExam) {
    const confirmed = await confirmWebBAction({
      title: "เริ่มสอบชุดนี้ใหม่หรือไม่",
      text: `${item.title} ชุด ${item.set} · คำตอบเดิมจะถูกลบ`,
      confirmText: "เริ่มสอบใหม่",
    });
    if (!confirmed) return;
    try {
      localStorage.removeItem(
        examResultStorageKey(item.productId, "purchased", undefined, item.set),
      );
      localStorage.removeItem(
        examAnswersStorageKey(item.productId, "purchased", undefined, item.set),
      );
      localStorage.removeItem(
        `webb-demo-started:${item.productId}:purchased:${item.set}`,
      );
      localStorage.removeItem(
        examResultStorageKey(item.productId, "purchased"),
      );
      localStorage.removeItem(
        examAnswersStorageKey(item.productId, "purchased"),
      );
      localStorage.removeItem(`webb-demo-started:${item.productId}:purchased`);
    } catch {
      // The purchase status still allows the demo attempt to be reset if storage is unavailable.
    }
    setPurchaseExamStatus(item.productId, "available", false, item.purchaseRef);
  }

  return (
    <div className="wb-dashboard-view">
      {rulesOpen && (
        <section className="wb-dashboard-card wb-exam-rules">
          <button
            type="button"
            className="wb-exam-rules-close"
            aria-label="ปิดกล่องเงื่อนไขสำคัญ"
            onClick={() => setRulesOpen(false)}
          >
            <LuX aria-hidden="true" />
          </button>
          <div className="wb-exam-rules-content">
            <h2>⚠️ เงื่อนไขสำคัญก่อนเข้าสอบ</h2>
            <ol>
              <li>
                <span className="wb-exam-rule-num">1</span>
                <span>เวลาจะเริ่มนับถอยหลังทันทีที่กด “เริ่มทำข้อสอบ”</span>
              </li>
              <li>
                <span className="wb-exam-rule-num">2</span>
                <span>
                  ระบบบันทึกคำตอบอัตโนมัติ (Auto-save) ทุกครั้งที่เลือกคำตอบ
                </span>
              </li>
              <li>
                <span className="wb-exam-rule-num">3</span>
                <span>
                  หากหลุดออกจากระบบ สามารถเข้ามาทำต่อได้
                  แต่เวลายังคงเดินต่อเนื่อง
                </span>
              </li>
              <li>
                <span className="wb-exam-rule-num">4</span>
                <span>
                  ระบบจะแจ้งเตือนเมื่อเหลือ 5 นาที
                  และส่งคำตอบอัตโนมัติเมื่อหมดเวลา
                </span>
              </li>
            </ol>
          </div>
          <div className="wb-exam-trial">
            <h3>ยังไม่พร้อม? ลองก่อนได้!</h3>
            <p>ทดลองหน้าจอทำข้อสอบและระบบจับเวลา ฟรี</p>
            <Link href="/webb/rules?product=tgat1&type=trial&back=exam">
              <span>ทดลองระบบสอบ</span>
            </Link>
          </div>
        </section>
      )}
      <section id="exam-list" className="wb-dashboard-card wb-exam-table">
        <h2>📋 รายการสอบของคุณ</h2>
        <div className="wb-exam-table-head">
          <span>วิชาที่สอบ</span>
          <span className="wb-col-center">ชุดข้อสอบ</span>
          <span className="wb-col-center">เวลาสอบ</span>
          <span className="wb-col-center">จำนวนข้อ</span>
          <span>สถานะ</span>
        </div>
        {examItems.length ? (
          examItems.map((item) => (
            <article key={item.purchaseRef || `${item.subjectId}-${item.set}`}>
              <div className="wb-exam-subject-col">
                <b>{item.title}</b>
                <small>{item.detail}</small>
              </div>
              <span className="wb-mobile-table-label wb-exam-set-col wb-col-center">
                <strong className="wb-mobile-label-tag">ชุดข้อสอบ</strong>
                <b>{item.set}</b>
              </span>
              <span className="wb-mobile-table-label wb-exam-time-col wb-col-center">
                <strong className="wb-mobile-label-tag">เวลาสอบ</strong>
                <b>{item.duration}</b>
              </span>
              <span className="wb-mobile-table-label wb-exam-count-col wb-col-center">
                <strong className="wb-mobile-label-tag">จำนวนข้อ</strong>
                <b>{item.questions}</b>
              </span>
              <div className="wb-exam-status-col">
                <em>
                  {item.status === "submitted"
                    ? "สอบเสร็จแล้ว"
                    : item.status === "in-progress"
                      ? "กำลังสอบ"
                      : item.status === "interrupted"
                        ? "รอผู้ดูแลตรวจสอบ"
                        : "ยังไม่ได้สอบ"}
                </em>
                <div className="wb-exam-actions">
                  {item.status === "submitted" ? (
                    <Link href="/webb/results">ดูผลสอบ</Link>
                  ) : getExamPlan(item.productId, item.set).hasSuppliedExam ? (
                    <Link
                      href={`/webb/rules?product=${item.productId}&set=${item.set}&ref=${encodeURIComponent(item.purchaseRef || "")}&type=purchased&back=exam`}
                    >
                      {item.status === "in-progress"
                        ? "ทำข้อสอบต่อ"
                        : "เริ่มสอบ"}
                    </Link>
                  ) : (
                    <span className="wb-exam-unavailable-label">
                      ไฟล์ข้อสอบยังไม่พร้อม
                    </span>
                  )}
                  {getExamPlan(item.productId, item.set).hasSuppliedExam && (
                    <button
                      type="button"
                      className="wb-exam-reset-btn"
                      onClick={() => resetExam(item)}
                    >
                      <LuRotateCcw aria-hidden="true" /> รีเซ็ตสอบใหม่
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <p className="wb-empty-state text-center pt-5">
            ยังไม่มีชุดข้อสอบที่สมัคร เมื่อเลือกซื้อแล้วรายการสอบจะแสดงที่นี่
          </p>
        )}
      </section>
    </div>
  );
}

function ExamResults({
  onSelect,
  student = defaultStudent,
}: {
  onSelect: (view: StudentView) => void;
  student?: StudentInfo;
}) {
  const [published, setPublished] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  useEffect(() => {
    const refresh = () => {
      const account = readDemoAccount();
      let studentScore: number | null = null;
      try {
        const records = JSON.parse(localStorage.getItem(DEMO_RANKINGS_KEY) || "[]") as { username: string; score: number }[];
        studentScore = records.find((record) => record.username.toLowerCase() === account?.username.toLowerCase())?.score ?? null;
      } catch { studentScore = null; }
      setScore(studentScore);

      const hasSubmitted = studentScore !== null || readCurrentDemoPurchases().some((purchase) => purchase.examStatus === "submitted");
      setPublished(hasSubmitted || areDemoResultsPublished());
    };
    refresh();
    window.addEventListener("webb-demo-ranking-updated", refresh);
    window.addEventListener("webb-admin-demo-updated", refresh);
    window.addEventListener("webb-admin-mock-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("webb-demo-ranking-updated", refresh);
      window.removeEventListener("webb-admin-demo-updated", refresh);
      window.removeEventListener("webb-admin-mock-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  if (!published) return <div className="wb-dashboard-view"><section className="wb-dashboard-card"><h2>กำลังตรวจสอบผลสอบ</h2><p>ผลสอบจะปรากฏเมื่อผู้ดูแลเผยแพร่ผลแล้ว</p></section></div>;
  return (
    <div className="wb-dashboard-view">
      <WebBFullAnalysisPdfReport
        student={student}
        displayScore={score ?? 60.7}
      />
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
          {(score ?? 60.7).toFixed(1)}<small>/100</small>
        </strong>
        <footer>
          <button
            type="button"
            className="wb-btn-download wb-results-download-btn"
            onClick={() => window.print()}
          >
            <LuDownload aria-hidden="true" />
            <span>ดาวน์โหลดใบวิเคราะห์ (PDF)</span>
          </button>
          <button
            type="button"
            className="wb-ranking-action"
            onClick={() => onSelect("ranking")}
          >
            🏆 จัดคะแนนอันดับ
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={() => onSelect("detail")}
          >
            <span>ดูคะแนนสอบ</span>
            <LuArrowRight aria-hidden="true" />
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
  const [published, setPublished] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  useEffect(() => {
    const refresh = () => {
      const account = readDemoAccount();
      let studentScore: number | null = null;
      try {
        const records = JSON.parse(localStorage.getItem(DEMO_RANKINGS_KEY) || "[]") as { username: string; score: number }[];
        studentScore = records.find((record) => record.username.toLowerCase() === account?.username.toLowerCase())?.score ?? null;
      } catch { studentScore = null; }
      setScore(studentScore);

      const hasSubmitted = studentScore !== null || readCurrentDemoPurchases().some((purchase) => purchase.examStatus === "submitted");
      setPublished(hasSubmitted || areDemoResultsPublished());
    };
    refresh();
    window.addEventListener("webb-demo-ranking-updated", refresh);
    window.addEventListener("webb-admin-demo-updated", refresh);
    window.addEventListener("webb-admin-mock-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("webb-demo-ranking-updated", refresh);
      window.removeEventListener("webb-admin-demo-updated", refresh);
      window.removeEventListener("webb-admin-mock-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  if (!published) return <div className="wb-dashboard-view"><section className="wb-dashboard-card"><h2>กำลังตรวจสอบผลสอบ</h2><p>ผลสอบจะปรากฏเมื่อผู้ดูแลเผยแพร่ผลแล้ว</p></section></div>;
  const displayScore = score ?? 60.7;
  return (
    <div className="wb-dashboard-view wb-detail-view">
      <WebBFullAnalysisPdfReport
        student={student}
        displayScore={displayScore}
      />
      <div className="wb-detail-back">
        <button
          type="button"
          className="wb-detail-back-btn"
          onClick={() => onSelect("results")}
        >
          <LuArrowLeft aria-hidden="true" />
          <span>ผลสอบทั้งหมด</span>
        </button>
        <button
          type="button"
          className="wb-btn-download wb-detail-download-btn"
          onClick={() => window.print()}
        >
          <LuDownload aria-hidden="true" />
          <span>ดาวน์โหลดใบวิเคราะห์ (PDF)</span>
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
            <dd>{maskCitizenId(student.citizenId)}</dd>
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
              🏆 จัดคะแนนอันดับ <LuArrowRight aria-hidden="true" />
            </button>
          </h2>
          <div className="wb-detail-score">
            <span>คะแนน</span>
            <b>{displayScore.toFixed(1)}/100</b>
          </div>
          <div className="wb-detail-place">
            <p>
              ลำดับที่ <strong>415</strong>/2709
            </p>
            <small>*คิดจากการสอบครั้งที่ 1 เท่านั้น</small>
          </div>
        </section>
      </div>
      <section className="wb-dashboard-card wb-total-score">
        <h2>
          TGAT ความถนัดทั่วไป <b>{displayScore.toFixed(1)} / 100</b>
        </h2>
        <i>
          <em style={{ width: `${displayScore}%` }} />
        </i>
        <div>
          <span>0</span>
          <span>{displayScore.toFixed(1)}</span>
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
              ดูรายละเอียดรายข้อ
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

export const TGAT1_SPEAKING_QUESTIONS = [
  { no: 1, ans: "A", correct: true, score: "1.00" },
  { no: 2, ans: "C", correct: true, score: "1.00" },
  { no: 3, ans: "B", correct: true, score: "1.00" },
  { no: 4, ans: "C", correct: true, score: "1.00" },
  { no: 5, ans: "B", correct: true, score: "1.00" },
  { no: 6, ans: "C", correct: false, score: "1.00" },
  { no: 7, ans: "A", correct: true, score: "1.00" },
  { no: 8, ans: "C", correct: false, score: "1.00" },
  { no: 9, ans: "A", correct: true, score: "1.00" },
  { no: 10, ans: "C", correct: true, score: "1.00" },
  { no: 11, ans: "A", correct: true, score: "1.00" },
  { no: 12, ans: "C", correct: true, score: "1.00" },
  { no: 13, ans: "A", correct: true, score: "1.00" },
  { no: 14, ans: "C", correct: false, score: "1.00" },
  { no: 15, ans: "A", correct: true, score: "1.00" },
  { no: 16, ans: "B", correct: false, score: "1.00" },
  { no: 17, ans: "B", correct: false, score: "1.00" },
  { no: 18, ans: "C", correct: false, score: "1.00" },
  { no: 19, ans: "D", correct: false, score: "1.00" },
  { no: 20, ans: "C", correct: true, score: "1.00" },
  { no: 21, ans: "B", correct: false, score: "1.00" },
  { no: 22, ans: "C", correct: false, score: "1.00" },
  { no: 23, ans: "A", correct: true, score: "1.00" },
  { no: 24, ans: "A", correct: true, score: "1.00" },
  { no: 25, ans: "B", correct: true, score: "1.00" },
  { no: 26, ans: "D", correct: false, score: "1.00" },
  { no: 27, ans: "A", correct: false, score: "1.00" },
  { no: 28, ans: "C", correct: false, score: "1.00" },
  { no: 29, ans: "D", correct: true, score: "1.00" },
  { no: 30, ans: "B", correct: true, score: "1.00" },
];

export const TGAT1_READING_QUESTIONS = [
  { no: 1, ans: "A", correct: true, score: "1.00" },
  { no: 2, ans: "C", correct: true, score: "1.00" },
  { no: 3, ans: "B", correct: true, score: "1.00" },
  { no: 4, ans: "C", correct: true, score: "1.00" },
  { no: 5, ans: "B", correct: true, score: "1.00" },
  { no: 6, ans: "C", correct: false, score: "1.00" },
  { no: 7, ans: "A", correct: true, score: "1.00" },
  { no: 8, ans: "C", correct: false, score: "1.00" },
  { no: 9, ans: "A", correct: true, score: "1.00" },
  { no: 10, ans: "C", correct: false, score: "1.00" },
  { no: 11, ans: "A", correct: false, score: "1.00" },
  { no: 12, ans: "C", correct: false, score: "1.00" },
  { no: 13, ans: "A", correct: true, score: "1.00" },
  { no: 14, ans: "C", correct: false, score: "1.00" },
  { no: 15, ans: "A", correct: true, score: "1.00" },
  { no: 16, ans: "B", correct: false, score: "1.00" },
  { no: 17, ans: "B", correct: false, score: "1.00" },
  { no: 18, ans: "C", correct: false, score: "1.00" },
  { no: 19, ans: "D", correct: false, score: "1.00" },
  { no: 20, ans: "C", correct: true, score: "1.00" },
  { no: 21, ans: "B", correct: false, score: "1.00" },
  { no: 22, ans: "C", correct: false, score: "1.00" },
  { no: 23, ans: "A", correct: true, score: "1.00" },
  { no: 24, ans: "A", correct: false, score: "1.00" },
  { no: 25, ans: "B", correct: true, score: "1.00" },
  { no: 26, ans: "D", correct: false, score: "1.00" },
  { no: 27, ans: "A", correct: false, score: "1.00" },
  { no: 28, ans: "C", correct: false, score: "1.00" },
  { no: 29, ans: "D", correct: false, score: "1.00" },
  { no: 30, ans: "B", correct: false, score: "1.00" },
];

function SubResultCheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="18" height="18" rx="4" fill="#22c55e" />
      <path
        d="M5 9.2L7.6 11.8L13 6.4"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SubResultCrossIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="#ef4444"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type QuestionResult = {
  no: string | number;
  ans: string;
  correct?: boolean;
  score: string;
  badge?: string;
  note?: string;
  isWrong?: boolean;
};

export const TGAT3_SKILL1_QUESTIONS: QuestionResult[] = [
  { no: 1, ans: "C", badge: "1", score: "0.00", isWrong: true },
  { no: 2, ans: "2,3,4", badge: "1", score: "1.00", note: "หลายข้อ" },
  {
    no: "3 -4",
    ans: "D",
    badge: "double-check",
    score: "2.00",
    note: "เชื่อมโยง",
  },
  { no: 5, ans: "2,4", badge: "0.5", score: "0.5", note: "หลายข้อ" },
  { no: 6, ans: "D", badge: "1", score: "0.00", isWrong: true },
  { no: 6, ans: "1,2,4", badge: "1", score: "1.00", note: "หลายข้อ" },
  { no: 7, ans: "1,2,4", badge: "1", score: "0.00", isWrong: true },
  {
    no: "8-9",
    ans: "A/D",
    badge: "double-check",
    score: "2.00",
    note: "หลายข้อ",
  },
  { no: 10, ans: "C", badge: "1", score: "0.75" },
  { no: 11, ans: "2,3", badge: "1", score: "1.00", note: "หลายข้อ" },
  { no: 12, ans: "2,3", badge: "0.75", score: "0.75", note: "หลายข้อ" },
  {
    no: "13-14",
    ans: "D/C",
    badge: "cross",
    score: "0.00",
    note: "เชื่อมโยง",
    isWrong: true,
  },
  { no: 15, ans: "1,2", badge: "1", score: "1.00", note: "หลายข้อ" },
];

export const TGAT3_SKILL2_QUESTIONS: QuestionResult[] = [
  { no: 16, ans: "4", badge: "0.5", score: "0.50", note: "หลายข้อ" },
  { no: 17, ans: "C", badge: "0", score: "0.00", isWrong: true },
  { no: 18, ans: "A", badge: "0.25", score: "0.25" },
  { no: 19, ans: "2,4", badge: "0", score: "0.00", isWrong: true },
  { no: 20, ans: "D", badge: "1", score: "0.00", isWrong: true },
  { no: 21, ans: "1,2,4", badge: "1", score: "1.00", note: "หลายข้อ" },
  { no: 22, ans: "1,2,4", badge: "1", score: "0.00", isWrong: true },
  { no: 23, ans: "A/D", badge: "double-check", score: "2.00", note: "หลายข้อ" },
  { no: 24, ans: "C", badge: "1", score: "0.75" },
  { no: 25, ans: "A", badge: "0", score: "0.00", isWrong: true },
  { no: 26, ans: "B", badge: "0.25", score: "0.25" },
  { no: 27, ans: "1,2,4", badge: "1", score: "1.00", note: "หลายข้อ" },
  { no: 28, ans: "1", badge: "0.25", score: "0.25", note: "หลายข้อ" },
  { no: 29, ans: "A", badge: "0.25", score: "0.25" },
  { no: 30, ans: "C", badge: "0", score: "0.00", isWrong: true },
];

export const TGAT3_SKILL3_QUESTIONS: QuestionResult[] = [
  { no: 31, ans: "D", badge: "check", score: "1.00", correct: true },
  { no: 32, ans: "C", badge: "check", score: "1.00", correct: true },
  { no: 33, ans: "C", badge: "check", score: "1.00", correct: true },
  { no: 34, ans: "D", badge: "check", score: "1.00", correct: true },
  { no: 35, ans: "B", badge: "cross", score: "0.00", isWrong: true },
  { no: 36, ans: "A", badge: "check", score: "1.00", correct: true },
  { no: 37, ans: "B", badge: "cross", score: "0.00", isWrong: true },
  { no: 38, ans: "B", badge: "cross", score: "0.00", isWrong: true },
  { no: 39, ans: "A", badge: "cross", score: "0.00", isWrong: true },
  { no: 40, ans: "C", badge: "check", score: "1.00", correct: true },
  { no: 41, ans: "C", badge: "check", score: "1.00", correct: true },
  { no: 42, ans: "D", badge: "check", score: "1.00", correct: true },
  { no: 43, ans: "B", badge: "check", score: "1.00", correct: true },
  { no: 44, ans: "A", badge: "cross", score: "0.00", isWrong: true },
  { no: 45, ans: "A", badge: "cross", score: "0.00", isWrong: true },
];

export const TGAT3_SKILL4_QUESTIONS: QuestionResult[] = [
  { no: 46, ans: "D", badge: "check", score: "1.00", correct: true },
  { no: 47, ans: "C", badge: "check", score: "1.00", correct: true },
  { no: 48, ans: "C", badge: "check", score: "1.00", correct: true },
  { no: 49, ans: "D", badge: "check", score: "1.00", correct: true },
  { no: 50, ans: "B", badge: "cross", score: "0.00", isWrong: true },
  { no: 51, ans: "A", badge: "check", score: "1.00", correct: true },
  { no: 52, ans: "B", badge: "check", score: "1.00", correct: true },
  { no: 53, ans: "B", badge: "cross", score: "0.00", isWrong: true },
  { no: 54, ans: "A", badge: "cross", score: "0.00", isWrong: true },
  { no: 55, ans: "C", badge: "check", score: "1.00", correct: true },
  { no: 56, ans: "C", badge: "check", score: "1.00", correct: true },
  { no: 57, ans: "D", badge: "check", score: "1.00", correct: true },
  { no: 58, ans: "B", badge: "check", score: "1.00", correct: true },
  { no: 59, ans: "A", badge: "cross", score: "0.00", isWrong: true },
  { no: 60, ans: "A", badge: "cross", score: "0.00", isWrong: true },
];

function renderResultBadge(q: QuestionResult) {
  if (q.badge === "double-check") {
    return <span className="wb-badge-pill-doublecheck">✓✓</span>;
  }
  if (q.badge === "1") {
    return <span className="wb-badge-circle wb-badge-circle-green">1</span>;
  }
  if (q.badge === "0.5") {
    return <span className="wb-badge-circle wb-badge-circle-yellow">0.5</span>;
  }
  if (q.badge === "0.25") {
    return <span className="wb-badge-circle wb-badge-circle-orange">0.25</span>;
  }
  if (q.badge === "0.75") {
    return <span className="wb-badge-circle wb-badge-circle-green">0.75</span>;
  }
  if (q.badge === "0") {
    return <span className="wb-badge-circle wb-badge-circle-red">0</span>;
  }
  if (q.badge === "cross" || q.isWrong) {
    return <SubResultCrossIcon />;
  }
  if (q.badge === "check" || q.correct) {
    return <SubResultCheckIcon />;
  }
  return q.correct ? <SubResultCheckIcon /> : <SubResultCrossIcon />;
}

export function getSubResultQuestions(
  partId: string,
  skillName: string,
  skillIndex: number,
  skill: ExamSkill,
): QuestionResult[] {
  const pid = partId.toLowerCase();
  if (pid === "tgat1") {
    if (skillName.toLowerCase().includes("speaking")) {
      return TGAT1_SPEAKING_QUESTIONS;
    }
    if (skillName.toLowerCase().includes("reading")) {
      return TGAT1_READING_QUESTIONS;
    }
  }

  if (pid === "tgat3") {
    if (skillIndex === 0 || skillName.includes("สร้างคุณค่า")) {
      return TGAT3_SKILL1_QUESTIONS;
    }
    if (skillIndex === 1 || skillName.includes("แก้ไขปัญหา")) {
      return TGAT3_SKILL2_QUESTIONS;
    }
    if (skillIndex === 2 || skillName.includes("บริหารจัดการอารมณ์")) {
      return TGAT3_SKILL3_QUESTIONS;
    }
    if (skillIndex === 3 || skillName.includes("พลเมือง")) {
      return TGAT3_SKILL4_QUESTIONS;
    }
  }

  const answerChoices = [
    "A",
    "C",
    "B",
    "C",
    "B",
    "C",
    "A",
    "C",
    "A",
    "C",
    "D",
    "B",
    "A",
    "C",
    "D",
  ];
  return Array.from({ length: skill.total }, (_, index) => {
    const correct = (index * 13) % skill.total < skill.correct;
    const answer =
      answerChoices[(index + skillIndex * 3) % answerChoices.length];
    return {
      no: skill.start + index,
      ans: answer,
      correct,
      score: correct ? "1.00" : "0.00",
    };
  });
}

export function ExamPartDetails({
  partId,
  onBack,
}: {
  partId: string;
  onBack: () => void;
}) {
  const part = examPartReports[partId] ?? examPartReports.tgat1;
  const [openSkills, setOpenSkills] = useState<Record<string, boolean>>({
    "Speaking Skill": true,
    "Reading Skill": false,
    ความสามารถทางภาษา: true,
    การสร้างคุณค่าและนวัตกรรม: true,
  });

  const toggleSkill = (name: string) => {
    setOpenSkills((prev) => ({
      ...prev,
      [name]: !(prev[name] ?? false),
    }));
  };

  const sortedSkills = [...part.skills].sort((a, b) => {
    const aVal = parseFloat(a.score.split("/")[0]);
    const aMax = parseFloat(a.score.split("/")[1] || "50");
    const bVal = parseFloat(b.score.split("/")[0]);
    const bMax = parseFloat(b.score.split("/")[1] || "50");
    return bVal / bMax - aVal / aMax;
  });

  return (
    <div
      className={`wb-dashboard-view wb-detail-view wb-subresults-page wb-part-${part.id.toLowerCase()}`}
    >
      <div className="wb-subresults-top">
        <button
          type="button"
          className="wb-subresults-back-btn"
          onClick={onBack}
        >
          <LuArrowLeft size={20} />
          <span>กลับใบวิเคราะห์รวม</span>
        </button>
      </div>

      <header
        className="wb-subresults-header"
        style={{ background: part.color }}
      >
        <div className="wb-subresults-header-info">
          <span className="wb-subresults-pill">{part.label}</span>
          <h1 className="wb-subresults-title">
            {part.title} ({part.englishTitle})
          </h1>
          <div className="wb-subresults-meta-mobile">
            · ถูก {part.correct} · ผิด {part.wrong} · {part.total} ข้อ
          </div>
        </div>
        <div className="wb-subresults-header-score">
          <div className="wb-subresults-score-num">
            <strong>{part.score}</strong>
            <span>/100</span>
          </div>
          <div className="wb-subresults-meta-desktop">
            · ถูก {part.correct} · ผิด {part.wrong} · {part.total} ข้อ
          </div>
        </div>
      </header>

      <div className={`wb-subresults-grid is-${part.skills.length}-skills`}>
        {part.skills.map((skill, skillIndex) => {
          const isOpen = openSkills[skill.name] ?? skillIndex === 0;
          const questions = getSubResultQuestions(
            part.id,
            skill.name,
            skillIndex,
            skill,
          );

          return (
            <div
              className={`wb-subresults-card ${isOpen ? "is-open" : "is-collapsed"}`}
              key={skill.name}
            >
              <div
                className="wb-subresults-card-header"
                onClick={() => toggleSkill(skill.name)}
                role="button"
                tabIndex={0}
              >
                {/* แถวบน: หัวข้อ */}
                <div className="wb-subresults-card-title-row">
                  <h3 className="wb-subresults-card-name" title={skill.name}>
                    {skill.name}
                  </h3>
                  <div className="wb-subresults-card-meta-right">
                    <span className="wb-subresults-count-text wb-count-desktop-2skills">
                      {skill.total} ข้อ ·{" "}
                      {part.id === "TGAT1"
                        ? "50"
                        : part.id === "TGAT3"
                          ? "25"
                          : "20"}{" "}
                      คะแนน
                    </span>
                    <span className="wb-subresults-chevron">
                      {isOpen ? (
                        <LuChevronUp size={20} />
                      ) : (
                        <LuChevronDown size={20} />
                      )}
                    </span>
                  </div>
                </div>

                {/* แถวล่าง: คะแนน และจำนวนข้อ */}
                <div className="wb-subresults-count-row">
                  <span className="wb-subresults-count-text">
                    {skill.total} ข้อ ·{" "}
                    {part.id === "TGAT1"
                      ? "50"
                      : part.id === "TGAT3"
                        ? "25"
                        : "20"}{" "}
                    คะแนน
                  </span>
                </div>

                {/* แถวสรุปผลและคะแนน */}
                <div className="wb-subresults-card-sub-row">
                  <div className="wb-subresults-skill-badges">
                    <span className="wb-subresults-badge-correct">
                      <SubResultCheckIcon />
                      <span>ถูก {skill.correctText ?? skill.correct}</span>
                    </span>
                    <span className="wb-subresults-dot">·</span>
                    <span className="wb-subresults-badge-wrong">
                      <SubResultCrossIcon />
                      <span>ผิด {skill.wrongText ?? skill.wrong}</span>
                    </span>
                  </div>
                  <div className="wb-subresults-card-score">
                    <strong>{skill.score.split("/")[0]}</strong>
                    <span>
                      /
                      {skill.score.split("/")[1] ||
                        (part.id === "TGAT1"
                          ? "50"
                          : part.id === "TGAT3"
                            ? "25"
                            : "20")}
                    </span>
                  </div>
                </div>

                <div className="wb-subresults-progress-bar">
                  <div
                    className="wb-subresults-progress-fill"
                    style={{
                      width: `${Math.min(100, (skill.correct / skill.total) * 100)}%`,
                      background: `linear-gradient(90deg, ${part.color} 0%, #38bdf8 100%)`,
                    }}
                  />
                </div>
              </div>

              <div
                className={`wb-subresults-table-wrap ${isOpen ? "is-open" : "is-collapsed"}`}
              >
                <table className="wb-subresults-table">
                  <thead>
                    <tr>
                      <th>ข้อ</th>
                      <th>คำตอบ</th>
                      <th>ผล</th>
                      <th>คะแนน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q, qIndex) => {
                      const isZero =
                        q.isWrong || q.score === "0.00" || q.score === "0";
                      const isAmber =
                        q.score === "0.5" ||
                        q.score === "0.50" ||
                        q.score === "0.25" ||
                        q.score === "0.75";
                      return (
                        <tr key={qIndex}>
                          <td className="wb-col-no">{q.no}</td>
                          <td className="wb-col-ans">{q.ans}</td>
                          <td className="wb-col-result">
                            {renderResultBadge(q)}
                          </td>
                          <td
                            className={`wb-col-score ${isZero ? "is-wrong-score" : isAmber ? "is-amber-score" : "is-correct-score"}`}
                          >
                            <div className="wb-score-val">{q.score}</div>
                            {q.note && (
                              <div className="wb-score-note">{q.note}</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <section className="wb-subresults-radar-section">
        <div className="wb-subresults-radar-header">
          <h2>โปรไฟล์ความถนัดโดยรวม (Competency Radar)</h2>
          <p>เทียบสัดส่วน % ของคะแนนแต่ละพาร์ทย่อย</p>
        </div>

        <div className="wb-subresults-radar-layout">
          <div className="wb-subresults-radar-chart-box">
            {part.skills.length === 2 ? (
              <div className="wb-subresults-vertical-axis">
                <div className="wb-axis-point-top">
                  <span className="wb-axis-label">{part.skills[0].name}</span>
                  <strong className="wb-axis-val">
                    {part.skills[0].score.split("/")[0]}
                  </strong>
                </div>
                <div className="wb-axis-line-container">
                  <svg width="24" height="110" viewBox="0 0 24 110" fill="none">
                    <line
                      x1="12"
                      y1="12"
                      x2="12"
                      y2="98"
                      stroke={part.color}
                      strokeWidth="2.5"
                    />
                    <circle cx="12" cy="12" r="5" fill={part.color} />
                    <circle cx="12" cy="98" r="5" fill={part.color} />
                  </svg>
                </div>
                <div className="wb-axis-point-bottom">
                  <span className="wb-axis-label">{part.skills[1].name}</span>
                  <strong className="wb-axis-val">
                    {part.skills[1].score.split("/")[0]}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="wb-subresults-radar-svg-wrap">
                <svg viewBox="0 0 460 280" role="img" aria-hidden="true">
                  <g className="wb-radar-grid">
                    <polygon points="230,40 350,135 230,230 110,135" />
                    <polygon points="230,70 310,135 230,200 150,135" />
                    <polygon points="230,100 270,135 230,170 190,135" />
                    <line x1="230" y1="40" x2="230" y2="230" />
                    <line x1="110" y1="135" x2="350" y2="135" />
                  </g>
                  <polygon
                    className="wb-radar-area"
                    points="230,75 295,135 230,192 148,135"
                    style={{ stroke: part.color, fill: `${part.color}20` }}
                  />
                  {[
                    [230, 75],
                    [295, 135],
                    [230, 192],
                    [148, 135],
                  ].map(([x, y], index) => (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="5"
                      style={{ fill: part.color }}
                    />
                  ))}
                  <text x="230" y="18" textAnchor="middle" fontWeight="600">
                    {part.skills[0]?.name}
                  </text>
                  <text
                    x="230"
                    y="32"
                    textAnchor="middle"
                    fontWeight="700"
                    fill="#0f172a"
                  >
                    {part.skills[0]?.score.split("/")[0]}
                  </text>

                  <text x="360" y="130" textAnchor="start" fontWeight="600">
                    {part.skills[1]?.name}
                  </text>
                  <text
                    x="360"
                    y="145"
                    textAnchor="start"
                    fontWeight="700"
                    fill="#0f172a"
                  >
                    {part.skills[1]?.score.split("/")[0]}
                  </text>

                  <text x="230" y="252" textAnchor="middle" fontWeight="600">
                    {part.skills[2]?.name}
                  </text>
                  <text
                    x="230"
                    y="266"
                    textAnchor="middle"
                    fontWeight="700"
                    fill="#0f172a"
                  >
                    {part.skills[2]?.score.split("/")[0]}
                  </text>

                  <text x="100" y="130" textAnchor="end" fontWeight="600">
                    {part.skills[3]?.name}
                  </text>
                  <text
                    x="100"
                    y="145"
                    textAnchor="end"
                    fontWeight="700"
                    fill="#0f172a"
                  >
                    {part.skills[3]?.score.split("/")[0]}
                  </text>
                </svg>
              </div>
            )}
          </div>

          <div className="wb-subresults-ranking-box">
            <h3 className="wb-subresults-ranking-title">
              เรียงจากพาร์ทที่ทำได้ดีที่สุด → ควรพัฒนา
            </h3>
            <div className="wb-subresults-ranking-list">
              {sortedSkills.map((skill, index) => {
                const scoreNum = parseFloat(skill.score.split("/")[0]);
                const maxNum = parseFloat(skill.score.split("/")[1] || "50");
                const pct = Math.min(
                  100,
                  Math.max(0, (scoreNum / maxNum) * 100),
                );

                return (
                  <div key={skill.name} className="wb-subresults-ranking-item">
                    <div className="wb-subresults-ranking-item-head">
                      <span className="wb-subresults-ranking-item-name">
                        {index + 1}. {skill.name}
                      </span>
                      <span className="wb-subresults-ranking-item-score">
                        <strong>{skill.score.split("/")[0]}</strong>
                        <span className="wb-subresults-ranking-max">
                          /{maxNum}
                        </span>
                      </span>
                    </div>
                    <div className="wb-subresults-ranking-bar">
                      <div
                        className="wb-subresults-ranking-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, #0369a1 0%, #38bdf8 100%)`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
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
  const [published, setPublished] = useState(true);
  const [grade, setGrade] = useState("ทุกระดับชั้น");
  const [province, setProvince] = useState("ทุกจังหวัด");
  const [period, setPeriod] = useState("ทุกช่วงเวลา");
  const gradeOptions = [
    "ทุกระดับชั้น",
    "มัธยมศึกษาปีที่ 4",
    "มัธยมศึกษาปีที่ 5",
    "มัธยมศึกษาปีที่ 6",
  ].map((value) => ({ value, label: value }));
  const provinceOptions = [
    { value: "ทุกจังหวัด", label: "ทุกจังหวัด" },
    ...WEBB_PROVINCES,
  ];
  const periodOptions = ["ทุกช่วงเวลา", "เดือนนี้", "สัปดาห์นี้"].map(
    (value) => ({ value, label: value }),
  );
  const [currentUsername, setCurrentUsername] = useState("");
  const [rankRecords, setRankRecords] = useState<
    {
      username: string;
      email: string;
      student: string;
      grade: string;
      province: string;
      productId: string;
      version: string;
      score: number;
      submittedAt: number;
    }[]
  >([]);
  useEffect(() => {
    const refresh = () => {
      const isPublished = areDemoResultsPublished();
      setPublished(isPublished);
      try {
        setRankRecords(
          isPublished ? JSON.parse(localStorage.getItem(DEMO_RANKINGS_KEY) || "[]") : [],
        );
      } catch {
        setRankRecords([]);
      }
      setCurrentUsername(readDemoAccount()?.username || "");
    };
    refresh();
    window.addEventListener("webb-demo-ranking-updated", refresh);
    window.addEventListener("webb-admin-demo-updated", refresh);
    window.addEventListener("webb-admin-mock-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("webb-demo-ranking-updated", refresh);
      window.removeEventListener("webb-admin-demo-updated", refresh);
      window.removeEventListener("webb-admin-mock-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const ownResult = rankRecords.find((row) =>
    currentUsername
      ? row.username.toLowerCase() === currentUsername.toLowerCase()
      : row.email.toLowerCase() === student.email.toLowerCase(),
  );
  const rankingProductId = ownResult?.productId || "tgat1";
  const rankingVersion = ownResult?.version;
  const actualRows = rankRecords.filter(
    (row) =>
      row.productId === rankingProductId &&
      (!rankingVersion || row.version === rankingVersion),
  );
  const rows = actualRows.map((row) => ({
    ...row,
    name: row.student,
    period:
      Date.now() - row.submittedAt < 7 * 86400000 ? "สัปดาห์นี้" : "เดือนนี้",
  }));
  const ownScore = ownResult?.score;
  const filteredRows = rows.filter(
    (row) =>
      (grade === "ทุกระดับชั้น" || row.grade === grade) &&
      (province === "ทุกจังหวัด" || row.province === province) &&
      (period === "ทุกช่วงเวลา" || row.period === period),
  );
  const candidates = filteredRows.length;
  const ownRank =
    ownScore === undefined
      ? null
      : filteredRows.filter((row) => row.score > ownScore).length + 1;
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
          <LuX aria-hidden="true" className="size-5" />
        </button>
        <div className="wb-ranking-brand">
          <WebBBrand />
        </div>
        <h2>{student.name}</h2>
        <p>วิชา TGAT ความถนัดทั่วไป</p>
        {!published && <p className="wb-ranking-place">ผลสอบและ Ranking ยังไม่เผยแพร่โดยผู้ดูแล</p>}
        <div style={{ display: published ? undefined : "none" }}>
        <div className="wb-ranking-score">
          <span>คะแนน</span>
          <b>{ownScore === undefined ? "—" : `${ownScore.toFixed(1)}/100`}</b>
        </div>
        <div className="wb-ranking-place">
          อันดับของคุณ <strong>{ownRank ?? "—"}</strong>/{candidates}
          <small>คำนวณจากผู้ส่งข้อสอบสำเร็จในชุดและเวอร์ชันเดียวกัน</small>
        </div>
        <h3>กรองข้อมูลการจัดอันดับ</h3>
        <div className="wb-ranking-filters">
          <label>
            ระดับชั้น
            <Select
              className="wb-ranking-select"
              classNamePrefix="wb-select"
              options={gradeOptions}
              value={
                gradeOptions.find((option) => option.value === grade) || null
              }
              onChange={(option) => option && setGrade(option.value)}
              isSearchable
              styles={WEBB_SELECT_STYLES as never}
            />
          </label>
          <label>
            จังหวัด
            <Select
              className="wb-ranking-select"
              classNamePrefix="wb-select"
              options={provinceOptions}
              value={
                provinceOptions.find((option) => option.value === province) ||
                null
              }
              onChange={(option) => option && setProvince(option.value)}
              isSearchable
              styles={WEBB_SELECT_STYLES as never}
            />
          </label>
          <label>
            ช่วงเวลา
            <Select
              className="wb-ranking-select"
              classNamePrefix="wb-select"
              options={periodOptions}
              value={
                periodOptions.find((option) => option.value === period) || null
              }
              onChange={(option) => option && setPeriod(option.value)}
              isSearchable
              styles={WEBB_SELECT_STYLES as never}
            />
          </label>
        </div>
        <div className="wb-ranking-qr-wrap">
          <QRCodeSVG
            value="https://studyunith.com/webb/register"
            size={96}
            level="M"
            title="QR สมัครสอบ"
          />
          <span>สแกน QR สมัครสอบเลย!</span>
        </div>
        </div>
      </section>
    </div>
  );
}

function StudentSolutions({
  onAction,
}: {
  onAction: (message: string) => void;
}) {
  type ManagedSolution = {
    id: string;
    name: string;
    product: string;
    kind: string;
    access: string;
    active: boolean;
    questionNumber?: number;
    duration?: string;
    summary?: string;
    tutor?: string;
    tutorCredential?: string;
    tutorBio?: string;
    pdfName?: string;
  };
  const [selectedSolution, setSelectedSolution] = useState<{
    id: string;
    name: string;
    duration: string;
    index: number;
    productName: string;
    set: string;
    pdf: string;
    summary?: string;
    tutor?: string;
    tutorCredential?: string;
    tutorBio?: string;
  } | null>(null);
  const [eligiblePurchases, setEligiblePurchases] = useState<
    ReturnType<typeof readCurrentDemoPurchases>
  >([]);
  const [solutionsPublished, setSolutionsPublished] = useState(true);
  const [openDownloadMenu, setOpenDownloadMenu] = useState<string | null>(null);
  const [managedSolutions, setManagedSolutions] = useState<ManagedSolution[]>([]);

  useEffect(() => {
    const refresh = () => {
    setManagedSolutions(safeRead<ManagedSolution[]>(adminMockKey("mock-solutions"), []));
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("product");
    const examSet = params.get("set");
    const purchaseRef = params.get("ref");
    const submittedPurchases = readCurrentDemoPurchases().filter((purchase) => {
      if (purchase.examStatus !== "submitted") return false;
      if (purchaseRef && purchase.ref !== purchaseRef) return false;
      if (productId && purchase.productId !== productId) return false;
      if (
        examSet &&
        (purchase.examSet || "A").toUpperCase() !== examSet.toUpperCase()
      )
        return false;
      return getExamPlan(purchase.productId, purchase.examSet || "A").hasSuppliedExam;
    });
    setSolutionsPublished(submittedPurchases.every((purchase) => isDemoSolutionPublished(purchase.productId)));
    setEligiblePurchases(submittedPurchases.filter((purchase) => isDemoSolutionPublished(purchase.productId)));
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("webb-demo-purchases-updated", refresh);
    window.addEventListener("webb-admin-demo-updated", refresh);
    window.addEventListener(WEBB_ADMIN_MOCK_UPDATED, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("webb-demo-purchases-updated", refresh);
      window.removeEventListener("webb-admin-demo-updated", refresh);
      window.removeEventListener(WEBB_ADMIN_MOCK_UPDATED, refresh);
    };
  }, []);

  return (
    <div className="wb-dashboard-view">
      <section className="wb-dashboard-card wb-solutions-view">
        <div className="wb-solutions-head">
          <div>
            <h2>เฉลยข้อสอบ</h2>
            <p>เลือกดูวิดีโอเฉลย หรือดาวน์โหลดเอกสารเฉลย PDF</p>
          </div>
        </div>
        {eligiblePurchases.length === 0 ? (
          <div className="wb-solutions-empty" role="status">
            {solutionsPublished ? "เฉลยจะแสดงหลังจากส่งข้อสอบในรายการที่ซื้อแล้ว" : "ผู้ดูแลพักการเผยแพร่เฉลยไว้ชั่วคราว"}
          </div>
        ) : (
          eligiblePurchases.map((purchase) => {
            const product = getProduct(purchase.productId);
            const plan = getExamPlan(
              purchase.productId,
              purchase.examSet || "A",
            );
            const downloadMenuId = `solution-download-${purchase.ref}`;
            const publishedVideos = managedSolutions.filter((solution) => {
              const productLabel = solution.product.toLowerCase();
              const isFullTgatMedia = productLabel.includes("full tgat");
              const matchesProduct = isFullTgatMedia
                ? purchase.productId === "tgat-full"
                : productsOverlap(purchase.productId, solution.product);
              return (
                solution.active &&
                solution.kind === "Video" &&
                matchesProduct &&
                productLabel.includes(`ชุด ${(purchase.examSet || "A").toLowerCase()}`)
              );
            });
            return (
              <section className="wb-solution-purchase" key={purchase.ref}>
                <header className="wb-solutions-head">
                  <span className="wb-subject-chip">
                    {purchase.productId === "tgat-full"
                      ? `TGAT 90 ความถนัดทั่วไป - ชุด ${purchase.examSet || "A"} `
                      : `${product.name} ${product.parts} · ชุด ${purchase.examSet || "A"}`}
                  </span>
                  <div className="wb-solutions-download-wrap">
                    <button
                      className="wb-solutions-download"
                      type="button"
                      aria-expanded={openDownloadMenu === downloadMenuId}
                      aria-controls={downloadMenuId}
                      onClick={() => {
                        if (plan.sections.length === 1) {
                          const link = document.createElement("a");
                          link.href = plan.sections[0].solutionPdf;
                          link.download = "";
                          link.click();
                          onAction("กำลังดาวน์โหลดไฟล์เฉลย PDF");
                          return;
                        }
                        setOpenDownloadMenu((current) =>
                          current === downloadMenuId ? null : downloadMenuId,
                        );
                      }}
                    >
                      <LuDownload aria-hidden="true" />
                      <span>ดาวน์โหลด PDF</span>
                    </button>
                    {plan.sections.length > 1 &&
                      openDownloadMenu === downloadMenuId && (
                        <div
                          className="wb-solutions-download-menu"
                          id={downloadMenuId}
                        >
                          {plan.sections.map((section) => (
                            <a
                              key={section.id}
                              href={section.solutionPdf}
                              download
                              onClick={() => {
                                onAction(`กำลังดาวน์โหลดเฉลย ${section.title}`);
                                setOpenDownloadMenu(null);
                              }}
                            >
                              {section.title}
                            </a>
                          ))}
                        </div>
                      )}
                  </div>
                </header>
                <p className="wb-solutions-purchase-ref">
                  {purchase.productId === "tgat-full"
                    ? `อัปเดตเมื่อ : ${WEBB_SOLUTION_UPDATED_AT}`
                    : `เลขรายการ ${purchase.ref}`}
                </p>
                <table className="wb-solutions-table">
                  <thead>
                    <tr>
                      <th>ข้อ</th>
                      <th>เนื้อหา</th>
                      <th aria-label="วิดีโอเฉลย" />
                    </tr>
                  </thead>
                  <tbody>
                    {plan.sections.map((section, index) => {
                      const durations: Record<string, string> = {
                        tgat1: "32:10 นาที",
                        tgat2: "28:45 นาที",
                        tgat3: "25:30 นาที",
                      };
                      return (
                        <tr key={section.id}>
                          <td>{index + 1}</td>
                          <td>
                            <b>{section.title}</b>
                            <small>
                              ความยาว{" "}
                              {durations[section.id] ||
                                `${section.durationMinutes}:00 นาที`}
                            </small>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="wb-solutions-play-btn"
                              onClick={() =>
                                setSelectedSolution({
                                  id: section.id,
                                  name: section.title,
                                  duration:
                                    durations[section.id] ||
                                    `${section.durationMinutes}:00 นาที`,
                                  index: index + 1,
                                  productName: `${product.name} ${product.parts}`,
                                  set: purchase.examSet || "A",
                                  pdf: section.solutionPdf,
                                })
                              }
                            >
                              <span className="wb-solutions-btn-desktop">
                                ดูวิดีโอเฉลย
                              </span>
                              <span className="wb-solutions-btn-mobile">
                                ดู
                              </span>
                              <LuPlay
                                className="wb-solutions-play-icon"
                                aria-hidden="true"
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {publishedVideos.length > 0 && (
                  <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="mb-3">
                      <h3 className="font-bold text-slate-900">วิดีโอเฉลยจากผู้สอน</h3>
                      <p className="mt-1 text-sm text-slate-600">รายการวิดีโอที่ผู้ดูแลเผยแพร่สำหรับชุดนี้</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {publishedVideos.map((solution, index) => (
                        <article key={solution.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-indigo-700">
                              {solution.questionNumber ? `ข้อ ${solution.questionNumber}` : "เฉลยทั้งชุด"}
                            </p>
                            <h4 className="mt-1 truncate font-bold text-slate-900">{solution.name}</h4>
                            <p className="mt-1 text-xs text-slate-500">{solution.product} · {solution.duration || "ไม่ระบุความยาว"}</p>
                          </div>
                          <button
                            type="button"
                            className="wb-solutions-play-btn shrink-0"
                            onClick={() =>
                              setSelectedSolution({
                                id: solution.id,
                                name: solution.name,
                                duration: solution.duration || "ไม่ระบุความยาว",
                                index: solution.questionNumber || index + 1,
                                productName: solution.product.split("·")[0].trim(),
                                set: purchase.examSet || "A",
                                pdf: plan.sections[0]?.solutionPdf || "#",
                                summary: solution.summary,
                                tutor: solution.tutor,
                                tutorCredential: solution.tutorCredential,
                                tutorBio: solution.tutorBio,
                              })
                            }
                          >
                            <span className="wb-solutions-btn-desktop">ดูวิดีโอเฉลย</span>
                            <span className="wb-solutions-btn-mobile">ดู</span>
                            <LuPlay className="wb-solutions-play-icon" aria-hidden="true" />
                          </button>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
              </section>
            );
          })
        )}
      </section>
      {selectedSolution && (
        <VideoSolutionModal
          solution={selectedSolution}
          onClose={() => setSelectedSolution(null)}
          onDownloadPdf={() =>
            onAction(`กำลังดาวน์โหลดเฉลย ${selectedSolution.name}`)
          }
        />
      )}
    </div>
  );
}

function VideoSolutionModal({
  solution,
  onClose,
  onDownloadPdf,
}: {
  solution: {
    id: string;
    name: string;
    duration: string;
    index: number;
    productName: string;
    set: string;
    pdf: string;
    summary?: string;
    tutor?: string;
    tutorCredential?: string;
    tutorBio?: string;
  };
  onClose: () => void;
  onDownloadPdf: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState("1.0x");
  const socialSettings = readSocialSettings();
  const tutorSocials = [
    { id: "line", label: "LINE", href: socialSettings.lineUrl === "https://line.me/" ? "" : socialSettings.lineUrl, handle: socialSettings.lineId, icon: <FaLine aria-hidden="true" /> },
    { id: "facebook", label: "Facebook", href: socialSettings.facebookUrl, handle: "", icon: <FaFacebookF aria-hidden="true" /> },
    { id: "instagram", label: "Instagram", href: socialSettings.instagramUrl, handle: "", icon: <FaInstagram aria-hidden="true" /> },
    { id: "tiktok", label: "TikTok", href: socialSettings.tiktokUrl, handle: "", icon: <FaTiktok aria-hidden="true" /> },
    { id: "youtube", label: "YouTube", href: socialSettings.youtubeUrl, handle: "", icon: <FaYoutube aria-hidden="true" /> },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="wb-video-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="wb-video-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wb-video-modal-title"
      >
        <div className="wb-video-modal-header">
          <div className="wb-video-modal-title-group">
            <span className="wb-video-badge">
              เฉลยวิดีโอ · {solution.duration}
            </span>
            <h3 id="wb-video-modal-title">{solution.name}</h3>
          </div>
          <button
            type="button"
            className="wb-video-modal-close"
            aria-label="ปิดหน้าต่างวิดีโอ"
            onClick={onClose}
          >
            <LuX aria-hidden="true" />
          </button>
        </div>
        <div className="wb-video-modal-body">
          <div
            className="wb-video-player-sample"
            onClick={() => setIsPlaying((playing) => !playing)}
          >
            <div className="wb-video-screen-content">
              <span className="wb-video-screen-watermark">
                STUDY UNITH · วิดีโอเฉลย
              </span>
              <div className="wb-video-play-center">
                <button
                  type="button"
                  className={`wb-video-big-play-btn ${isPlaying ? "is-playing" : ""}`}
                  aria-label={isPlaying ? "หยุดวิดีโอ" : "เล่นวิดีโอ"}
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsPlaying((playing) => !playing);
                  }}
                >
                  {isPlaying ? (
                    <LuPause size={30} aria-hidden="true" />
                  ) : (
                    <LuPlay
                      size={30}
                      className="wb-video-play-icon-offset"
                      aria-hidden="true"
                    />
                  )}
                </button>
                <p className="wb-video-play-hint">
                  {isPlaying
                    ? "กำลังเล่นวิดีโอเฉลยตัวอย่าง (คลิกเพื่อหยุด)"
                    : "คลิกเพื่อดูวิดีโอเฉลยตัวอย่าง"}
                </p>
              </div>
              <div className="wb-video-screen-info">
                <span>
                  {solution.productName} · ชุด {solution.set}
                </span>
                <b>วิดีโอเฉลย: {solution.name}</b>
              </div>
            </div>
            <div
              className="wb-video-controls"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="wb-video-progress-bar">
                <div
                  className="wb-video-progress-fill"
                  style={{ width: isPlaying ? "48%" : "30%" }}
                />
                <div
                  className="wb-video-progress-thumb"
                  style={{ left: isPlaying ? "48%" : "30%" }}
                />
              </div>
              <div className="wb-video-controls-row">
                <div className="wb-video-controls-left">
                  <button
                    type="button"
                    className="wb-video-ctrl-btn"
                    onClick={() => setIsPlaying((playing) => !playing)}
                    aria-label={isPlaying ? "หยุด" : "เล่น"}
                  >
                    {isPlaying ? <LuPause size={17} /> : <LuPlay size={17} />}
                  </button>
                  <div className="wb-video-time">
                    <span>{isPlaying ? "14:20" : "09:12"}</span>
                    <i>/</i>
                    <span>{solution.duration}</span>
                  </div>
                  <button
                    type="button"
                    className="wb-video-ctrl-btn"
                    title="ระดับเสียง"
                    aria-label="ระดับเสียง"
                  >
                    <LuVolume2 size={17} />
                  </button>
                </div>
                <div className="wb-video-controls-right">
                  <button
                    type="button"
                    className="wb-video-speed-btn"
                    onClick={() =>
                      setPlaybackSpeed((current) => {
                        const speeds = ["1.0x", "1.25x", "1.5x", "2.0x"];
                        return speeds[
                          (speeds.indexOf(current) + 1) % speeds.length
                        ];
                      })
                    }
                    title="ความเร็วในการเล่น"
                  >
                    {playbackSpeed}
                  </button>
                  <span className="wb-video-quality-tag">1080p HD</span>
                  <button
                    type="button"
                    className="wb-video-ctrl-btn"
                    title="เต็มจอ"
                    aria-label="เต็มหน้าจอ"
                  >
                    <LuMaximize2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="wb-video-meta-section">
            <div className="wb-video-meta-top">
              <div className="wb-video-meta-desc">
                <h4>สรุปประเด็นเฉลย</h4>
                <p>
                  {solution.summary ||
                    "วิดีโอนี้อธิบายแนวคิดและวิธีวิเคราะห์โจทย์ของหัวข้อนี้ พร้อมเทคนิคการตัดตัวเลือก"}
                </p>
              </div>
              <div className="wb-video-meta-tags">
                <span className="wb-video-tag">
                  <LuClock size={13} aria-hidden="true" />
                  ความยาว {solution.duration}
                </span>
              </div>
            </div>
            <section className="wb-video-tutor-card" aria-label="ประวัติและช่องทางติดตามติวเตอร์">
              <Image src="/images/user/user-01.png" alt="ติวเตอร์แมว" width={52} height={52} />
              <div className="wb-video-tutor-info">
                <h4>{solution.tutor || "ติวเตอร์แมว"}</h4>
                <p>{solution.tutorCredential || "ครุศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย · ประสบการณ์สอน 5 ปี"}</p>
                <small>{solution.tutorBio || "ติวเตรียมสอบ TGAT และแนะนำเทคนิควิเคราะห์โจทย์"}</small>
              </div>
              <div className="wb-video-tutor-social">
                <b>ช่องทางติดตาม</b>
                <div>
                  {tutorSocials.map((channel) => channel.href ? (
                    <a key={channel.id} href={channel.href} target="_blank" rel="noreferrer" aria-label={`ติดตามติวเตอร์ทาง ${channel.label}`} title={`${channel.label}${channel.handle ? ` ${channel.handle}` : ""}`}>
                      {channel.icon}
                    </a>
                  ) : (
                    <span key={channel.id} className="is-placeholder" aria-label={`${channel.label} ยังไม่ระบุลิงก์`} title={`${channel.label} · ตัวอย่างช่องทาง`}>
                      {channel.icon}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
        <div className="wb-video-modal-footer">
          <a
            className="wb-video-footer-download"
            href={solution.pdf}
            download
            onClick={onDownloadPdf}
          >
            <LuDownload size={15} aria-hidden="true" />
            <span>ดาวน์โหลดเอกสารเฉลย (PDF)</span>
          </a>
          <button
            type="button"
            className="wb-video-footer-close"
            onClick={onClose}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}

const AVATAR_PRESETS = [
  {
    id: "preset-1",
    label: "นักเรียน 1",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230284c7'/><circle cx='50' cy='38' r='20' fill='%23fde047'/><path d='M22 88c0-18 12-28 28-28s28 10 28 28' fill='%23ffffff'/><circle cx='43' cy='36' r='2.5' fill='%230f172a'/><circle cx='57' cy='36' r='2.5' fill='%230f172a'/><path d='M46 45q4 3 8 0' stroke='%230f172a' stroke-width='2' fill='none' stroke-linecap='round'/><path d='M30 28q20-15 40 0c-5-12-35-12-40 0z' fill='%231e293b'/></svg>",
  },
  {
    id: "preset-2",
    label: "นักเรียน 2",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f43f5e'/><circle cx='50' cy='38' r='20' fill='%23fed7aa'/><path d='M20 88c0-18 13-28 30-28s30 10 30 28' fill='%23ffffff'/><circle cx='43' cy='36' r='2.5' fill='%230f172a'/><circle cx='57' cy='36' r='2.5' fill='%230f172a'/><path d='M46 45q4 3 8 0' stroke='%230f172a' stroke-width='2' fill='none' stroke-linecap='round'/><path d='M25 36c0-15 15-22 25-22s25 7 25 22c0 8-3 15-7 18 3-10-4-16-18-16s-21 6-18 16c-4-3-7-10-7-18z' fill='%237c2d12'/></svg>",
  },
  {
    id: "preset-3",
    label: "นักเรียน 3",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%2310b981'/><circle cx='50' cy='38' r='20' fill='%23ffedd5'/><path d='M22 88c0-18 12-28 28-28s28 10 28 28' fill='%23ffffff'/><rect x='36' y='32' width='12' height='9' rx='2' fill='none' stroke='%230f172a' stroke-width='2'/><rect x='52' y='32' width='12' height='9' rx='2' fill='none' stroke='%230f172a' stroke-width='2'/><line x1='48' y1='36' x2='52' y2='36' stroke='%230f172a' stroke-width='2'/><path d='M47 46q3 2 6 0' stroke='%230f172a' stroke-width='2' fill='none' stroke-linecap='round'/><path d='M30 26q20-12 40 0c-4-10-36-10-40 0z' fill='%23334155'/></svg>",
  },
  {
    id: "preset-4",
    label: "นักเรียน 4",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%238b5cf6'/><circle cx='50' cy='38' r='20' fill='%23fef08a'/><path d='M22 88c0-18 12-28 28-28s28 10 28 28' fill='%23ffffff'/><circle cx='43' cy='36' r='2.5' fill='%230f172a'/><circle cx='57' cy='36' r='2.5' fill='%230f172a'/><path d='M46 45q4 3 8 0' stroke='%230f172a' stroke-width='2' fill='none' stroke-linecap='round'/><path d='M26 38a5 7 0 0 0 0 14h3v-14zm48 0v14h3a5 7 0 0 0 0-14z' fill='%23f59e0b'/><path d='M28 38a22 22 0 0 1 44 0' stroke='%23f59e0b' stroke-width='4' fill='none'/></svg>",
  },
];

function AvatarEditModal({
  currentAvatar,
  isOpen,
  onClose,
  onSave,
}: {
  currentAvatar?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (url?: string) => void;
}) {
  const [selectedUrl, setSelectedUrl] = useState<string | undefined>(
    currentAvatar,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedUrl(currentAvatar);
  }, [currentAvatar, isOpen]);

  if (!isOpen) return null;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setSelectedUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div
      className="wb-avatar-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="wb-avatar-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wb-avatar-modal-title"
      >
        <div className="wb-avatar-modal-header">
          <h3 id="wb-avatar-modal-title">แก้ไขรูปโปรไฟล์</h3>
          <button
            type="button"
            className="wb-avatar-modal-close"
            aria-label="ปิด"
            onClick={onClose}
          >
            <LuX aria-hidden="true" />
          </button>
        </div>

        <div className="wb-avatar-modal-body">
          <div className="wb-avatar-modal-preview-section">
            <div className="wb-avatar-modal-preview-circle">
              {selectedUrl ? (
                <img
                  src={selectedUrl}
                  alt="ตัวอย่างรูปโปรไฟล์"
                  className="wb-avatar-modal-preview-img"
                />
              ) : (
                <WebBImage
                  className="wb-dashboard-avatar-image"
                  alt="ภาพตัวอย่างนักเรียน"
                />
              )}
            </div>
            <span className="wb-avatar-modal-preview-text">
              {selectedUrl ? "ตัวอย่างรูปภาพที่เลือก" : "รูปภาพเริ่มต้นของระบบ"}
            </span>
          </div>

          <div className="wb-avatar-modal-upload-box">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="wb-avatar-modal-file-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <LuUpload className="wb-avatar-modal-icon" aria-hidden="true" />
              <span>
                <b>อัปโหลดรูปภาพใหม่จากอุปกรณ์</b>
                <small>รองรับไฟล์ JPG, PNG, GIF, WebP (สูงสุด 5MB)</small>
              </span>
            </button>
          </div>

          <div className="wb-avatar-modal-presets">
            <label className="wb-avatar-modal-presets-label">
              หรือเลือกจากรูปตัวอย่าง:
            </label>
            <div className="wb-avatar-modal-preset-grid">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`wb-avatar-preset-btn${isSelected ? " is-selected" : ""}`}
                    onClick={() => setSelectedUrl(preset.url)}
                    aria-label={`เลือก ${preset.label}`}
                  >
                    <img src={preset.url} alt={preset.label} />
                    {isSelected && (
                      <span className="wb-avatar-preset-check">
                        <LuCheck aria-hidden="true" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="wb-avatar-modal-footer">
          {selectedUrl ? (
            <button
              type="button"
              className="wb-avatar-modal-reset-btn"
              onClick={() => setSelectedUrl(undefined)}
            >
              <LuRotateCcw aria-hidden="true" /> คืนค่ารูปเริ่มต้น
            </button>
          ) : (
            <span />
          )}
          <div className="wb-avatar-modal-footer-actions">
            <button
              type="button"
              className="wb-profile-cancel"
              onClick={onClose}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              className="wb-profile-save"
              onClick={() => onSave(selectedUrl)}
            >
              บันทึกแก้ไข
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentProfile({
  student,
  onSave,
  onCancel,
  onPasswordSaved,
  onOpenAvatarModal,
  onResetAvatar,
}: {
  student: StudentInfo;
  onSave: (student: StudentInfo) => void;
  onCancel: () => void;
  onPasswordSaved: () => void;
  onOpenAvatarModal?: () => void;
  onResetAvatar?: () => void;
}) {
  const [personalOpen, setPersonalOpen] = useState(true);
  const [passwordOpen, setPasswordOpen] = useState(true);
  const [citizenIdMasked, setCitizenIdMasked] = useState(true);
  const [visiblePassword, setVisiblePassword] = useState<
    Record<string, boolean>
  >({});
  const [passwordError, setPasswordError] = useState("");
  const [firstName, ...lastNameParts] = student.name.split(" ");
  const lastName = lastNameParts.join(" ");

  function getDisplayCitizenId() {
    const raw = student.citizenId || "1-6799-12345-34-1";
    if (!citizenIdMasked) return raw;
    return maskCitizenId(raw);
  }

  function savePersonal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    const saved: StudentInfo = {
      ...student,
      name: [data.firstName, data.lastName].filter(Boolean).join(" "),
      citizenId: String(data.citizenId || student.citizenId),
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
    if (account)
      safeWrite(DEMO_ACCOUNT_KEY, {
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
        <div className="wb-profile-input-wrapper">
          <input
            name={name}
            type={visible ? "text" : "password"}
            placeholder={label}
            minLength={name === "currentPassword" ? undefined : 8}
            required
          />
          <button
            type="button"
            className="wb-profile-input-toggle-btn"
            aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            onClick={() =>
              setVisiblePassword((current) => ({
                ...current,
                [name]: !visible,
              }))
            }
          >
            {visible ? (
              <LuEye aria-hidden="true" />
            ) : (
              <LuEyeOff aria-hidden="true" />
            )}
          </button>
        </div>
        {note && <small>{note}</small>}
      </label>
    );
  }

  return (
    <div className="wb-dashboard-view wb-personal-profile">
      <form
        className="wb-dashboard-card wb-profile-form"
        onSubmit={savePersonal}
      >
        <button
          type="button"
          className="wb-profile-section-heading"
          aria-expanded={personalOpen}
          onClick={() => setPersonalOpen((open) => !open)}
        >
          <span className="wb-profile-heading-title">
            <span className="wb-profile-heading-bar" />
            ข้อมูลส่วนตัว
          </span>
          <span className="wb-profile-collapse-circle" aria-hidden="true">
            {personalOpen ? <LuChevronUp /> : <LuChevronDown />}
          </span>
        </button>
        {personalOpen && (
          <>
            <div className="wb-profile-avatar-edit-card">
              <div
                className="wb-profile-avatar-preview-wrap"
                onClick={onOpenAvatarModal}
                title="คลิกเพื่อแก้ไขรูปโปรไฟล์"
              >
                <StudentAvatar
                  large
                  withCamera
                  avatarUrl={student.avatarUrl}
                  onCameraClick={onOpenAvatarModal}
                />
              </div>
              <div className="wb-profile-avatar-info">
                <div className="wb-profile-avatar-title-row">
                  <b>รูปโปรไฟล์</b>
                  {student.avatarUrl ? (
                    <span className="wb-profile-avatar-badge is-custom">
                      รูปภาพที่ตั้งค่าไว้
                    </span>
                  ) : (
                    <span className="wb-profile-avatar-badge is-default">
                      รูปเริ่มต้น
                    </span>
                  )}
                </div>
                <p>
                  คลิกที่รูปหรือกดปุ่มเพื่ออัปโหลดรูปภาพใหม่
                  หรือเลือกรูปตัวอย่าง
                </p>
                <div className="wb-profile-avatar-btn-group">
                  <button
                    type="button"
                    className="wb-profile-avatar-upload-btn"
                    onClick={onOpenAvatarModal}
                  >
                    <LuCamera aria-hidden="true" /> เปลี่ยนรูปโปรไฟล์
                  </button>
                  {student.avatarUrl && (
                    <button
                      type="button"
                      className="wb-profile-avatar-reset-btn"
                      onClick={onResetAvatar}
                    >
                      <LuRotateCcw aria-hidden="true" /> คืนค่ารูปเริ่มต้น
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="wb-profile-fields">
              <label>
                ชื่อผู้ใช้งาน
                <input
                  value={readDemoAccount()?.username ?? student.name}
                  readOnly
                  className="wb-profile-input-readonly"
                />
              </label>
              <label>
                บัตรประชาชน
                <div className="wb-profile-input-wrapper">
                  <input
                    name="citizenId"
                    value={getDisplayCitizenId()}
                    readOnly
                    className="wb-profile-input-readonly"
                  />
                  <button
                    type="button"
                    className="wb-profile-input-toggle-btn"
                    aria-label={
                      citizenIdMasked
                        ? "แสดงเลขบัตรประชาชน"
                        : "ซ่อนเลขบัตรประชาชน"
                    }
                    onClick={() => setCitizenIdMasked((masked) => !masked)}
                  >
                    {citizenIdMasked ? (
                      <LuEyeOff aria-hidden="true" />
                    ) : (
                      <LuEye aria-hidden="true" />
                    )}
                  </button>
                </div>
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
                <input
                  name="phone"
                  type="tel"
                  defaultValue={student.phone}
                  required
                />
              </label>
              <label>
                อีเมล
                <input
                  name="email"
                  type="text"
                  defaultValue={student.email?.split("@")[0] || "Somchai"}
                  required
                />
              </label>
              <label>
                จังหวัด
                <WebBProvinceSelect
                  inputId="webb-profile-province"
                  name="province"
                  defaultValue={student.province}
                />
              </label>
              <label>
                โรงเรียน
                <input
                  name="school"
                  defaultValue={student.school}
                  placeholder="พิมพ์ชื่อโรงเรียน"
                  required
                />
              </label>
              <label>
                ระดับการศึกษา
                <div className="wb-profile-select-wrapper">
                  <select
                    name="education"
                    defaultValue={normalizeEducation(student.grade)}
                  >
                    {educationOptions.map((education) => (
                      <option key={education}>{education}</option>
                    ))}
                  </select>
                  <LuChevronDown
                    className="wb-profile-select-chevron"
                    aria-hidden="true"
                  />
                </div>
              </label>
            </div>
            <div className="wb-profile-form-actions">
              <button
                type="button"
                className="wb-profile-cancel"
                onClick={onCancel}
              >
                ยกเลิก
              </button>
              <button type="submit" className="wb-profile-save">
                บันทึกแก้ไข
              </button>
            </div>
          </>
        )}
      </form>

      <form
        className="wb-dashboard-card wb-profile-password"
        onSubmit={savePassword}
      >
        <div className="wb-profile-password-header">
          <div className="wb-profile-password-heading-group">
            <h2 className="wb-profile-password-title">
              <span className="wb-profile-heading-bar" />
              เปลี่ยนรหัสผ่าน
            </h2>
            <p className="wb-profile-password-desc">
              เพิ่มความปลอดภัยให้บัญชีของคุณด้วยการเปลี่ยนรหัสผ่านอยู่เสมอ
            </p>
          </div>
          <button
            type="button"
            className="wb-profile-collapse-circle"
            aria-label={
              passwordOpen
                ? "ย่อส่วนเปลี่ยนรหัสผ่าน"
                : "ขยายส่วนเปลี่ยนรหัสผ่าน"
            }
            aria-expanded={passwordOpen}
            onClick={() => setPasswordOpen((open) => !open)}
          >
            {passwordOpen ? (
              <LuChevronUp aria-hidden="true" />
            ) : (
              <LuChevronDown aria-hidden="true" />
            )}
          </button>
        </div>
        {passwordOpen && (
          <div className="wb-profile-password-body">
            <div className="wb-profile-password-fields">
              {passwordField("currentPassword", "รหัสผ่านปัจจุบัน")}
              {passwordField(
                "newPassword",
                "รหัสผ่านใหม่",
                "รหัสผ่านใหม่(อักขระ 8-20 ตัว รวมทั้งตัวเลขอย่างน้อย 1 ตัว, ตัวอักษร 1 ตัว และสัญลักษณ์พิเศษ 1 ตัว)",
              )}
              {passwordField("confirmPassword", "ยืนยันรหัสผ่าน")}
            </div>
            {passwordError && (
              <p className="wb-profile-error" role="alert">
                {passwordError}
              </p>
            )}
            <div className="wb-profile-form-actions">
              <button
                type="button"
                className="wb-profile-cancel"
                onClick={onCancel}
              >
                ยกเลิก
              </button>
              <button type="submit" className="wb-profile-save">
                บันทึกแก้ไข
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default function WebBStudentArea({
  mode,
  initialPart,
}: {
  mode: StudentMode;
  initialPart?: string;
}) {
  const [activeView, setActiveView] = useState<StudentView>(modeToView(mode));
  const [student, setStudent] = useState<StudentInfo>(defaultStudent);
  const [productId, setProductId] = useState("tgat-full");
  const [selectedPart, setSelectedPart] = useState(initialPart ?? "tgat1");
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(mode === "ranking");
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [rankingReturnView, setRankingReturnView] =
    useState<StudentView>("results");

  useEffect(() => {
    setActiveView(modeToView(mode));
  }, [mode]);

  useEffect(() => {
    const enforceStudentStatus = () => {
      const account = readDemoAccount();
      if (localStorage.getItem(DEMO_AUTH_KEY) === "true" && account && isDemoStudentSuspended(account.username, account.email)) {
        localStorage.removeItem(DEMO_AUTH_KEY);
        window.dispatchEvent(new Event("webb-demo-auth-updated"));
        window.location.replace("/webb/login");
      }
    };
    enforceStudentStatus();
    window.addEventListener("storage", enforceStudentStatus);
    return () => window.removeEventListener("storage", enforceStudentStatus);
  }, []);

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
    } else if (queryView === "profile" || queryView === "personal") {
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
      const queryPart = new URLSearchParams(window.location.search).get("part");
      if (queryPart) {
        setSelectedPart(queryPart);
      }
    }
    if (
      typeof window !== "undefined" &&
      window.location.hash === "#exam-list"
    ) {
      setTimeout(() => {
        document
          .getElementById("exam-list")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  }, []);

  function handleSaveAvatar(newAvatarUrl?: string) {
    if (newAvatarUrl) {
      localStorage.setItem("webb-demo-avatar", newAvatarUrl);
      setStudent((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
    } else {
      localStorage.removeItem("webb-demo-avatar");
      setStudent((prev) => ({ ...prev, avatarUrl: undefined }));
    }
    setNotice("อัปเดตรูปโปรไฟล์เรียบร้อยแล้ว");
    setAvatarModalOpen(false);
  }

  function handleResetAvatar() {
    localStorage.removeItem("webb-demo-avatar");
    setStudent((prev) => ({ ...prev, avatarUrl: undefined }));
    setNotice("คืนค่ารูปโปรไฟล์เริ่มต้นแล้ว");
  }

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

  const isDetailView = activeView === "detail" || activeView === "subresults";

  const activeTab = isDetailView ? "results" : activeView;

  return (
    <div
      className={`webb-site wb-shell wb-dashboard${isDetailView ? " is-detail-view" : ""}`}
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
            <StudentAvatar avatarUrl={student.avatarUrl} />
            <span>
              <b>{student.name}</b>
              <small>
                {student.grade} · {student.school}
                <br />⌖ {student.province}
              </small>
            </span>
            <i>
              <LuChevronRight aria-hidden="true" />
            </i>
          </button>
        </div>
      </div>
      <main className="wb-dashboard-container wb-dashboard-layout ">
        <StudentSidebar
          student={student}
          onSelect={selectView}
          onOpenAvatarModal={() => setAvatarModalOpen(true)}
        />
        <section className="wb-dashboard-main ">
          {!isDetailView && (
            <nav className="wb-dashboard-tabs " aria-label="ส่วนผู้เข้าสอบ">
              {views.map((view) => (
                <button
                  type="button"
                  key={view.id}
                  className={activeTab === view.id ? "is-active" : ""}
                  aria-current={activeTab === view.id ? "page" : undefined}
                  onClick={() => selectView(view.id)}
                >
                  {view.label}
                </button>
              ))}
            </nav>
          )}
          {!isDetailView && <StudentBanner />}
          {!isDetailView && <MobileEnrollCard onSelect={selectView} />}
          {activeView === "overview" ? (
            <StudentOverview onSelect={selectView} />
          ) : activeView === "exam" ? (
            <ExamRoom />
          ) : activeView === "results" ? (
            <ExamResults onSelect={selectView} student={student} />
          ) : activeView === "subresults" ? (
            <ExamPartDetails
              partId={selectedPart}
              onBack={() => selectView("detail")}
            />
          ) : activeView === "detail" ? (
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
              onOpenAvatarModal={() => setAvatarModalOpen(true)}
              onResetAvatar={handleResetAvatar}
            />
          ) : activeView === "solutions" ? (
            <StudentSolutions onAction={setNotice} />
          ) : activeView === "ranking" ? (
            <ExamResults onSelect={selectView} student={student} />
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
      <AvatarEditModal
        isOpen={avatarModalOpen}
        currentAvatar={student.avatarUrl}
        onClose={() => setAvatarModalOpen(false)}
        onSave={handleSaveAvatar}
      />
    </div>
  );
}
