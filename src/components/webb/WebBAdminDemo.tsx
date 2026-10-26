"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  LuActivity,
  LuChartNoAxesCombined,
  LuCirclePlay,
  LuArrowUpRight,
  LuCreditCard,
  LuFileCheck2,
  LuFileText,
  LuKeyRound,
  LuLayoutDashboard,
  LuLifeBuoy,
  LuPencil,
  LuTag,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import {
  WEBB_PRODUCTS,
  formatBaht,
  formatThaiDate,
  formatThaiDateTimeValue,
  toDateInputValue,
} from "./data";
import WebBThaiDatePicker from "./WebBThaiDatePicker";
import AdminSelect from "@/components/ui/AdminSelect";
import WebBAdminInput from "./WebBAdminInput";
import WebBAdminTextarea from "./WebBAdminTextarea";
import { confirmWebBAction, inputWebBValue } from "./confirm";
import { toast } from "react-toastify";
import { WebBAdminRoleContext } from "./WebBAdminAccess";
import {
  getExamPlan,
  getExamQuestionDetails,
  getExamResponseDetails,
} from "./exam-documents";
import WebBTGAT3AnswerKeyManager from "./WebBTGAT3AnswerKeyManager";
import {
  type TGAT3AnswerRule,
  getTGAT3BlueprintPreset,
} from "./tgat3-scoring";
import {
  defaultSocialSettings,
  productsOverlap,
  safeRead,
  safeWrite,
  setDemoResultsPublished,
  type DemoPurchase,
  type SocialSettings,
} from "./demo-store";
import WebBExamApprovals from "./WebBExamApprovals";
import WebBAdminTable, {
  adminTableCellClass,
  adminTableHeadClass,
} from "./WebBAdminTable";
import WebBModalPortal from "./WebBModalPortal";
import WebBAdminClientReference from "./WebBAdminClientReference";
import WebBDashboardMetrics from "./WebBDashboardMetrics";
import { ExamPartDetails } from "./WebBStudentArea";
import WebBTrendChart, { type TrendMetric, type TrendPoint } from "./WebBTrendChart";
import { TOTAL_MOCK_QUESTIONS } from "./mock-exam-questions";
import { Badge, Button, Panel } from "./WebBAdminPrimitives";
import {
  adminMockKey,
  readAdminMockPurchases,
  readAdminMockRankings,
  writeAdminMockPurchases,
  writeAdminMockRankings,
  WEBB_ADMIN_MOCK_PREFIX,
  WEBB_ADMIN_MOCK_UPDATED,
} from "./webb-admin-mock-store";

export type DemoOrder = {
  ref: string;
  student: string;
  username?: string;
  product: string;
  base: number;
  charged: number;
  method: string;
  day: string;
  status:
    | "สำเร็จ"
    | "รอชำระ"
    | "หมดอายุ"
    | "ยกเลิก"
    | "ไม่สำเร็จ"
    | "คืนเงินแล้ว";
};
type PaysoFeeBreakdown = {
  feeBeforeVat: number;
  vat: number;
  totalDeduction: number;
};

function paysoFeeBreakdown(order: DemoOrder): PaysoFeeBreakdown {
  if (order.status !== "สำเร็จ") {
    return { feeBeforeVat: 0, vat: 0, totalDeduction: 0 };
  }
  const feeBeforeVat = Math.max(5, Math.round(order.charged * 0.0135 * 100) / 100);
  const vat = Math.round(feeBeforeVat * 0.07 * 100) / 100;
  return { feeBeforeVat, vat, totalDeduction: feeBeforeVat + vat };
}

export type DemoStudent = {
  id: string;
  name: string;
  username?: string;
  email: string;
  grade: string;
  school: string;
  joined: string;
  status: "ใช้งาน" | "ระงับ" | "ลบข้อมูลแล้ว";
  entitlements: number;
};
// Keep these values aligned with the education choices in WebBRegistrationFlow.
const registrationEducationOptions = [
  "มัธยมศึกษาปีที่ 4",
  "มัธยมศึกษาปีที่ 5",
  "มัธยมศึกษาปีที่ 6",
  "มัธยมศึกษาตอนต้น",
  "เด็กซิ่ว",
  "อื่นๆ (ผู้ปกครอง, คุณครู)",
];
function normalizeStudentEducation(value: string) {
  const shortGradeMap: Record<string, string> = {
    "ม.4": "มัธยมศึกษาปีที่ 4",
    "ม.5": "มัธยมศึกษาปีที่ 5",
    "ม.6": "มัธยมศึกษาปีที่ 6",
  };
  return shortGradeMap[value] || value;
}
type DemoProduct = {
  id: string;
  name: string;
  parts: string;
  price: number;
  payPrice: number;
  status: "เปิดขาย" | "ปิดขาย";
  version: string;
  trial: boolean;
  contentStatus?: "Draft" | "รอตรวจ" | "เผยแพร่";
  sectionIds?: ("tgat1" | "tgat2" | "tgat3")[];
};
type DemoExamSectionSetting = {
  id: "tgat1" | "tgat2" | "tgat3";
  title: string;
  questionCount: number;
  durationMinutes: number;
  choiceCount: number;
  scoreMaximum: number;
  responseMode: string;
};
type DemoAnswerScoringRule = {
  responseType: "single" | "multiple" | "linked";
  maxScore: number;
  partialScore: number;
};
type DemoTicket = {
  id: string;
  student: string;
  username?: string;
  product: string;
  productId?: string;
  purchaseRef?: string;
  examSet?: string;
  reason: string;
  date: string;
  status: "รอตรวจสอบ" | "อนุมัติ" | "ไม่อนุมัติ";
};
type DemoAttempt = {
  id: string;
  student: string;
  username?: string;
  product: string;
  started: string;
  status: "ส่งแล้ว" | "กำลังสอบ" | "รอเริ่มสอบ" | "ผิดปกติ" | "ยกเลิก";
  score: string;
  events?: { time: string; action: string; detail: string }[];
};
type DemoAdmin = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ใช้งาน" | "ปิดใช้งาน";
};
type DemoLog = { time: string; actor: string; action: string; target: string };
type DemoExamDocument = {
  id: string;
  productId: string;
  trial?: boolean;
  productName: string;
  examSet: string;
  sectionId?: string;
  sectionTitle?: string;
  name: string;
  size: number;
  status: "รอตรวจ" | "เผยแพร่";
  addedAt: string;
};
type DemoExamSet = {
  id: string;
  productId: string;
  name: string;
  version: string;
  contentStatus: "Draft" | "รอตรวจ" | "เผยแพร่";
  questionCount: number;
};
type DemoSolution = {
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
  social?: string;
};
type ResultOverviewRow = {
  id: string;
  student: string;
  citizenId: string;
  grade: string;
  school: string;
  province: string;
  submittedAt: string;
  duration: string;
  rank: number;
  rankTotal: number;
  product: string;
  packageName: string;
  set: string;
  total: number;
  tgat1: number;
  tgat2: number;
  tgat3: number;
  status: string;
};

const thaiResultMonths: Record<string, number> = {
  "ม.ค.": 1,
  "ก.พ.": 2,
  "มี.ค.": 3,
  "เม.ย.": 4,
  "พ.ค.": 5,
  "มิ.ย.": 6,
  "ก.ค.": 7,
  "ส.ค.": 8,
  "ก.ย.": 9,
  "ต.ค.": 10,
  "พ.ย.": 11,
  "ธ.ค.": 12,
};

function thaiResultDateKey(value: string) {
  const [dayText, monthText, yearText] = value.trim().split(/\s+/);
  const month = thaiResultMonths[monthText];
  const day = Number(dayText);
  const year = Number(yearText) - 543;
  if (!month || !Number.isInteger(day) || !Number.isInteger(year)) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type PermissionResource =
  | "overview"
  | "exams"
  | "students"
  | "finance"
  | "results";
type PermissionAction = "view" | "add" | "edit" | "approve";
type RolePermissions = Record<
  string,
  Record<PermissionResource, Record<PermissionAction, boolean>>
>;
const permissionRows: { key: PermissionResource; label: string }[] = [
  { key: "overview", label: "ภาพรวม" },
  { key: "exams", label: "ชุดข้อสอบ / เฉลย" },
  { key: "students", label: "สมาชิก / สิทธิ์สอบ" },
  { key: "finance", label: "การเงิน" },
  { key: "results", label: "ผลสอบ / Ranking" },
];
const permissionActions: { key: PermissionAction; label: string }[] = [
  { key: "view", label: "ดู" },
  { key: "add", label: "เพิ่ม" },
  { key: "edit", label: "แก้ไข" },
  { key: "approve", label: "อนุมัติ" },
];
const defaultRolePermissions: RolePermissions = {
  "Super Admin": Object.fromEntries(
    permissionRows.map(({ key }) => [
      key,
      { view: true, add: true, edit: true, approve: true },
    ]),
  ) as RolePermissions[string],
  Content: {
    overview: { view: true, add: false, edit: false, approve: false },
    exams: { view: true, add: true, edit: true, approve: false },
    students: { view: false, add: false, edit: false, approve: false },
    finance: { view: false, add: false, edit: false, approve: false },
    results: { view: true, add: false, edit: true, approve: false },
  },
  Support: {
    overview: { view: true, add: false, edit: false, approve: false },
    exams: { view: false, add: false, edit: false, approve: false },
    students: { view: true, add: false, edit: true, approve: true },
    finance: { view: false, add: false, edit: false, approve: false },
    results: { view: false, add: false, edit: false, approve: false },
  },
  Finance: {
    overview: { view: true, add: false, edit: false, approve: false },
    exams: { view: false, add: false, edit: false, approve: false },
    students: { view: false, add: false, edit: false, approve: false },
    finance: { view: true, add: false, edit: false, approve: true },
    results: { view: false, add: false, edit: false, approve: false },
  },
};

const initialOrders: DemoOrder[] = [
  {
    ref: "DO-2570-0001",
    student: "สมชาย ศิริกุล",
    product: "Full TGAT",
    base: 179,
    charged: 197,
    method: "PromptPay QR",
    day: "2026-07-14",
    status: "สำเร็จ",
  },
  {
    ref: "DO-2570-0002",
    student: "ณิชา วัฒนกุล",
    product: "Full TGAT · ชุด A",
    base: 179,
    charged: 197,
    method: "PromptPay QR",
    day: "2026-10-04",
    status: "สำเร็จ",
  },
  {
    ref: "DO-2570-0003",
    student: "ธนกร พิพัฒน์กุล",
    product: "Full TGAT · ชุด A",
    base: 179,
    charged: 197,
    method: "PromptPay QR",
    day: "2026-10-03",
    status: "สำเร็จ",
  },
  {
    ref: "DO-2570-0004",
    student: "พิมพ์ชนก สุขใจ",
    product: "Full TGAT · ชุด A",
    base: 179,
    charged: 197,
    method: "PromptPay QR",
    day: "2026-10-02",
    status: "สำเร็จ",
  },
  {
    ref: "DO-2570-0005",
    student: "กัญญารัตน์ จิตดี",
    product: "Full TGAT · ชุด A",
    base: 179,
    charged: 197,
    method: "PromptPay QR",
    day: "2026-10-01",
    status: "หมดอายุ",
  },
  {
    ref: "DO-2570-0006",
    student: "ปภังกร รัตนกุล",
    product: "Full TGAT · ชุด A",
    base: 179,
    charged: 197,
    method: "PromptPay QR",
    day: "2026-10-05",
    status: "รอชำระ",
  },
  {
    ref: "DO-2570-0007",
    student: "วริศรา รุ่งเรือง",
    product: "Full TGAT · ชุด A",
    base: 179,
    charged: 197,
    method: "PromptPay QR",
    day: "2026-10-06",
    status: "สำเร็จ",
  },
];
const initialStudents: DemoStudent[] = [
  {
    id: "ST-001",
    name: "สมชาย ศิริกุล",
    username: "sss",
    email: "somchai@example.com",
    grade: "ม.6",
    school: "โรงเรียนตัวอย่างวิทยา",
    joined: "2026-07-14",
    status: "ใช้งาน",
    entitlements: 1,
  },
  {
    id: "ST-002",
    name: "ณิชา วัฒนกุล",
    email: "nicha.w@example.test",
    grade: "ม.6",
    school: "โรงเรียนเตรียมศึกษา",
    joined: "2026-09-24",
    status: "ใช้งาน",
    entitlements: 1,
  },
  {
    id: "ST-003",
    name: "ธนกร พิพัฒน์กุล",
    email: "thanakorn@example.test",
    grade: "ม.5",
    school: "โรงเรียนหอพระ",
    joined: "2026-10-01",
    status: "ใช้งาน",
    entitlements: 1,
  },
  {
    id: "ST-004",
    name: "พิมพ์ชนก สุขใจ",
    email: "pimchanok@example.test",
    grade: "ม.6",
    school: "โรงเรียนยุพราชวิทยาลัย",
    joined: "2026-10-01",
    status: "ใช้งาน",
    entitlements: 1,
  },
  {
    id: "ST-005",
    name: "กัญญารัตน์ จิตดี",
    email: "kanyarat@example.test",
    grade: "ม.6",
    school: "โรงเรียนแก่นนครวิทยาลัย",
    joined: "2026-09-28",
    status: "ใช้งาน",
    entitlements: 0,
  },
  {
    id: "ST-006",
    name: "ปภังกร รัตนกุล",
    email: "papangkorn@example.test",
    grade: "ม.5",
    school: "โรงเรียนหอพระ",
    joined: "2026-10-04",
    status: "ใช้งาน",
    entitlements: 0,
  },
  {
    id: "ST-007",
    name: "วริศรา รุ่งเรือง",
    username: "varisara",
    email: "varisara@example.test",
    grade: "ม.6",
    school: "โรงเรียนยุพราชวิทยาลัย",
    joined: "2026-10-06",
    status: "ใช้งาน",
    entitlements: 1,
  },
];
const initialProducts: DemoProduct[] = WEBB_PRODUCTS.map((p, i) => ({
  id: p.id,
  name: p.name,
  parts: p.parts,
  price: p.id === "tgat-full" ? 179 : p.price,
  payPrice: ({ tgat1: 110, tgat2: 110, tgat3: 110, tgat23: 198, "tgat-full": 197 } as Record<string, number>)[p.id] ?? p.price,
  status: p.id === "tgat-full" ? "เปิดขาย" : "ปิดขาย",
  version: `TGAT-2026.${i + 1}`,
  trial: i === 0,
  contentStatus: p.id === "tgat-full" ? "เผยแพร่" : "Draft",
  sectionIds: getExamPlan(p.id, "A").sections.map((section) => section.id),
}));
const initialExamSectionSettings: DemoExamSectionSetting[] = getExamPlan(
  "tgat-full",
  "A",
).sections.map((section) => ({
  id: section.id,
  title: section.title,
  questionCount: section.questionCount,
  durationMinutes: section.durationMinutes,
  choiceCount: section.choiceCount,
  scoreMaximum: 100,
  responseMode:
    section.id === "tgat3"
      ? "คำตอบหลายรูปแบบ · มีคะแนนบางส่วน"
      : `ปรนัยคำตอบเดียว · ${section.choiceCount} ตัวเลือก`,
}));
function defaultAnswerScoringRules(
  productId: string,
  questionCount: number,
  sections: {
    id: string;
    answerIndexStart: number;
    questionCount: number;
    questionStart?: number;
    durationMinutes?: number;
    choiceCount?: number;
  }[] = [],
): DemoAnswerScoringRule[] {
  const plan = {
    sections: sections as ReturnType<typeof getExamPlan>["sections"],
    questionCount,
    durationMinutes: sections.reduce(
      (sum, section) => sum + (section.durationMinutes || 0),
      0,
    ),
    hasSuppliedExam: true,
    sourceSet: "04" as const,
  };
  return Array.from({ length: questionCount }, (_, index) => {
    const responseType =
      productId === "tgat3"
        ? getExamResponseDetails(getExamPlan("tgat3", "A"), index).responseType
        : getExamResponseDetails(plan, index).responseType;
    const maxScore = 1;
    return {
      responseType,
      maxScore,
      partialScore: responseType === "multiple" ? 0.25 : 0,
    };
  });
}
const initialExamSets: DemoExamSet[] = initialProducts.map((product) => ({
  id: product.id + ":A",
  productId: product.id,
  name: "A",
  version: product.version,
  contentStatus: product.contentStatus || "Draft",
  questionCount: getExamPlan(product.id, "A").questionCount,
}));
const initialTickets: DemoTicket[] = [{
  id: "TKT-2570-0001",
  student: "วริศรา รุ่งเรือง",
  username: "varisara",
  product: "Full TGAT · ชุด A",
  productId: "tgat-full",
  purchaseRef: "DO-2570-0007",
  examSet: "A",
  reason: "อินเทอร์เน็ตขัดข้องระหว่างทำ TGAT3 ระบบส่งคำตอบไม่ครบ ขอเปิดสอบใหม่ตามสิทธิ์รายการซื้อ",
  date: "2026-10-06 11:42",
  status: "รอตรวจสอบ",
}];
const initialAttempts: DemoAttempt[] = [
  {
    id: "ATT-001",
    student: "สมชาย ศิริกุล",
    product: "Full TGAT · ชุด A",
    started: "2026-07-15 09:10",
    status: "ส่งแล้ว",
    score: "60.7 / 100",
  },
  {
    id: "ATT-002",
    student: "ณิชา วัฒนกุล",
    product: "Full TGAT · ชุด A",
    started: "2026-10-04 13:00",
    status: "ส่งแล้ว",
    score: "71.2 / 100",
  },
  {
    id: "ATT-003",
    student: "ธนกร พิพัฒน์กุล",
    product: "Full TGAT · ชุด A",
    started: "2026-10-03 10:00",
    status: "ส่งแล้ว",
    score: "58.3 / 100",
  },
  {
    id: "ATT-004",
    student: "พิมพ์ชนก สุขใจ",
    product: "Full TGAT · ชุด A",
    started: "2026-10-02 15:00",
    status: "ส่งแล้ว",
    score: "66.5 / 100",
  },
  {
    id: "ATT-005",
    student: "วริศรา รุ่งเรือง",
    username: "varisara",
    product: "Full TGAT · ชุด A",
    started: "2026-10-06 11:05",
    status: "ผิดปกติ",
    score: "—",
    events: [
      { time: "2026-10-06 11:05", action: "เริ่มสอบ", detail: "TGAT ชุด A · TGAT3" },
      { time: "2026-10-06 11:38", action: "การเชื่อมต่อขาดหาย", detail: "ส่งคำตอบไม่ครบ · บันทึกสถานะผิดปกติ" },
    ],
  },
];
const initialAdmins: DemoAdmin[] = [
  {
    id: "ADM-001",
    name: "ผู้ดูแลระบบ",
    email: "admin@example.test",
    role: "Super Admin",
    status: "ใช้งาน",
  },
  {
    id: "ADM-002",
    name: "ทีมเนื้อหา",
    email: "content@example.test",
    role: "Content",
    status: "ใช้งาน",
  },
  {
    id: "ADM-003",
    name: "ทีมช่วยเหลือ",
    email: "support@example.test",
    role: "Support",
    status: "ใช้งาน",
  },
  {
    id: "ADM-004",
    name: "ทีมการเงิน",
    email: "finance@example.test",
    role: "Finance",
    status: "ใช้งาน",
  },
];
const initialLogs: DemoLog[] = [
  {
    time: "2026-10-05 09:20",
    actor: "ผู้ดูแลระบบ",
    action: "เข้าสู่ระบบ",
    target: "Web B Admin",
  },
  {
    time: "2026-10-04 15:13",
    actor: "ทีมช่วยเหลือ",
    action: "ตรวจสอบสิทธิ์หลังชำระเงิน",
    target: "DO-2570-0002",
  },
  {
    time: "2026-10-04 13:05",
    actor: "ทีมการเงิน",
    action: "ตรวจสอบ Webhook",
    target: "DO-2570-0002",
  },
];

function normalizeOrders(value: DemoOrder[]): DemoOrder[] {
  return value.map((order) => ({ ...order, method: "PromptPay QR" }));
}

function useDemoData<T>(key: string, seed: T, normalize?: (value: T) => T) {
  const [value, setValue] = useState(seed);
  const valueRef = useRef(value);
  const seedRef = useRef(seed);
  const normalizeRef = useRef(normalize);
  seedRef.current = seed;
  normalizeRef.current = normalize;
  const [loadedKey, setLoadedKey] = useState("");
  useEffect(() => {
    const refresh = () => {
      try {
        const saved = localStorage.getItem(adminMockKey(key));
        if (saved) {
          const raw = JSON.parse(saved) as T;
          const parsed = normalizeRef.current
            ? normalizeRef.current(raw)
            : raw;
          valueRef.current = parsed;
          setValue(parsed);
        } else {
          const currentSeed = seedRef.current;
          const initial = normalizeRef.current
            ? normalizeRef.current(currentSeed)
            : currentSeed;
          valueRef.current = initial;
          setValue(initial);
        }
      } catch {
        // Keep the built-in demo data if browser storage is unavailable.
      } finally {
        setLoadedKey(key);
      }
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(WEBB_ADMIN_MOCK_UPDATED, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(WEBB_ADMIN_MOCK_UPDATED, refresh);
    };
  }, [key]);
  const update = (next: T | ((current: T) => T)) => {
    const updated =
      typeof next === "function"
        ? (next as (current: T) => T)(valueRef.current)
        : next;
    valueRef.current = updated;
    setValue(updated);
    try {
      localStorage.setItem(adminMockKey(key), JSON.stringify(updated));
    } catch {
      // The current page remains usable without persistence.
    }
    window.dispatchEvent(new Event(WEBB_ADMIN_MOCK_UPDATED));
  };
  return [value, update, loadedKey === key] as const;
}

function Section({
  id,
  title,
  detail,
  action,
  actionEnabledWhenReadOnly = false,
  actionFullWidth = false,
  headerNoWrap = false,
  children,
}: {
  id: string;
  title: string;
  detail?: string;
  action?: ReactNode;
  actionEnabledWhenReadOnly?: boolean;
  actionFullWidth?: boolean;
  headerNoWrap?: boolean;
  children: ReactNode;
}) {
  const {
    screen: activeScreen,
    orderTab,
    examView,
    examTab,
    rolePermissions,
    embedded,
  } = useContext(AdminScreenContext);
  const role = useContext(WebBAdminRoleContext);
  const examTableSections = ["products"];
  const trialDetailSections =
    examTab === "content" ? ["content"] : ["products"];
  const realExamDetailSections: Record<ExamTab, string[]> = {
    overview: ["products"],
    content: ["content"],
    offers: ["products"],
    access: ["entitlements", "approvals"],
    activity: ["attempts", "results"],
    results: ["results"],
    solutions: ["solutions"],
  };
  const managedExamSections: Record<ExamTab, string[]> = {
    overview: [],
    content: ["content"],
    offers: ["products"],
    access: ["entitlements", "approvals"],
    activity: ["attempts"],
    results: ["results"],
    solutions: ["solutions"],
  };
  const sectionResource: Partial<Record<string, PermissionResource>> = {
    dashboard: "overview",
    students: "students",
    entitlements: "students",
    approvals: "students",
    attempts: "students",
    orders: "finance",
    payments: "finance",
    finance: "finance",
    products: "exams",
    content: "exams",
    solutions: "exams",
    results: "results",
  };
  const resource = sectionResource[id];
  const access = resource ? rolePermissions[role]?.[resource] : undefined;
  const canView =
    role === "Super Admin" ||
    (resource ? access?.view === true : role === "Super Admin");
  const visible =
    canView &&
    (activeScreen === "all" ||
      (activeScreen === "trial-exams" &&
        (examView === "table"
          ? examTableSections.includes(id)
          : trialDetailSections.includes(id))) ||
      (activeScreen === "real-exams" &&
        (examView === "table"
          ? examTableSections.includes(id)
          : realExamDetailSections[examTab].includes(id))) ||
      (activeScreen === "exam-management" &&
        managedExamSections[examTab].includes(id)) ||
      (activeScreen === "settings" && id === "settings") ||
      (activeScreen === "admins" && id === "admins") ||
      ((activeScreen === "orders" || activeScreen === "payments") &&
        id === "orders" &&
        orderTab === "orders") ||
      ((activeScreen === "orders" || activeScreen === "payments") &&
        id === "payments" &&
        orderTab === "payments") ||
      (activeScreen === id && id !== "orders" && id !== "payments"));
  if (!visible) return null;
  const canEdit =
    role === "Super Admin" ||
    Boolean(access && (access.add || access.edit || access.approve));
  const hasHeading = Boolean(title.trim() || detail?.trim());
  const hasSectionHeader = hasHeading || Boolean(action);
  return (
    <section
      id={id}
      className={
        embedded
          ? "h-full flex flex-col min-h-0"
          : `scroll-mt-24 ${hasSectionHeader ? "space-y-4" : ""}`
      }
    >
      {!embedded ? (
        hasHeading || action ? (
          <div
            className={`shrink-0 flex flex-wrap items-end justify-between gap-3 ${
              headerNoWrap ? "2xl:flex-nowrap" : ""
            }`}
          >
            {hasHeading && (
              <div>
                {title.trim() && <h2 className="text-xl font-bold text-slate-900">{title}</h2>}
                {detail?.trim() && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
              </div>
            )}
            {action && (
              <fieldset
                disabled={!canEdit && !actionEnabledWhenReadOnly}
                className={`m-0 min-w-0 border-0 p-0 ${actionFullWidth ? "w-full" : ""}`}
              >
                {action}
              </fieldset>
            )}
          </div>
        ) : null
      ) : action ? (
        <div className="shrink-0 flex justify-end pb-2">
          <fieldset
            disabled={!canEdit && !actionEnabledWhenReadOnly}
            className="m-0 min-w-0 border-0 p-0"
          >
            {action}
          </fieldset>
        </div>
      ) : null}
      <fieldset
        disabled={!canEdit}
        className={
          embedded
            ? `m-0 min-w-0 border-0 p-0 flex-1 min-h-0 flex flex-col ${hasSectionHeader ? "mt-2" : ""}`
            : "m-0 min-w-0 space-y-4 border-0 p-0"
        }
      >
        <legend className="sr-only">{title}</legend>
        {children}
      </fieldset>
      {!canEdit && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
          บทบาท {role} ดูข้อมูลได้ แต่ไม่มีสิทธิ์แก้ไขส่วนนี้
        </p>
      )}
    </section>
  );
}
const adminSecondaryButtonClass =
  "rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50";
const th = adminTableHeadClass;
const td = adminTableCellClass;
const money = (n: number) =>
  `${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;
function getClientReadiness(product: DemoProduct, salesOpen: boolean) {
  if (!WEBB_PRODUCTS.some((item) => item.id === product.id)) {
    return {
      tone: "amber" as const,
      label: "ยังไม่อยู่ในรายการซื้อของ Client",
    };
  }
  if (product.trial && product.id !== "tgat1") {
    return { tone: "amber" as const, label: "ยังไม่รองรับใน Client" };
  }
  if (!getExamPlan(product.id, "A").hasSuppliedExam) {
    return { tone: "amber" as const, label: "ยังไม่มีข้อสอบใน Client" };
  }
  if (
    product.trial &&
    product.id === "tgat1" &&
    (!salesOpen ||
      product.status === "ปิดขาย" ||
      product.contentStatus !== "เผยแพร่")
  ) {
    return {
      tone: "blue" as const,
      label: "ทดลอง TGAT1 ได้ · การซื้อชุดนี้ยังไม่พร้อม",
    };
  }
  if (!salesOpen || product.status === "ปิดขาย") {
    return { tone: "gray" as const, label: "ปิดขายใน Client" };
  }
  if (product.contentStatus !== "เผยแพร่") {
    return { tone: "amber" as const, label: "Client ยังซื้อ/สอบไม่ได้" };
  }
  return {
    tone: "green" as const,
    label:
      product.trial && product.id === "tgat1"
        ? "ซื้อได้ · ทดลองฟรีใช้โจทย์คงที่"
        : "พร้อมซื้อและสอบใน Client",
  };
}
type ExamTab =
  | "overview"
  | "content"
  | "offers"
  | "access"
  | "activity"
  | "results"
  | "solutions";
const examTabIcons: Record<ExamTab, typeof LuLayoutDashboard> = {
  overview: LuLayoutDashboard,
  content: LuFileText,
  offers: LuTag,
  access: LuKeyRound,
  activity: LuActivity,
  results: LuChartNoAxesCombined,
  solutions: LuCirclePlay,
};
const managedExamTabResource: Partial<Record<ExamTab, PermissionResource>> = {
  content: "exams",
  offers: "exams",
  access: "students",
  activity: "students",
  results: "results",
};
const AdminScreenContext = createContext({
  screen: "all",
  orderTab: "orders" as "orders" | "payments",
  examView: "table" as "table" | "detail",
  examTab: "overview" as ExamTab,
  rolePermissions: defaultRolePermissions,
  embedded: false,
});
function downloadCsv(
  filename: string,
  headings: string[],
  rows: (string | number)[][],
) {
  const csv = [headings, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function WebBAdminDemo({
  activeScreen = "overview",
  initialExamTab,
  initialProductId,
  initialFamilyId,
  embedded = false,
  onStepChange,
  offerTable = false,
  hideProductSelector = false,
}: {
  activeScreen?: string;
  initialExamTab?: string;
  initialProductId?: string;
  initialFamilyId?: string;
  embedded?: boolean;
  onStepChange?: (tab: "content", productId?: string) => void;
  offerTable?: boolean;
  hideProductSelector?: boolean;
}) {
  const activeRole = useContext(WebBAdminRoleContext);
  const [orderTab, setOrderTab] = useState<"orders" | "payments">(
    activeScreen === "payments" ? "payments" : "orders",
  );
  const [examView, setExamView] = useState<"table" | "detail">(
    (activeScreen === "exam-management" || activeScreen === "trial-exams") &&
    !offerTable
      ? "detail"
      : "table",
  );
  const [examTab, setExamTab] = useState<ExamTab>(() =>
    activeScreen === "trial-exams"
      ? "content"
      : activeScreen === "exam-management" &&
          ["overview", "content", "offers", "access", "activity", "results", "solutions"].includes(
            initialExamTab || "",
          )
        ? (initialExamTab as ExamTab)
        : "overview",
  );
  const externalExamTabRef = useRef(initialExamTab);
  const [permissionRole, setPermissionRole] = useState("Content");
  const [rolePermissions, setRolePermissions] = useDemoData<RolePermissions>(
    "role-permissions",
    defaultRolePermissions,
  );
  const [rolePermissionDraft, setRolePermissionDraft] =
    useState<RolePermissions>(defaultRolePermissions);
  const [orders, setOrders] = useDemoData<DemoOrder[]>("orders", initialOrders, normalizeOrders);
  const [students, setStudents] = useDemoData<DemoStudent[]>(
    "students",
    initialStudents,
  );
  const [products, setProducts] = useDemoData<DemoProduct[]>(
    "products",
    initialProducts,
  );
  const [examSectionSettings, setExamSectionSettings] = useDemoData<
    DemoExamSectionSetting[]
  >("exam-section-settings", initialExamSectionSettings);
  const [trialExamSectionSettings, setTrialExamSectionSettings] =
    useDemoData<DemoExamSectionSetting[]>(
      "trial-exam-section-settings",
      initialExamSectionSettings.filter((section) => section.id === "tgat1"),
    );
  const [examSets, setExamSets] = useDemoData<DemoExamSet[]>(
    "exam-sets",
    initialExamSets,
  );
  const [tickets, setTickets] = useDemoData<DemoTicket[]>(
    "tickets",
    initialTickets,
  );
  const [attempts, setAttempts] = useDemoData<DemoAttempt[]>(
    "attempts",
    initialAttempts,
  );
  const [demoPurchases, setDemoPurchases] = useState<DemoPurchase[]>([]);
  const [demoRankings, setDemoRankings] = useState<
    ReturnType<typeof readAdminMockRankings>
  >([]);
  const [admins, setAdmins] = useDemoData<DemoAdmin[]>("admins", initialAdmins);
  const [logs, setLogs] = useDemoData<DemoLog[]>("logs", initialLogs);
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ทั้งหมด");
  const [webhookTypeFilter, setWebhookTypeFilter] = useState("ทั้งหมด");
  const [webhookStatusFilter, setWebhookStatusFilter] = useState("ทั้งหมด");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentGradeFilter, setStudentGradeFilter] = useState("ทุกระดับชั้น");
  const [studentStatusFilter, setStudentStatusFilter] = useState("ทุกสถานะ");
  const [studentEntitlementFilter, setStudentEntitlementFilter] = useState("ทุกสิทธิ์");
  const [auditQuery, setAuditQuery] = useState("");
  const [auditActorFilter, setAuditActorFilter] = useState("ทั้งหมด");
  const [auditActionFilter, setAuditActionFilter] = useState("ทั้งหมด");
  const [entitlementStudentId, setEntitlementStudentId] = useState(
    initialStudents.find((student) => student.status === "ใช้งาน")?.id || "",
  );
  const [entitlementStatusFilter, setEntitlementStatusFilter] =
    useState("ทั้งหมด");
  const [entitlementModalOpen, setEntitlementModalOpen] = useState(false);
  const [newEntitlementStatus, setNewEntitlementStatus] =
    useState<DemoPurchase["examStatus"]>("available");
  const [attemptStatusFilter, setAttemptStatusFilter] = useState("ทั้งหมด");
  const [detail, setDetail] = useState<
    | { type: "student"; value: DemoStudent }
    | { type: "order"; value: DemoOrder }
    | { type: "product"; value: DemoProduct }
    | { type: "attempt"; value: DemoAttempt }
    | null
  >(null);
  const [examDocuments, setExamDocuments] = useDemoData<DemoExamDocument[]>(
    "exam-documents",
    [],
  );
  const [selectedExamProductId, setSelectedExamProductId] = useState(
    () =>
      (activeScreen === "exam-management" && initialProductId
        ? initialProductId
        : activeScreen === "real-exams" && initialFamilyId === "tpat"
          ? "tpat1"
          : activeScreen === "real-exams"
            ? initialProducts.find((product) => !product.trial)?.id
            : initialProducts.find((product) => product.trial)?.id) ||
      initialProducts[0]?.id ||
      "",
  );
  const [selectedExamSetId, setSelectedExamSetId] = useState(
    () =>
      ((activeScreen === "trial-exams"
        ? initialProducts.find((product) => product.trial)?.id
        : initialProductId) ||
        initialProducts.find((product) => !product.trial)?.id ||
        initialProducts[0]?.id ||
        "") + ":A",
  );
  const [selectedDocumentPartId, setSelectedDocumentPartId] = useState("");
  const [pendingExamFile, setPendingExamFile] = useState<File | null>(null);
  const [sectionSettingsDraft, setSectionSettingsDraft] =
    useState<DemoExamSectionSetting | null>(null);
  const today = new Date();
  const [fromDate, setFromDate] = useState(
    toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)),
  );
  const [toDate, setToDate] = useState(toDateInputValue(today));
  const [publishedResults, setPublishedResults] = useDemoData(
    "mock-published-results",
    true,
  );
  const [openSales, setOpenSales] = useDemoData("open-sales", true);
  const [socialSettings, setSocialSettings] = useState<SocialSettings>(
    defaultSocialSettings,
  );
  const paymentProvider = "Payso";
  const [webhookEvents, setWebhookEvents] = useDemoData("webhooks", [
    {
      id: "EVT-001",
      order: "DO-2570-0001",
      type: "payment.succeeded",
      status: "ประมวลผลแล้ว",
      received: "2026-10-05 09:02",
    },
    {
      id: "EVT-002",
      order: "DO-2570-0002",
      type: "payment.succeeded",
      status: "ประมวลผลแล้ว",
      received: "2026-10-04 12:57",
    },
    {
      id: "EVT-003",
      order: "DO-2570-0004",
      type: "payment.succeeded",
      status: "ประมวลผลแล้ว",
      received: "2026-10-02 11:20",
    },
    {
      id: "EVT-004",
      order: "DO-2570-0006",
      type: "payment.pending",
      status: "รอดำเนินการ",
      received: "2026-10-05 10:20",
    },
  ] as {
    id: string;
    order: string;
    type: string;
    status: string;
    received: string;
  }[]);
  const [solutions, setSolutions] = useDemoData<DemoSolution[]>("mock-solutions", [
    {
      id: "SOL-001",
      name: "tgat1-set-04.pdf",
      product: "Full TGAT · ชุด A",
      kind: "PDF",
      access: "หลังส่งข้อสอบ",
      active: true,
    },
    {
      id: "SOL-002",
      name: "tgat2-set-04.pdf",
      product: "TGAT2 · ชุด A",
      kind: "PDF",
      access: "หลังส่งข้อสอบ",
      active: true,
    },
    {
      id: "SOL-003",
      name: "tgat3-set-04.pdf",
      product: "Full TGAT · ชุด A",
      kind: "PDF",
      access: "หลังส่งข้อสอบ",
      active: true,
    },
    {
      id: "SOL-004",
      name: "วิดีโอเฉลย · 32:10 นาที",
      product: "Full TGAT · ชุด A",
      kind: "Video",
      access: "หลังส่งข้อสอบ",
      active: true,
      questionNumber: 1,
      duration: "32:10",
      summary:
        "สรุปประเด็นเฉลย · วิดีโอนี้อธิบายแนวคิดและวิธีวิเคราะห์โจทย์ของหัวข้อนี้ พร้อมเทคนิคการตัดตัวเลือก",
      tutor: "ติวเตอร์แมว",
      tutorCredential: "ครุศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย · ประสบการณ์สอน 5 ปี",
      tutorBio: "ติวเตรียมสอบ TGAT และแนะนำเทคนิควิเคราะห์โจทย์",
      pdfName: "ดาวน์โหลดเอกสารเฉลย (PDF)",
      social: "ช่องทางติดตาม",
    },
    {
      id: "SOL-005",
      name: "วิดีโอเฉลย TGAT2 · 28:45 นาที",
      product: "TGAT2 · ชุด A",
      kind: "Video",
      access: "หลังส่งข้อสอบ",
      active: true,
    },
    {
      id: "SOL-006",
      name: "วิดีโอเฉลย TGAT3 · 25:30 นาที",
      product: "Full TGAT · ชุด A",
      kind: "Video",
      access: "หลังส่งข้อสอบ",
      active: true,
    },
  ]);
  const [solutionDraft, setSolutionDraft] = useState<{
    id?: string;
    name: string;
    questionNumber: string;
    kind: string;
    access: string;
    fileSelected: boolean;
    duration: string;
    summary: string;
    tutor: string;
    tutorCredential: string;
    tutorBio: string;
    pdfName: string;
    social: string;
  } | null>(null);
  const [resultsView, setResultsView] = useState<"overview" | "ranking">(
    "overview",
  );
  const [selectedResultReport, setSelectedResultReport] =
    useState<ResultOverviewRow | null>(null);
  const [selectedResultPart, setSelectedResultPart] = useState<
    "TGAT1" | "TGAT2" | "TGAT3" | null
  >(null);
  const [selectedSolutionDetail, setSelectedSolutionDetail] =
    useState<DemoSolution | null>(null);
  const [rankingGradeFilter, setRankingGradeFilter] = useState("ทุกระดับชั้น");
  const [rankingProvinceFilter, setRankingProvinceFilter] =
    useState("ทุกจังหวัด");
  const [rankingTimeFilter, setRankingTimeFilter] = useState("ทุกช่วงเวลา");
  const [resultProductFilter, setResultProductFilter] =
    useState("ทุกประเภทสอบ");
  const [resultSetFilter, setResultSetFilter] = useState("ทุกชุด");
  const [resultPackageFilter, setResultPackageFilter] = useState("ทุกแพ็กเกจ");
  const [resultGradeFilter, setResultGradeFilter] = useState("ทุกระดับชั้น");
  const [resultProvinceFilter, setResultProvinceFilter] =
    useState("ทุกจังหวัด");
  const [resultStatusFilter, setResultStatusFilter] = useState("ทุกสถานะ");
  const [resultSearch, setResultSearch] = useState("");
  const [resultDateFrom, setResultDateFrom] = useState("");
  const [resultDateTo, setResultDateTo] = useState("");
  useEffect(() => {
    if (!solutionDraft && !(offerTable && examView === "detail")) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSolutionDraft(null);
      if (offerTable) setExamView("table");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [solutionDraft, offerTable, examView]);
  useEffect(() => {
    if (!detail) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetail(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [detail]);
  const answerKeyProductId = selectedExamProductId || "tgat1";
  const answerKeyStorageProductId =
    activeScreen === "trial-exams"
      ? `trial-${answerKeyProductId}`
      : answerKeyProductId;
  const selectedExamSet =
    examSets.find(
      (set) =>
        set.id === selectedExamSetId && set.productId === answerKeyProductId,
    ) ||
    examSets.find(
      (set) => set.productId === answerKeyProductId && set.name === "A",
    ) ||
    null;
  const answerKeySetName = selectedExamSet?.name || "A";
  const activeExamSectionSettings =
    activeScreen === "trial-exams"
      ? trialExamSectionSettings
      : examSectionSettings;
  const getManagedExamPlan = (productId: string, examSet = "A") => {
    const base = getExamPlan(productId, examSet);
    const product = products.find((item) => item.id === productId);
    const configuredIds = product?.sectionIds?.length
      ? product.sectionIds
      : base.sections.map((section) => section.id);
    const clientOrder = new Map(
      base.sections.map((section, index) => [section.id, index]),
    );
    const ids = [...configuredIds].sort((left, right) => {
      const leftOrder = clientOrder.get(left) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = clientOrder.get(right) ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder;
    });
    let answerIndexStart = 0;
    let questionStart = 1;
    const sections = ids.map((id) => {
      const source =
        activeExamSectionSettings.find((item) => item.id === id) ||
        initialExamSectionSettings.find((item) => item.id === id)!;
      const original = getExamPlan(id, "A").sections[0];
      const section = {
        ...original,
        ...source,
        questionStart,
        answerIndexStart,
      };
      answerIndexStart += source.questionCount;
      questionStart += source.questionCount;
      return section;
    });
    return {
      ...base,
      sections:
        examSet.toUpperCase() === "A" || examSet === "4" ? sections : [],
      questionCount:
        sections.reduce((sum, section) => sum + section.questionCount, 0) ||
        base.questionCount,
      durationMinutes:
        sections.reduce((sum, section) => sum + section.durationMinutes, 0) ||
        base.durationMinutes,
      hasSuppliedExam: sections.length > 0 && base.hasSuppliedExam,
    };
  };
  const selectedSectionSetting = activeExamSectionSettings.find(
    (section) => section.id === answerKeyProductId,
  );
  useEffect(() => {
    setSectionSettingsDraft(
      selectedSectionSetting ? { ...selectedSectionSetting } : null,
    );
  }, [
    answerKeyProductId,
    selectedSectionSetting?.questionCount,
    selectedSectionSetting?.durationMinutes,
    selectedSectionSetting?.choiceCount,
    selectedSectionSetting?.scoreMaximum,
    selectedSectionSetting?.responseMode,
  ]);
  function saveSectionSettings() {
    if (!sectionSettingsDraft) return;
    const setting = { ...sectionSettingsDraft };
    if (
      ![
        setting.questionCount,
        setting.durationMinutes,
        setting.choiceCount,
        setting.scoreMaximum,
      ].every((value) => Number.isInteger(value) && value > 0)
    )
      return toast.error("จำนวนข้อ เวลา ตัวเลือก และคะแนนเต็มต้องมากกว่า 0");
    const nextSettings = activeExamSectionSettings.map((section) =>
      section.id === setting.id ? setting : section,
    );
    if (activeScreen === "trial-exams") {
      setTrialExamSectionSettings(nextSettings);
    } else {
      setExamSectionSettings(nextSettings);
      setExamSets((current) =>
        current.map((set) => {
          if (set.name !== "A") return set;
          const product = products.find((item) => item.id === set.productId);
          const ids = product?.sectionIds?.length
            ? product.sectionIds
            : getExamPlan(set.productId, set.name).sections.map(
                (section) => section.id,
              );
          const questionCount = ids.reduce(
            (sum, id) =>
              sum +
              (nextSettings.find((item) => item.id === id)?.questionCount || 0),
            0,
          );
          return ids.includes(setting.id) ? { ...set, questionCount } : set;
        }),
      );
    }
    logAction("ปรับโครงสร้างข้อสอบรายพาร์ท", setting.title);
    toast.success("บันทึกการตั้งค่าพาร์ทแล้ว");
  }
  const answerKeyStorageSet = encodeURIComponent(answerKeySetName);
  const [answerKey, setAnswerKey, answerKeyLoaded] = useDemoData<string[]>(
    `answer-key:${answerKeyStorageProductId}:${answerKeyStorageSet}`,
    ["1", "3", "2", "4", "1"],
  );
  const answerKeyPlan = getManagedExamPlan(
    answerKeyProductId,
    answerKeySetName,
  );
  const expectedAnswerCount = answerKeyPlan.questionCount;
  const [answerScoringRules, setAnswerScoringRules, answerScoringRulesLoaded] =
    useDemoData<DemoAnswerScoringRule[]>(
      `answer-scoring:${answerKeyStorageProductId}:${answerKeyStorageSet}`,
      defaultAnswerScoringRules(
        answerKeyProductId,
        expectedAnswerCount,
        answerKeyPlan.sections,
      ),
    );
  const [reviewedAnswers, setReviewedAnswers, reviewedAnswersLoaded] =
    useDemoData<Record<string, boolean>>(
      `reviewed-answers:${answerKeyStorageProductId}:${answerKeyStorageSet}`,
      selectedExamSet?.contentStatus === "เผยแพร่"
        ? Object.fromEntries(
            Array.from(
              {
                length: getManagedExamPlan(answerKeyProductId, answerKeySetName)
                  .questionCount,
              },
              (_, index) => [String(index), true],
            ),
          )
        : {},
    );
  const isTgat3Product = answerKeyProductId === "tgat3";
  const [tgat3Rules, setTgat3Rules, tgat3RulesLoaded] = useDemoData<TGAT3AnswerRule[]>(
    `tgat3-dynamic-rules:${answerKeyStorageSet}`,
    getTGAT3BlueprintPreset(),
  );
  const answerReviewComplete = isTgat3Product
    ? tgat3RulesLoaded && tgat3Rules.length > 0 && tgat3Rules.every((r) => r.isReviewed)
    : answerKeyLoaded &&
      reviewedAnswersLoaded &&
      answerScoringRulesLoaded &&
      answerKey.length === expectedAnswerCount &&
      answerScoringRules.length === expectedAnswerCount &&
      answerKey.every(
        (answer, index) =>
          Boolean(answer && typeof answer === "string" ? answer.trim() : answer) &&
          reviewedAnswers[index] &&
          Number.isFinite(answerScoringRules[index]?.maxScore) &&
          answerScoringRules[index].maxScore > 0 &&
          Number.isFinite(answerScoringRules[index]?.partialScore) &&
          answerScoringRules[index].partialScore >= 0 &&
          answerScoringRules[index].partialScore < answerScoringRules[index].maxScore,
      );
  useEffect(() => {
    if (!answerKeyLoaded || !answerScoringRulesLoaded) return;
    const expectedCount = getManagedExamPlan(
      answerKeyProductId,
      answerKeySetName,
    ).questionCount;
    if (answerKey.length && answerKey.length < expectedCount) {
      const defaults = ["A", "C", "B", "D", "A"];
      setAnswerKey([
        ...answerKey,
        ...Array.from(
          { length: expectedCount - answerKey.length },
          (_, offset) => {
            const index = answerKey.length + offset;
            const responseType = answerScoringRules[index]?.responseType;
            return responseType === "linked"
              ? "A/D"
              : responseType === "multiple"
                ? "2,3,4"
                : defaults[index % defaults.length];
          },
        ),
      ]);
    }
    if (answerKey.length > expectedCount)
      setAnswerKey(answerKey.slice(0, expectedCount));
  }, [
    answerKey.length,
    answerKeyLoaded,
    answerScoringRules,
    answerScoringRulesLoaded,
    answerKeyProductId,
    answerKeySetName,
  ]);
  useEffect(() => {
    if (!answerScoringRulesLoaded) return;
    if (answerScoringRules.length < expectedAnswerCount) {
      setAnswerScoringRules([
        ...answerScoringRules,
        ...defaultAnswerScoringRules(
          answerKeyProductId,
          expectedAnswerCount,
          answerKeyPlan.sections,
        ).slice(answerScoringRules.length),
      ]);
    } else if (answerScoringRules.length > expectedAnswerCount) {
      setAnswerScoringRules(answerScoringRules.slice(0, expectedAnswerCount));
    }
  }, [
    answerScoringRules.length,
    answerScoringRulesLoaded,
    answerKeyProductId,
    answerKeyPlan,
    expectedAnswerCount,
  ]);
  useEffect(() => {
    if (!answerScoringRulesLoaded || !answerKeyLoaded) return;
    if (answerKeyProductId === "tgat3") return;
    const hasTgat3 = answerKeyPlan.sections.some(
      (section) => section.id === "tgat3",
    );
    if (!hasTgat3) return;

    const canonicalRules = defaultAnswerScoringRules(
      answerKeyProductId,
      expectedAnswerCount,
      answerKeyPlan.sections,
    );
    let rulesChanged = false;
    let answersChanged = false;
    const nextAnswers = [...answerKey];
    const nextRules = answerScoringRules.map((rule, index) => {
      const section = answerKeyPlan.sections.find(
        (item) =>
          index >= item.answerIndexStart &&
          index < item.answerIndexStart + item.questionCount,
      );
      if (section?.id !== "tgat3") return rule;

      const canonical = canonicalRules[index];
      const answer = nextAnswers[index] || "";
      const validAnswer =
        canonical.responseType === "single"
          ? /^[A-E]$/i.test(answer)
          : canonical.responseType === "multiple"
            ? /^\d+(\s*,\s*\d+)+$/.test(answer)
            : /^[A-E]\s*\/\s*[A-E]$/i.test(answer);
      if (!validAnswer) {
        nextAnswers[index] =
          canonical.responseType === "multiple"
            ? "1,2"
            : canonical.responseType === "linked"
              ? "A/D"
              : "A";
        answersChanged = true;
      }
      if (
        rule.responseType !== canonical.responseType ||
        rule.maxScore !== canonical.maxScore ||
        rule.partialScore !== canonical.partialScore
      ) {
        rulesChanged = true;
        return canonical;
      }
      return rule;
    });

    if (rulesChanged) setAnswerScoringRules(nextRules);
    if (answersChanged) {
      setAnswerKey(nextAnswers);
      setReviewedAnswers((current) => {
        const next = { ...current };
        answerKeyPlan.sections
          .filter((section) => section.id === "tgat3")
          .forEach((section) => {
            for (
              let index = section.answerIndexStart;
              index < section.answerIndexStart + section.questionCount;
              index += 1
            ) {
              if (nextAnswers[index] !== answerKey[index]) delete next[index];
            }
          });
        return next;
      });
    }
  }, [
    answerKey,
    answerKeyLoaded,
    answerKeyPlan,
    answerKeyProductId,
    answerScoringRules,
    answerScoringRulesLoaded,
    expectedAnswerCount,
    setAnswerKey,
    setAnswerScoringRules,
    setReviewedAnswers,
  ]);
  useEffect(() => {
    const defaultSet =
      examSets.find(
        (set) => set.productId === selectedExamProductId && set.name === "A",
      ) || examSets.find((set) => set.productId === selectedExamProductId);
    if (defaultSet) setSelectedExamSetId(defaultSet.id);
  }, [selectedExamProductId]);
  useEffect(() => setSocialSettings(safeRead(adminMockKey("social-settings"), defaultSocialSettings)), []);
  useEffect(() => setRolePermissionDraft(rolePermissions), [rolePermissions]);
  useEffect(() => {
    const syncPurchases = () => setDemoPurchases(readAdminMockPurchases());
    syncPurchases();
    window.addEventListener("storage", syncPurchases);
    window.addEventListener(WEBB_ADMIN_MOCK_UPDATED, syncPurchases);
    return () => {
      window.removeEventListener("storage", syncPurchases);
      window.removeEventListener(WEBB_ADMIN_MOCK_UPDATED, syncPurchases);
    };
  }, []);
  useEffect(() => {
    const syncRankings = () => setDemoRankings(readAdminMockRankings());
    syncRankings();
    window.addEventListener("storage", syncRankings);
    window.addEventListener(WEBB_ADMIN_MOCK_UPDATED, syncRankings);
    return () => {
      window.removeEventListener("storage", syncRankings);
      window.removeEventListener(WEBB_ADMIN_MOCK_UPDATED, syncRankings);
    };
  }, []);
  const dateFilteredOrders = orders.filter(
    (order) =>
      (!fromDate || order.day >= fromDate) && (!toDate || order.day <= toDate),
  );
  const examProducts =
    activeScreen === "trial-exams"
      ? products.filter((product) => product.id === "tgat1")
      : activeScreen === "exam-management"
        ? products.filter((product) =>
            ["tgat1", "tgat2", "tgat3", "tgat23", "tgat-full"].includes(
              product.id,
            ) || Boolean(product.sectionIds?.length),
          )
        : activeScreen === "real-exams"
          ? products.filter((product) =>
              initialFamilyId === "tpat"
                ? product.id.startsWith("tpat")
                : !product.trial || product.id === "tgat1",
            )
          : products;
  const visibleExamProducts =
    examView === "detail" &&
    (activeScreen === "trial-exams" ||
      activeScreen === "real-exams" ||
      activeScreen === "exam-management")
      ? examProducts.filter((product) => product.id === selectedExamProductId)
      : examProducts;
  const selectedExamProduct =
    products.find((product) => product.id === selectedExamProductId) ||
    visibleExamProducts[0] ||
    null;
  const answerEntryLocked =
    activeRole !== "Super Admin" &&
    !!selectedExamProduct &&
    hasActiveAttempt(selectedExamProduct.name);
  const examSummary = (product: DemoProduct) => {
    const matches = (value: string) =>
      productsOverlap(product.id, value) ||
      value.toLowerCase().includes(product.name.toLowerCase());
    const entitledCount = demoPurchases.filter(
      (purchase) =>
        purchase.paymentStatus !== "refunded" &&
        productsOverlap(product.id, purchase.productId),
    ).length;
    const requestCount = tickets.filter((ticket) =>
      matches(ticket.product),
    ).length;
    const productAttempts = attempts.filter((attempt) =>
      matches(attempt.product),
    );
    const resultCount = productAttempts.filter(
      (attempt) => attempt.status === "ส่งแล้ว" && attempt.score !== "—",
    ).length;
    return {
      entitledCount,
      requestCount,
      attemptCount: productAttempts.length,
      resultCount,
    };
  };
  const matchesSelectedExam = (value: string) => {
    if (!selectedExamProduct) return true;
    const text = value.toLowerCase();
    if (selectedExamProduct.id === "tgat-full")
      return text.includes("full tgat") || /tgat[123]/.test(text);
    return (
      text.includes(selectedExamProduct.name.toLowerCase()) ||
      text.includes(selectedExamProduct.id.toLowerCase())
    );
  };
  const scopedAttempts = (
    examView === "detail"
      ? attempts.filter((attempt) => matchesSelectedExam(attempt.product))
      : attempts
  ).filter(
    (attempt) =>
      attemptStatusFilter === "ทั้งหมด" ||
      attempt.status === attemptStatusFilter,
  );
  const scopedSolutions =
    examView !== "detail" || !selectedExamProduct
      ? solutions
      : solutions.filter(
          (solution) =>
            solution.product.toLowerCase().includes("ทุกชุด") ||
            (matchesSelectedExam(solution.product) &&
              solution.product.includes("ชุด " + answerKeySetName)),
        );
  const successful = dateFilteredOrders.filter(
    (order) => order.status === "สำเร็จ",
  );
  const gross = successful.reduce((sum, order) => sum + order.base, 0);
  const charged = successful.reduce((sum, order) => sum + order.charged, 0);
  const paysoFees = successful.map(paysoFeeBreakdown);
  const paysoFeeBeforeVat = paysoFees.reduce((sum, fee) => sum + fee.feeBeforeVat, 0);
  const paysoFeeVat = paysoFees.reduce((sum, fee) => sum + fee.vat, 0);
  const paysoDeduction = paysoFeeBeforeVat + paysoFeeVat;
  const filteredOrders = useMemo(
    () =>
      dateFilteredOrders.filter(
        (row) =>
          `${row.ref} ${row.student} ${row.product} ${row.status} ${row.method}`
            .toLowerCase()
            .includes(orderQuery.toLowerCase()) &&
          (orderStatusFilter === "ทั้งหมด" ||
            row.status === orderStatusFilter),
      ),
    [dateFilteredOrders, orderQuery, orderStatusFilter],
  );
  const filteredWebhookEvents = useMemo(
    () =>
      webhookEvents.filter(
        (event) =>
          (webhookTypeFilter === "ทั้งหมด" ||
            event.type === webhookTypeFilter) &&
          (webhookStatusFilter === "ทั้งหมด" ||
            event.status === webhookStatusFilter),
      ),
    [webhookEvents, webhookTypeFilter, webhookStatusFilter],
  );
  const filteredStudents = useMemo(
    () =>
      students.filter((row) =>
        `${row.id} ${row.name} ${row.email} ${row.school}`
          .toLowerCase()
          .includes(studentQuery.toLowerCase()) &&
        (studentGradeFilter === "ทุกระดับชั้น" ||
          normalizeStudentEducation(row.grade) === studentGradeFilter) &&
        (studentStatusFilter === "ทุกสถานะ" || row.status === studentStatusFilter) &&
        (studentEntitlementFilter === "ทุกสิทธิ์" ||
          (studentEntitlementFilter === "มีสิทธิ์สอบ"
            ? row.entitlements > 0
            : row.entitlements === 0)),
      ),
    [students, studentQuery, studentGradeFilter, studentStatusFilter, studentEntitlementFilter],
  );
  const filteredAuditLogs = useMemo(
    () =>
      logs.filter(
        (log) =>
          (auditActorFilter === "ทั้งหมด" || log.actor === auditActorFilter) &&
          (auditActionFilter === "ทั้งหมด" ||
            log.action === auditActionFilter) &&
          `${log.time} ${log.actor} ${log.action} ${log.target}`
            .toLowerCase()
            .includes(auditQuery.toLowerCase()),
      ),
    [logs, auditActorFilter, auditActionFilter, auditQuery],
  );
  const activityBars = useMemo(() => {
    const startDate = fromDate
      ? new Date(`${fromDate}T00:00:00`)
      : new Date(
          `${dateFilteredOrders[0]?.day || toDateInputValue(new Date())}T00:00:00`,
        );
    const endDate = toDate ? new Date(`${toDate}T23:59:59`) : new Date();
    const span = Math.max(1, endDate.getTime() - startDate.getTime() + 1);
    return Array.from({ length: 12 }, (_, index) => {
      const bucketStart = startDate.getTime() + (span * index) / 12;
      const bucketEnd = startDate.getTime() + (span * (index + 1)) / 12;
      const count = dateFilteredOrders.filter((order) => {
        const time = new Date(`${order.day}T12:00:00`).getTime();
        return time >= bucketStart && time < bucketEnd;
      }).length;
      return {
        count,
        height: count
          ? Math.max(18, (count / Math.max(1, dateFilteredOrders.length)) * 100)
          : 3,
        from: toDateInputValue(new Date(bucketStart)),
        to: toDateInputValue(new Date(bucketEnd - 1)),
      };
    });
  }, [dateFilteredOrders, fromDate, toDate]);
  const financeBars = useMemo(() => {
    const startDate = fromDate
      ? new Date(`${fromDate}T00:00:00`)
      : new Date(
          `${dateFilteredOrders[0]?.day || toDateInputValue(new Date())}T00:00:00`,
        );
    const endDate = toDate ? new Date(`${toDate}T23:59:59`) : new Date();
    const span = Math.max(1, endDate.getTime() - startDate.getTime() + 1);
    const buckets = Array.from({ length: 12 }, (_, index) => {
      const start = startDate.getTime() + (span * index) / 12;
      const end = startDate.getTime() + (span * (index + 1)) / 12;
      const rows = successful.filter((order) => {
        const time = new Date(`${order.day}T12:00:00`).getTime();
        return time >= start && time < end;
      });
      const grossAmount = rows.reduce((sum, row) => sum + row.base, 0);
      const amount = rows.reduce((sum, row) => sum + row.charged, 0);
      const feeBreakdown = rows.map(paysoFeeBreakdown);
      const feeAmount = feeBreakdown.reduce((sum, fee) => sum + fee.feeBeforeVat, 0);
      const feeVatAmount = feeBreakdown.reduce((sum, fee) => sum + fee.vat, 0);
      return {
        gross: grossAmount,
        amount,
        uplift: amount - grossAmount,
        fee: feeAmount,
        feeVat: feeVatAmount,
        net: amount - feeAmount - feeVatAmount,
        from: toDateInputValue(new Date(start)),
      };
    });
    return buckets;
  }, [dateFilteredOrders, fromDate, successful, toDate]);
  const financeChartData: TrendPoint[] = financeBars.map((bucket) => ({
    day: bucket.from,
    gross: bucket.gross,
    charged: bucket.amount,
    uplift: bucket.uplift,
    fee: bucket.fee,
    feeVat: bucket.feeVat,
    net: bucket.net,
  }));
  const financeChartMetrics: TrendMetric[] = [
    { id: "gross", label: "ราคาสินค้ารวม", color: "#0d9488", axis: "money", value: money(gross) },
    { id: "charged", label: "ยอดเรียกเก็บรวม Payso", color: "#2563eb", axis: "money", value: money(charged), defaultSelected: true },
    { id: "uplift", label: "ส่วนเพิ่มในยอดชำระ", color: "#9333ea", axis: "smallMoney", value: money(charged - gross) },
    { id: "fee", label: "ค่าบริการ Payso ก่อน VAT", color: "#ea580c", axis: "smallMoney", value: money(paysoFeeBeforeVat) },
    { id: "feeVat", label: "VAT 7% ของค่าบริการ", color: "#db2777", axis: "smallMoney", value: money(paysoFeeVat) },
    { id: "net", label: "ยอดรับสุทธิ", color: "#4f46e5", axis: "money", value: money(charged - paysoDeduction), defaultSelected: true },
  ];
  const isFullTgatRanking = selectedExamProduct?.id === "tgat-full";
  const rankingColumns = isFullTgatRanking
    ? ["TGAT1", "TGAT2", "TGAT3", "รวม"]
    : ["คะแนน"];
  const storedRankingRows = demoRankings
    .filter(
      (row) =>
        (!selectedExamProduct || selectedExamProduct.id === row.productId) &&
        (!row.examSet || row.examSet === answerKeySetName) &&
        (!selectedExamProduct || row.version === selectedExamProduct.version),
    )
    .sort((left, right) => right.score - left.score);
  type RankingRow = {
    rank: number;
    rankTotal: number;
    name: string;
    tgat1: number | string;
    tgat2: number | string;
    tgat3: number | string;
    total: number | string;
    version: string;
    submittedAt: string;
    grade: string;
    province: string;
    score: number;
  };
  const rankingExampleRows: RankingRow[] = (
    storedRankingRows.length
      ? storedRankingRows.map((row, index) => ({
          rank: index + 1,
          rankTotal: storedRankingRows.length,
          name: row.student,
          tgat1: "—" as const,
          tgat2: "—" as const,
          tgat3: "—" as const,
          total: row.score,
          version: row.version,
          submittedAt: formatThaiDateTimeValue(new Date(row.submittedAt)),
          grade: row.grade,
          province: row.province,
          score: row.score,
        }))
      : [
          {
            rank: 415,
            rankTotal: 2709,
            name: "สมชาย ศิริกุล",
            tgat1: 60.7,
            tgat2: 67.4,
            tgat3: 54.6,
            total: 60.7,
            version: selectedExamProduct?.version || "TGAT-2026.5",
            submittedAt: "15 ก.ค. 2569",
            grade: "ม.6",
            province: "ขอนแก่น",
            score: 60.7,
          },
          {
            rank: 150,
            rankTotal: 2709,
            name: "ณิชา วัฒนกุล",
            tgat1: 74,
            tgat2: 68.5,
            tgat3: 71.2,
            total: 71.2,
            version: selectedExamProduct?.version || "TGAT-2026.5",
            submittedAt: "4 ต.ค. 2569",
            grade: "ม.6",
            province: "เชียงใหม่",
            score: 71.2,
          },
          {
            rank: 207,
            rankTotal: 2709,
            name: "พิมพ์ชนก สุขใจ",
            tgat1: 69.2,
            tgat2: 64,
            tgat3: 66.5,
            total: 66.5,
            version: selectedExamProduct?.version || "TGAT-2026.5",
            submittedAt: "2 ต.ค. 2569",
            grade: "ม.6",
            province: "เชียงใหม่",
            score: 66.5,
          },
          {
            rank: 600,
            rankTotal: 2709,
            name: "ธนกร พิพัฒน์กุล",
            tgat1: 62.5,
            tgat2: 55,
            tgat3: 58.3,
            total: 58.3,
            version: selectedExamProduct?.version || "TGAT-2026.5",
            submittedAt: "3 ต.ค. 2569",
            grade: "ม.5",
            province: "ขอนแก่น",
            score: 58.3,
          },
        ]
  ).sort((left, right) => right.score - left.score);
  const rankingScoreForSelected = (
    row: (typeof rankingExampleRows)[number],
  ) => {
    if (storedRankingRows.length) return row.total;
    if (selectedExamProduct?.id === "tgat1") return Number(row.tgat1);
    if (selectedExamProduct?.id === "tgat2") return Number(row.tgat2);
    if (selectedExamProduct?.id === "tgat3") return Number(row.tgat3);
    if (selectedExamProduct?.id === "tgat23")
      return Number(row.tgat2) + Number(row.tgat3);
    return row.total;
  };
  const filteredRankingRows = rankingExampleRows.filter(
    (row) =>
      (rankingGradeFilter === "ทุกระดับชั้น" ||
        row.grade === rankingGradeFilter) &&
      (rankingProvinceFilter === "ทุกจังหวัด" ||
        row.province === rankingProvinceFilter) &&
      (rankingTimeFilter === "ทุกช่วงเวลา" ||
        row.submittedAt === rankingTimeFilter),
  );
  const resultOverviewRows: ResultOverviewRow[] = [
    {
      id: "RES-1001",
      student: "สมชาย ศิริกุล",
      citizenId: "1-67**-*****-34-1",
      grade: "ม.6",
      school: "โรงเรียนตัวอย่างวิทยา",
      province: "ขอนแก่น",
      submittedAt: "15 ก.ค. 2569",
      duration: "2 ชั่วโมง 41 นาที",
      rank: 415,
      rankTotal: 2709,
      product: "TGAT",
      packageName: "Full TGAT",
      set: "A",
      total: 60.7,
      tgat1: 60.7,
      tgat2: 67.4,
      tgat3: 54.6,
      status: "ส่งสำเร็จ",
    },
    {
      id: "RES-1002",
      student: "ณิชา วัฒนกุล",
      citizenId: "1-67**-*****-25-2",
      grade: "ม.6",
      school: "โรงเรียนตัวอย่างเชียงใหม่",
      province: "เชียงใหม่",
      submittedAt: "4 ต.ค. 2569",
      duration: "2 ชั่วโมง 18 นาที",
      rank: 150,
      rankTotal: 2709,
      product: "TGAT",
      packageName: "Full TGAT",
      set: "A",
      total: 71.2,
      tgat1: 74.0,
      tgat2: 68.5,
      tgat3: 71.2,
      status: "ส่งสำเร็จ",
    },
    {
      id: "RES-1003",
      student: "ธนกร พิพัฒน์กุล",
      citizenId: "1-67**-*****-19-3",
      grade: "ม.5",
      school: "โรงเรียนขอนแก่นวิทยา",
      province: "ขอนแก่น",
      submittedAt: "3 ต.ค. 2569",
      duration: "2 ชั่วโมง 35 นาที",
      rank: 600,
      rankTotal: 2709,
      product: "TGAT",
      packageName: "Full TGAT",
      set: "A",
      total: 58.3,
      tgat1: 62.5,
      tgat2: 55.0,
      tgat3: 58.3,
      status: "ส่งสำเร็จ",
    },
    {
      id: "RES-1004",
      student: "พิมพ์ชนก สุขใจ",
      citizenId: "1-67**-*****-53-4",
      grade: "ม.6",
      school: "โรงเรียนตัวอย่างเชียงใหม่",
      province: "เชียงใหม่",
      submittedAt: "2 ต.ค. 2569",
      duration: "2 ชั่วโมง 22 นาที",
      rank: 207,
      rankTotal: 2709,
      product: "TGAT",
      packageName: "Full TGAT",
      set: "A",
      total: 66.5,
      tgat1: 69.2,
      tgat2: 64.0,
      tgat3: 66.5,
      status: "ส่งสำเร็จ",
    },
  ];
  const resultFilterOptions = {
    products: Array.from(new Set(resultOverviewRows.map((row) => row.product))).sort(
      (left, right) => left.localeCompare(right, "th"),
    ),
    sets: Array.from(new Set(resultOverviewRows.map((row) => row.set))).sort(
      (left, right) => left.localeCompare(right, "th"),
    ),
    packages: Array.from(new Set(resultOverviewRows.map((row) => row.packageName))).sort(
      (left, right) => left.localeCompare(right, "th"),
    ),
    grades: Array.from(new Set(resultOverviewRows.map((row) => row.grade))).sort(
      (left, right) => left.localeCompare(right, "th"),
    ),
    provinces: Array.from(
      new Set(resultOverviewRows.map((row) => row.province)),
    ).sort((left, right) => left.localeCompare(right, "th")),
    statuses: Array.from(new Set(resultOverviewRows.map((row) => row.status))).sort(
      (left, right) => left.localeCompare(right, "th"),
    ),
  };
  const isScopedSetResults =
    activeScreen === "exam-management" && embedded && examTab === "results";
  const selectedResultScoreLabel =
    !isScopedSetResults || selectedExamProductId === "tgat-full"
      ? "คะแนนรวม"
      : selectedExamProduct?.name || "คะแนน";
  const selectedResultScoreMaximum =
    isScopedSetResults && selectedExamProductId === "tgat23" ? 200 : 100;
  const resultScoreForRow = (row: ResultOverviewRow) => {
    if (!isScopedSetResults) return row.total;
    if (selectedExamProductId === "tgat1") return row.tgat1;
    if (selectedExamProductId === "tgat2") return row.tgat2;
    if (selectedExamProductId === "tgat3") return row.tgat3;
    if (selectedExamProductId === "tgat23") return row.tgat2 + row.tgat3;
    return row.total;
  };
  const normalizedResultSearch = resultSearch.trim().toLocaleLowerCase("th");
  const filteredResultRows = resultOverviewRows.filter((row) => {
    const submittedDate = thaiResultDateKey(row.submittedAt);
    const matchesSearch =
      !normalizedResultSearch ||
      [row.student, row.id, row.product, row.packageName, row.set]
        .join(" ")
        .toLocaleLowerCase("th")
        .includes(normalizedResultSearch);
    return (
      matchesSearch &&
      (isScopedSetResults ||
        resultProductFilter === "ทุกประเภทสอบ" ||
        row.product === resultProductFilter) &&
      (isScopedSetResults || resultSetFilter === "ทุกชุด" ||
        row.set === resultSetFilter) &&
      (isScopedSetResults || resultPackageFilter === "ทุกแพ็กเกจ" ||
        row.packageName === resultPackageFilter) &&
      (resultGradeFilter === "ทุกระดับชั้น" ||
        row.grade === resultGradeFilter) &&
      (resultProvinceFilter === "ทุกจังหวัด" ||
        row.province === resultProvinceFilter) &&
      (resultStatusFilter === "ทุกสถานะ" ||
        row.status === resultStatusFilter) &&
      (!resultDateFrom || submittedDate >= resultDateFrom) &&
      (!resultDateTo || submittedDate <= resultDateTo)
    );
  });
  const averageResultScore = filteredResultRows.length
    ? filteredResultRows.reduce((sum, row) => sum + resultScoreForRow(row), 0) /
      filteredResultRows.length
    : 0;
  const highestResultScore = filteredResultRows.length
    ? Math.max(...filteredResultRows.map(resultScoreForRow))
    : null;
  const successfulResultCount = filteredResultRows.filter(
    (row) => row.status === "ส่งสำเร็จ",
  ).length;

  function hasActiveAttempt(productName: string) {
    return attempts.some(
      (attempt) =>
        attempt.status === "กำลังสอบ" &&
        productsOverlap(attempt.product, productName),
    );
  }

  async function deleteStudent(student: DemoStudent) {
    if (student.status === "ลบข้อมูลแล้ว") return;
    const confirmed = await confirmWebBAction({
      title: "ลบข้อมูลผู้เรียน",
      text: `ข้อมูลส่วนตัวของ ${student.name} จะถูกลบ ส่วนประวัติซื้อและสอบจะเก็บแบบไม่ระบุตัวตน`,
      confirmText: "ลบข้อมูล",
    });
    if (!confirmed) return;
    const deletedName = "ผู้ใช้งานที่ถูกลบไปแล้ว";
    setStudents((current) =>
      current.map((row) =>
        row.id === student.id
          ? {
              ...row,
              name: deletedName,
              username: deletedName,
              email: "—",
              grade: "—",
              school: "—",
              status: "ลบข้อมูลแล้ว",
            }
          : row,
      ),
    );
    setOrders((current) =>
      current.map((row) =>
        row.student === student.name ||
        (!!student.username &&
          row.username?.toLowerCase() === student.username.toLowerCase())
          ? { ...row, student: deletedName, username: deletedName }
          : row,
      ),
    );
    setAttempts((current) =>
      current.map((row) =>
        row.student === student.name ||
        (!!student.username &&
          row.username?.toLowerCase() === student.username.toLowerCase())
          ? { ...row, student: deletedName, username: deletedName }
          : row,
      ),
    );
    setTickets((current) =>
      current.map((row) =>
        row.student === student.name ||
        (!!student.username &&
          row.username?.toLowerCase() === student.username.toLowerCase())
          ? { ...row, student: deletedName, username: deletedName }
          : row,
      ),
    );
    const purchases = readAdminMockPurchases().map((purchase) =>
      purchase.profileSnapshot.email === student.email ||
      (!!student.username &&
        purchase.profileSnapshot.username.toLowerCase() ===
          student.username.toLowerCase())
        ? {
            ...purchase,
            profileSnapshot: {
              ...purchase.profileSnapshot,
              username: "ผู้ใช้งานที่ถูกลบไปแล้ว",
              citizenId: "",
              firstName: deletedName,
              lastName: "",
              phone: "",
              email: "",
              province: "",
              school: "",
              education: "",
            },
          }
        : purchase,
    );
    writeAdminMockPurchases(purchases);
    setDemoPurchases(purchases);
    const rankings = readAdminMockRankings().map((row) =>
      row.email === student.email ||
      (!!student.username && row.username.toLowerCase() === student.username.toLowerCase())
        ? { ...row, username: "ผู้ใช้งานที่ถูกลบไปแล้ว", email: "", student: deletedName, grade: "", province: "" }
        : row,
    );
    writeAdminMockRankings(rankings);
    setDemoRankings(rankings);
    logAction(
      "ลบข้อมูลส่วนตัวผู้เรียนและเก็บประวัติแบบไม่ระบุตัวตน",
      student.id,
    );
  }

  function grantManualEntitlement(
    student: DemoStudent,
    productId = selectedExamProduct?.id || "tgat-full",
    examSet = selectedExamSet?.name || "A",
    examStatus: DemoPurchase["examStatus"] = "available",
  ) {
    if (student.status !== "ใช้งาน") return;
    const username = student.username || student.email.split("@")[0];
    const purchases = readAdminMockPurchases();
    if (
      purchases.some(
        (purchase) =>
          purchase.paymentStatus !== "refunded" &&
          purchase.profileSnapshot.username.toLowerCase() ===
            username.toLowerCase() &&
          purchase.productId === productId &&
          (purchase.examSet || "A") === examSet,
      )
    ) {
      toast.info(
        `${student.name} มีสิทธิ์ ${selectedExamProduct?.name || "ชุดนี้"} อยู่แล้ว`,
      );
      return;
    }
    const [firstName, ...lastNames] = student.name.split(" ");
    const snapshot = {
      username,
      citizenId: "",
      firstName,
      lastName: lastNames.join(" "),
      phone: "",
      email: student.email,
      province: "",
      school: student.school,
      education: student.grade,
    };
    const nextPurchases: DemoPurchase[] = [
      {
        ref: `GRANT-${Date.now()}`,
        productId,
        examSet,
        amount: 0,
        baseAmount: 0,
        payment: "Manual Grant",
        purchasedAt: formatThaiDateTimeValue(new Date()),
        receipt: "สิทธิ์จากผู้ดูแล",
        profileSnapshot: snapshot,
        examStatus,
        attempts: 0,
        paymentStatus: "paid",
      },
      ...purchases,
    ];
    writeAdminMockPurchases(nextPurchases);
    setDemoPurchases(nextPurchases);
    setStudents((current) =>
      current.map((row) =>
        row.id === student.id
          ? { ...row, username, entitlements: row.entitlements + 1 }
          : row,
      ),
    );
    setEntitlementModalOpen(false);
    logAction(
      "เพิ่มสิทธิ์สอบ Manual",
      `${student.id} · ${selectedExamProduct?.name || "TGAT"} ชุด ${examSet} · ${examStatus}`,
    );
  }

  function revokeManualEntitlement(
    student: DemoStudent,
    productId = selectedExamProduct?.id || "tgat-full",
    examSet = selectedExamSet?.name || "A",
  ) {
    const username = student.username || student.email.split("@")[0];
    const purchases = readAdminMockPurchases();
    const grant = [...purchases]
      .reverse()
      .find(
        (purchase) =>
          purchase.payment === "Manual Grant" &&
          purchase.productId === productId &&
          (purchase.examSet || "A") === examSet &&
          purchase.paymentStatus !== "refunded" &&
          purchase.profileSnapshot.username.toLowerCase() ===
            username.toLowerCase(),
      );
    if (!grant) {
      toast.error("ถอนสิทธิ์ได้เฉพาะสิทธิ์ที่เพิ่มด้วย Manual Grant");
      return;
    }
    const nextPurchases: DemoPurchase[] = purchases.map((purchase) =>
        purchase.ref === grant.ref
          ? { ...purchase, paymentStatus: "refunded" }
          : purchase,
      );
    writeAdminMockPurchases(nextPurchases);
    setDemoPurchases(nextPurchases);
    setStudents((current) =>
      current.map((row) =>
        row.id === student.id
          ? { ...row, entitlements: Math.max(0, row.entitlements - 1) }
          : row,
      ),
    );
    logAction("ถอนสิทธิ์สอบ Manual", `${student.id} · ${grant.ref}`);
  }
  function hasManualGrantForStudent(
    student: DemoStudent,
    productId = selectedExamProduct?.id || "tgat-full",
    examSet = selectedExamSet?.name || "A",
  ) {
    const username = (
      student.username || student.email.split("@")[0]
    ).toLowerCase();
    return readAdminMockPurchases().some(
      (purchase) =>
        purchase.payment === "Manual Grant" &&
        purchase.productId === productId &&
        (purchase.examSet || "A") === examSet &&
        purchase.paymentStatus !== "refunded" &&
        purchase.profileSnapshot.username.toLowerCase() === username,
    );
  }

  function updateMockPurchaseForOrder(order: DemoOrder, status: DemoOrder["status"]) {
    const purchases = readAdminMockPurchases();
    const linked = purchases.some((purchase) => purchase.orderRef === order.ref || purchase.ref === order.ref);
    if (status === "คืนเงินแล้ว") {
      const next: DemoPurchase[] = purchases.map((purchase) =>
        purchase.orderRef === order.ref || purchase.ref === order.ref
          ? { ...purchase, paymentStatus: "refunded" as const }
          : purchase,
      );
      writeAdminMockPurchases(next);
      setDemoPurchases(next);
      return;
    }
    if (status !== "สำเร็จ" || linked) return;
    const student = students.find((row) => row.name === order.student);
    if (!student) return;
    const [firstName, ...lastNames] = student.name.split(" ");
    const purchase: DemoPurchase = {
      ref: order.ref,
      orderRef: order.ref,
      productId: order.product.toLowerCase().includes("tgat") ? "tgat-full" : selectedExamProduct?.id || "tgat-full",
      examSet: "A",
      amount: order.charged,
      baseAmount: order.base,
      payment: order.method,
      purchasedAt: `${order.day} 12:00`,
      receipt: `ใบเสร็จจำลอง ${order.ref}`,
      profileSnapshot: {
        username: student.username || student.email.split("@")[0],
        citizenId: "",
        firstName,
        lastName: lastNames.join(" "),
        phone: "",
        email: student.email,
        province: "",
        school: student.school,
        education: student.grade,
      },
      examStatus: "available",
      attempts: 0,
      paymentStatus: "paid",
    };
    const next = [purchase, ...purchases];
    writeAdminMockPurchases(next);
    setDemoPurchases(next);
  }

  function logAction(
    action: string,
    target: string,
    notice: "success" | "info" | "none" = "success",
  ) {
    const time = formatThaiDateTimeValue(new Date());
    setLogs((current) => [
      { time, actor: `ผู้ดูแลระบบ · ${activeRole}`, action, target },
      ...current,
    ]);
    if (notice === "success") toast.success(`${action} · ${target}`);
    if (notice === "info") toast.info(`${action} · ${target}`);
  }
  function createContentDraft() {
    const product = selectedExamProduct;
    if (!product) {
      toast.error("เลือกชุดข้อสอบก่อนสร้างชุดเนื้อหา");
      return;
    }
    const existing = examSets.filter((set) => set.productId === product.id);
    const suggestedName =
      ["A", "B", "C", "D"].find(
        (name) => !existing.some((set) => set.name.toUpperCase() === name),
      ) || "ชุด " + (existing.length + 1);
    void (async () => {
      const name = await inputWebBValue({
        title: "สร้างชุดข้อสอบ · " + product.name,
        value: suggestedName,
        placeholder: "ชื่อชุด เช่น A, B หรือ Mock 1",
      });
      const normalized = name?.trim();
      if (!normalized) return;
      if (
        existing.some(
          (set) => set.name.toLowerCase() === normalized.toLowerCase(),
        )
      ) {
        toast.error("มีชุดชื่อนี้อยู่แล้วในรายการนี้");
        return;
      }
      const nextSet: DemoExamSet = {
        id: product.id + ":" + normalized,
        productId: product.id,
        name: normalized,
        version: "Draft-1",
        contentStatus: "Draft",
        questionCount: getManagedExamPlan(product.id, normalized).questionCount,
      };
      setExamSets((current) => [...current, nextSet]);
      setSelectedExamSetId(nextSet.id);
      setExamTab("content");
      setPendingExamFile(null);
      logAction("สร้างชุดข้อสอบ", product.name + " · ชุด " + normalized);
    })();
  }
  function saveExamDocument() {
    if (!pendingExamFile) {
      toast.error("เลือกไฟล์ PDF ก่อนบันทึก");
      return;
    }
    const product = examProducts.find(
      (item) => item.id === selectedExamProductId,
    );
    if (!product) {
      toast.error("เลือกชุดข้อสอบที่ต้องการก่อน");
      return;
    }
    const availableParts = getManagedExamPlan(product.id, "A").sections;
    const selectedPart =
      availableParts.find((part) => part.id === selectedDocumentPartId) ||
      availableParts[0];
    const document: DemoExamDocument = {
      id: `DOC-${String(Date.now()).slice(-8)}`,
      productId: product.id,
      trial: activeScreen === "trial-exams",
      productName: product.name,
      examSet: selectedExamSet?.name || "A",
      sectionId: selectedPart?.id,
      sectionTitle: selectedPart?.title,
      name: pendingExamFile.name,
      size: pendingExamFile.size,
      status: "รอตรวจ",
      addedAt: formatThaiDateTimeValue(new Date()),
    };
    setExamDocuments((current) => [document, ...current]);
    if (activeScreen !== "trial-exams") {
      setExamSets((current) =>
        current.map((set) =>
          set.id === selectedExamSetId
            ? { ...set, contentStatus: "รอตรวจ" }
            : set,
        ),
      );
      setProducts((current) =>
        current.map((row) =>
          row.id === product.id ? { ...row, contentStatus: "รอตรวจ" } : row,
        ),
      );
    }
    setPendingExamFile(null);
    logAction(
      "บันทึกไฟล์ข้อสอบ PDF",
      product.name + " · ชุด " + document.examSet + " · " + document.name,
    );
  }
  function hasExamFileForSet(productId: string, examSet = "A") {
    if (getManagedExamPlan(productId, examSet).hasSuppliedExam) return true;
    const documents = examDocuments.filter(
      (document) =>
        document.productId === productId &&
        document.examSet === examSet &&
        Boolean(document.trial) === (activeScreen === "trial-exams"),
    );
    const parts = getManagedExamPlan(productId, "A").sections;
    return parts.length
      ? parts.every((part) =>
          documents.some((document) => document.sectionId === part.id),
        )
      : documents.length > 0;
  }
  function simulateWebhook() {
    const order =
      dateFilteredOrders.find((item) => item.status === "รอชำระ") ||
      dateFilteredOrders[0];
    const event = {
      id: `EVT-${String(Date.now()).slice(-6)}`,
      order: order?.ref || "CALLBACK-TEST",
      type:
        order?.status === "รอชำระ"
          ? "payment.pending"
          : "payment.callback.test",
      status: "ประมวลผลแล้ว",
      received: formatThaiDateTimeValue(new Date()),
    };
    setWebhookEvents((current) => [event, ...current]);
    logAction("ทดสอบ Webhook Callback", event.order);
  }
  function checkPaymentProvider() {
    const event = {
      id: `EVT-${String(Date.now()).slice(-6)}`,
      order: "PROVIDER-CHECK",
      type: "provider.connection.checked",
      status: "Payso กำหนดไว้ · ยังไม่เชื่อมต่อจริง",
      received: formatThaiDateTimeValue(new Date()),
    };
    setWebhookEvents((current) => [event, ...current]);
    logAction("ตรวจสถานะผู้ให้บริการชำระเงิน", paymentProvider, "none");
    toast.info("กำหนด Payso ไว้แล้ว · ยังไม่มีการเชื่อมต่อ Provider จริง");
  }
  async function createProduct(trial = activeScreen === "trial-exams") {
    const name = await inputWebBValue({
      title: "สร้างชุดข้อสอบ",
      value: "TGAT1 · ชุด B",
      placeholder: "ชื่อชุดข้อสอบ",
    });
    if (!name) return;
    const product: DemoProduct = {
      id: `demo-${Date.now()}`,
      name,
      parts: "ระบุพาร์ทข้อสอบ",
      price: 100,
      payPrice: 110,
      status: "ปิดขาย",
      version: "Draft-1",
      trial,
      contentStatus: "Draft",
    };
    setProducts((current) => [...current, product]);
    const defaultSet: DemoExamSet = {
      id: product.id + ":A",
      productId: product.id,
      name: "A",
      version: product.version,
      contentStatus: "Draft",
      questionCount: getManagedExamPlan(product.id, "A").questionCount,
    };
    setExamSets((current) => [...current, defaultSet]);
    setSelectedExamProductId(product.id);
    setSelectedExamSetId(defaultSet.id);
    setExamView("detail");
    setExamTab("overview");
    logAction("สร้างชุดข้อสอบ", name);
  }
  function selectManagedExamProduct(productId: string) {
    setSelectedExamProductId(productId);
    const set = examSets.find(
      (item) => item.productId === productId && item.name === "A",
    );
    if (set) setSelectedExamSetId(set.id);
    setPendingExamFile(null);
  }
  function saveSolutionDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!solutionDraft || !selectedExamProduct) return;
    const questionNumber = Number(solutionDraft.questionNumber);
    const maxQuestion = getManagedExamPlan(
      selectedExamProduct.id,
      answerKeySetName,
    ).questionCount;
    if (
      !Number.isInteger(questionNumber) ||
      questionNumber < 1 ||
      questionNumber > maxQuestion
    )
      return toast.error(`ระบุเลขข้อ 1–${maxQuestion}`);
    if (
      !solutionDraft.name.trim() ||
      (!solutionDraft.id && !solutionDraft.fileSelected)
    )
      return toast.error("เลือกไฟล์สื่อเฉลยก่อนบันทึก");
    if (solutionDraft.id) {
      setSolutions((current) =>
        current.map((solution) =>
          solution.id === solutionDraft.id
            ? {
                ...solution,
                name: solutionDraft.name.trim(),
                questionNumber,
                kind: solutionDraft.kind,
                access: solutionDraft.access,
                duration: solutionDraft.duration,
                summary: solutionDraft.summary,
                tutor: solutionDraft.tutor,
                tutorCredential: solutionDraft.tutorCredential,
                tutorBio: solutionDraft.tutorBio,
                pdfName: solutionDraft.pdfName,
                social: solutionDraft.social,
              }
            : solution,
        ),
      );
      logAction("แก้ไขสื่อเฉลยรายข้อ", solutionDraft.id);
    } else {
      const id = `SOL-${Date.now()}`;
      setSolutions((current) => [
        ...current,
        {
          id,
          name: solutionDraft.name.trim(),
          questionNumber,
          product: `${selectedExamProduct.name} · ชุด ${answerKeySetName}`,
          kind: solutionDraft.kind,
          access: solutionDraft.access,
          active: false,
          duration: solutionDraft.duration,
          summary: solutionDraft.summary,
          tutor: solutionDraft.tutor,
          tutorCredential: solutionDraft.tutorCredential,
          tutorBio: solutionDraft.tutorBio,
          pdfName: solutionDraft.pdfName,
          social: solutionDraft.social,
        },
      ]);
      logAction("เพิ่มสื่อเฉลยรายข้อ", id);
    }
    setSolutionDraft(null);
  }
  async function addStudent() {
    const name = await inputWebBValue({
      title: "เพิ่มผู้เรียน",
      value: "ผู้เรียนใหม่",
      placeholder: "ชื่อและนามสกุล",
    });
    if (!name) return;
    const id = `ST-${String(Date.now()).slice(-4)}`;
    const student: DemoStudent = {
      id,
      name,
      email: `${id.toLowerCase()}@example.test`,
      grade: "ม.6",
      school: "โรงเรียนยุพราชวิทยาลัย",
      joined: new Date().toISOString().slice(0, 10),
      status: "ใช้งาน",
      entitlements: 0,
    };
    setStudents((current) => [student, ...current]);
    logAction("เพิ่มบัญชีผู้เรียน", student.id);
  }
  const exportOrders = () =>
    downloadCsv(
      "web-b-demo-orders.csv",
      [
        "เลขคำสั่งซื้อ",
        "ผู้เรียน",
        "สินค้า",
        "ราคาสินค้า",
        "ยอดเรียกเก็บรวม Payso",
        "ส่วนเพิ่มในยอดชำระ",
        "ค่าบริการ Payso ก่อน VAT",
        "VAT 7% ของค่าบริการ",
        "ยอดรับสุทธิ",
        "วิธีชำระ",
        "สถานะ",
      ],
      filteredOrders.map((r) => {
        const fee = paysoFeeBreakdown(r);
        return [r.ref, r.student, r.product, r.base, r.charged, r.charged - r.base, fee.feeBeforeVat, fee.vat, r.charged - fee.totalDeduction, r.method, r.status];
      }),
    );
  const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const settingsTabs = (
    <nav className="flex flex-wrap gap-2" aria-label="ตั้งค่าระบบและผู้ดูแล">
      <Link
        href="/webb/admin/settings"
        aria-current={activeScreen === "settings" ? "page" : undefined}
        className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${activeScreen === "settings" ? "bg-[#211d4f] text-white" : "border border-slate-200 bg-white text-slate-700"}`}
      >
        ตั้งค่าระบบ
      </Link>
      <Link
        href="/webb/admin/admins"
        aria-current={activeScreen === "admins" ? "page" : undefined}
        className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${activeScreen === "admins" ? "bg-[#211d4f] text-white" : "border border-slate-200 bg-white text-slate-700"}`}
      >
        ผู้ดูแลและสิทธิ์
      </Link>
    </nav>
  );
  const orderTabs = (
    <nav aria-label="คำสั่งซื้อและการชำระเงิน" className="flex shrink-0 flex-nowrap gap-2">
      <Link
        href="/webb/admin/orders"
        aria-current={orderTab === "orders" ? "page" : undefined}
        className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${orderTab === "orders" ? "bg-[#211d4f] text-white" : "border border-slate-200 bg-white text-slate-700"}`}
      >
        คำสั่งซื้อ
      </Link>
      <Link
        href="/webb/admin/payments"
        aria-current={orderTab === "payments" ? "page" : undefined}
        className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${orderTab === "payments" ? "bg-[#211d4f] text-white" : "border border-slate-200 bg-white text-slate-700"}`}
      >
        ดูการชำระเงิน
      </Link>
    </nav>
  );
  useEffect(() => {
    if (
      activeScreen !== "exam-management" ||
      embedded ||
      activeRole === "Super Admin" ||
      examTab === "overview"
    )
      return;
    const resource = managedExamTabResource[examTab];
    if (resource && rolePermissions[activeRole]?.[resource]?.view !== true)
      setExamTab("overview");
  }, [activeScreen, embedded, activeRole, examTab, rolePermissions]);
  useEffect(() => {
    if (!embedded || !initialExamTab) return;
    if (externalExamTabRef.current === initialExamTab) return;
    externalExamTabRef.current = initialExamTab;
    setExamTab(initialExamTab as ExamTab);
  }, [embedded, initialExamTab]);
  const examTabs: { id: ExamTab; label: string }[] =
    activeScreen === "exam-management"
      ? (
          [
            { id: "overview", label: "ภาพรวมชุด A" },
            { id: "content", label: "ข้อสอบและเฉลย" },
            { id: "offers", label: "รูปแบบการเปิดใช้" },
            { id: "access", label: "สิทธิ์และคำร้อง" },
            { id: "activity", label: "การเข้าสอบ" },
            { id: "results", label: "ผลสอบและ Ranking" },
            { id: "solutions", label: "สื่อเฉลย" },
          ] as { id: ExamTab; label: string }[]
        ).filter(
          (tab) =>
            activeRole === "Super Admin" ||
            tab.id === "overview" ||
            rolePermissions[activeRole]?.[
              managedExamTabResource[tab.id] || "exams"
            ]?.view === true,
        )
      : activeScreen === "trial-exams"
        ? [{ id: "content", label: "เอกสารและเฉลย" }]
        : [
            { id: "overview", label: "ข้อมูลชุด" },
            { id: "content", label: "ข้อสอบและเฉลย" },
            { id: "access", label: "สิทธิ์และคำร้อง" },
            { id: "activity", label: "ประวัติสอบและผลสอบ" },
            { id: "solutions", label: "สื่อเฉลย" },
          ];
  const canManageExamContent =
    activeRole === "Super Admin" ||
    rolePermissions[activeRole]?.exams?.view === true;
  const examTabIntro =
    examTab === "offers"
      ? {
          title: "หน้านี้ใช้ตั้งค่าสิ่งที่ผู้เรียนซื้อ",
          description:
            "เลือกสินค้าหรือพาร์ทที่ต้องการจากตัวเลือกด้านบน แล้วตรวจราคา ยอดเรียกเก็บ และสถานะขายในส่วนตั้งค่าด้านล่าง",
          steps: [
            "เลือกสินค้า เช่น Full TGAT",
            "ตรวจราคาและยอดเรียกเก็บ",
            "ตรวจสถานะขายและความพร้อมหน้าบ้าน",
          ],
        }
      : examTab === "access"
        ? {
            title: "หน้านี้ใช้ตรวจสิทธิ์และจัดการคำร้อง",
            description:
              "สิทธิ์เกิดจากคำสั่งซื้อที่สำเร็จ ส่วนคำร้องใช้เมื่อผู้เรียนขอสอบใหม่ ทั้งสองรายการแสดงแยกกันด้านล่าง",
            steps: [
              "ตรวจสิทธิ์จากรายการซื้อ",
              "อ่านเหตุผลที่ผู้เรียนส่งมา",
              "อนุมัติหรือปฏิเสธคำร้องที่รอตรวจ",
            ],
          }
        : null;

  return (
    <AdminScreenContext.Provider
      value={{
        screen: activeScreen,
        orderTab,
        examView,
        examTab,
        rolePermissions,
        embedded,
      }}
    >
      <div
        className={
          embedded
            ? "flex-1 min-h-0 flex flex-col h-full text-slate-900"
            : `${activeScreen === "overview" ? "-mt-6 " : ""}space-y-7 text-slate-900`
        }
      >
        {activeScreen === "real-exams" && initialFamilyId === "tpat" && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <Link
              href="/webb/admin/exam-catalog"
              className="font-semibold text-indigo-700"
            >
              ← คลังข้อสอบ
            </Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="font-semibold">TPAT</span>
          </div>
        )}
        {activeScreen === "exam-management" && !embedded && (
          <header className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-wide text-amber-700">
                  <Link
                    href="/webb/admin/exam-catalog"
                    className="hover:underline"
                  >
                    คลังข้อสอบ
                  </Link>{" "}
                  / TGAT / ชุด A
                </p>
                <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
                  TGAT · ชุด A
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  ดูข้อสอบทั้ง 3
                  พาร์ทและติดตามงานตั้งแต่เตรียมชุดจนถึงผลสอบในที่เดียว
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  tone={
                    getExamPlan("tgat-full", "A").hasSuppliedExam
                      ? "green"
                      : "amber"
                  }
                >
                  ไฟล์ต้นทาง {getExamPlan("tgat-full", "A").sourceSet} · 3 พาร์ท
                </Badge>
                <Badge tone={publishedResults ? "green" : "amber"}>
                  {publishedResults ? "แสดงผลสอบทุกชุด" : "พักผลสอบทุกชุด"}
                </Badge>
              </div>
            </div>
            <nav
              aria-label="ขั้นตอนจัดการ TGAT ชุด A"
              className="flex gap-2 overflow-x-auto border-t border-slate-100 pt-4"
            >
              {examTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={examTab === tab.id ? "step" : undefined}
                  onClick={() => setExamTab(tab.id)}
                  className={`shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${examTab === tab.id ? "bg-[#211d4f] text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                >
                  {(() => {
                    const TabIcon = examTabIcons[tab.id];
                    return <TabIcon aria-hidden="true" className="size-4 shrink-0" />;
                  })()}
                  {tab.label}
                </button>
              ))}
            </nav>
            {examTab !== "overview" && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3">
                <label className="min-w-[240px] flex-1 text-xs font-semibold text-slate-600">
                  สินค้า / วิชาที่กำลังดู
                  <AdminSelect
                    value={selectedExamProductId}
                    onChange={selectManagedExamProduct}
                    options={examProducts.map((product) => ({
                      value: product.id,
                      label: `${product.name}${product.id === "tgat-full" ? " · รวม TGAT1–3" : ""} · ชุด A`,
                    }))}
                    ariaLabel="เลือกสินค้าและชุดข้อสอบ TGAT"
                    className="mt-1 font-normal"
                  />
                </label>
                <p className="text-xs leading-5 text-slate-500">
                  {examTab === "offers"
                    ? "เลือกสินค้าเพื่อดูหรือปรับราคาและสถานะขาย"
                    : examTab === "access"
                      ? "สิทธิ์และคำร้องด้านล่างจะแสดงเฉพาะสินค้าที่เลือก"
                      : "ตารางและข้อมูลในขั้นตอนนี้กรองตามสินค้าที่เลือก"}
                </p>
              </div>
            )}
            {examTabIntro && (
              <section
                aria-label={examTabIntro.title}
                className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4"
              >
                <h2 className="font-bold text-indigo-950">
                  {examTabIntro.title}
                </h2>
                <p className="mt-1 text-sm leading-6 text-indigo-900">
                  {examTabIntro.description}
                </p>
                <ol className="mt-3 grid gap-2 sm:grid-cols-3">
                  {examTabIntro.steps.map((step, index) => (
                    <li
                      key={step}
                      className="flex items-start gap-2 rounded-lg border border-indigo-100 bg-white p-3 text-sm text-slate-700"
                    >
                      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold text-indigo-800">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </header>
        )}
        {activeScreen === "exam-management" &&
          embedded &&
          !hideProductSelector &&
          !offerTable &&
          examTab !== "overview" &&
          examTab !== "results" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="block max-w-xl text-sm font-semibold text-slate-700">
                ดูรายละเอียดสินค้า / พาร์ท
                <AdminSelect
                  value={selectedExamProductId}
                  onChange={selectManagedExamProduct}
                  options={examProducts.map((product) => ({
                    value: product.id,
                    label: `${product.name}${product.id === "tgat-full" ? " · รวม TGAT1–3" : ""} · ชุด A`,
                  }))}
                  ariaLabel="เลือกสินค้าและพาร์ทใน TGAT ชุด A"
                  className="mt-2 font-normal"
                />
              </label>
            </div>
          )}
        {activeScreen === "exam-management" && examTab === "overview" && (
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-3">
              {(["tgat1", "tgat2", "tgat3"] as const).map((id) => {
                const product = products.find((item) => item.id === id);
                const plan = getExamPlan(id, "A");
                const set = examSets.find(
                  (item) => item.productId === id && item.name === "A",
                );
                return (
                  <Panel key={id}>
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-lg font-bold">
                        {product?.name || id.toUpperCase()}
                      </h2>
                      <Badge tone={hasExamFileForSet(id) ? "green" : "amber"}>
                        {hasExamFileForSet(id)
                          ? "มีไฟล์ข้อสอบ"
                          : "รอไฟล์ข้อสอบ"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {plan.questionCount} ข้อ · {plan.durationMinutes} นาที ·{" "}
                      {plan.sections[0]?.choiceCount || 4} ตัวเลือก ·
                      เกณฑ์อ้างอิง 100 คะแนน
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge
                        tone={
                          set?.contentStatus === "เผยแพร่" ? "green" : "amber"
                        }
                      >
                        เนื้อหา {set?.contentStatus || "Draft"}
                      </Badge>
                      <Badge
                        tone={product?.status === "เปิดขาย" ? "green" : "gray"}
                      >
                        {product?.status || "ปิดขาย"}
                      </Badge>
                    </div>
                    {canManageExamContent && (
                      <button
                        type="button"
                        onClick={() => {
                          selectManagedExamProduct(id);
                          if (embedded) onStepChange?.("content", id);
                          else setExamTab("content");
                        }}
                        className="mt-5 rounded-xl bg-[#211d4f] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#332e71]"
                      >
                        จัดการข้อสอบ {product?.name || id.toUpperCase()} →
                      </button>
                    )}
                  </Panel>
                );
              })}
            </div>
            {!embedded && (
              <Panel>
                <h2 className="font-bold">ลำดับงานของชุด A</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-5">
                  {examTabs
                    .filter((tab) => tab.id !== "overview")
                    .map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setExamTab(tab.id)}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                      >
                        {(() => {
                          const TabIcon = examTabIcons[tab.id];
                          return <TabIcon aria-hidden="true" className="mb-2 size-5" />;
                        })()}
                        <span className="block">{tab.label} →</span>
                      </button>
                    ))}
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  ชุดทดลองฟรี TGAT1 ใช้โจทย์บนหน้าจอ 60 ข้อ ส่วนชุดซื้อใช้ไฟล์
                  PDF ที่ผูกไว้กับ Client · การแก้ข้อมูลใน Admin
                  เก็บไว้ในเบราว์เซอร์นี้
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  จำนวนข้อและเวลาอ้างอิง{" "}
                  <a
                    href="https://www.mytcas.com/blueprint/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-indigo-700 underline"
                  >
                    TGAT Blueprint ของ ทปอ.
                  </a>{" "}
                  · TGAT3 มีรูปแบบคำตอบและการให้คะแนนหลายแบบ
                  ส่วนเฉลยรายข้อเป็นข้อมูลจำลองเพื่อการนำเสนอ
                </p>
              </Panel>
            )}
          </div>
        )}
        {(activeScreen === "trial-exams" || activeScreen === "real-exams") &&
          examView === "detail" &&
          selectedExamProduct && (
            <header className={activeScreen === "trial-exams" ? "hidden" : "space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {activeScreen !== "trial-exams" && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setExamView("table");
                        setExamTab("overview");
                        setPendingExamFile(null);
                      }}
                    >
                      ← กลับรายการ
                    </Button>
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-500">
                      {activeScreen === "trial-exams" ? "ชุดทดลอง" : "ชุดจริง"}{" "}
                      · {selectedExamProduct.version}
                    </span>
                    <h1 className="mt-1 text-xl font-bold text-slate-900">
                      {selectedExamProduct.name}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedExamProduct.parts}
                    </p>
                  </div>
                </div>
                {activeScreen === "trial-exams" ? (
                  <Badge tone="blue">ทดลองฟรี</Badge>
                ) : (
                  <Badge
                    tone={
                      selectedExamProduct.status === "เปิดขาย" ? "green" : "gray"
                    }
                  >
                    {selectedExamProduct.status}
                  </Badge>
                )}
              </div>
              {activeScreen !== "trial-exams" && (
                <nav
                  aria-label="รายการจัดการชุดข้อสอบ"
                  className="flex gap-2 overflow-x-auto border-t border-slate-100 pt-3"
                >
                  {examTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      aria-current={examTab === tab.id ? "page" : undefined}
                      onClick={() => setExamTab(tab.id)}
                      className={`shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${examTab === tab.id ? "bg-[#211d4f] text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                    >
                      {(() => {
                        const TabIcon = examTabIcons[tab.id];
                        return <TabIcon aria-hidden="true" className="size-4 shrink-0" />;
                      })()}
                      {tab.label}
                    </button>
                  ))}
                </nav>
              )}
            </header>
          )}
        {detail && (
          <WebBModalPortal>
            <div
              className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setDetail(null);
              }}
            >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="webb-detail-title"
              className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Web-B
                  </p>
                  <h2
                    id="webb-detail-title"
                    className="mt-1 text-xl font-bold text-slate-900"
                  >
                    {detail.type === "student"
                      ? "ข้อมูลผู้เรียน"
                      : detail.type === "order"
                        ? "รายละเอียดคำสั่งซื้อ"
                        : detail.type === "product"
                          ? "ตัวอย่างชุดข้อสอบ"
                          : "บันทึกการเข้าสอบ"}
                  </h2>
                </div>
                <button
                  type="button"
                  autoFocus
                  onClick={() => setDetail(null)}
                  aria-label="ปิดหน้าต่างรายละเอียด"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
                >
                  <LuX aria-hidden="true" className="size-4" />
                </button>
              </div>
              {detail.type === "student" ? (
                <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ["รหัสผู้เรียน", detail.value.id],
                    ["ชื่อ", detail.value.name],
                    ["อีเมล", detail.value.email],
                    ["ระดับ", detail.value.grade],
                    ["โรงเรียน", detail.value.school],
                    ["สมัครเมื่อ", formatThaiDate(detail.value.joined)],
                    ["สถานะ", detail.value.status],
                    ["สิทธิ์สอบ", `${detail.value.entitlements} ชุด`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-3">
                      <dt className="text-xs text-slate-500">{label}</dt>
                      <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : detail.type === "order" ? (
                <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ["เลขคำสั่งซื้อ", detail.value.ref],
                    ["ผู้เรียน", detail.value.student],
                    ["สินค้า", detail.value.product],
                    ["ราคาสินค้า", formatBaht(detail.value.base)],
                    ["ยอดเรียกเก็บรวม Payso", formatBaht(detail.value.charged)],
                    ["ส่วนเพิ่มในยอดชำระ", formatBaht(detail.value.charged - detail.value.base)],
                    ["ค่าบริการ Payso ก่อน VAT", formatBaht(paysoFeeBreakdown(detail.value).feeBeforeVat)],
                    ["VAT 7% ของค่าบริการ", formatBaht(paysoFeeBreakdown(detail.value).vat)],
                    ["ยอดรับสุทธิ", formatBaht(detail.value.charged - paysoFeeBreakdown(detail.value).totalDeduction)],
                    ["ช่องทางชำระ", "PromptPay QR"],
                    ["วันที่", formatThaiDate(detail.value.day)],
                    ["สถานะ", detail.value.status],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-3">
                      <dt className="text-xs text-slate-500">{label}</dt>
                      <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : detail.type === "product" ? (
                <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ["ชื่อชุดข้อสอบ", detail.value.name],
                    ["เวอร์ชัน", detail.value.version],
                    ["เนื้อหา", detail.value.parts],
                    ["ราคาสินค้า", formatBaht(detail.value.price)],
                    ["ยอดเรียกเก็บรวม Payso", formatBaht(detail.value.payPrice)],
                    ["สถานะขาย", detail.value.status],
                    ["สถานะเนื้อหา", detail.value.contentStatus || "Draft"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-3">
                      <dt className="text-xs text-slate-500">{label}</dt>
                      <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
                        {value}
                      </dd>
                    </div>
                  ))}
                  <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 sm:col-span-2">
                    {getExamPlan(detail.value.id, "A").hasSuppliedExam
                      ? "มีไฟล์ข้อสอบชุด A พร้อมตรวจ"
                      : "ยังไม่มีไฟล์ข้อสอบชุด A"}
                  </p>
                </dl>
              ) : (
                <>
                  <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      ["รหัสการสอบ", detail.value.id],
                      ["ผู้เข้าสอบ", detail.value.student],
                      ["ชุดข้อสอบ", detail.value.product],
                      ["เวลาเริ่ม", detail.value.started],
                      ["สถานะ", detail.value.status],
                      ["คะแนน", detail.value.score],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-slate-50 p-3">
                        <dt className="text-xs text-slate-500">{label}</dt>
                        <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <section className="mt-5 rounded-xl border border-slate-200 p-4">
                    <h3 className="font-bold">Log การสอบ</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      เหตุการณ์ที่บันทึกระหว่างการสอบรอบนี้
                    </p>
                    <ol className="mt-3 space-y-3">
                      {(detail.value.events?.length
                        ? detail.value.events
                        : [
                            {
                              time: detail.value.started,
                              action: "บันทึกประวัติการสอบ",
                              detail:
                                detail.value.status +
                                " · " +
                                detail.value.score,
                            },
                          ]
                      ).map((event, index) => (
                        <li
                          key={index}
                          className="flex gap-3 border-l-2 border-slate-200 pl-3"
                        >
                          <span className="mt-1 size-2 shrink-0 rounded-full bg-[#211d4f]" />
                          <div>
                            <b className="text-sm">{event.action}</b>
                            <p className="mt-0.5 text-sm text-slate-600">
                              {event.detail}
                            </p>
                            <small className="text-xs text-slate-400">
                              {event.time}
                            </small>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                </>
              )}
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setDetail(null)}>
                  ปิด
                </Button>
              </div>
            </section>
          </div>
        </WebBModalPortal>
      )}
        {entitlementModalOpen && (
          <WebBModalPortal>
            <div
              className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget)
                  setEntitlementModalOpen(false);
              }}
            >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="webb-grant-entitlement-title"
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-wide text-amber-700">
                    สิทธิ์สอบ · {selectedExamProduct?.name || "ชุดข้อสอบ"} · ชุด{" "}
                    {selectedExamSet?.name || "A"}
                  </p>
                  <h2
                    id="webb-grant-entitlement-title"
                    className="mt-1 text-xl font-bold text-slate-900"
                  >
                    เพิ่มสิทธิ์ให้ผู้เรียน
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    เลือกบัญชีผู้เรียนและสถานะเริ่มต้นของสิทธิ์
                  </p>
                </div>
                <button
                  type="button"
                  autoFocus
                  onClick={() => setEntitlementModalOpen(false)}
                  aria-label="ปิดหน้าต่างเพิ่มสิทธิ์"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
                >
                  <LuX aria-hidden="true" className="size-4" />
                </button>
              </div>
              <div className="mt-5 grid gap-4">
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                  ผู้เรียน
                  <AdminSelect
                    value={entitlementStudentId}
                    onChange={setEntitlementStudentId}
                    ariaLabel="เลือกบัญชีผู้เรียน"
                    placeholder="ค้นหาชื่อหรืออีเมลผู้เรียน"
                    options={students
                      .filter((student) => student.status === "ใช้งาน")
                      .map((student) => ({
                        value: student.id,
                        label: `${student.name} · ${student.email}`,
                      }))}
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                  สถานะสิทธิ์หลังเพิ่ม
                  <AdminSelect
                    value={newEntitlementStatus}
                    onChange={(value) =>
                      setNewEntitlementStatus(
                        value as DemoPurchase["examStatus"],
                      )
                    }
                    ariaLabel="เลือกสถานะสิทธิ์สอบ"
                    options={[
                      { value: "available", label: "พร้อมสอบ" },
                      { value: "in-progress", label: "กำลังสอบ" },
                      { value: "submitted", label: "ส่งข้อสอบแล้ว" },
                      { value: "interrupted", label: "รอตรวจสอบ" },
                    ]}
                  />
                </label>
                <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                  <b className="text-slate-800">สิทธิ์จะผูกกับรายการนี้</b>
                  <p>
                    {selectedExamProduct?.name || "ชุดข้อสอบ"} · ชุด{" "}
                    {selectedExamSet?.name || "A"} · บัญชีที่เลือก
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEntitlementModalOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  disabled={
                    !students.some(
                      (student) =>
                        student.id === entitlementStudentId &&
                        student.status === "ใช้งาน",
                    )
                  }
                  onClick={() => {
                    const student = students.find(
                      (row) =>
                        row.id === entitlementStudentId &&
                        row.status === "ใช้งาน",
                    );
                    if (student && selectedExamProduct)
                      grantManualEntitlement(
                        student,
                        selectedExamProduct.id,
                        selectedExamSet?.name || "A",
                        newEntitlementStatus,
                      );
                  }}
                >
                  ยืนยันเพิ่มสิทธิ์
                </Button>
              </div>
            </section>
          </div>
        </WebBModalPortal>
      )}
        <Section
          id="overview"
          title=""
          detail=""
          actionEnabledWhenReadOnly
        >
          <WebBDashboardMetrics
            orders={orders}
            students={students}
            onOrderDetail={(order) => setDetail({ type: "order", value: order })}
          />
          <div className="mt-4">
            <Panel>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">รายการที่ควรตรวจสอบ</h3>
                  <p className="mt-1 text-xs text-slate-500">ติดตามรายการที่รอดำเนินการจากแต่ละส่วน</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">งานค้าง</span>
              </div>
              <div className="grid gap-3 lg:grid-cols-3">
                {([
                  [
                    "คำร้องขอสอบใหม่",
                    tickets.filter((t) => t.status === "รอตรวจสอบ").length,
                    "/webb/admin/exam-management?tab=access",
                    "คำร้องจากผู้เรียนที่รอตรวจสอบ",
                    LuLifeBuoy,
                    "from-violet-500 to-indigo-600",
                  ],
                  [
                    "ชำระเงินรอยืนยัน",
                    orders.filter((o) => o.status === "รอชำระ").length,
                    "/webb/admin/orders",
                    "คำสั่งซื้อที่ยังไม่ยืนยันการชำระ",
                    LuCreditCard,
                    "from-amber-400 to-orange-500",
                  ],
                  [
                    "ผลสอบที่พักการเผยแพร่",
                    attempts.filter((a) => a.status === "ผิดปกติ").length,
                    "/webb/admin/exam-management?tab=results",
                    "ผลสอบที่ต้องตรวจสอบก่อนเผยแพร่",
                    LuFileCheck2,
                    "from-rose-500 to-pink-600",
                  ],
                ] as [string, number, string, string, typeof LuLifeBuoy, string][]).map(([label, value, href, hint, Icon, gradient]) => (
                  <Link
                    key={String(label)}
                    href={String(href)}
                    className="group flex min-h-32 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                  >
                    <span className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white shadow-sm`}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-800 group-hover:text-indigo-700">{label}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{hint}</span>
                    </span>
                    <span className="text-right">
                      <b className="block text-2xl font-extrabold tabular-nums text-slate-900">{value}</b>
                      <span className="text-[11px] text-slate-400">รายการ</span>
                    </span>
                    <LuArrowUpRight className="size-4 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-600" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </Panel>
          </div>
          <Panel>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">ชุดข้อสอบที่เปิดขาย</h3>
              <Link
                href="/webb/admin/exam-catalog"
                className="text-sm font-semibold text-indigo-700"
              >
                จัดการชุดสอบ
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl border border-slate-100 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-sm">{product.name}</b>
                    <Badge
                      tone={product.status === "เปิดขาย" ? "green" : "gray"}
                    >
                      {product.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    <b className="text-slate-700">ผู้เรียนชำระ {formatBaht(product.payPrice)}</b>
                    <span className="mt-1 block">ราคาสินค้า {formatBaht(product.price)} · {product.version}</span>
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </Section>

        <Section
          id="students"
          title="สมาชิกและผู้เข้าสอบ"
          detail="ค้นหาบัญชี ดูสถานะ และจัดการการเข้าถึงของผู้เรียน"
        >
          <Panel>
            <WebBAdminTable
              rows={filteredStudents}
              getSearchText={(student) =>
                [student.id, student.name, student.email, student.school].join(
                  " ",
                )
              }
              ariaLabel="ตารางสมาชิกและผู้เข้าสอบ"
              searchPlaceholder="ค้นหาผู้เรียน"
              resetKey={`${studentQuery}:${studentGradeFilter}:${studentStatusFilter}:${studentEntitlementFilter}`}
              emptyMessage={
                students.length
                  ? "ไม่พบผู้เรียนตามคำค้น"
                  : "ยังไม่มีบัญชีผู้เรียน"
              }
              hideSearch
              toolbar={
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.45fr)_repeat(3,minmax(145px,1fr))_auto]">
                  <label className="grid min-w-0 gap-1 text-xs font-semibold">
                    ค้นหาผู้เรียน
                    <WebBAdminInput
                      value={studentQuery}
                      onChange={(event) => setStudentQuery(event.target.value)}
                      placeholder="ชื่อ อีเมล โรงเรียน หรือรหัสผู้เรียน"
                      aria-label="ค้นหาชื่อ อีเมล โรงเรียน หรือรหัสผู้เรียน"
                      className="w-full"
                    />
                  </label>
                  <label className="grid min-w-0 gap-1 text-xs font-semibold">
                    ระดับชั้น
                    <AdminSelect
                      value={studentGradeFilter}
                      onChange={setStudentGradeFilter}
                      options={[
                        { value: "ทุกระดับชั้น", label: "ทุกระดับชั้น" },
                        ...registrationEducationOptions.map((education) => ({
                          value: education,
                          label: education,
                        })),
                      ]}
                      ariaLabel="กรองระดับชั้นผู้เรียน"
                    />
                  </label>
                  <label className="grid min-w-0 gap-1 text-xs font-semibold">
                    สถานะบัญชี
                    <AdminSelect
                      value={studentStatusFilter}
                      onChange={setStudentStatusFilter}
                      options={[
                        "ทุกสถานะ",
                        "ใช้งาน",
                        "ระงับ",
                        "ลบข้อมูลแล้ว",
                      ].map((status) => ({ value: status, label: status }))}
                      ariaLabel="กรองสถานะบัญชีผู้เรียน"
                    />
                  </label>
                  <label className="grid min-w-0 gap-1 text-xs font-semibold">
                    สิทธิ์สอบ
                    <AdminSelect
                      value={studentEntitlementFilter}
                      onChange={setStudentEntitlementFilter}
                      options={[
                        "ทุกสิทธิ์",
                        "มีสิทธิ์สอบ",
                        "ไม่มีสิทธิ์สอบ",
                      ].map((status) => ({ value: status, label: status }))}
                      ariaLabel="กรองสิทธิ์สอบผู้เรียน"
                    />
                  </label>
                  <div className="flex items-end">
                    <Button onClick={addStudent}>＋ เพิ่มผู้เรียน</Button>
                  </div>
                </div>
              }
            >
              {(pageStudents) => (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left">
                    <thead>
                      <tr>
                        {[
                          "รหัส / ผู้เรียน",
                          "อีเมล / โรงเรียน",
                          "ระดับ",
                          "สมัครเมื่อ",
                          "สิทธิ์สอบ",
                          "สถานะ",
                          "จัดการ",
                        ].map((h) => (
                          <th key={h} className={th}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageStudents.map((student) => (
                        <tr key={student.id}>
                          <td className={td}>
                            <b>{student.name}</b>
                            <small className="mt-1 block font-mono text-xs text-slate-400">
                              {student.id}
                            </small>
                          </td>
                          <td className={td}>
                            {student.email}
                            <small className="mt-1 block text-xs text-slate-400">
                              {student.school}
                            </small>
                          </td>
                          <td className={td}>{student.grade}</td>
                          <td className={td}>
                            {formatThaiDate(student.joined)}
                          </td>
                          <td className={td}>{student.entitlements} ชุด</td>
                          <td className={td}>
                            <Badge
                              tone={
                                student.status === "ใช้งาน" ? "green" : "red"
                              }
                            >
                              {student.status}
                            </Badge>
                          </td>
                          <td className={td}>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setDetail({
                                    type: "student",
                                    value: student,
                                  });
                                  logAction(
                                    "เปิดดูโปรไฟล์ผู้เรียน",
                                    student.id,
                                    "none",
                                  );
                                }}
                              >
                                ดูข้อมูล
                              </Button>
                              <Button
                                disabled={student.status === "ลบข้อมูลแล้ว"}
                                variant={
                                  student.status === "ใช้งาน"
                                    ? "danger"
                                    : "outline"
                                }
                                onClick={() => {
                                  const status: DemoStudent["status"] =
                                    student.status === "ใช้งาน"
                                      ? "ระงับ"
                                      : "ใช้งาน";
                                  setStudents((current) =>
                                    current.map((s) =>
                                      s.id === student.id
                                        ? { ...s, status }
                                        : s,
                                    ),
                                  );
                                  logAction(
                                    status === "ระงับ"
                                      ? "ระงับบัญชีผู้เรียน"
                                      : "เปิดใช้บัญชีผู้เรียน",
                                    student.id,
                                  );
                                }}
                              >
                                {student.status === "ใช้งาน"
                                  ? "ระงับ"
                                  : student.status === "ระงับ"
                                    ? "เปิดใช้"
                                    : "ลบแล้ว"}
                              </Button>
                              <Button
                                variant="danger"
                                disabled={student.status === "ลบข้อมูลแล้ว"}
                                ariaLabel={`ลบข้อมูล ${student.name}`}
                                title={`ลบข้อมูล ${student.name}`}
                                onClick={() => deleteStudent(student)}
                              >
                                <LuTrash2
                                  aria-hidden="true"
                                  className="size-4"
                                />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td
                            className={`${td} py-8 text-center text-slate-500`}
                            colSpan={7}
                          >
                            {students.length
                              ? "ไม่พบผู้เรียนตามคำค้น"
                              : "ยังไม่มีบัญชีผู้เรียน"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </WebBAdminTable>
          </Panel>
        </Section>

        <div
          className={
            offerTable && examView === "detail"
              ? "fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
              : undefined
          }
          onMouseDown={(event) => {
            if (
              offerTable &&
              examView === "detail" &&
              event.target === event.currentTarget
            )
              setExamView("table");
          }}
        >
          <div
            role={offerTable && examView === "detail" ? "dialog" : undefined}
            aria-modal={offerTable && examView === "detail" ? true : undefined}
            className={
              offerTable && examView === "detail"
                ? "max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6"
                : undefined
            }
          >
            {offerTable && examView === "detail" && (
              <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-lg font-bold">
                  ตั้งค่า {selectedExamProduct?.name} · ชุด A
                </h2>
                <button
                  type="button"
                  onClick={() => setExamView("table")}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                  aria-label="ปิดหน้าตั้งค่า"
                >
                  ปิด <LuX aria-hidden="true" className="size-4" />
                </button>
              </div>
            )}
            <Section
              id="products"
              title={
                offerTable
                  ? "สินค้าและแพ็กเกตของชุด A"
                  : activeScreen === "exam-management"
                    ? "ตั้งค่าราคาและสถานะขาย"
                    : activeScreen === "trial-exams"
                      ? "ชุดทดลอง"
                      : activeScreen === "real-exams" &&
                          initialFamilyId === "tpat"
                        ? "ชุดสอบ TPAT"
                        : activeScreen === "real-exams"
                          ? "ชุดจริง"
                          : "วิชาและชุดข้อสอบ"
              }
              detail={
                offerTable
                  ? undefined
                  : activeScreen === "exam-management"
                    ? `สินค้าที่เลือก: ${selectedExamProduct?.name || "TGAT"} · ชุด A · ใช้ตั้งค่าว่าผู้เรียนซื้ออะไร ราคาเท่าไร และเปิดขายอยู่หรือไม่`
                    : activeScreen === "trial-exams"
                      ? "จัดการชุดตัวอย่างที่ผู้เรียนทดลองทำได้"
                      : activeScreen === "real-exams"
                        ? "จัดการชุดขายจริงและเนื้อหาตั้งแต่สินค้าไปจนถึงเฉลย"
                        : "จัดการสินค้า เวอร์ชัน ราคา และชุดทดลอง"
              }
            >
              <Panel>
                {(activeScreen === "trial-exams" ||
                  activeScreen === "real-exams" ||
                  activeScreen === "exam-management") &&
                examView === "detail" &&
                selectedExamProduct ? (
                  <div className="space-y-5">
                    {!offerTable && (
                      <WebBAdminClientReference
                        productId={selectedExamProduct.id}
                        examSet={selectedExamSet?.name || "A"}
                        trial={activeScreen === "trial-exams"}
                        section="overview"
                      />
                    )}
                    <div>
                      <h3 className="font-bold">ตั้งค่าชุดข้อสอบ</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        การเปลี่ยนแปลงจะบันทึกใน Browser นี้ทันที
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="text-sm">สถานะที่ผู้เรียนเห็น</b>
                        <Badge
                          tone={
                            getClientReadiness(selectedExamProduct, openSales)
                              .tone
                          }
                        >
                          {
                            getClientReadiness(selectedExamProduct, openSales)
                              .label
                          }
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {activeScreen === "trial-exams"
                          ? "หน้าทดลองใช้โจทย์ TGAT1 ที่อยู่ใน Client · การแก้โจทย์ Draft ด้านล่างไม่เปลี่ยนโจทย์หน้าบ้าน"
                          : selectedExamProduct.trial &&
                              selectedExamProduct.id === "tgat1"
                            ? "TGAT1 เป็นทั้งสินค้าซื้อและทางทดลองฟรี · การทดลองใช้โจทย์คงที่ใน Client"
                            : WEBB_PRODUCTS.some(
                                  (item) => item.id === selectedExamProduct.id,
                                )
                              ? "Client รองรับเฉพาะสินค้าที่กำหนดไว้ในหน้าบ้าน · ไฟล์ที่เลือกใน Admin เก็บเป็นข้อมูลอ้างอิงเท่านั้น"
                              : "สินค้าที่สร้างใน Admin ใช้แสดงการจัดการหลังบ้าน · ยังไม่ปรากฏในรายการซื้อหรือห้องสอบของ Client"}
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <label className="grid gap-1 text-sm font-semibold text-slate-700">
                        เวอร์ชัน
                        <WebBAdminInput
                          value={selectedExamProduct.version}
                          onChange={(event) =>
                            setProducts((current) =>
                              current.map((product) =>
                                product.id === selectedExamProduct.id
                                  ? { ...product, version: event.target.value }
                                  : product,
                              ),
                            )
                          }
                          className="rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
                        />
                      </label>
                      {activeScreen === "trial-exams" ? (
                        <div className="grid gap-1 text-sm font-semibold text-slate-700">
                          การเข้าถึง
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal">
                            ทดลองฟรี · ไม่ต้องซื้อ
                          </div>
                        </div>
                      ) : (
                        <label className="grid gap-1 text-sm font-semibold text-slate-700">
                          ราคาสินค้า (บาท)
                          <WebBAdminInput
                            type="number"
                            min="0"
                            value={selectedExamProduct.price}
                            onChange={(event) => {
                              const price = Math.max(
                                0,
                                Number(event.target.value) || 0,
                              );
                              setProducts((current) =>
                                current.map((product) =>
                                  product.id === selectedExamProduct.id
                                    ? {
                                        ...product,
                                        price,
                                      }
                                    : product,
                                ),
                              );
                            }}
                            className="rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
                          />
                        </label>
                      )}
                      {activeScreen !== "trial-exams" && (
                        <label className="grid gap-1 text-sm font-semibold text-slate-700">
                          ยอดเรียกเก็บรวม Payso (บาท)
                          <WebBAdminInput
                            type="number"
                            min="0"
                            value={selectedExamProduct.payPrice}
                            onChange={(event) => {
                              const payPrice = Math.max(0, Number(event.target.value) || 0);
                              setProducts((current) => current.map((product) => product.id === selectedExamProduct.id ? { ...product, payPrice } : product));
                            }}
                            className="rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
                          />
                        </label>
                      )}
                      {activeScreen !== "trial-exams" && (
                        <label className="grid gap-1 text-sm font-semibold text-slate-700">
                          สถานะขาย
                          <AdminSelect
                            value={selectedExamProduct.status}
                            options={[
                              { value: "เปิดขาย", label: "เปิดขาย" },
                              { value: "ปิดขาย", label: "ปิดขาย" },
                            ]}
                            onChange={(value) =>
                              setProducts((current) =>
                                current.map((product) =>
                                  product.id === selectedExamProduct.id
                                    ? {
                                        ...product,
                                        status: value as DemoProduct["status"],
                                      }
                                    : product,
                                ),
                              )
                            }
                            className="font-normal"
                            ariaLabel="สถานะขาย"
                          />
                        </label>
                      )}
                      {activeScreen !== "trial-exams" &&
                        activeScreen !== "real-exams" &&
                        activeScreen !== "exam-management" && (
                          <label className="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
                            ประเภทชุด
                            <AdminSelect
                              value={
                                selectedExamProduct.trial ? "trial" : "real"
                              }
                              options={[
                                { value: "trial", label: "ชุดทดลอง" },
                                { value: "real", label: "ชุดจริง" },
                              ]}
                              onChange={(value) =>
                                setProducts((current) =>
                                  current.map((product) =>
                                    product.id === selectedExamProduct.id
                                      ? { ...product, trial: value === "trial" }
                                      : product,
                                  ),
                                )
                              }
                              className="font-normal"
                              ariaLabel="ประเภทชุดข้อสอบ"
                            />
                          </label>
                        )}
                      <div className="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
                        สถานะเนื้อหา
                        <div className="flex items-center rounded-xl border border-slate-200 px-3 py-2.5">
                          <Badge
                            tone={
                              selectedExamProduct.contentStatus === "เผยแพร่"
                                ? "green"
                                : selectedExamProduct.contentStatus === "รอตรวจ"
                                  ? "amber"
                                  : "blue"
                            }
                          >
                            {selectedExamProduct.contentStatus || "Draft"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {activeScreen !== "trial-exams" && (
                      <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                        ราคาสินค้าและยอดเรียกเก็บเป็นข้อมูลตัวอย่างแยกกัน ·
                        ค่าบริการ Payso และ VAT ขึ้นกับช่องทางชำระ
                      </p>
                    )}
                  </div>
                ) : (
                  <WebBAdminTable
                    rows={visibleExamProducts}
                    getSearchText={(product) =>
                      [
                        product.name,
                        product.parts,
                        product.version,
                        product.status,
                      ].join(" ")
                    }
                    searchPlaceholder="ค้นหาชุดข้อสอบหรือสินค้า"
                    ariaLabel="รายการชุดข้อสอบและสินค้า"
                    emptyMessage="ไม่พบชุดข้อสอบตามคำค้น"
                  >
                    {(pageProducts) => (
                      <table className="w-full min-w-[900px] text-left">
                        <thead>
                          <tr>
                            {(activeScreen === "trial-exams"
                              ? [
                                  "ชุดทดลอง / พาร์ท",
                                  "การเข้าถึง",
                                  "จำนวนข้อ",
                                  "เวลา",
                                  "หลังส่ง",
                                  "",
                                ]
                              : activeScreen === "real-exams"
                                ? [
                                    "ชุดข้อสอบ / พาร์ท",
                                    "สิทธิ์สอบ",
                                    "คำร้อง",
                                    "ประวัติสอบ",
                                    "ผลสอบ",
                                    "",
                                  ]
                                : [
                                    "สินค้า / พาร์ท",
                                    "เวอร์ชัน",
                                    "ราคาสินค้า",
                                    "ยอดชำระรวม",
                                    "ชุดทดลอง",
                                    "มีสินค้า",
                                    "สถานะหน้าบ้าน",
                                    "การทำงาน",
                                  ]
                            ).map((heading) => (
                              <th className={th} key={heading}>
                                {heading}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pageProducts.map((product) => {
                            const summary = examSummary(product);
                            const clientReadiness = getClientReadiness(
                              product,
                              openSales,
                            );
                            return (
                              <tr key={product.id}>
                                <td className={td}>
                                  <b>{product.name}</b>
                                  <small className="mt-1 block text-xs text-slate-400">
                                    {product.parts}
                                  </small>
                                </td>
                                {activeScreen === "trial-exams" ? (
                                  <>
                                    <td className={td}>ฟรี · ไม่ต้องซื้อ</td>
                                    <td className={td}>
                                      {TOTAL_MOCK_QUESTIONS} ข้อ
                                    </td>
                                    <td className={td}>
                                      {
                                        getExamPlan("tgat1", "A")
                                          .durationMinutes
                                      }{" "}
                                      นาที
                                    </td>
                                    <td className={td}>
                                      กลับห้องสอบ · ไม่แสดงคะแนน
                                    </td>
                                    <td className={td}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedExamProductId(product.id);
                                          setExamView("detail");
                                          setExamTab("overview");
                                          setPendingExamFile(null);
                                        }}
                                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#211d4f] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#332e71]"
                                      >
                                        เปิดรายการ
                                      </button>
                                    </td>
                                  </>
                                ) : activeScreen === "real-exams" ? (
                                  <>
                                    {[
                                      summary.entitledCount,
                                      summary.requestCount,
                                      summary.attemptCount,
                                      summary.resultCount,
                                    ].map((count, index) => (
                                      <td
                                        className={`${td} font-semibold`}
                                        key={index}
                                      >
                                        {count}
                                      </td>
                                    ))}
                                    <td className={td}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedExamProductId(product.id);
                                          setExamView("detail");
                                          setExamTab("overview");
                                          setPendingExamFile(null);
                                        }}
                                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#211d4f] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#332e71]"
                                      >
                                        เปิดรายการ
                                      </button>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className={td}>{product.version}</td>
                                    <td className={td}>
                                      {formatBaht(product.price)}
                                    </td>
                                    <td className={td}>
                                      {formatBaht(product.payPrice)}
                                    </td>
                                    <td className={td}>
                                      <Badge
                                        tone={product.trial ? "blue" : "gray"}
                                      >
                                        {product.trial ? "เปิด" : "ปิด"}
                                      </Badge>
                                    </td>
                                    <td className={td}>
                                      {offerTable ? (
                                        <Badge
                                          tone={
                                            product.status === "เปิดขาย"
                                              ? "green"
                                              : "gray"
                                          }
                                        >
                                          {product.status}
                                        </Badge>
                                      ) : (
                                        <button
                                          type="button"
                                          role="switch"
                                          aria-checked={
                                            product.status === "เปิดขาย"
                                          }
                                          aria-label={`สถานะสินค้า ${product.name}`}
                                          onClick={() => {
                                            setProducts((current) =>
                                              current.map((item) =>
                                                item.id === product.id
                                                  ? {
                                                      ...item,
                                                      status: (item.status ===
                                                      "เปิดขาย"
                                                        ? "ปิดขาย"
                                                        : "เปิดขาย") as DemoProduct["status"],
                                                    }
                                                  : item,
                                              ),
                                            );
                                            logAction(
                                              "เปลี่ยนสถานะสินค้า",
                                              `${product.name} · ${product.status === "เปิดขาย" ? "ไม่มีสินค้า" : "มีสินค้า"}`,
                                            );
                                          }}
                                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${product.status === "เปิดขาย" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                                        >
                                          {product.status === "เปิดขาย"
                                            ? "มีสินค้า"
                                            : "ไม่มีสินค้า"}
                                        </button>
                                      )}
                                    </td>
                                    <td className={td}>
                                      <Badge tone={clientReadiness.tone}>
                                        {clientReadiness.label}
                                      </Badge>
                                    </td>
                                    <td className={td}>
                                      {offerTable ? (
                                        <Button
                                          variant="outline"
                                          ariaLabel={`จัดการ ${product.name}`}
                                          title={`จัดการ ${product.name}`}
                                          onClick={() => {
                                            selectManagedExamProduct(
                                              product.id,
                                            );
                                            setExamView("detail");
                                          }}
                                        >
                                          <LuPencil
                                            aria-hidden="true"
                                            className="size-4"
                                          />
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          ariaLabel={`จัดการราคา ${product.name}`}
                                          title={`จัดการราคาสินค้าและยอดเรียกเก็บ ${product.name}`}
                                          onClick={() => {
                                            setSelectedExamProductId(product.id);
                                            setExamView("detail");
                                            setExamTab("offers");
                                          }}
                                        >
                                          <LuPencil
                                            aria-hidden="true"
                                            className="size-4"
                                          />
                                        </Button>
                                      )}
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </WebBAdminTable>
                )}
              </Panel>
            </Section>
          </div>
        </div>

        <Section
          id="content"
          title={activeScreen === "trial-exams" ? "" : "คลังข้อสอบและเฉลยคำตอบ"}
          detail={activeScreen === "trial-exams" ? undefined : "จัดการไฟล์ข้อสอบ เวอร์ชัน และเฉลยคำตอบที่ใช้ตรวจคะแนนก่อนเผยแพร่"}
        >
          <div className={embedded ? "flex-1 min-h-0 flex flex-col h-full" : "space-y-4"}>
            {selectedExamProduct && !embedded && activeScreen !== "trial-exams" && (
              <WebBAdminClientReference
                productId={selectedExamProduct.id}
                examSet={selectedExamSet?.name || "A"}
                trial={activeScreen === "trial-exams"}
                section="content"
              />
            )}
            {!embedded && sectionSettingsDraft && (
              <Panel>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold">
                      {activeScreen === "trial-exams"
                        ? "คลังข้อสอบและเฉลยคำตอบ"
                        : `ตั้งค่าโครงสร้าง ${sectionSettingsDraft.title}`}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {activeScreen === "trial-exams"
                        ? "จัดการไฟล์ข้อสอบ เวอร์ชัน และเฉลยคำตอบที่ใช้ตรวจคะแนนก่อนเผยแพร่"
                        : "ใช้กำหนดจำนวนข้อ เวลา รูปแบบตอบ และคะแนนในชุด A"}
                    </p>
                  </div>
                  <Button onClick={saveSectionSettings}>
                    บันทึกการตั้งค่า
                  </Button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <label className="grid gap-1 text-xs font-semibold">
                    จำนวนข้อ
                    <WebBAdminInput
                      type="number"
                      min="1"
                      value={sectionSettingsDraft.questionCount}
                      onChange={(event) =>
                        setSectionSettingsDraft({
                          ...sectionSettingsDraft,
                          questionCount: Number(event.target.value),
                        })
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold">
                    เวลาสอบ (นาที)
                    <WebBAdminInput
                      type="number"
                      min="1"
                      value={sectionSettingsDraft.durationMinutes}
                      onChange={(event) =>
                        setSectionSettingsDraft({
                          ...sectionSettingsDraft,
                          durationMinutes: Number(event.target.value),
                        })
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold">
                    จำนวนตัวเลือก
                    <WebBAdminInput
                      type="number"
                      min="2"
                      max="10"
                      value={sectionSettingsDraft.choiceCount}
                      onChange={(event) =>
                        setSectionSettingsDraft({
                          ...sectionSettingsDraft,
                          choiceCount: Number(event.target.value),
                        })
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold">
                    คะแนนเต็ม
                    <WebBAdminInput
                      type="number"
                      min="1"
                      value={sectionSettingsDraft.scoreMaximum}
                      onChange={(event) =>
                        setSectionSettingsDraft({
                          ...sectionSettingsDraft,
                          scoreMaximum: Number(event.target.value),
                        })
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold sm:col-span-2 xl:col-span-4">
                    รูปแบบคำตอบและการให้คะแนน
                    <WebBAdminInput
                      value={sectionSettingsDraft.responseMode}
                      onChange={(event) =>
                        setSectionSettingsDraft({
                          ...sectionSettingsDraft,
                          responseMode: event.target.value,
                        })
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                </div>
              </Panel>
            )}
            {!embedded && selectedExamProduct &&
              hasActiveAttempt(selectedExamProduct.name) && (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                  มีผู้เข้าสอบอยู่ ·
                  ล็อกการแก้เฉลยและเผยแพร่ชั่วคราวสำหรับผู้ดูแลทั่วไป · Super
                  Admin ยังแก้เฉลยรายข้อได้
                </p>
              )}
            <div
              className={
                embedded
                  ? "flex-1 min-h-0 flex flex-col lg:flex-row gap-5 overflow-hidden"
                  : activeScreen === "trial-exams"
                    ? "grid gap-4 xl:grid-cols-[.7fr_1.3fr]"
                    : "grid gap-4 xl:grid-cols-[1.1fr_.9fr]"
              }
            >
              {embedded && (
                <div className={`w-full ${activeScreen === "trial-exams" ? "lg:w-[300px] xl:w-[320px]" : "lg:w-[400px] xl:w-[420px]"} shrink-0 h-full overflow-y-auto space-y-4 pr-1.5`}>
                  {sectionSettingsDraft && (
                    <Panel>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold">
                            {activeScreen === "trial-exams"
                              ? "คลังข้อสอบและเฉลยคำตอบ"
                              : `ตั้งค่าโครงสร้าง ${sectionSettingsDraft.title}`}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {activeScreen === "trial-exams"
                              ? "จัดการไฟล์ข้อสอบ เวอร์ชัน และเฉลยคำตอบที่ใช้ตรวจคะแนนก่อนเผยแพร่"
                              : "ใช้กำหนดจำนวนข้อ เวลา รูปแบบตอบ และคะแนนในชุด A"}
                          </p>
                        </div>
                        <Button onClick={saveSectionSettings}>
                          บันทึกการตั้งค่า
                        </Button>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1 text-xs font-semibold">
                          จำนวนข้อ
                          <WebBAdminInput
                            type="number"
                            min="1"
                            value={sectionSettingsDraft.questionCount}
                            onChange={(event) =>
                              setSectionSettingsDraft({
                                ...sectionSettingsDraft,
                                questionCount: Number(event.target.value),
                              })
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-semibold">
                          เวลาสอบ (นาที)
                          <WebBAdminInput
                            type="number"
                            min="1"
                            value={sectionSettingsDraft.durationMinutes}
                            onChange={(event) =>
                              setSectionSettingsDraft({
                                ...sectionSettingsDraft,
                                durationMinutes: Number(event.target.value),
                              })
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-semibold">
                          จำนวนตัวเลือก
                          <WebBAdminInput
                            type="number"
                            min="2"
                            max="10"
                            value={sectionSettingsDraft.choiceCount}
                            onChange={(event) =>
                              setSectionSettingsDraft({
                                ...sectionSettingsDraft,
                                choiceCount: Number(event.target.value),
                              })
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-semibold">
                          คะแนนเต็ม
                          <WebBAdminInput
                            type="number"
                            min="1"
                            value={sectionSettingsDraft.scoreMaximum}
                            onChange={(event) =>
                              setSectionSettingsDraft({
                                ...sectionSettingsDraft,
                                scoreMaximum: Number(event.target.value),
                              })
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-semibold sm:col-span-2">
                          รูปแบบคำตอบและการให้คะแนน
                          <WebBAdminInput
                            value={sectionSettingsDraft.responseMode}
                            onChange={(event) =>
                              setSectionSettingsDraft({
                                ...sectionSettingsDraft,
                                responseMode: event.target.value,
                              })
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"
                          />
                        </label>
                      </div>
                    </Panel>
                  )}

                  {selectedExamProduct &&
                    hasActiveAttempt(selectedExamProduct.name) && (
                      <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                        มีผู้เข้าสอบอยู่ ·
                        ล็อกการแก้เฉลยและเผยแพร่ชั่วคราวสำหรับผู้ดูแลทั่วไป · Super
                        Admin ยังแก้เฉลยรายข้อได้
                      </p>
                    )}

                  {(activeScreen !== "trial-exams" || embedded) && (
                    <Panel>
                      <div className={`mt-2 grid gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 ${activeScreen === "trial-exams" ? "p-2" : "gap-3 p-4"}`}>
                        <div>
                          <b className="text-sm">
                            {activeScreen === "trial-exams"
                              ? "เพิ่มเอกสารข้อสอบ PDF"
                              : `ชุด ${selectedExamSet?.name || "A"} · เพิ่มเอกสารข้อสอบ PDF`}
                          </b>
                          <p className="mt-1 text-xs text-slate-500">
                            {selectedExamProduct?.name || "เลือกชุดข้อสอบ"} ·
                            เลือกไฟล์เพื่อบันทึกเข้าคิวตรวจ
                          </p>
                        </div>
                        <div className="grid gap-1 text-xs font-semibold text-slate-600">
                          ชุดข้อสอบ
                          <div className={`rounded-xl border border-slate-200 bg-white ${activeScreen === "trial-exams" ? "px-2 py-1.5 text-xs" : "px-3 py-2.5 text-sm"} font-normal text-slate-800`}>
                            {activeScreen === "trial-exams"
                              ? selectedExamProduct?.name || "—"
                              : `${selectedExamProduct?.name || "—"} · ชุด ${selectedExamSet?.name || "A"}`}
                          </div>
                        </div>
                        {selectedExamProduct &&
                          getManagedExamPlan(selectedExamProduct.id, "A").sections
                            .length > 0 && (
                            <div className="grid gap-1 text-xs font-semibold text-slate-600">
                              <span>พาร์ทที่ใช้เอกสารนี้</span>
                              {getManagedExamPlan(selectedExamProduct.id, "A")
                                .sections.length === 1 ? (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-800">
                                  {
                                    getManagedExamPlan(selectedExamProduct.id, "A")
                                      .sections[0].title
                                  }{" "}
                                  · ข้อ{" "}
                                  {
                                    getManagedExamPlan(selectedExamProduct.id, "A")
                                      .sections[0].questionStart
                                  }
                                  –
                                  {getManagedExamPlan(selectedExamProduct.id, "A")
                                    .sections[0].questionStart +
                                    getManagedExamPlan(selectedExamProduct.id, "A")
                                      .sections[0].questionCount -
                                    1}
                                  <span className="ml-2 text-xs text-slate-500">
                                    เอกสารของพาร์ทนี้โดยตรง
                                  </span>
                                </div>
                              ) : (
                                <AdminSelect
                                  value={
                                    getManagedExamPlan(
                                      selectedExamProduct.id,
                                      "A",
                                    ).sections.some(
                                      (part) => part.id === selectedDocumentPartId,
                                    )
                                      ? selectedDocumentPartId
                                      : getManagedExamPlan(
                                          selectedExamProduct.id,
                                          "A",
                                        ).sections[0].id
                                  }
                                  onChange={setSelectedDocumentPartId}
                                  options={getManagedExamPlan(
                                    selectedExamProduct.id,
                                    "A",
                                  ).sections.map((part) => ({
                                    value: part.id,
                                    label: `${part.title} · ข้อ ${part.questionStart}–${part.questionStart + part.questionCount - 1}`,
                                  }))}
                                  ariaLabel="เลือกพาร์ทของไฟล์ข้อสอบ"
                                />
                              )}
                            </div>
                          )}
                        <label className="grid gap-2 rounded-lg bg-white p-3 text-sm">
                          <span className="font-semibold">
                            เลือกไฟล์ PDF ข้อสอบ
                          </span>
                          <WebBAdminInput
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              if (
                                file.type !== "application/pdf" &&
                                !file.name.toLowerCase().endsWith(".pdf")
                              ) {
                                toast.error("รองรับเฉพาะไฟล์ PDF");
                                event.target.value = "";
                                return;
                              }
                              setPendingExamFile(file);
                              toast.info(`เลือกไฟล์ ${file.name} แล้ว`);
                            }}
                            className="max-w-full text-xs"
                          />
                          {pendingExamFile && (
                            <small className="text-emerald-700">
                              พร้อมบันทึก: {pendingExamFile.name} ·{" "}
                              {(pendingExamFile.size / 1024).toFixed(0)} KB
                            </small>
                          )}
                        </label>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs text-slate-500">
                            หน้าจอนี้บันทึกชื่อไฟล์และสถานะไว้ในเบราว์เซอร์นี้
                          </p>
                          <Button
                            disabled={!pendingExamFile}
                            onClick={saveExamDocument}
                          >
                            บันทึกเอกสาร
                          </Button>
                        </div>
                        {examDocuments.filter(
                          (document) =>
                            document.productId === selectedExamProduct?.id &&
                            document.examSet === selectedExamSet?.name &&
                            Boolean(document.trial) ===
                              (activeScreen === "trial-exams"),
                        ).length > 0 && (
                          <div className="space-y-2 border-t border-slate-200 pt-3">
                            <b className="text-xs text-slate-600">เอกสารในรายการ</b>
                            {examDocuments
                              .filter(
                                (document) =>
                                  document.productId === selectedExamProduct?.id &&
                                  document.examSet === selectedExamSet?.name &&
                                  Boolean(document.trial) ===
                                    (activeScreen === "trial-exams"),
                              )
                              .map((document) => (
                                <div
                                  key={document.id}
                                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 text-sm"
                                >
                                  <div className="min-w-0">
                                    <b className="block truncate">
                                      {document.name}
                                    </b>
                                    <small className="text-slate-500">
                                      {document.trial
                                        ? document.productName
                                        : `${document.productName} · ชุด ${document.examSet}`}
                                      {document.sectionTitle
                                        ? ` · ${document.sectionTitle}`
                                        : ""}{" "}
                                      · {(document.size / 1024).toFixed(0)} KB ·{" "}
                                      {document.addedAt}
                                    </small>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      tone={
                                        document.status === "เผยแพร่"
                                          ? "green"
                                          : "amber"
                                      }
                                    >
                                      {document.status}
                                    </Badge>
                                    <Button
                                      variant={
                                        document.status === "เผยแพร่"
                                          ? "outline"
                                          : "primary"
                                      }
                                      onClick={() => {
                                        const nextStatus =
                                          document.status === "เผยแพร่"
                                            ? "รอตรวจ"
                                            : "เผยแพร่";
                                        setExamDocuments((current) =>
                                          current.map((item) =>
                                            item.id === document.id
                                              ? { ...item, status: nextStatus }
                                              : item,
                                          ),
                                        );
                                        if (!document.trial) {
                                          const hasPublishedDocument =
                                            nextStatus === "เผยแพร่" ||
                                            examDocuments.some(
                                              (item) =>
                                                item.id !== document.id &&
                                                item.productId ===
                                                  document.productId &&
                                                item.examSet === document.examSet &&
                                                !item.trial &&
                                                item.status === "เผยแพร่",
                                            );
                                          setExamSets((current) =>
                                            current.map((set) =>
                                              set.productId === document.productId &&
                                              set.name === document.examSet
                                                ? {
                                                    ...set,
                                                    contentStatus:
                                                      hasPublishedDocument
                                                        ? "เผยแพร่"
                                                        : "รอตรวจ",
                                                  }
                                                : set,
                                            ),
                                          );
                                          setProducts((current) =>
                                            current.map((item) =>
                                              item.id === document.productId
                                                ? {
                                                    ...item,
                                                    contentStatus:
                                                      hasPublishedDocument
                                                        ? "เผยแพร่"
                                                        : "รอตรวจ",
                                                  }
                                                : item,
                                            ),
                                          );
                                        }
                                      logAction(
                                        nextStatus === "เผยแพร่"
                                          ? "เผยแพร่ไฟล์ข้อสอบ"
                                          : "พักไฟล์ข้อสอบ",
                                        `${document.productName} · ${document.name}`,
                                      );
                                    }}
                                  >
                                    {document.status === "เผยแพร่"
                                      ? "พักเผยแพร่"
                                      : "เผยแพร่"}
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </Panel>
                )}
              </div>
            )}
            {!embedded && (
                <Panel>
                <div className={`mt-4 grid gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 ${activeScreen === "trial-exams" ? "p-2" : "gap-3 p-4"}`}>
                    <div>
                      <b className="text-sm">
                        {activeScreen === "trial-exams"
                          ? "เพิ่มเอกสารข้อสอบ PDF"
                          : `ชุด ${selectedExamSet?.name || "A"} · เพิ่มเอกสารข้อสอบ PDF`}
                      </b>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedExamProduct?.name || "เลือกชุดข้อสอบ"} ·
                        เลือกไฟล์เพื่อบันทึกเข้าคิวตรวจ
                      </p>
                    </div>
                    <div className="grid gap-1 text-xs font-semibold text-slate-600">
                      ชุดข้อสอบ
                      <div className={`rounded-xl border border-slate-200 bg-white ${activeScreen === "trial-exams" ? "px-2 py-1.5 text-xs" : "px-3 py-2.5 text-sm"} font-normal text-slate-800`}>
                        {activeScreen === "trial-exams"
                          ? selectedExamProduct?.name || "—"
                          : `${selectedExamProduct?.name || "—"} · ชุด ${selectedExamSet?.name || "A"}`}
                      </div>
                    </div>
                    {selectedExamProduct &&
                      getManagedExamPlan(selectedExamProduct.id, "A").sections
                        .length > 0 && (
                        <div className="grid gap-1 text-xs font-semibold text-slate-600">
                          <span>พาร์ทที่ใช้เอกสารนี้</span>
                          {getManagedExamPlan(selectedExamProduct.id, "A")
                            .sections.length === 1 ? (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-800">
                              {
                                getManagedExamPlan(selectedExamProduct.id, "A")
                                  .sections[0].title
                              }{" "}
                              · ข้อ{" "}
                              {
                                getManagedExamPlan(selectedExamProduct.id, "A")
                                  .sections[0].questionStart
                              }
                              –
                              {getManagedExamPlan(selectedExamProduct.id, "A")
                                .sections[0].questionStart +
                                getManagedExamPlan(selectedExamProduct.id, "A")
                                  .sections[0].questionCount -
                                1}
                              <span className="ml-2 text-xs text-slate-500">
                                เอกสารของพาร์ทนี้โดยตรง
                              </span>
                            </div>
                          ) : (
                            <AdminSelect
                              value={
                                getManagedExamPlan(
                                  selectedExamProduct.id,
                                  "A",
                                ).sections.some(
                                  (part) => part.id === selectedDocumentPartId,
                                )
                                  ? selectedDocumentPartId
                                  : getManagedExamPlan(
                                      selectedExamProduct.id,
                                      "A",
                                    ).sections[0].id
                              }
                              onChange={setSelectedDocumentPartId}
                              options={getManagedExamPlan(
                                selectedExamProduct.id,
                                "A",
                              ).sections.map((part) => ({
                                value: part.id,
                                label: `${part.title} · ข้อ ${part.questionStart}–${part.questionStart + part.questionCount - 1}`,
                              }))}
                              ariaLabel="เลือกพาร์ทของไฟล์ข้อสอบ"
                            />
                          )}
                        </div>
                      )}
                    <label className="grid gap-2 rounded-lg bg-white p-3 text-sm">
                      <span className="font-semibold">
                        เลือกไฟล์ PDF ข้อสอบ
                      </span>
                      <WebBAdminInput
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          if (
                            file.type !== "application/pdf" &&
                            !file.name.toLowerCase().endsWith(".pdf")
                          ) {
                            toast.error("รองรับเฉพาะไฟล์ PDF");
                            event.target.value = "";
                            return;
                          }
                          setPendingExamFile(file);
                          toast.info(`เลือกไฟล์ ${file.name} แล้ว`);
                        }}
                        className="max-w-full text-xs"
                      />
                      {pendingExamFile && (
                        <small className="text-emerald-700">
                          พร้อมบันทึก: {pendingExamFile.name} ·{" "}
                          {(pendingExamFile.size / 1024).toFixed(0)} KB
                        </small>
                      )}
                    </label>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        หน้าจอนี้บันทึกชื่อไฟล์และสถานะไว้ในเบราว์เซอร์นี้
                      </p>
                      <Button
                        disabled={!pendingExamFile}
                        onClick={saveExamDocument}
                      >
                        บันทึกเอกสาร
                      </Button>
                    </div>
                    {examDocuments.filter(
                      (document) =>
                        document.productId === selectedExamProduct?.id &&
                        document.examSet === selectedExamSet?.name &&
                        Boolean(document.trial) ===
                          (activeScreen === "trial-exams"),
                    ).length > 0 && (
                      <div className="space-y-2 border-t border-slate-200 pt-3">
                        <b className="text-xs text-slate-600">เอกสารในรายการ</b>
                        {examDocuments
                          .filter(
                            (document) =>
                              document.productId === selectedExamProduct?.id &&
                            document.examSet === selectedExamSet?.name &&
                            Boolean(document.trial) ===
                              (activeScreen === "trial-exams"),
                          )
                          .map((document) => (
                            <div
                              key={document.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 text-sm"
                            >
                              <div className="min-w-0">
                                <b className="block truncate">
                                  {document.name}
                                </b>
                                <small className="text-slate-500">
                                  {document.trial
                                    ? document.productName
                                    : `${document.productName} · ชุด ${document.examSet}`}
                                  {document.sectionTitle
                                    ? ` · ${document.sectionTitle}`
                                    : ""}{" "}
                                  · {(document.size / 1024).toFixed(0)} KB ·{" "}
                                  {document.addedAt}
                                </small>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  tone={
                                    document.status === "เผยแพร่"
                                      ? "green"
                                      : "amber"
                                  }
                                >
                                  {document.status}
                                </Badge>
                                <Button
                                  variant={
                                    document.status === "เผยแพร่"
                                      ? "outline"
                                      : "primary"
                                  }
                                  onClick={() => {
                                    const nextStatus =
                                      document.status === "เผยแพร่"
                                        ? "รอตรวจ"
                                        : "เผยแพร่";
                                    setExamDocuments((current) =>
                                      current.map((item) =>
                                        item.id === document.id
                                          ? { ...item, status: nextStatus }
                                          : item,
                                      ),
                                    );
                                    if (!document.trial) {
                                      const hasPublishedDocument =
                                        nextStatus === "เผยแพร่" ||
                                        examDocuments.some(
                                          (item) =>
                                            item.id !== document.id &&
                                            item.productId === document.productId &&
                                            item.examSet === document.examSet &&
                                            !item.trial &&
                                            item.status === "เผยแพร่",
                                        );
                                      setExamSets((current) =>
                                        current.map((set) =>
                                          set.productId === document.productId &&
                                          set.name === document.examSet
                                            ? {
                                                ...set,
                                                contentStatus:
                                                  hasPublishedDocument
                                                    ? "เผยแพร่"
                                                    : "รอตรวจ",
                                              }
                                            : set,
                                        ),
                                      );
                                      setProducts((current) =>
                                        current.map((item) =>
                                          item.id === document.productId
                                            ? {
                                                ...item,
                                                contentStatus:
                                                  hasPublishedDocument
                                                    ? "เผยแพร่"
                                                    : "รอตรวจ",
                                              }
                                            : item,
                                        ),
                                      );
                                    }
                                    logAction(
                                      nextStatus === "เผยแพร่"
                                        ? "เผยแพร่ไฟล์ข้อสอบ"
                                        : "พักไฟล์ข้อสอบ",
                                      `${document.productName} · ${document.name}`,
                                    );
                                  }}
                                >
                                  {document.status === "เผยแพร่"
                                    ? "พักเผยแพร่"
                                    : "เผยแพร่"}
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </Panel>
              )}
              <div className={embedded ? "flex-1 min-w-0 h-full overflow-hidden flex flex-col" : "min-w-0"}>
                <Panel
                  className={
                    embedded ? "h-full flex flex-col min-h-0 overflow-hidden" : ""
                  }
                >
                  <div className="shrink-0">
                    <h3 className="font-bold">
                      {activeScreen === "trial-exams"
                        ? "เฉลยรายข้อ"
                        : `เฉลยรายข้อ ชุด ${selectedExamSet?.name || "A"}`}
                    </h3>

                    {answerKeyProductId === "tgat-full" && (
                      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
                        เรียงพาร์ทตามหน้าสอบ: TGAT1 → TGAT2 → TGAT3
                      </p>
                    )}
                  </div>

                  <div className={embedded ? "flex-1 min-h-0 overflow-y-auto mt-3 pr-1" : "pt-2"}>
                    {isTgat3Product ? (
                      <div>
                        <WebBTGAT3AnswerKeyManager
                          rules={tgat3Rules}
                          disabled={answerEntryLocked}
                      onChange={(newRules) => {
                        setTgat3Rules(newRules);
                        const nextAnswers = newRules.map((r) => {
                          if (r.responseType === "single") return r.singleCorrectChoice || "1";
                          if (r.responseType === "multiple") return (r.targetChoices || ["1"]).join(",");
                          if (r.responseType === "weighted") return "1";
                          if (r.responseType === "linked") {
                            const pair = r.acceptedPairs?.[0];
                            return pair ? `${pair.q1}/${pair.q2}` : "1/1";
                          }
                          return "1";
                        });
                        setAnswerKey(nextAnswers);
                        setAnswerScoringRules(
                          newRules.map((r) => ({
                            responseType: (r.responseType === "weighted" ? "single" : r.responseType) as DemoAnswerScoringRule["responseType"],
                            maxScore: r.maxScore,
                            partialScore: r.responseType === "multiple" ? 0.25 : 0,
                          }))
                        );
                        const nextReviewed: Record<string, boolean> = {};
                        newRules.forEach((r, idx) => {
                          nextReviewed[String(idx)] = !!r.isReviewed;
                        });
                        setReviewedAnswers(nextReviewed);
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <p className="mt-2 text-xs font-semibold text-blue-700">
                      ตรวจเฉลยแล้ว{" "}
                      {
                        answerKey.filter((_, index) => reviewedAnswers[index])
                          .length
                      }
                      /{answerKey.length} ข้อ
                    </p>
                    <WebBAdminTable
                  rows={answerKey.map((answer, index) => ({
                    answer,
                    index,
                    question: getExamQuestionDetails(answerKeyPlan, index),
                    section: answerKeyPlan.sections.find(
                      (item) =>
                        index >= item.answerIndexStart &&
                        index < item.answerIndexStart + item.questionCount,
                    ),
                  }))}
                  getSearchText={(row) => [
                    row.question.questionNumber,
                    row.section?.title,
                    row.answer,
                    answerScoringRules[row.index]?.responseType,
                  ].join(" ")}
                  ariaLabel="ตารางเฉลยรายข้อ"
                  pageSize={20}
                  emptyMessage="ยังไม่มีเฉลยในชุดนี้"
                  searchPlaceholder="ค้นหาข้อหรือคำตอบ"
                >
                  {(pageAnswers) => (
                    <div className="w-full">
                      <table className="w-full min-w-[900px] table-fixed text-left">
                        <colgroup>
                          <col className="w-[15%]" />
                          <col className="w-[25%]" />
                          <col className="w-[25%]" />
                          <col className="w-[18%]" />
                          <col className="w-[17%]" />
                        </colgroup>
                        <thead>
                          <tr>
                            {[
                              "พาร์ท / ข้อ",
                              "รูปแบบตอบ",
                              "เฉลย",
                              "คะแนนเต็ม",
                              "คะแนนบางส่วน",
                            ].map((x) => (
                              <th className={th} key={x}>
                                {x}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                            {pageAnswers.map(({ answer, index: i, question, section }) => {
                            const rule = answerScoringRules[i] || {
                              responseType: "single" as const,
                              maxScore: 1,
                              partialScore: 0,
                            };
                            const isTgat3 =
                              answerKeyProductId === "tgat3" ||
                              section?.id === "tgat3";
                            const responseDetails = getExamResponseDetails(
                              answerKeyPlan,
                              i,
                            );
                            const updateRule = (
                              change: Partial<DemoAnswerScoringRule>,
                            ) => {
                              setAnswerScoringRules((current) =>
                                current.map((currentRule, index) =>
                                  index === i
                                    ? { ...currentRule, ...change }
                                    : currentRule,
                                ),
                              );
                              setReviewedAnswers((current) => ({
                                ...current,
                                [i]: false,
                              }));
                            };
                            return (
                            <tr key={i}>
                              <td className={td}>
                                {section && (
                                  <small className="mb-1 block text-[10px] text-slate-500">
                                    {section.id.toUpperCase()}
                                  </small>
                                )}
                                {question.questionNumber}
                              </td>
                              <td className={td}>
                                {isTgat3 ? (
                                  <div>
                                    <span className="text-xs font-medium text-slate-700">
                                      {rule.responseType === "multiple"
                                        ? "เลือกหลายคำตอบ"
                                        : rule.responseType === "linked"
                                          ? "ข้อเชื่อมโยง"
                                          : "คำตอบเดี่ยว"}
                                    </span>
                                    {responseDetails.linkedQuestionNumber && (
                                      <small className="mt-1 block text-[10px] text-slate-500">
                                        เชื่อมกับข้อ {responseDetails.linkedQuestionNumber}
                                      </small>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-600">คำตอบเดี่ยว</span>
                                )}
                              </td>
                              <td className={td}>
                                {isTgat3 && rule.responseType !== "single" ? (
                                  <WebBAdminInput
                                    value={answer}
                                    disabled={answerEntryLocked}
                                    onChange={(event) => {
                                      setAnswerKey((current) =>
                                        current.map((currentAnswer, index) =>
                                          index === i ? event.target.value : currentAnswer,
                                        ),
                                      );
                                      setReviewedAnswers((current) => ({
                                        ...current,
                                        [i]: false,
                                      }));
                                    }}
                                    aria-label={`เฉลยข้อ ${i + 1}`}
                                    placeholder={rule.responseType === "linked" ? "เช่น 1/4 หรือ 4/3" : "เช่น 1,2,4"}
                                    className="w-36 rounded-lg border border-slate-200 px-2.5 py-2 text-sm disabled:bg-slate-100"
                                  />
                                ) : (
                                  <AdminSelect
                                    value={(({"A":"1","B":"2","C":"3","D":"4","E":"5"} as Record<string, string>)[answer] || answer)}
                                    disabled={answerEntryLocked}
                                    options={Array.from(
                                      {
                                        length: getExamQuestionDetails(
                                          getManagedExamPlan(
                                            answerKeyProductId,
                                            answerKeySetName,
                                          ),
                                          i,
                                        ).choiceCount,
                                      },
                                      (_, index) =>
                                        String(index + 1),
                                    ).map((value) => ({ value, label: value }))}
                                    onChange={(value) => {
                                      setAnswerKey((current) =>
                                        current.map((currentAnswer, index) =>
                                          index === i ? value : currentAnswer,
                                        ),
                                      );
                                      setReviewedAnswers((current) => ({
                                        ...current,
                                        [i]: false,
                                      }));
                                    }}
                                    ariaLabel={`เฉลยข้อ ${i + 1}`}
                                    className="min-w-20"
                                  />
                                )}
                              </td>
                              <td className={td}>
                                <WebBAdminInput
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={rule.maxScore}
                                  disabled={answerEntryLocked}
                                  onChange={(event) => {
                                    const maxScore = Number(event.target.value);
                                    updateRule({
                                      maxScore,
                                      partialScore:
                                        rule.responseType === "single"
                                          ? 0
                                          : Math.min(
                                              rule.partialScore,
                                              Math.max(0, maxScore - 0.01),
                                            ),
                                    });
                                  }}
                                  aria-label={`คะแนนเต็มข้อ ${i + 1}`}
                                  className="w-24 rounded-lg border border-slate-200 px-2.5 py-2 text-sm disabled:bg-slate-100"
                                />
                              </td>
                              <td className={td}>
                                {isTgat3 && rule.responseType !== "single" ? (
                                  <WebBAdminInput
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={rule.partialScore}
                                    disabled={answerEntryLocked}
                                    onChange={(event) =>
                                      updateRule({ partialScore: Number(event.target.value) })
                                    }
                                    aria-label={`คะแนนบางส่วนข้อ ${i + 1}`}
                                    className="w-24 rounded-lg border border-slate-200 px-2.5 py-2 text-sm disabled:bg-slate-100"
                                  />
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </td>
                            </tr>
                          );})}
                        </tbody>
                      </table>
                    </div>
                  )}
                </WebBAdminTable>
                  </>
                )}
                </div>
                <div className={`flex flex-wrap items-center gap-3 ${embedded ? "shrink-0 pt-3 border-t border-slate-100 mt-2" : "pt-3"}`}>
                <Button
                  disabled={answerEntryLocked}
                  onClick={() => {
                    if (isTgat3Product) {
                      setTgat3Rules([...tgat3Rules]);
                    }
                    setAnswerKey([...answerKey]);
                    logAction(
                      "บันทึกเฉลย",
                      (selectedExamProduct?.name || "TGAT1") +
                        " ชุด " +
                        answerKeySetName,
                    );
                    toast.success("บันทึกเฉลยและเกณฑ์คะแนนแล้ว");
                  }}
                >
                  บันทึกเฉลย
                </Button>
                </div>
              </Panel>
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="orders"
          title="คำสั่งซื้อและการชำระเงิน"
          detail="ค้นหาและตรวจสอบสถานะคำสั่งซื้อ และเปลี่ยนสถานะคำสั่งซื้อ"
          action={
            <div className="flex flex-nowrap items-center gap-2">
              {orderTabs}
              <Button variant="outline" onClick={exportOrders}>
                ดาวน์โหลด CSV
              </Button>
            </div>
          }
          actionEnabledWhenReadOnly
        >
          <Panel>
            <div className="mb-4 flex flex-wrap items-end gap-3 xl:flex-nowrap">
              <WebBThaiDatePicker
                label="ตั้งแต่วันที่"
                value={fromDate}
                max={toDate || undefined}
                onChange={setFromDate}
                className="w-44 min-w-0 shrink-0"
              />
              <WebBThaiDatePicker
                label="ถึงวันที่"
                value={toDate}
                min={fromDate || undefined}
                onChange={setToDate}
                className="w-44 min-w-0 shrink-0"
              />
              <WebBAdminInput
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="ค้นหาผู้เรียน เลขคำสั่งซื้อ หรือชุดสอบ"
                className="min-w-[240px] flex-1"
              />
              <label className="flex w-56 shrink-0 items-center gap-2 text-sm text-slate-600">
                <span className="shrink-0">สถานะ</span>
                <AdminSelect
                  value={orderStatusFilter}
                  onChange={setOrderStatusFilter}
                  options={[
                    "ทั้งหมด",
                    "รอชำระ",
                    "สำเร็จ",
                    "หมดอายุ",
                    "ยกเลิก",
                    "ไม่สำเร็จ",
                    "คืนเงินแล้ว",
                  ].map((value) => ({ value, label: value }))}
                  ariaLabel="กรองสถานะคำสั่งซื้อ"
                  className="min-w-0 flex-1"
                />
              </label>
            </div>
            <WebBAdminTable
              rows={filteredOrders}
              getSearchText={(order) =>
                [
                  order.ref,
                  order.student,
                  order.product,
                  order.method,
                  order.status,
                ].join(" ")
              }
              ariaLabel="ตารางคำสั่งซื้อและการชำระเงิน"
              hideSearch
              emptyMessage="ไม่พบคำสั่งซื้อในช่วงเวลาและตัวกรองนี้"
              resetKey={orderStatusFilter + fromDate + toDate}
            >
              {(pageOrders) => (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left">
                    <thead>
                      <tr>
                        {[
                          "เลขที่ / วันที่",
                          "ผู้เรียน / สินค้า",
                          "ราคาสินค้า",
                          "ยอดเรียกเก็บรวม Payso",
                          "สถานะ",
                          "จัดการ",
                        ].map((h) => (
                          <th className={th} key={h}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageOrders.map((order) => (
                        <tr key={order.ref}>
                          <td className={td}>
                            <b className="font-mono text-xs">{order.ref}</b>
                            <small className="mt-1 block text-xs text-slate-400">
                              {formatThaiDate(order.day)}
                            </small>
                          </td>
                          <td className={td}>
                            {order.student}
                            <small className="mt-1 block text-xs text-slate-400">
                              {order.product}
                            </small>
                          </td>
                          <td className={td}>{formatBaht(order.base)}</td>
                          <td className={td}>{formatBaht(order.charged)}</td>
                          <td className={td}>
                            <Badge
                              tone={
                                order.status === "สำเร็จ"
                                  ? "green"
                                  : order.status === "รอชำระ"
                                    ? "amber"
                                    : order.status === "คืนเงินแล้ว"
                                      ? "red"
                                      : order.status === "ไม่สำเร็จ" ||
                                          order.status === "ยกเลิก"
                                        ? "red"
                                        : "gray"
                              }
                            >
                              {order.status}
                            </Badge>
                          </td>
                          <td className={td}>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setDetail({ type: "order", value: order });
                                }}
                              >
                                รายละเอียด
                              </Button>
                              {order.status === "รอชำระ" && (
                                <>
                                  <Button
                                    variant="danger"
                                    onClick={() => {
                                      setOrders((current) =>
                                        current.map((row) =>
                                          row.ref === order.ref
                                            ? { ...row, status: "หมดอายุ" }
                                            : row,
                                        ),
                                      );
                                      logAction(
                                        "จำลองหมดเวลาชำระเงิน",
                                        order.ref,
                                      );
                                    }}
                                  >
                                    หมดอายุ
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setOrders((current) =>
                                        current.map((row) =>
                                          row.ref === order.ref
                                            ? { ...row, status: "ยกเลิก" }
                                            : row,
                                        ),
                                      );
                                      logAction("ยกเลิกคำสั่งซื้อ", order.ref);
                                    }}
                                  >
                                    ยกเลิก
                                  </Button>
                                  <Button
                                    variant="danger"
                                    onClick={() => {
                                      setOrders((current) =>
                                        current.map((row) =>
                                          row.ref === order.ref
                                            ? { ...row, status: "ไม่สำเร็จ" }
                                            : row,
                                        ),
                                      );
                                      logAction(
                                        "จำลองการชำระไม่สำเร็จ",
                                        order.ref,
                                      );
                                    }}
                                  >
                                    ชำระไม่ผ่าน
                                  </Button>
                                </>
                              )}
                              {order.status === "สำเร็จ" && (
                                <Button
                                  variant="danger"
                                  onClick={async () => {
                                    const confirmed = await confirmWebBAction({
                                      title: "จำลองคืนเงิน",
                                      text: `คืนเงินรายการ ${order.ref} และถอนสิทธิ์สอบที่เกี่ยวข้องหรือไม่`,
                                      confirmText: "คืนเงิน",
                                    });
                                    if (!confirmed) return;
                                    updateMockPurchaseForOrder(order, "คืนเงินแล้ว");
                                    setOrders((current) =>
                                      current.map((o) =>
                                        o.ref === order.ref
                                          ? {
                                              ...o,
                                              status: "คืนเงินแล้ว" as const,
                                            }
                                          : o,
                                      ),
                                    );
                                    setStudents((current) =>
                                      current.map((s) =>
                                        s.name === order.student
                                          ? {
                                              ...s,
                                              entitlements: Math.max(
                                                0,
                                                s.entitlements - 1,
                                              ),
                                            }
                                          : s,
                                      ),
                                    );
                                    logAction(
                                      "คืนเงินและถอนสิทธิ์สอบ",
                                      order.ref,
                                    );
                                  }}
                                >
                                  คืนเงิน
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td
                            className={`${td} py-8 text-center text-slate-500`}
                            colSpan={7}
                          >
                            {orders.length
                              ? "ไม่พบคำสั่งซื้อตามคำค้นหรือช่วงวันที่นี้"
                              : "ยังไม่มีคำสั่งซื้อ"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </WebBAdminTable>
          </Panel>
        </Section>

        <Section
          id="payments"
          title="คำสั่งซื้อและการชำระเงิน"
          detail="ดู Payment Reference, สถานะ Provider และจำลองการตรวจซ้ำแบบ idempotent"
          action={orderTabs}
          actionEnabledWhenReadOnly
        >
          <Panel>
            <div className="mb-4 flex flex-wrap items-end gap-3 xl:flex-nowrap">
              <div className="min-w-44 self-center">
                <b>ผู้ให้บริการที่เลือก</b>
                <p className="mt-1 text-sm font-semibold text-slate-700">{paymentProvider}</p>
              </div>
              <Button variant="outline" onClick={checkPaymentProvider}>
                ตรวจการเชื่อมต่อ
              </Button>
              <div className="flex min-w-[250px] flex-1 items-center gap-2 text-sm text-slate-600">
                  <span className="shrink-0">ประเภทเหตุการณ์</span>
                  <AdminSelect
                    value={webhookTypeFilter}
                    onChange={setWebhookTypeFilter}
                    options={[
                      "ทั้งหมด",
                      ...Array.from(
                        new Set(webhookEvents.map((event) => event.type)),
                      ),
                    ].map((value) => ({ value, label: value }))}
                    ariaLabel="กรองประเภทเหตุการณ์"
                    className="min-w-0 flex-1"
                  />
              </div>
              <div className="flex min-w-[190px] flex-1 items-center gap-2 text-sm text-slate-600">
                  <span className="shrink-0">สถานะ</span>
                  <AdminSelect
                    value={webhookStatusFilter}
                    onChange={setWebhookStatusFilter}
                    options={[
                      "ทั้งหมด",
                      ...Array.from(
                        new Set(webhookEvents.map((event) => event.status)),
                      ),
                    ].map((value) => ({ value, label: value }))}
                    ariaLabel="กรองสถานะ Webhook"
                    className="min-w-0 flex-1"
                  />
              </div>
            </div>
            <div className="overflow-x-auto">
              <WebBAdminTable
                rows={filteredWebhookEvents}
                getSearchText={(event) =>
                  [event.id, event.order, event.type, event.status].join(" ")
                }
                ariaLabel="ตาราง Webhook"
                hideSearch
                resetKey={webhookTypeFilter + webhookStatusFilter}
                emptyMessage="ไม่พบเหตุการณ์ตามตัวกรองนี้"
              >
                {(pageEvents) => (
                  <table className="w-full min-w-[800px] text-left">
                    <thead>
                      <tr>
                        {[
                          "Event ID",
                          "Order",
                          "Event",
                          "ได้รับเมื่อ",
                          "สถานะ",
                          "การทำงาน",
                        ].map((x) => (
                          <th className={th} key={x}>
                            {x}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageEvents.map((event) => (
                        <tr key={event.id}>
                          <td className={`${td} font-mono text-xs`}>
                            {event.id}
                          </td>
                          <td className={td}>{event.order}</td>
                          <td className={td}>{event.type}</td>
                          <td className={td}>
                            {formatThaiDateTimeValue(event.received)}
                          </td>
                          <td className={td}>
                            <Badge
                              tone={
                                event.status === "ประมวลผลแล้ว"
                                  ? "green"
                                  : "amber"
                              }
                            >
                              {event.status}
                            </Badge>
                          </td>
                          <td className={td}>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setWebhookEvents((current) =>
                                  current.map((e) =>
                                    e.id === event.id
                                      ? {
                                          ...e,
                                          status:
                                            "ตรวจซ้ำแล้ว · ไม่สร้างสิทธิ์ซ้ำ",
                                        }
                                      : e,
                                  ),
                                );
                                logAction("จำลองตรวจ Webhook ซ้ำ", event.id);
                              }}
                            >
                              ตรวจซ้ำ
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredWebhookEvents.length === 0 && (
                        <tr>
                          <td
                            className={`${td} py-8 text-center text-slate-500`}
                            colSpan={6}
                          >
                            ไม่พบเหตุการณ์ตามตัวกรองนี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </WebBAdminTable>
            </div>
            <p className="mt-4 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-900">
              ระบบจริงควรตรวจ Signature, Reference, Order, Amount และสถานะจาก
              Provider ก่อนเปิดสิทธิ์สอบ โดย Webhook
              ที่ส่งซ้ำต้องไม่สร้างสิทธิ์ซ้ำ
            </p>
          </Panel>
        </Section>

        <Section
          id="entitlements"
          title={
            activeScreen === "exam-management"
              ? "1 · สิทธิ์สอบจากรายการซื้อ"
              : "สิทธิ์สอบ"
          }
          detail={
            activeScreen === "exam-management"
              ? "ตรวจว่าผู้เรียนชำระเงินสำเร็จและมีสิทธิ์เข้าสอบหรือไม่ · รายการคืนเงินจะแสดงสถานะไว้ในตาราง"
              : "ดูสิทธิ์ที่ซื้อและจำลองการเพิ่ม/ถอนสิทธิ์โดยผู้ดูแล"
          }
        >
          <Panel>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-bold">รายการสิทธิ์ของผู้เข้าสอบ</h3>
              </div>
              <Button
                disabled={!selectedExamProduct}
                onClick={() => setEntitlementModalOpen(true)}
              >
                ＋ เพิ่มสิทธิ์ชุด {selectedExamSet?.name || "A"}
              </Button>
            </div>
            <WebBAdminTable
              rows={demoPurchases.filter(
                (purchase) =>
                  selectedExamProduct &&
                  productsOverlap(selectedExamProduct.id, purchase.productId) &&
                  (entitlementStatusFilter === "ทั้งหมด" ||
                    (entitlementStatusFilter === "คืนเงินแล้ว"
                      ? purchase.paymentStatus === "refunded"
                      : entitlementStatusFilter === "พร้อมสอบ"
                        ? purchase.paymentStatus !== "refunded" &&
                          purchase.examStatus === "available"
                        : purchase.paymentStatus !== "refunded" &&
                          purchase.examStatus === entitlementStatusFilter)),
              )}
              getSearchText={(purchase) =>
                [
                  purchase.ref,
                  purchase.productId,
                  purchase.examSet,
                  purchase.profileSnapshot.firstName,
                  purchase.profileSnapshot.lastName,
                  purchase.profileSnapshot.username,
                  purchase.profileSnapshot.email,
                  purchase.payment,
                ].join(" ")
              }
              searchPlaceholder="ค้นหาผู้เรียน เลขสิทธิ์ หรือรายการซื้อ"
              ariaLabel="ตารางสิทธิ์สอบ"
              emptyMessage="ยังไม่มีรายการสิทธิ์สำหรับชุดข้อสอบนี้"
              resetKey={entitlementStatusFilter}
              toolbar={
                <div className="min-w-44">
                  <AdminSelect
                    value={entitlementStatusFilter}
                    onChange={setEntitlementStatusFilter}
                    ariaLabel="กรองสถานะสิทธิ์สอบ"
                    options={[
                      "ทั้งหมด",
                      "พร้อมสอบ",
                      "in-progress",
                      "submitted",
                      "interrupted",
                      "คืนเงินแล้ว",
                    ].map((value) => ({
                      value,
                      label:
                        value === "in-progress"
                          ? "กำลังสอบ"
                          : value === "submitted"
                            ? "ส่งข้อสอบแล้ว"
                            : value === "interrupted"
                              ? "รอตรวจสอบ"
                              : value,
                    }))}
                  />
                </div>
              }
            >
              {(pagePurchases) => (
                <table className="w-full min-w-[1000px] text-left">
                  <thead>
                    <tr>
                      {[
                        "รายการ / ซื้อเมื่อ",
                        "ผู้เรียน",
                        "ชุดข้อสอบ",
                        "ช่องทาง",
                        "สถานะสิทธิ์",
                        "จำนวนรอบ",
                        "การทำงาน",
                      ].map((heading) => (
                        <th className={th} key={heading}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagePurchases.map((purchase) => {
                      const student = students.find(
                        (row) =>
                          (
                            row.username || row.email.split("@")[0]
                          ).toLowerCase() ===
                          purchase.profileSnapshot.username.toLowerCase(),
                      );
                      const studentName =
                        purchase.profileSnapshot.firstName +
                        " " +
                        purchase.profileSnapshot.lastName;
                      const examState =
                        purchase.paymentStatus === "refunded"
                          ? "คืนเงินแล้ว"
                          : purchase.examStatus === "available"
                            ? "พร้อมสอบ"
                            : purchase.examStatus === "in-progress"
                              ? "กำลังสอบ"
                              : purchase.examStatus === "submitted"
                                ? "ส่งข้อสอบแล้ว"
                                : "รอตรวจสอบ";
                      return (
                        <tr key={purchase.ref}>
                          <td className={td}>
                            <b className="font-mono text-xs">{purchase.ref}</b>
                            <small className="mt-1 block text-xs text-slate-400">
                              {formatThaiDateTimeValue(
                                purchase.purchasedAtIso || purchase.purchasedAt,
                              )}
                            </small>
                          </td>
                          <td className={td}>
                            <b>
                              {studentName.trim() ||
                                student?.name ||
                                "ผู้เรียน"}
                            </b>
                            <small className="mt-1 block text-xs text-slate-400">
                              {purchase.profileSnapshot.username} ·{" "}
                              {purchase.profileSnapshot.email}
                            </small>
                          </td>
                          <td className={td}>
                            {purchase.productId} · ชุด {purchase.examSet || "A"}
                          </td>
                          <td className={td}>{purchase.payment}</td>
                          <td className={td}>
                            <Badge
                              tone={
                                examState === "พร้อมสอบ"
                                  ? "green"
                                  : examState === "คืนเงินแล้ว"
                                    ? "red"
                                    : examState === "ส่งข้อสอบแล้ว"
                                      ? "blue"
                                      : "amber"
                              }
                            >
                              {examState}
                            </Badge>
                          </td>
                          <td className={td}>{purchase.attempts}</td>
                          <td className={td}>
                            {purchase.payment === "Manual Grant" &&
                            student &&
                            purchase.paymentStatus !== "refunded" ? (
                              <Button
                                variant="danger"
                                ariaLabel={`ถอนสิทธิ์ ${purchase.productId}`}
                                title={`ถอนสิทธิ์ ${purchase.productId}`}
                                onClick={() =>
                                  revokeManualEntitlement(
                                    student,
                                    purchase.productId,
                                    purchase.examSet || "A",
                                  )
                                }
                              >
                                <LuTrash2
                                  aria-hidden="true"
                                  className="size-4"
                                />
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-500">
                                {purchase.payment === "Manual Grant"
                                  ? "ถอนแล้ว"
                                  : "จากรายการซื้อ"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </WebBAdminTable>
          </Panel>
        </Section>

        <Section
          id="approvals"
          title={
            activeScreen === "exam-management"
              ? "2 · คำร้องขอสอบใหม่"
              : "คำร้องสอบใหม่"
          }
          detail={
            activeScreen === "exam-management"
              ? "อ่านเหตุผลและตรวจรายการซื้อที่ผูกกับคำร้อง แล้วเลือกอนุมัติเปิดสอบใหม่หรือปฏิเสธ"
              : "ตรวจคำร้องที่ผู้เรียนส่งจากรายการซื้อและบันทึกผลการพิจารณา"
          }
        >
          <Panel>
            <WebBExamApprovals
              compact
              productId={
                examView === "detail" ? selectedExamProduct?.id : undefined
              }
              productName={
                examView === "detail" ? selectedExamProduct?.name : undefined
              }
              canManage={
                activeRole === "Super Admin" ||
                rolePermissions[activeRole]?.students?.approve === true
              }
            />
          </Panel>
        </Section>

        <Section
          id="attempts"
          title="ประวัติการเข้าสอบ"
          detail="ดูสถานะ เวลา คะแนน และเหตุผิดปกติของการสอบจำลอง"
        >
          <Panel>
            <WebBAdminTable
              rows={scopedAttempts}
              getSearchText={(attempt) =>
                [
                  attempt.id,
                  attempt.student,
                  attempt.username,
                  attempt.product,
                  attempt.status,
                  attempt.score,
                ].join(" ")
              }
              ariaLabel="ตารางประวัติการสอบ"
              searchPlaceholder="ค้นหารหัสสอบ ผู้เรียน ชุดข้อสอบ หรือสถานะ"
              emptyMessage="ยังไม่มีประวัติการเข้าสอบของชุดนี้"
              resetKey={attemptStatusFilter}
              toolbar={
                <div className="min-w-44">
                  <AdminSelect
                    value={attemptStatusFilter}
                    onChange={setAttemptStatusFilter}
                    ariaLabel="กรองสถานะประวัติสอบ"
                    options={[
                      "ทั้งหมด",
                      "รอเริ่มสอบ",
                      "กำลังสอบ",
                      "ส่งแล้ว",
                      "ผิดปกติ",
                      "ยกเลิก",
                    ].map((value) => ({ value, label: value }))}
                  />
                </div>
              }
            >
              {(pageAttempts) => (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left">
                    <thead>
                      <tr>
                        {[
                          "Attempt",
                          "ผู้เรียน",
                          "ชุดข้อสอบ",
                          "เริ่มสอบ",
                          "สถานะ",
                          "คะแนน",
                          "การทำงาน",
                        ].map((h) => (
                          <th className={th} key={h}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageAttempts.map((attempt) => (
                        <tr key={attempt.id}>
                          <td className={`${td} font-mono text-xs`}>
                            {attempt.id}
                          </td>
                          <td className={td}>{attempt.student}</td>
                          <td className={td}>{attempt.product}</td>
                          <td className={td}>
                            {formatThaiDateTimeValue(attempt.started)}
                          </td>
                          <td className={td}>
                            <Badge
                              tone={
                                attempt.status === "ส่งแล้ว"
                                  ? "green"
                                  : attempt.status === "ผิดปกติ"
                                    ? "red"
                                    : "amber"
                              }
                            >
                              {attempt.status}
                            </Badge>
                          </td>
                          <td className={td}>{attempt.score}</td>
                          <td className={td}>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setDetail({
                                    type: "attempt",
                                    value: attempt,
                                  });
                                  logAction(
                                    "เปิดบันทึกการเข้าสอบ",
                                    attempt.id,
                                    "none",
                                  );
                                }}
                              >
                                ดู Log
                              </Button>
                              {attempt.status === "ผิดปกติ" && (
                                <Button
                                  onClick={() => {
                                    setAttempts((current) =>
                                      current.map((a) =>
                                        a.id === attempt.id
                                          ? {
                                              ...a,
                                              status: "ยกเลิก" as const,
                                              events: [
                                                ...(a.events || []),
                                                {
                                                  time: formatThaiDateTimeValue(
                                                    new Date(),
                                                  ),
                                                  action: "พักผลสอบผิดปกติ",
                                                  detail:
                                                    "ผู้ดูแลระงับการแสดงผลสอบ",
                                                },
                                              ],
                                            }
                                          : a,
                                      ),
                                    );
                                    logAction("พักผลสอบผิดปกติ", attempt.id);
                                  }}
                                >
                                  พักผลสอบ
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {scopedAttempts.length === 0 && (
                        <tr>
                          <td
                            className={`${td} py-8 text-center text-slate-500`}
                            colSpan={7}
                          >
                            ยังไม่มีประวัติการเข้าสอบของชุดนี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </WebBAdminTable>
          </Panel>
        </Section>

        <Section id="results" title="">
          <Panel>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <b>
                  {isScopedSetResults
                    ? "ผลสอบ TGAT ชุด A"
                    : "ผลสอบรวมทุกประเภทและทุกชุด"}
                </b>
                <p className="mt-1 text-xs text-slate-500">
                  ข้อมูลผลสอบเป็น Mockup · เลือกดูรายงานเพื่อเปิดรายละเอียดผู้เข้าสอบ
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeScreen !== "results" && !isScopedSetResults && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const recalculatedAt = formatThaiDateTimeValue(new Date());
                      setAttempts((current) =>
                        current.map((a) =>
                          a.status === "ส่งแล้ว" &&
                          (!selectedExamProduct ||
                            matchesSelectedExam(a.product)) &&
                          a.product.includes("ชุด " + answerKeySetName)
                            ? {
                                ...a,
                                events: [
                                  ...(a.events || []),
                                  {
                                    time: recalculatedAt,
                                    action: "คำนวณคะแนนใหม่",
                                    detail:
                                      "ชุด " +
                                      answerKeySetName +
                                      " · คะแนน " +
                                      a.score,
                                  },
                                ],
                              }
                            : a,
                        ),
                      );
                      logAction(
                        "บันทึกเหตุการณ์ตรวจคะแนนจำลอง",
                        (selectedExamProduct?.name || "TGAT") +
                          " · ชุด " +
                          answerKeySetName,
                      );
                    }}
                  >
                    บันทึกเหตุการณ์ตรวจคะแนน
                  </Button>
                )}
                {activeScreen !== "results" && !isScopedSetResults && (
                  <Button
                    onClick={() => {
                      const next = !publishedResults;
                      setPublishedResults(next);
                      setDemoResultsPublished(next);
                      logAction(
                        next
                          ? "เผยแพร่ผลสอบทุกชุด"
                          : "พักการเผยแพร่ผลสอบทุกชุด",
                        "ทุกสินค้าและทุกชุด · ข้อมูลหลังบ้าน",
                      );
                    }}
                  >
                    {publishedResults ? "พักผลสอบทุกชุด" : "เผยแพร่ผลสอบทุกชุด"}
                  </Button>
                )}
              </div>
            </div>
            <div
              className="mb-4 flex gap-2 border-b border-slate-200 pb-2"
              role="tablist"
              aria-label="ภาพรวมผลสอบและ Ranking"
            >
              <button
                type="button"
                role="tab"
                aria-selected={resultsView === "overview"}
                onClick={() => setResultsView("overview")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${resultsView === "overview" ? "bg-[#211d4f] text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                ภาพรวมผลสอบ
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={resultsView === "ranking"}
                onClick={() => setResultsView("ranking")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${resultsView === "ranking" ? "bg-[#211d4f] text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                Ranking
              </button>
            </div>
            {/* <p className="mb-4 text-xs leading-5 text-slate-500">
              {resultsView === "overview"
                ? "รายงานตัวอย่าง TGAT ชุด A · สมชายใช้คะแนนและวันสอบเดียวกับหน้าผลสอบผู้เรียน ส่วนรายชื่ออื่นใช้สาธิตการกรองข้อมูล"
                : storedRankingRows.length
                  ? "รายการอันดับที่บันทึกในเบราว์เซอร์นี้ · กรองเทียบสินค้า ชุด และเวอร์ชันเดียวกัน"
                  : "อันดับตัวอย่าง TGAT ชุด A · แสดงเพื่อสาธิตตารางและตัวกรอง โดยจัดอันดับแยกตามสินค้า ชุด และเวอร์ชัน"}
            </p> */}
            {resultsView === "overview" && (
              <div className="mb-5 space-y-4">
                <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-4">
                  <label className="text-xs font-semibold">
                    ค้นหาผู้เข้าสอบ / รหัสผลสอบ
                    <div className="mt-1">
                      <WebBAdminInput
                        value={resultSearch}
                        onChange={(event) => setResultSearch(event.target.value)}
                        placeholder="ชื่อผู้สอบหรือ RES-1001"
                        aria-label="ค้นหาผู้เข้าสอบหรือรหัสผลสอบ"
                      />
                    </div>
                  </label>
                  {isScopedSetResults && (
                    <label className="text-xs font-semibold">
                      ค้นหาสินค้า / พาร์ท
                      <div className="mt-1">
                        <AdminSelect
                          value={selectedExamProductId}
                          onChange={selectManagedExamProduct}
                          options={examProducts.map((product) => ({
                            value: product.id,
                            label:
                              product.id === "tgat-full"
                                ? "ทั้งหมด · รวม TGAT1–3 · ชุด A"
                                : `${product.name} · ชุด A`,
                          }))}
                          placeholder="ค้นหาสินค้าหรือพาร์ท"
                          ariaLabel="ค้นหาสินค้าหรือพาร์ทในชุด A"
                        />
                      </div>
                    </label>
                  )}
                  {!isScopedSetResults && (
                    <>
                      <label className="text-xs font-semibold">
                        ประเภทสอบ
                        <div className="mt-1">
                          <AdminSelect
                            value={resultProductFilter}
                            onChange={setResultProductFilter}
                            options={[
                              { value: "ทุกประเภทสอบ", label: "ทุกประเภทสอบ" },
                              ...resultFilterOptions.products.map((value) => ({
                                value,
                                label: value,
                              })),
                            ]}
                            ariaLabel="กรองประเภทสอบ"
                          />
                        </div>
                      </label>
                      <label className="text-xs font-semibold">
                        ชุดข้อสอบ
                        <div className="mt-1">
                          <AdminSelect
                            value={resultSetFilter}
                            onChange={setResultSetFilter}
                            options={[
                              { value: "ทุกชุด", label: "ทุกชุด" },
                              ...resultFilterOptions.sets.map((value) => ({
                                value,
                                label: `ชุด ${value}`,
                              })),
                            ]}
                            ariaLabel="กรองชุดข้อสอบ"
                          />
                        </div>
                      </label>
                      <label className="text-xs font-semibold">
                        แพ็กเกจ
                        <div className="mt-1">
                          <AdminSelect
                            value={resultPackageFilter}
                            onChange={setResultPackageFilter}
                            options={[
                              { value: "ทุกแพ็กเกจ", label: "ทุกแพ็กเกจ" },
                              ...resultFilterOptions.packages.map((value) => ({
                                value,
                                label: value,
                              })),
                            ]}
                            ariaLabel="กรองแพ็กเกจผลสอบ"
                          />
                        </div>
                      </label>
                    </>
                  )}
                  <label className="text-xs font-semibold">
                    ระดับชั้น
                    <div className="mt-1">
                      <AdminSelect
                        value={resultGradeFilter}
                        onChange={setResultGradeFilter}
                        options={[
                          { value: "ทุกระดับชั้น", label: "ทุกระดับชั้น" },
                          ...resultFilterOptions.grades.map((value) => ({
                            value,
                            label: value,
                          })),
                        ]}
                        ariaLabel="กรองระดับชั้น"
                      />
                    </div>
                  </label>
                  <label className="text-xs font-semibold">
                    จังหวัด
                    <div className="mt-1">
                      <AdminSelect
                        value={resultProvinceFilter}
                        onChange={setResultProvinceFilter}
                        options={[
                          { value: "ทุกจังหวัด", label: "ทุกจังหวัด" },
                          ...resultFilterOptions.provinces.map((value) => ({
                            value,
                            label: value,
                          })),
                        ]}
                        ariaLabel="กรองจังหวัด"
                      />
                    </div>
                  </label>
                  <label className="text-xs font-semibold">
                    สถานะผลสอบ
                    <div className="mt-1">
                      <AdminSelect
                        value={resultStatusFilter}
                        onChange={setResultStatusFilter}
                        options={[
                          { value: "ทุกสถานะ", label: "ทุกสถานะ" },
                          ...resultFilterOptions.statuses.map((value) => ({
                            value,
                            label: value,
                          })),
                        ]}
                        ariaLabel="กรองสถานะผลสอบ"
                      />
                    </div>
                  </label>
                  <WebBThaiDatePicker
                    label="ส่งผลตั้งแต่วันที่"
                    value={resultDateFrom}
                    max={resultDateTo || undefined}
                    onChange={setResultDateFrom}
                    className="!min-w-0"
                  />
                  <WebBThaiDatePicker
                    label="ส่งผลถึงวันที่"
                    value={resultDateTo}
                    min={resultDateFrom || undefined}
                    onChange={setResultDateTo}
                    className="!min-w-0"
                  />
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setResultSearch("");
                        setResultProductFilter("ทุกประเภทสอบ");
                        setResultSetFilter("ทุกชุด");
                        setResultPackageFilter("ทุกแพ็กเกจ");
                        setResultGradeFilter("ทุกระดับชั้น");
                        setResultProvinceFilter("ทุกจังหวัด");
                        setResultStatusFilter("ทุกสถานะ");
                        setResultDateFrom("");
                        setResultDateTo("");
                        if (isScopedSetResults) {
                          selectManagedExamProduct("tgat-full");
                        }
                      }}
                    >
                      ล้างตัวกรอง
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <article className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">ผลสอบหลังกรอง</p>
                    <b className="mt-1 block text-2xl">
                      {filteredResultRows.length}
                    </b>
                    <span className="text-xs text-slate-500">
                      รายการตามตัวกรอง
                    </span>
                  </article>
                  <article className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">
                      {isScopedSetResults && selectedExamProductId !== "tgat-full"
                        ? `คะแนนเฉลี่ย · ${selectedExamProduct?.name || "พาร์ทที่เลือก"}`
                        : "คะแนนรวมเฉลี่ย"}
                    </p>
                    <b className="mt-1 block text-2xl">
                      {averageResultScore.toFixed(1)}
                      <small className="text-sm">/{selectedResultScoreMaximum}</small>
                    </b>
                    <span className="text-xs text-slate-500">
                      จากรายการที่กรอง
                    </span>
                  </article>
                  <article className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">คะแนนสูงสุด</p>
                    <b className="mt-1 block text-2xl">
                      {highestResultScore === null
                        ? "—"
                        : `${highestResultScore.toFixed(1)}/${selectedResultScoreMaximum}`}
                    </b>
                    <span className="text-xs text-slate-500">จากผลสอบหลังกรอง</span>
                  </article>
                  <article className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">ส่งผลสำเร็จ</p>
                    <b className="mt-1 block text-2xl">{successfulResultCount}</b>
                    <span className="text-xs text-slate-500">รายการหลังกรอง</span>
                  </article>
                </div>
                <Panel className="p-0">
                  <div className="p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-bold">ผลสอบรายบุคคลตามตัวกรอง</h3>
                        <p className="mt-1 text-xs text-slate-500">แสดงรายการที่ตรงกับประเภทสอบ ชุด และแพ็กเกจที่เลือกทันที</p>
                      </div>
                      <Badge tone="blue">{filteredResultRows.length} ผู้เข้าสอบ</Badge>
                    </div>
                    <WebBAdminTable
                      rows={filteredResultRows}
                      getSearchText={(row) => `${row.student} ${row.id} ${row.product} ${row.set} ${row.packageName}`}
                      hideSearch hideCsvExport
                      ariaLabel="รายชื่อผลสอบรายบุคคลตามตัวกรอง"
                      emptyMessage="ไม่พบผู้เข้าสอบตามตัวกรอง"
                      resetKey={JSON.stringify([resultSearch, resultProductFilter, resultSetFilter, resultPackageFilter, resultGradeFilter, resultProvinceFilter, resultStatusFilter, resultDateFrom, resultDateTo])}
                    >
                      {(pageResultRows) => (
                        <table className="w-full min-w-[1080px] text-left">
                          <thead className="bg-slate-50"><tr>
                            {["ส่งเมื่อ", "ผู้เข้าสอบ", "ระดับชั้น / จังหวัด", "ประเภท / ชุด", "แพ็กเกจ", "รวม", "TGAT1", "TGAT2", "TGAT3", "สถานะ", "รายงาน"].map((heading) => <th className={th} key={heading}>{heading}</th>)}
                          </tr></thead>
                          <tbody>{pageResultRows.map((row) => (
                            <tr key={row.id}>
                              <td className={td}>{row.submittedAt}</td>
                              <td className={td}><b>{row.student}</b><small className="mt-1 block text-xs text-slate-400">{row.id}</small></td>
                              <td className={td}>{row.grade}<small className="mt-1 block text-xs text-slate-500">{row.province}</small></td>
                              <td className={td}>{row.product} · ชุด {row.set}</td>
                              <td className={td}>{row.packageName}</td>
                              <td className={td}><b>{row.total.toFixed(1)}/100</b></td>
                              <td className={td}>{row.tgat1}</td><td className={td}>{row.tgat2}</td><td className={td}>{row.tgat3}</td>
                              <td className={td}><Badge tone="green">{row.status}</Badge></td>
                              <td className={td}><Button variant="outline" onClick={() => setSelectedResultReport(row)}>ดูรายงาน</Button></td>
                            </tr>
                          ))}</tbody>
                        </table>
                      )}
                    </WebBAdminTable>
                  </div>
                </Panel>

              </div>
            )}
            <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl bg-slate-50 p-4">
              <div className="grid gap-1 text-xs font-semibold text-slate-500">
                {resultsView === "ranking"
                  ? "รายการ Ranking หลังกรอง"
                  : "ผลสอบหลังกรอง"}
                <strong className="text-base text-slate-800">
                  {resultsView === "ranking"
                    ? filteredRankingRows.length
                    : filteredResultRows.length}{" "}
                  รายการ
                </strong>
              </div>
              <Badge tone={publishedResults ? "green" : "amber"}>
                {publishedResults ? "เผยแพร่ผลสอบ" : "พักผลสอบ"}
              </Badge>
              <span className="text-xs text-slate-500">
                สถานะตัวอย่างของหลังบ้าน · ไม่เปลี่ยนหน้าผู้เรียน
              </span>
            </div>
            {resultsView === "ranking" && (
              <div className="mb-3 grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-3">
                <label className="text-xs font-semibold">
                  ระดับชั้น
                  <div className="mt-1">
                    <AdminSelect
                      value={rankingGradeFilter}
                      onChange={setRankingGradeFilter}
                      options={["ทุกระดับชั้น", "ม.5", "ม.6"].map((value) => ({ value, label: value }))}
                      ariaLabel="กรองระดับชั้น Ranking"
                    />
                  </div>
                </label>
                <label className="text-xs font-semibold">
                  จังหวัด
                  <div className="mt-1">
                    <AdminSelect
                      value={rankingProvinceFilter}
                      onChange={setRankingProvinceFilter}
                      options={["ทุกจังหวัด", ...Array.from(new Set(rankingExampleRows.map((row) => row.province)))].map((value) => ({ value, label: value }))}
                      ariaLabel="กรองจังหวัด Ranking"
                    />
                  </div>
                </label>
                <label className="text-xs font-semibold">
                  ช่วงเวลา
                  <div className="mt-1">
                    <AdminSelect
                      value={rankingTimeFilter}
                      onChange={setRankingTimeFilter}
                      options={["ทุกช่วงเวลา", ...Array.from(new Set(rankingExampleRows.map((row) => row.submittedAt)))].map((value) => ({ value, label: value }))}
                      ariaLabel="กรองช่วงเวลา Ranking"
                    />
                  </div>
                </label>
              </div>
            )}
            {resultsView === "ranking" && (
              <WebBAdminTable
                rows={filteredRankingRows}
                getSearchText={(row) =>
                  [
                    row.rank,
                    row.name,
                    row.total,
                    row.tgat1,
                    row.tgat2,
                    row.tgat3,
                  ].join(" ")
                }
                ariaLabel="ตาราง Ranking ผู้เข้าสอบ"
                emptyMessage="ไม่พบผลสอบตามตัวกรองนี้"
              >
                {(rankingRows) => (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr>
                          {[
                            "อันดับ",
                            "ผู้เข้าสอบ",
                            "เวอร์ชัน",
                            "ส่งเมื่อ",
                            "ระดับ",
                            "จังหวัด",
                            ...rankingColumns,
                            "สถานะ",
                          ].map((x) => (
                            <th className={th} key={x}>
                              {x}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rankingRows.map((row) => (
                          <tr key={row.rank}>
                            <td className={td}>
                              {row.rank} / {row.rankTotal}
                            </td>
                            <td className={td}>{row.name}</td>
                            <td className={td}>{row.version}</td>
                            <td className={td}>{row.submittedAt}</td>
                            <td className={td}>{row.grade}</td>
                            <td className={td}>{row.province}</td>
                            {(isFullTgatRanking
                              ? [row.tgat1, row.tgat2, row.tgat3, row.total]
                              : [rankingScoreForSelected(row)]
                            ).map((score, index) => (
                              <td className={td} key={index}>
                                {score}
                              </td>
                            ))}
                            <td className={td}>
                              <Badge tone="blue">ในกลุ่มเดียวกัน</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </WebBAdminTable>
            )}
            {selectedResultReport && (
              <WebBModalPortal>
                <div
                  className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
                  onMouseDown={(event) => {
                    if (event.target === event.currentTarget)
                      setSelectedResultReport(null);
                  }}
                >
                  <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="result-report-title"
                    className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-700">
                        ผลสอบรายบุคคล · {selectedResultReport.id}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedResultReport(null)}
                        className={adminSecondaryButtonClass}
                        aria-label="ปิดรายงานผลสอบ"
                      >
                        <LuX aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                    <div className="wb-dashboard-view wb-detail-view">
                      <section className="wb-detail-exam-head">
                        <div className="wb-brand" aria-label="เรียนต่อมหาลัย TCAS Mock Exam">
                          <span className="wb-brand-symbol" aria-hidden="true">
                            <span className="wb-brand-person wb-brand-yellow"><i /><b /></span>
                            <span className="wb-brand-person wb-brand-orange"><i /><b /></span>
                            <span className="wb-brand-person wb-brand-blue"><i /><b /></span>
                          </span>
                          <span className="wb-brand-copy"><strong>เรียนต่อมหาลัย</strong><small>TCAS MOCK EXAM</small></span>
                        </div>
                        <h2 id="result-report-title">{selectedResultReport.product} ความถนัดทั่วไป</h2>
                        <p>THAI GENERAL APTITUDE TEST · รายการผลการสอบฉบับสมบูรณ์ · {selectedResultReport.student} · {selectedResultReport.id}</p>
                        <div>
                          {[
                            ["ชุดข้อสอบ", selectedResultReport.set],
                            ["จำนวนข้อสอบ", "200 ข้อ"],
                            ["ระยะเวลาสอบ", "180 นาที"],
                            ["ประเภทข้อสอบ", "ปรนัย 4-5 ตัวเลือก"],
                            ["คะแนน", "100 คะแนน"],
                          ].map(([label, value]) => (
                            <article key={label}><small>{label}</small><b>{value}</b></article>
                          ))}
                        </div>
                      </section>
                      <div className="wb-detail-columns">
                        <section className="wb-dashboard-card">
                          <h2>ข้อมูลผู้เข้าสอบ</h2>
                          <dl>
                            <dt>ชื่อ-นามสกุล</dt><dd>{selectedResultReport.student}</dd>
                            <dt>เลขบัตรประชาชน</dt><dd>{selectedResultReport.citizenId}</dd>
                            <dt>ระดับชั้น</dt><dd>{selectedResultReport.grade}</dd>
                            <dt>โรงเรียน / จังหวัด</dt><dd>{selectedResultReport.school} · {selectedResultReport.province}</dd>
                            <dt>วันที่สอบ</dt><dd>{selectedResultReport.submittedAt}</dd>
                            <dt>เวลาที่ใช้ทำข้อสอบ</dt><dd>{selectedResultReport.duration}</dd>
                          </dl>
                        </section>
                        <section className="wb-detail-rank">
                          <h2>🏆 อันดับของผู้เข้าสอบ</h2>
                          <div className="wb-detail-score"><span>คะแนน</span><b>{selectedResultReport.total.toFixed(1)}/100</b></div>
                          <div className="wb-detail-place">
                            <p>ลำดับที่ <strong>{selectedResultReport.rank}</strong>/{selectedResultReport.rankTotal}</p>
                            <small>ชุดและเวอร์ชันเดียวกัน · คิดจากการสอบครั้งที่ 1 เท่านั้น</small>
                          </div>
                        </section>
                      </div>
                      <section className="wb-dashboard-card wb-total-score">
                        <h2>{selectedResultReport.product} ความถนัดทั่วไป <b>{selectedResultReport.total.toFixed(1)} / 100</b></h2>
                        <i><em style={{ width: `${Math.min(100, selectedResultReport.total)}%` }} /></i>
                        <div><span>0</span><span>{selectedResultReport.total.toFixed(1)}</span><span>100</span></div>
                      </section>
                      <div className="wb-score-detail-grid">
                        {[
                          { id: "TGAT1", name: "การสื่อสารภาษาอังกฤษ", score: selectedResultReport.tgat1, color: "#0066a7" },
                          { id: "TGAT2", name: "การคิดอย่างมีเหตุผล", score: selectedResultReport.tgat2, color: "#ff673f" },
                          { id: "TGAT3", name: "สมรรถนะการทำงาน", score: selectedResultReport.tgat3, color: "#4168ff" },
                        ].map((part) => (
                          <article className="wb-dashboard-card" key={part.id}>
                            <h3><i style={{ background: part.color }} />{part.id} {part.name}<b>{part.score}/100</b></h3>
                            <i className="wb-score-line"><em style={{ width: `${Math.min(100, Number(part.score))}%`, background: part.color }} /></i>
                            <button style={{ background: part.color }} onClick={() => setSelectedResultPart(part.id as "TGAT1" | "TGAT2" | "TGAT3")}>ดูรายละเอียดรายข้อ</button>
                          </article>
                        ))}
                      </div>
                      <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                        รายงานนี้เป็น Mockup · คะแนน อันดับ และคำตอบรายข้อเป็นข้อมูลตัวอย่าง · การแก้ไขหรือเผยแพร่ในหลังบ้านนี้ไม่เปลี่ยนข้อมูล Client
                      </p>
                    </div>
                  </section>
                </div>
              </WebBModalPortal>
            )}
          {selectedResultPart && (
            <WebBModalPortal>
              <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6">
                <section
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${selectedResultPart} รายละเอียดคะแนนรายข้อ`}
                  className="max-h-[94vh] w-full max-w-[96vw] overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6"
                >
                  <ExamPartDetails
                    partId={selectedResultPart.toLowerCase()}
                    onBack={() => setSelectedResultPart(null)}
                  />
                </section>
              </div>
            </WebBModalPortal>
          )}
            <p className="mt-4 text-xs text-slate-500">
              ระบบใช้ผลสอบครั้งแรกที่ส่งสำเร็จ
              หากรอบเดิมถูกยกเลิกจากปัญหาระบบจึงใช้รอบสอบใหม่ที่อนุมัติ
            </p>
          </Panel>
        </Section>

        <Section
          id="solutions"
          title="สื่อเฉลยสำหรับผู้เรียน"
          detail="จัดการ PDF / วิดีโอที่ผู้เรียนเปิดดูได้ตามสิทธิ์หลังสอบ"
          action={
            activeScreen === "exam-management" ? (
              <Button
                onClick={() =>
                  setSolutionDraft({
                    name: "",
                    questionNumber: "",
                    kind: "Video",
                    access: "หลังส่งข้อสอบ",
                    fileSelected: false,
                    duration: "",
                    summary: "",
                    tutor: "",
                    tutorCredential: "",
                    tutorBio: "",
                    pdfName: "",
                    social: "",
                  })
                }
              >
                ＋ เพิ่มสื่อเฉลยรายข้อ
              </Button>
            ) : undefined
          }
        >
          <Panel>
            {selectedExamProduct && !embedded && (
              <div className="mb-4">
                <WebBAdminClientReference
                  productId={selectedExamProduct.id}
                  examSet={selectedExamSet?.name || "A"}
                  trial={false}
                  section="solutions"
                />
              </div>
            )}
            <WebBAdminTable
              rows={scopedSolutions}
              getSearchText={(solution) =>
                [
                  solution.id,
                  solution.name,
                  solution.product,
                  solution.questionNumber || "",
                  solution.kind,
                  solution.access,
                  solution.active ? "เผยแพร่" : "Draft",
                ].join(" ")
              }
              ariaLabel="ตารางสื่อเฉลย"
              searchPlaceholder="ค้นหาสื่อเฉลยหรือชุดข้อสอบ"
              emptyMessage="ยังไม่มีสื่อเฉลยของชุดนี้"
            >
              {(pageSolutions) => (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr>
                        {[
                          "เนื้อหา",
                          "ข้อ",
                          "ชุดข้อสอบ",
                          "รูปแบบ",
                          "สิทธิ์ผู้เข้าถึง",
                          "สถานะ",
                          "จัดการ",
                        ].map((h) => (
                          <th className={th} key={h}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageSolutions.map((solution) => (
                        <tr key={solution.id}>
                          <td className={td}>
                            <b>{solution.name}</b>
                            <small className="mt-1 block text-xs text-slate-400">
                              {solution.id}
                            </small>
                            {solution.kind === "Video" && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedSolutionDetail(solution)
                                }
                                className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
                              >
                                ดูรายละเอียดผู้เรียน
                              </button>
                            )}
                          </td>
                          <td className={td}>
                            {solution.questionNumber
                              ? `ข้อ ${solution.questionNumber}`
                              : "ทั้งชุด"}
                          </td>
                          <td className={td}>{solution.product}</td>
                          <td className={td}>{solution.kind}</td>
                          <td className={td}>{solution.access}</td>
                          <td className={td}>
                            <Badge tone={solution.active ? "green" : "gray"}>
                              {solution.active ? "เผยแพร่" : "Draft"}
                            </Badge>
                          </td>
                          <td className={td}>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSolutions((current) =>
                                    current.map((item) =>
                                      item.id === solution.id
                                        ? { ...item, active: !item.active }
                                        : item,
                                    ),
                                  );
                                  logAction(
                                    solution.active
                                      ? "พักสื่อเฉลย"
                                      : "เผยแพร่สื่อเฉลย",
                                    solution.id,
                                  );
                                }}
                              >
                                {solution.active ? "พักเผยแพร่" : "เผยแพร่"}
                              </Button>
                              {activeScreen === "exam-management" && (
                                <>
                                  <Button
                                    variant="outline"
                                    ariaLabel={`แก้ไข ${solution.name}`}
                                    title={`แก้ไข ${solution.name}`}
                                    onClick={() =>
                                      setSolutionDraft({
                                        id: solution.id,
                                        name: solution.name,
                                        questionNumber: String(
                                          solution.questionNumber || "",
                                        ),
                                        kind: solution.kind,
                                        access: solution.access,
                                        fileSelected: true,
                                        duration: solution.duration || "",
                                        summary: solution.summary || "",
                                        tutor: solution.tutor || "",
                                        tutorCredential:
                                          solution.tutorCredential || "",
                                        tutorBio: solution.tutorBio || "",
                                        pdfName: solution.pdfName || "",
                                        social: solution.social || "",
                                      })
                                    }
                                  >
                                    <LuPencil
                                      aria-hidden="true"
                                      className="size-4"
                                    />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    ariaLabel={`ลบ ${solution.name}`}
                                    title={`ลบ ${solution.name}`}
                                    onClick={async () => {
                                      const confirmed = await confirmWebBAction(
                                        {
                                          title: "ลบสื่อเฉลยนี้หรือไม่?",
                                          text: solution.name,
                                          confirmText: "ลบสื่อเฉลย",
                                        },
                                      );
                                      if (!confirmed) return;
                                      setSolutions((current) =>
                                        current.filter(
                                          (item) => item.id !== solution.id,
                                        ),
                                      );
                                      logAction(
                                        "ลบสื่อเฉลยรายข้อ",
                                        solution.id,
                                      );
                                    }}
                                  >
                                    <LuTrash2
                                      aria-hidden="true"
                                      className="size-4"
                                    />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {scopedSolutions.length === 0 && (
                        <tr>
                          <td
                            className={`${td} py-8 text-center text-slate-500`}
                            colSpan={7}
                          >
                            ยังไม่มีสื่อเฉลยของชุดนี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </WebBAdminTable>
            {activeScreen !== "exam-management" && (
              <label className="mt-4 grid gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm">
                <b>เพิ่ม PDF / วิดีโอ</b>
                <span className="text-xs text-slate-500">
                  เก็บเฉพาะชื่อไฟล์และชนิดสื่อในหน้าจอนี้ ·
                  ไม่อัปโหลดและยังไม่เปลี่ยนสื่อที่ Client เปิดดู
                </span>
                <WebBAdminInput
                  type="file"
                  accept="application/pdf,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setSolutions((current) => [
                      ...current,
                      {
                        id: `SOL-${String(Date.now()).slice(-3)}`,
                        name: file.name,
                        product: `${selectedExamProduct?.name || "TGAT"} · ชุด ${selectedExamSet?.name || "A"}`,
                        kind: file.type.includes("video") ? "Video" : "PDF",
                        access: "หลังส่งข้อสอบ",
                        active: false,
                      },
                    ]);
                    logAction("เพิ่มไฟล์สื่อ", file.name);
                  }}
                  className="mx-auto max-w-full text-xs"
                />
              </label>
            )}
          </Panel>
        </Section>

        {activeScreen === "exam-management" && solutionDraft && (
          <WebBModalPortal>
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setSolutionDraft(null);
              }}
            >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="solution-draft-title"
              className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 id="solution-draft-title" className="text-lg font-bold">
                  {solutionDraft.id
                    ? "แก้ไขสื่อเฉลยรายข้อ"
                    : "เพิ่มสื่อเฉลยรายข้อ"}
                </h2>
                <button
                  type="button"
                  onClick={() => setSolutionDraft(null)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold"
                  aria-label="ปิดหน้าต่าง"
                >
                  <LuX aria-hidden="true" className="size-4" />
                </button>
              </div>
              <form onSubmit={saveSolutionDraft} className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">
                    เลขข้อ
                    <WebBAdminInput
                      type="number"
                      min="1"
                      max={
                        selectedExamProduct
                          ? getManagedExamPlan(
                              selectedExamProduct.id,
                              answerKeySetName,
                            ).questionCount
                          : undefined
                      }
                      required
                      value={solutionDraft.questionNumber}
                      onChange={(event) =>
                        setSolutionDraft({
                          ...solutionDraft,
                          questionNumber: event.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    ไฟล์ PDF / วิดีโอ
                    <WebBAdminInput
                      type="file"
                      accept="application/pdf,video/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file)
                          setSolutionDraft({
                            ...solutionDraft,
                            name: file.name,
                            kind: file.type.includes("video") ? "Video" : "PDF",
                            fileSelected: true,
                            pdfName: file.type.includes("video")
                              ? solutionDraft.pdfName
                              : file.name,
                          });
                      }}
                      className="mt-1 block w-full rounded-xl border border-slate-200 p-2 text-sm"
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">
                    ชื่อสื่อ
                    <WebBAdminInput
                      value={solutionDraft.name}
                      onChange={(event) =>
                        setSolutionDraft({
                          ...solutionDraft,
                          name: event.target.value,
                        })
                      }
                      required
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    ระยะเวลาวิดีโอ
                    <WebBAdminInput
                      placeholder="เช่น 32:10 นาที"
                      value={solutionDraft.duration}
                      onChange={(event) =>
                        setSolutionDraft({
                          ...solutionDraft,
                          duration: event.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                    />
                  </label>
                </div>
                <label className="block text-sm font-semibold">
                  สรุปประเด็นเฉลย
                  <WebBAdminTextarea
                    value={solutionDraft.summary}
                    onChange={(event) =>
                      setSolutionDraft({
                        ...solutionDraft,
                        summary: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                    rows={2}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">
                    ติวเตอร์
                    <WebBAdminInput
                      value={solutionDraft.tutor}
                      onChange={(event) =>
                        setSolutionDraft({
                          ...solutionDraft,
                          tutor: event.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    คุณวุฒิ / ประสบการณ์
                    <WebBAdminInput
                      value={solutionDraft.tutorCredential}
                      onChange={(event) =>
                        setSolutionDraft({
                          ...solutionDraft,
                          tutorCredential: event.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                    />
                  </label>
                </div>
                <label className="block text-sm font-semibold">
                  ประวัติผู้สอน
                  <WebBAdminTextarea
                    value={solutionDraft.tutorBio}
                    onChange={(event) =>
                      setSolutionDraft({
                        ...solutionDraft,
                        tutorBio: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                    rows={2}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">
                    ช่องทางติดตาม
                    <WebBAdminInput
                      value={solutionDraft.social}
                      onChange={(event) =>
                        setSolutionDraft({
                          ...solutionDraft,
                          social: event.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    เอกสารเฉลย PDF
                    <WebBAdminInput
                      value={solutionDraft.pdfName}
                      onChange={(event) =>
                        setSolutionDraft({
                          ...solutionDraft,
                          pdfName: event.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                    />
                  </label>
                </div>
                <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                  ไฟล์และรายละเอียดเป็น Mockup ใน Browser ·
                  สื่อวิดีโอที่เผยแพร่จะแสดงในหน้าเฉลยของ Client
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSolutionDraft(null)}
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit">บันทึก</Button>
                </div>
              </form>
            </section>
          </div>
        </WebBModalPortal>
      )}
      {activeScreen === "exam-management" && selectedSolutionDetail && (
        <WebBModalPortal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget)
                setSelectedSolutionDetail(null);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="solution-preview-title"
              className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-bold text-indigo-700">
                    ตัวอย่างหน้าต่างสื่อเฉลยของผู้เรียน
                  </p>
                  <h2
                    id="solution-preview-title"
                    className="mt-1 text-xl font-extrabold"
                  >
                    {selectedSolutionDetail.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedSolutionDetail.product} · ข้อ{" "}
                    {selectedSolutionDetail.questionNumber || 1} ·{" "}
                    {selectedSolutionDetail.duration || "32:10 นาที"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSolutionDetail(null)}
                  aria-label="ปิดรายละเอียดสื่อเฉลย"
                  title="ปิด"
                  className={adminSecondaryButtonClass}
                >
                  <LuX aria-hidden="true" className="size-4" />
                </button>
              </div>
              <div className="mt-5 space-y-4">
                <article className="rounded-xl bg-slate-50 p-4">
                  <h3 className="font-bold">สรุปประเด็นเฉลย</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {selectedSolutionDetail.summary ||
                      "วิดีโอนี้อธิบายแนวคิดและวิธีวิเคราะห์โจทย์ของหัวข้อนี้ พร้อมเทคนิคการตัดตัวเลือก"}
                  </p>
                </article>
                <article className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-bold">ผู้สอน</h3>
                  <p className="mt-2 text-sm font-semibold">
                    {selectedSolutionDetail.tutor || "ติวเตอร์แมว"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedSolutionDetail.tutorCredential ||
                      "ครุศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย · ประสบการณ์สอน 5 ปี"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {selectedSolutionDetail.tutorBio ||
                      "ติวเตรียมสอบ TGAT และแนะนำเทคนิควิเคราะห์โจทย์"}
                  </p>
                </article>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500">
                      ช่องทางติดตาม
                    </p>
                    <p className="mt-1 text-sm">
                      {selectedSolutionDetail.social || "ช่องทางติดตามติวเตอร์"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500">
                      เอกสารประกอบ
                    </p>
                    <p className="mt-1 text-sm text-indigo-700">
                      {selectedSolutionDetail.pdfName ||
                        "ดาวน์โหลดเอกสารเฉลย (PDF)"}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </WebBModalPortal>
      )}

        <Section
          id="finance"
          title=""
          detail=""
          actionEnabledWhenReadOnly
          actionFullWidth
          action={
            <Panel>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="mr-auto text-base font-bold text-slate-900">
                  รายงานการเงิน
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  ช่วงวันที่
                </span>
                <WebBThaiDatePicker
                  label="ตั้งแต่วันที่"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={setFromDate}
                  className="!min-w-0 w-36 [&_.wb-flatpickr-label]:sr-only"
                />
                <span className="text-slate-400">–</span>
                <WebBThaiDatePicker
                  label="ถึงวันที่"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={setToDate}
                  className="!min-w-0 w-36 [&_.wb-flatpickr-label]:sr-only"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const now = new Date();
                    setFromDate(
                      toDateInputValue(
                        new Date(now.getFullYear(), now.getMonth(), 1),
                      ),
                    );
                    setToDate(toDateInputValue(now));
                  }}
                >
                  เดือนนี้
                </Button>
                <Button variant="outline" onClick={exportOrders}>
                  ดาวน์โหลด CSV
                </Button>
              </div>
            </Panel>
          }
        >
          <Panel>
            <WebBTrendChart
              data={financeChartData}
              metrics={financeChartMetrics}
              ariaLabel="กราฟแนวโน้มรายงานการเงินตามช่วงวันที่"
            />
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              ค่าบริการ PromptPay QR เป็นข้อมูลตัวอย่าง และคำนวณ VAT 7% บนค่าบริการ ·
              อัตราจริงขึ้นกับข้อตกลงบัญชี Payso ·
              ยอดสุทธิยังไม่หักต้นทุนอื่น · รายงานรวมคำสั่งซื้อตัวอย่างหลังบ้านกับรายการที่มีอยู่ในเบราว์เซอร์นี้
            </p>
            <div className="mt-5">
              <WebBAdminTable
                rows={dateFilteredOrders}
                getSearchText={(order) =>
                  [
                    order.ref,
                    order.student,
                    order.product,
                    order.method,
                    order.status,
                  ].join(" ")
                }
                ariaLabel="ตารางรายการรายงานการเงิน"
                searchPlaceholder="ค้นหาคำสั่งซื้อ ผู้เรียน หรือสินค้า"
                emptyMessage="ไม่พบรายการในช่วงวันที่นี้"
                resetKey={fromDate + toDate}
              >
                {(financeRows) => (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[760px] table-fixed text-left xl:min-w-0">
                      <colgroup>
                        <col className="w-[14%]" />
                        <col className="w-[17%]" />
                        <col className="w-[29%]" />
                        <col className="w-[16%]" />
                        <col className="w-[12%]" />
                        <col className="w-[12%]" />
                      </colgroup>
                      <thead>
                        <tr>
                          {[
                            "วันที่",
                            "เลขคำสั่งซื้อ",
                            "ผู้เรียน / รายการ",
                            "ยอดเรียกเก็บ",
                            "สถานะ",
                            "รายละเอียด",
                          ].map((heading) => (
                            <th className={th} key={heading}>
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {financeRows.map((order) => {
                          return (
                            <tr key={order.ref}>
                              <td className={td}>
                                {formatThaiDate(order.day)}
                              </td>
                              <td className={td}>
                                <b className="whitespace-nowrap">{order.ref}</b>
                              </td>
                              <td className={td}>
                                <b className="block truncate">{order.student}</b>
                                <small className="mt-1 block truncate text-xs text-slate-500">
                                  {order.product}
                                </small>
                              </td>
                              <td className={`${td} whitespace-nowrap font-semibold`}>{money(order.charged)}</td>
                              <td className={td}>
                                <Badge
                                  tone={
                                    order.status === "สำเร็จ"
                                      ? "green"
                                      : order.status === "รอชำระ"
                                        ? "amber"
                                        : "gray"
                                  }
                                >
                                  {order.status}
                                </Badge>
                              </td>
                              <td className={td}>
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    setDetail({ type: "order", value: order })
                                  }
                                >
                                  ดูรายการ
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                        {dateFilteredOrders.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-8 text-center text-sm text-slate-500"
                            >
                              ไม่พบรายการในช่วงวันที่นี้
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </WebBAdminTable>
            </div>
          </Panel>
        </Section>

        <Section
          id="admins"
          title="ผู้ดูแลและสิทธิ์"
          detail="จัดการบัญชีผู้ดูแล สถานะ และสิทธิ์ตามบทบาท"
          actionEnabledWhenReadOnly
          action={settingsTabs}
        >
          <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
            <Panel className="!p-4">
              <h3 className="font-bold">บัญชีผู้ดูแล</h3>
              <div className="mt-3 space-y-2">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <b className="text-sm">{admin.name}</b>
                      <p className="truncate text-xs text-slate-500">
                        {admin.email} · {admin.role}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        tone={admin.status === "ใช้งาน" ? "green" : "gray"}
                      >
                        {admin.status}
                      </Badge>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAdmins((current) =>
                            current.map((item) =>
                              item.id === admin.id
                                ? {
                                    ...item,
                                    status: (item.status === "ใช้งาน"
                                      ? "ปิดใช้งาน"
                                      : "ใช้งาน") as DemoAdmin["status"],
                                  }
                                : item,
                            ),
                          );
                          logAction("เปลี่ยนสถานะผู้ดูแล", admin.id);
                        }}
                      >
                        เปลี่ยนสถานะ
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel className="!p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold">สิทธิ์ตามบทบาท</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    เลือกบทบาทแล้วติ๊กสิทธิ์ที่ต้องการ
                  </p>
                </div>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  บทบาท
                  <AdminSelect
                    value={permissionRole}
                    onChange={setPermissionRole}
                    options={[
                      "Super Admin",
                      "Content",
                      "Support",
                      "Finance",
                    ].map((value) => ({ value, label: value }))}
                    className="min-w-40 font-normal"
                    ariaLabel="เลือกบทบาท"
                  />
                </label>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[510px] text-left">
                  <thead>
                    <tr>
                      <th className={`${th} !px-2 !py-2`}>เมนู</th>
                      {permissionActions.map((action) => (
                        <th
                          className={`${th} !px-2 !py-2 text-center`}
                          key={action.key}
                        >
                          {action.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissionRows.map((row) => (
                      <tr key={row.key}>
                        <td className={`${td} !px-2 !py-2`}>
                          <b>{row.label}</b>
                        </td>
                        {permissionActions.map((action) => {
                          const fallback =
                            defaultRolePermissions[permissionRole]?.[row.key]?.[
                              action.key
                            ] ?? false;
                          const checked =
                            rolePermissionDraft[permissionRole]?.[row.key]?.[
                              action.key
                            ] ?? fallback;
                          return (
                            <td
                              key={action.key}
                              className={`${td} !px-2 !py-2 text-center`}
                            >
                              <WebBAdminInput
                                type="checkbox"
                                checked={checked}
                                disabled={
                                  permissionRole === "Super Admin" ||
                                  activeRole !== "Super Admin"
                                }
                                onChange={(event) =>
                                  setRolePermissionDraft((current) => {
                                    const roleDefaults =
                                      defaultRolePermissions[permissionRole] ||
                                      defaultRolePermissions.Content;
                                    return {
                                      ...current,
                                      [permissionRole]: {
                                        ...roleDefaults,
                                        ...current[permissionRole],
                                        [row.key]: {
                                          ...roleDefaults[row.key],
                                          ...current[permissionRole]?.[row.key],
                                          [action.key]: event.target.checked,
                                        },
                                      },
                                    };
                                  })
                                }
                                aria-label={`${permissionRole} · ${row.label} · ${action.label}`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Super Admin มีสิทธิ์สูงสุดเสมอ ·
                  บันทึกแล้วจึงมีผลกับเมนูและการแก้ไข
                </p>
                <Button
                  disabled={
                    activeRole !== "Super Admin" ||
                    JSON.stringify(rolePermissionDraft) ===
                      JSON.stringify(rolePermissions)
                  }
                  onClick={() => {
                    setRolePermissions(rolePermissionDraft);
                    logAction("บันทึกสิทธิ์ตามบทบาท", permissionRole);
                    toast.success("บันทึกสิทธิ์ตามบทบาทแล้ว");
                  }}
                >
                  บันทึกสิทธิ์
                </Button>
              </div>
            </Panel>
          </div>
        </Section>

        <Section
          id="audit"
          title="Audit Log และเหตุการณ์ระบบ"
          detail="ตัวอย่างประวัติการเปลี่ยน Payment, สิทธิ์สอบ, ผลสอบ และการตั้งค่าของ Admin"
          actionEnabledWhenReadOnly
          actionFullWidth
          action={
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.2fr)_minmax(170px,.8fr)_minmax(190px,1fr)_auto] xl:w-auto">
              <WebBAdminInput
                value={auditQuery}
                onChange={(event) => setAuditQuery(event.target.value)}
                placeholder="ค้นหาผู้ดำเนินการหรือรายการ"
                aria-label="ค้นหา Audit Log"
                className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
              <AdminSelect
                value={auditActorFilter}
                onChange={setAuditActorFilter}
                options={[
                  "ทั้งหมด",
                  ...Array.from(new Set(logs.map((log) => log.actor))),
                ].map((value) => ({ value, label: value }))}
                ariaLabel="กรองผู้ดำเนินการ"
                className="min-w-0"
              />
              <AdminSelect
                value={auditActionFilter}
                onChange={setAuditActionFilter}
                options={[
                  "ทั้งหมด",
                  ...Array.from(new Set(logs.map((log) => log.action))),
                ].map((value) => ({ value, label: value }))}
                ariaLabel="กรองการกระทำ"
                className="min-w-0"
              />
              <Button
                variant="outline"
                onClick={() =>
                  downloadCsv(
                    "webb-audit-log.csv",
                    ["วันเวลา", "ผู้ดำเนินการ", "การกระทำ", "รายการอ้างอิง"],
                    filteredAuditLogs.map((log) => [
                      formatThaiDateTimeValue(log.time),
                      log.actor,
                      log.action,
                      log.target,
                    ]),
                  )
                }
              >
                ดาวน์โหลด CSV
              </Button>
            </div>
          }
        >
          <Panel>
            <WebBAdminTable
              rows={filteredAuditLogs}
              getSearchText={(log) =>
                [log.time, log.actor, log.action, log.target].join(" ")
              }
              ariaLabel="ตาราง Audit Log"
              hideSearch
              hideCsvExport
              emptyMessage="ไม่พบประวัติตามตัวกรองนี้"
              resetKey={auditQuery + auditActorFilter + auditActionFilter}
            >
              {(pageLogs) => (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left">
                    <thead>
                      <tr>
                        {[
                          "วันเวลา",
                          "ผู้ดำเนินการ",
                          "การกระทำ",
                          "รายการอ้างอิง",
                        ].map((x) => (
                          <th className={th} key={x}>
                            {x}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageLogs.map((log, i) => (
                        <tr key={`${log.time}-${i}`}>
                          <td className={td}>
                            {formatThaiDateTimeValue(log.time)}
                          </td>
                          <td className={td}>{log.actor}</td>
                          <td className={td}>{log.action}</td>
                          <td className={`${td} font-mono text-xs`}>
                            {log.target}
                          </td>
                        </tr>
                      ))}
                      {filteredAuditLogs.length === 0 && (
                        <tr>
                          <td
                            className={`${td} py-8 text-center text-slate-500`}
                            colSpan={4}
                          >
                            ไม่พบประวัติตามตัวกรองนี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </WebBAdminTable>
          </Panel>
        </Section>

        <Section
          id="settings"
          title="ตั้งค่าระบบ"
          detail="จัดการการขาย ผู้ให้บริการที่กำหนดไว้ และช่องทางช่วยเหลือ"
          actionEnabledWhenReadOnly
          action={settingsTabs}
        >
          <div className="grid gap-4 xl:grid-cols-[.7fr_1.3fr]">
            <Panel>
              <h3 className="font-bold">การขายและชำระเงิน</h3>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
                <span className="text-slate-500">ผู้ให้บริการชำระเงิน</span>
                <b>
                    Payso{" "}
                  <small className="font-normal text-slate-500">
                    · ล็อคไว้
                  </small>
                </b>
              </div>
              <label className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
                <span>
                  <b>เปิดขายชุดสอบ</b>
                  <small className="mt-1 block text-xs text-slate-500">
                    สถานะจำลองของหลังบ้าน · ไม่เปลี่ยนหน้าผู้เรียน
                  </small>
                </span>
                <WebBAdminInput
                  type="checkbox"
                  checked={openSales}
                  onChange={() => {
                    const next = !openSales;
                    setOpenSales(next);
                    logAction("เปลี่ยนการเปิดขาย", "Web-B");
                  }}
                />
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    logAction("บันทึกการตั้งค่าชำระเงิน", paymentProvider)
                  }
                >
                  บันทึกการตั้งค่า
                </Button>
                <Button variant="outline" onClick={simulateWebhook}>
                  ทดสอบ Webhook
                </Button>
                <Button variant="outline" onClick={checkPaymentProvider}>
                  ตรวจสถานะ Payso
                </Button>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                ผู้ให้บริการจำลอง Payso · การตั้งค่านี้ใช้ในหน้านี้เท่านั้น
              </p>
            </Panel>
            <Panel>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">ช่องทางติดต่อและช่วยเหลือ</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    ตั้งค่าช่องทางที่แสดงบนหน้า Web B
                  </p>
                </div>
                <Button
                  onClick={() => {
                    safeWrite(adminMockKey("social-settings"), socialSettings);
                    logAction("บันทึกช่องทางติดต่อ", "WEB-B Admin");
                  }}
                >
                  บันทึกช่องทาง
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(
                  [
                    ["lineId", "LINE ID", "@บัญชี LINE"],
                    ["lineUrl", "ลิงก์ LINE", "https://line.me/..."],
                    ["facebookUrl", "Facebook", "https://facebook.com/..."],
                    ["instagramUrl", "Instagram", "https://instagram.com/..."],
                    ["tiktokUrl", "TikTok", "https://tiktok.com/@..."],
                    ["youtubeUrl", "YouTube", "https://youtube.com/@..."],
                    ["supportEmail", "อีเมลช่วยเหลือ", "support@example.com"],
                  ] as [keyof SocialSettings, string, string][]
                ).map(([key, label, placeholder]) => (
                  <label
                    className="grid gap-1 text-xs font-semibold text-slate-600"
                    key={key}
                  >
                    {label}
                    <WebBAdminInput
                      value={socialSettings[key]}
                      onChange={(event) =>
                        setSocialSettings((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      placeholder={placeholder}
                      className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-amber-400"
                    />
                  </label>
                ))}
              </div>
            </Panel>
          </div>
        </Section>

        {activeScreen === "settings" && activeRole === "Super Admin" && (
          <Panel className="flex flex-wrap items-center justify-between gap-3 bg-slate-50">
            <div>
              <b>คืนค่าข้อมูลและการตั้งค่า</b>
              <p className="mt-1 text-xs text-slate-500">
                คืนข้อมูลตัวอย่างและการตั้งค่าของหลังบ้านเป็นค่าเริ่มต้น
              </p>
            </div>
            <Button
              variant="danger"
              onClick={async () => {
                const confirmed = await confirmWebBAction({
                  title: "คืนค่าข้อมูลเริ่มต้น",
                  text: "ข้อมูลตัวอย่างที่บันทึกในระบบหลังบ้าน WEBB นี้จะถูกลบและสร้างใหม่เมื่อเปิดหน้าอีกครั้ง",
                  confirmText: "คืนค่าเริ่มต้น",
                });
                if (!confirmed) return;
                    Object.keys(localStorage)
                      .filter((key) => key.startsWith(WEBB_ADMIN_MOCK_PREFIX))
                      .forEach((key) => localStorage.removeItem(key));
                window.location.reload();
              }}
            >
              <LuTrash2 aria-hidden="true" className="mr-2 size-4" />
              คืนค่าเริ่มต้น
            </Button>
          </Panel>
        )}
      </div>
    </AdminScreenContext.Provider>
  );
}
