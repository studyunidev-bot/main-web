"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  LuActivity,
  LuChartNoAxesCombined,
  LuCirclePlay,
  LuDownload,
  LuEye,
  LuFileText,
  LuImage,
  LuKeyRound,
  LuLayoutDashboard,
  LuPencil,
  LuPlus,
  LuTag,
  LuTrash2,
  LuUpload,
  LuX,
} from "react-icons/lu";
import AdminSelect from "@/components/ui/AdminSelect";
import { downloadCsvData } from "./WebBAdminTable";
import { WebBAdminRoleContext } from "./WebBAdminAccess";
import { WEBB_MOCK_IMAGE } from "./data";
import {
  type TutorSubject,
  getTutorsForCategory,
  saveTutorsForCategory,
} from "./webb-tutors";
import { productComponents, safeRead, type DemoPurchase } from "./demo-store";
import { getExamPlan } from "./exam-documents";
import WebBExam from "./WebBExam";
import WebBExamApprovals, { readExamRequests } from "./WebBExamApprovals";
import WebBAdminDemo from "./WebBAdminDemo";
import WebBModalPortal from "./WebBModalPortal";
import { confirmWebBAction } from "./confirm";
import WebBAdminInput from "./WebBAdminInput";
import { WEBB_PRODUCTS } from "./data";
import {
  adminMockKey,
  readAdminMockAttempts,
  readAdminMockPurchases,
  readAdminMockRankings,
  WEBB_ADMIN_MOCK_UPDATED,
} from "./webb-admin-mock-store";
import {
  catalogStorageKey,
  familyCanOpen,
  familySets,
  initialCatalog,
  readCatalog,
  type CatalogStatus,
  type CatalogFamily,
  type CatalogFlow,
  type CatalogOffer,
  type CatalogPartSettings,
  type CatalogSet,
} from "./webb-exam-catalog-data";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400 disabled:bg-slate-100";
const secondaryButton =
  "rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton =
  "rounded-xl bg-[#211d4f] px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-[#332e71] disabled:cursor-not-allowed disabled:bg-slate-300";
const choiceButton =
  "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors";


type PartModalState = {
  mode: "add" | "edit" | "manage";
  part?: string;
  name: string;
  questionCount: string;
  durationMinutes: string;
  choiceCount: string;
  scoreMaximum: string;
  examFileName: string;
  answerFileName: string;
  answers: { value: string; score: string }[];
  contentStatus: NonNullable<CatalogPartSettings["contentStatus"]>;
  tutorDraft?: TutorSubject;
  tutorId?: string;
  error?: string;
};
type FamilyContentDraft = {
  id: string;
  name: string;
  homeSubtitle: string;
  detailDescription: string;
  homeCoverImage: string;
  error?: string;
};

type SetManagementTab =
  | "overview"
  | "content"
  | "offers"
  | "access"
  | "activity"
  | "results"
  | "solutions";
type ImagePreview = { src: string; alt: string; width: number; height: number };
type FutureDemoRecord = {
  subjectId: string;
  student: string;
  studentCode: string;
  grade: string;
  province: string;
  packageName: string;
  purchaseRef: string;
  requestId: string;
  requestReason: string;
  attemptId: string;
  submittedAt: string;
  duration: string;
  total: number;
  rank: string;
  partScores: { name: string; score: number; maximum: number }[];
  solutionTitle: string;
  solutionDuration: string;
  tutor: string;
  solutionFile: string;
};

const futureDemoRecords: Record<string, FutureDemoRecord> = {
  tpat: {
    subjectId: "tpat1",
    student: "ณิชา วัฒนกุล",
    studentCode: "WB-690184",
    grade: "ม.6",
    province: "กรุงเทพมหานคร",
    packageName: "TPAT1 · แพ็กเกตครบทุกพาร์ท",
    purchaseRef: "MOCK-TPAT1-A-001",
    requestId: "REQ-MOCK-TPAT1-001",
    requestReason: "ขอสอบใหม่หลังอินเทอร์เน็ตขัดข้องระหว่างทำข้อสอบ",
    attemptId: "ATT-MOCK-TPAT1-A-001",
    submittedAt: "12 ส.ค. 2569 10:42",
    duration: "1 ชั่วโมง 36 นาที",
    total: 72.5,
    rank: "18/264",
    partScores: [
      { name: "วิเคราะห์ข้อมูลและเงื่อนไข", score: 24, maximum: 35 },
      { name: "เชื่อมโยงเหตุผล", score: 26, maximum: 35 },
      { name: "ประยุกต์ใช้ความรู้", score: 22.5, maximum: 30 },
    ],
    solutionTitle: "แนวคิดวิเคราะห์โจทย์ TPAT1 ชุด A",
    solutionDuration: "24:18 นาที",
    tutor: "ครูเมย์ · ติวเตรียมสอบความถนัดแพทย์",
    solutionFile: "TPAT1-set-A-answer-guide.pdf",
  },
  alevel: {
    subjectId: "alevel-1",
    student: "ปัณณวิชญ์ ศรีวัฒน์",
    studentCode: "WB-690237",
    grade: "ม.6",
    province: "เชียงใหม่",
    packageName: "A-Level คณิตศาสตร์ประยุกต์ 1 · แพ็กเกตครบทุกพาร์ท",
    purchaseRef: "MOCK-ALEVEL-MATH1-A-001",
    requestId: "REQ-MOCK-ALEVEL-MATH1-001",
    requestReason: "ขอสอบใหม่เนื่องจากอุปกรณ์หยุดทำงานระหว่างสอบ",
    attemptId: "ATT-MOCK-ALEVEL-MATH1-A-001",
    submittedAt: "14 ส.ค. 2569 13:18",
    duration: "2 ชั่วโมง 12 นาที",
    total: 68,
    rank: "42/318",
    partScores: [
      { name: "จำนวนและพีชคณิต", score: 18, maximum: 25 },
      { name: "การวัดและเรขาคณิต", score: 20, maximum: 30 },
      { name: "สถิติและความน่าจะเป็น", score: 30, maximum: 45 },
    ],
    solutionTitle: "เฉลย A-Level คณิตศาสตร์ประยุกต์ 1 ชุด A",
    solutionDuration: "31:05 นาที",
    tutor: "ครูต้น · ติวคณิตศาสตร์ระดับมัธยมปลาย",
    solutionFile: "alevel-math1-set-A-solution.pdf",
  },
  netsat: {
    subjectId: "netsat-1",
    student: "พิมพ์ชนก อินทร์คำ",
    studentCode: "WB-690291",
    grade: "ม.6",
    province: "ขอนแก่น",
    packageName: "NETSAT ภาษาไทย · แพ็กเกตครบทุกพาร์ท",
    purchaseRef: "MOCK-NETSAT-TH-A-001",
    requestId: "REQ-MOCK-NETSAT-TH-001",
    requestReason: "ขอให้ตรวจสอบเวลาสอบที่ระบบบันทึกไว้",
    attemptId: "ATT-MOCK-NETSAT-TH-A-001",
    submittedAt: "16 ส.ค. 2569 09:56",
    duration: "1 ชั่วโมง 18 นาที",
    total: 76.5,
    rank: "11/207",
    partScores: [
      { name: "การอ่านจับใจความ", score: 28, maximum: 35 },
      { name: "การใช้ภาษา", score: 24, maximum: 30 },
      { name: "การคิดวิเคราะห์", score: 24.5, maximum: 35 },
    ],
    solutionTitle: "เฉลย NETSAT ภาษาไทย ชุด A",
    solutionDuration: "19:42 นาที",
    tutor: "ครูอิง · ติวภาษาไทยและการอ่านวิเคราะห์",
    solutionFile: "netsat-thai-set-A-guide.pdf",
  },
};

const setManagementTabs: { id: SetManagementTab; label: string }[] = [
  { id: "overview", label: "ภาพรวมชุด" },
  { id: "content", label: "ข้อสอบและเฉลย" },
  { id: "offers", label: "รูปแบบการเปิดใช้" },
  { id: "access", label: "สิทธิ์และคำร้อง" },
  { id: "activity", label: "การเข้าสอบ" },
  { id: "results", label: "ผลสอบและ Ranking" },
  { id: "solutions", label: "สื่อเฉลย" },
];

const managementTabIcons: Record<SetManagementTab, typeof LuLayoutDashboard> = {
  overview: LuLayoutDashboard,
  content: LuFileText,
  offers: LuTag,
  access: LuKeyRound,
  activity: LuActivity,
  results: LuChartNoAxesCombined,
  solutions: LuCirclePlay,
};

const managementImageGroups = [
  {
    id: "tgat",
    title: "ประเภทสอบ → ชุด → พาร์ท/แพ็กเกต · TGAT ชุด A",
    examples: [
      [
        "overview",
        "ภาพรวมชุด A",
        "ดูความพร้อมของชุดและงานที่ต้องทำต่อ",
        "Client ซื้อและสอบได้เมื่อชุดพร้อม · Full TGAT รวม TGAT1–3",
      ],
      [
        "content",
        "1 · ข้อสอบและเฉลย",
        "จัดการพาร์ท ไฟล์ข้อสอบ เฉลย และการตรวจคำตอบ",
        "ผูกไฟล์กับ TGAT1–3 · กำหนดจำนวนข้อและเวลาตามชุด",
      ],
      [
        "offers",
        "2 · รูปแบบการเปิดใช้",
        "กำหนดแพ็กเกต ราคา และสถานะที่ผู้เรียนเลือกซื้อ",
        "แพ็กเกต Full TGAT · 179 บาท · รวม TGAT1–3",
      ],
      [
        "access",
        "3 · สิทธิ์และคำร้อง",
        "ตรวจสิทธิ์จากรายการซื้อ และคำร้องสอบใหม่",
        "ตัวอย่างคำร้องของณิชา · ขอสอบใหม่หลังอินเทอร์เน็ตขัดข้องระหว่าง TGAT3",
      ],
      [
        "activity",
        "4 · การเข้าสอบ",
        "ติดตามการเริ่มสอบ การส่งข้อสอบ และสถานะการทำ",
        "ณิชาเริ่ม TGAT ชุด A แล้วขาดการเชื่อมต่อก่อนส่งคำตอบ",
      ],
      [
        "results",
        "5 · ผลสอบและ Ranking",
        "ตรวจคะแนนและจัดการการเผยแพร่ผลสอบ",
        "คะแนนและ Ranking จากข้อมูลที่บันทึกใน Browser นี้",
      ],
      [
        "solutions",
        "6 · สื่อเฉลย",
        "จัดการวิดีโอ เอกสาร และสิทธิ์เข้าถึงเฉลย",
        "ตัวอย่างวิดีโอ TGAT1 พร้อมข้อมูลติวเตอร์และ PDF",
      ],
    ],
  },
  {
    id: "tpat",
    title: "ประเภทสอบ → วิชาย่อย → ชุด → แพ็กเกต · TPAT1 ชุด A",
    examples: [
      [
        "overview",
        "ภาพรวมชุด A",
        "ดูความพร้อมของชุดและงานที่ต้องทำต่อ",
        "TPAT1–5 เป็นโครงสร้างอนาคต · Client ยังปิดบริการ",
      ],
      [
        "content",
        "1 · ข้อสอบและเฉลย",
        "จัดการเอกสารข้อสอบและเฉลยของวิชาย่อยและชุดนี้",
        "ไฟล์ข้อสอบรอเตรียม · กำหนดรายละเอียดก่อนเปิด",
      ],
      [
        "offers",
        "2 · รูปแบบการเปิดใช้",
        "กำหนดแพ็กเกต ราคา และสถานะของชุด A",
        "ยังไม่มีแพ็กเกตเปิดขาย · Client ยังเลือกไม่ได้",
      ],
      [
        "access",
        "3 · สิทธิ์และคำร้อง",
        "ตรวจสิทธิ์แพ็กเกตของผู้เรียนและรายการขอความช่วยเหลือ",
        "ยังไม่มีสิทธิ์ซื้อ TPAT1 จาก Client",
      ],
      [
        "activity",
        "4 · การเข้าสอบ",
        "ดูว่าใครเริ่มสอบ ส่งแล้ว หรือยังทำอยู่",
        "ยังไม่มีการสอบ TPAT1 จาก Client",
      ],
      [
        "results",
        "5 · ผลสอบและ Ranking",
        "ทบทวนผลก่อนเผยแพร่และดูอันดับผู้สอบ",
        "ยังไม่มีผลสอบ/Ranking TPAT1 จาก Client",
      ],
      [
        "solutions",
        "6 · สื่อเฉลย",
        "จัดการสื่อและเอกสารเฉลยของชุดสอบ",
        "ตัวอย่างสื่อเฉลย TPAT1 สำหรับโครงสร้างอนาคต",
      ],
    ],
  },
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatPrice(price: number) {
  return `${new Intl.NumberFormat("th-TH").format(price)} บาท`;
}

function samplePayPrice(price: number) {
  return (
    ({ 100: 110, 179: 197, 180: 198, 249: 274 } as Record<number, number>)[
    price
    ] ?? price
  );
}

function flowText(flow: CatalogFlow) {
  return flow === "set-first"
    ? "ประเภทสอบ → ชุด → พาร์ท/แพ็กเกต"
    : "ประเภทสอบ → วิชาย่อย → ชุด → แพ็กเกต";
}

function compressCoverImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("เลือกไฟล์รูปภาพก่อน"));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("รูปภาพต้องมีขนาดไม่เกิน 8 MB"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("อ่านไฟล์รูปภาพไม่สำเร็จ"));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error("เปิดไฟล์รูปภาพไม่สำเร็จ"));
      image.onload = () => {
        const scale = Math.min(1, 1200 / image.width, 800 / image.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("เตรียมรูปภาพไม่สำเร็จ"));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function WebBExamCatalog({
  focusFamilyId,
  focusSetId,
  initialTab = "overview",
  initialProductId = "tgat-full",
}: {
  focusFamilyId?: string;
  focusSetId?: string;
  initialTab?: SetManagementTab;
  initialProductId?: string;
} = {}) {
  const isSetPage = Boolean(focusFamilyId && focusSetId);
  const role = useContext(WebBAdminRoleContext);
  const canEdit = role === "Super Admin" || role === "Content";
  const [families, setFamilies] = useState(initialCatalog);
  const [selectedId, setSelectedId] = useState(focusFamilyId || "");
  const [subjectId, setSubjectId] = useState("");
  const [setId, setSetId] = useState("");
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  const [salesAction, setSalesAction] = useState<
    "pause-selected" | "open-selected" | "pause-category" | "open-category" | ""
  >("");
  const [partModal, setPartModal] = useState<PartModalState | null>(null);
  const [familyContentDraft, setFamilyContentDraft] =
    useState<FamilyContentDraft | null>(null);
  const [offerModal, setOfferModal] = useState<{
    id?: string;
    productId?: string;
    name: string;
    price: string;
    payPrice: string;
    status: CatalogStatus;
    parts: string[];
    error?: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [managementTab, setManagementTab] = useState<SetManagementTab>(
    focusFamilyId === "tgat" &&
      focusSetId === "tgat-a" &&
      initialTab === "offers"
      ? "content"
      : initialTab,
  );
  const [adminMockData, setAdminMockData] = useState({
    purchases: [] as DemoPurchase[],
    requests: [] as {
      id: string;
      productId?: string;
      product: string;
      examSet?: string;
      status: string;
      date?: string;
    }[],
    attempts: [] as {
      id: string;
      product: string;
      status: string;
      score: string;
      started?: string;
    }[],
    rankings: readAdminMockRankings(),
    solutions: [] as { id: string; product: string; active: boolean }[],
  });
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [examPreviewProductId, setExamPreviewProductId] = useState<string | null>(null);
  const [examPreviewSettings, setExamPreviewSettings] = useState<CatalogPartSettings | null>(null);
  const [examPreviewSetName, setExamPreviewSetName] = useState("A");
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [previewChoices, setPreviewChoices] = useState<Record<string, string>>(
    {},
  );
  const [loaded, setLoaded] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setManagementTab(
      focusFamilyId === "tgat" &&
        focusSetId === "tgat-a" &&
        initialTab === "offers"
        ? "content"
        : initialTab,
    );
  }, [focusFamilyId, focusSetId, initialTab]);

  useEffect(() => {
    if (!partModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPartModal(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [partModal]);

  useEffect(() => {
    if (!offerModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOfferModal(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [offerModal]);

  useEffect(() => {
    const refresh = () => {
      setFamilies(readCatalog());
      setLoaded(true);
    };
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  useEffect(() => {
    if (!selectedId || isSetPage) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedId("");
        requestAnimationFrame(() => openerRef.current?.focus());
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const controls = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled])",
        ),
      );
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedId, isSetPage]);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (!examPreviewProductId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [examPreviewProductId]);

  useEffect(() => {
    const refresh = () => {
      const requests = readExamRequests();
      setAdminMockData({
        purchases: readAdminMockPurchases(),
        requests,
        attempts: readAdminMockAttempts(),
        rankings: readAdminMockRankings(),
        solutions: safeRead(adminMockKey("mock-solutions"), []),
      });
    };
    refresh();
    const events = ["storage", WEBB_ADMIN_MOCK_UPDATED];
    events.forEach((event) => window.addEventListener(event, refresh));
    return () =>
      events.forEach((event) => window.removeEventListener(event, refresh));
  }, []);

  useEffect(() => {
    if (!imagePreview) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setImagePreview(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [imagePreview]);

  const selected = families.find((family) => family.id === selectedId);
  const focusedSubject =
    isSetPage && selected?.flow === "subject-first"
      ? selected.subjects.find((subject) =>
        subject.sets.some((set) => set.id === focusSetId),
      )
      : undefined;
  const selectedSubject =
    selected?.flow === "subject-first"
      ? focusedSubject ||
      selected.subjects.find((subject) => subject.id === subjectId) ||
      selected.subjects[0]
      : undefined;
  const sets =
    selected?.flow === "set-first"
      ? selected.sets
      : selectedSubject?.sets || [];
  const fallbackSet: CatalogSet = {
    id: "default-set",
    name: "A",
    parts: [],
    offers: [],
  };
  const selectedSet =
    (isSetPage
      ? sets.find((set) => set.id === focusSetId)
      : sets.find((set) => set.id === setId) || sets[0]) || fallbackSet;
  const isTgatA =
    isSetPage && selected?.id === "tgat" && selectedSet?.id === "tgat-a";
  const managedPartProductId = partModal?.part
    ?.match(/^TGAT[123]\b/i)?.[0]
    .toLowerCase();
  const isRelevantProduct = (id?: string, label = "") => {
    if (selected?.id !== "tgat") return false;
    const normalizedLabel = label.toLocaleLowerCase();
    if (id && selectedSet?.offers.some((offer) => offer.productId === id))
      return true;
    if (
      selectedSet?.offers.some((offer) =>
        normalizedLabel.includes(offer.name.toLocaleLowerCase()),
      )
    )
      return true;
    return (
      selectedSet?.parts.some((part) => {
        const partCode = part.match(/^TGAT[123]/i)?.[0];
        return partCode ? new RegExp(partCode, "i").test(label) : false;
      }) || false
    );
  };
  const matchesSet = (examSet?: string) =>
    !selectedSet ||
    (examSet || "A").toLocaleUpperCase() ===
    selectedSet.name.toLocaleUpperCase();
  const scopedPurchases = adminMockData.purchases.filter(
    (purchase) =>
      isRelevantProduct(purchase.productId, purchase.productId) &&
      matchesSet(purchase.examSet),
  );
  // Admin keeps the newest mock request at the beginning of the array, so this order
  // identifies the latest request without parsing localized Thai dates.
  const scopedRequests = adminMockData.requests.filter(
    (request) =>
      isRelevantProduct(request.productId, request.product) &&
      matchesSet(request.examSet),
  );
  const scopedAttempts = adminMockData.attempts.filter(
    (attempt) =>
      isRelevantProduct(undefined, attempt.product) &&
      matchesSet(attempt.product.match(/ชุด\s+([A-D])/i)?.[1]),
  );
  const scopedRankings = adminMockData.rankings.filter(
    (result) =>
      isRelevantProduct(result.productId, result.productId) &&
      matchesSet(result.examSet),
  );
  const scopedSolutions = adminMockData.solutions.filter((solution) =>
    isRelevantProduct(undefined, solution.product),
  );
  const futureDemoRecord =
    selected?.id &&
      selected.id !== "tgat" &&
      selectedSet?.name === "A" &&
      selectedSubject?.id === futureDemoRecords[selected.id]?.subjectId
      ? futureDemoRecords[selected.id]
      : undefined;
  const adminProducts = safeRead<
    {
      id: string;
      status?: string;
      contentStatus?: string;
      price?: number;
      payPrice?: number;
    }[]
  >(
    adminMockKey("products"),
    WEBB_PRODUCTS.map((product) => ({
      id: product.id,
      status: product.id === "tgat-full" ? "เปิดขาย" : "ปิดขาย",
      contentStatus: product.id === "tgat-full" ? "เผยแพร่" : "Draft",
      price: product.id === "tgat-full" ? 179 : product.price,
      payPrice:
        product.id === "tgat-full" ? 197 : samplePayPrice(product.price),
    })),
  );
  const fullTgatAdminProduct = adminProducts.find(
    (product) => product.id === "tgat-full",
  );
  const clientTgatOpen =
    selected?.id === "tgat" &&
    selected.status === "open" &&
    selectedSet?.id === "tgat-a" &&
    selectedSet.offers.some(
      (offer) => offer.id === "tgat-a-full" && offer.status === "open",
    ) &&
    safeRead(adminMockKey("open-sales"), true) &&
    fullTgatAdminProduct?.status !== "ปิดขาย" &&
    fullTgatAdminProduct?.contentStatus === "เผยแพร่" &&
    getExamPlan("tgat-full", "A").hasSuppliedExam;
  const unreadAccessCount = scopedRequests[0]?.status === "รอตรวจสอบ" ? 1 : 0;

  function menuNeedsAttention(tabId: SetManagementTab) {
    if (!selectedSet) return false;
    if (tabId === "content") return selectedSet.parts.length === 0;
    if (tabId === "access") return unreadAccessCount > 0;
    return false;
  }

  function openManagementTab(tabId: SetManagementTab) {
    setManagementTab(tabId);
  }

  function save(next: CatalogFamily[], notice: string) {
    setFamilies(next);
    try {
      localStorage.setItem(catalogStorageKey, JSON.stringify(next));
      const savedTgat = families.find((family) => family.id === "tgat");
      const nextTgat = next.find((family) => family.id === "tgat");
      if (nextTgat && JSON.stringify(savedTgat) !== JSON.stringify(nextTgat)) {
        const tgatA = nextTgat.sets.find((set) => set.id === "tgat-a");
        const productRows = safeRead<
          {
            id: string;
            name?: string;
            parts?: string;
            sectionIds?: string[];
            price?: number;
            payPrice?: number;
            status?: string;
            [key: string]: unknown;
          }[]
        >(
          adminMockKey("products"),
          WEBB_PRODUCTS.map((product, index) => ({
            id: product.id,
            name: product.name,
            parts: product.parts,
            price: product.price,
            payPrice: product.price,
            status: product.id === "tgat-full" ? "เปิดขาย" : "ปิดขาย",
            version: `TGAT-2026.${index + 1}`,
            trial: false,
            contentStatus: product.id === "tgat-full" ? "เผยแพร่" : "Draft",
          })),
        );
        const examSets = safeRead<
          {
            id: string;
            productId: string;
            name: string;
            version: string;
            contentStatus: string;
            questionCount: number;
          }[]
        >(
          adminMockKey("exam-sets"),
          WEBB_PRODUCTS.map((product, index) => ({
            id: `${product.id}:A`,
            productId: product.id,
            name: "A",
            version: `TGAT-2026.${index + 1}`,
            contentStatus: product.id === "tgat-full" ? "เผยแพร่" : "Draft",
            questionCount: getExamPlan(product.id, "A").questionCount,
          })),
        );
        const examSettings = safeRead<{ id: string; questionCount: number }[]>(
          adminMockKey("exam-section-settings"),
          [],
        );
        const previousOffers =
          savedTgat?.sets.find((set) => set.id === "tgat-a")?.offers || [];
        const nextOffers = tgatA?.offers || [];
        const activeOfferIds = new Set(
          nextOffers.map((offer) => offer.productId || offer.id),
        );
        const deletedIds = previousOffers
          .map((offer) => offer.productId || offer.id)
          .filter((id) => !activeOfferIds.has(id));
        let syncedProducts = productRows.filter(
          (product) => !deletedIds.includes(product.id),
        );
        let syncedSets = examSets.filter(
          (set) => !deletedIds.includes(set.productId),
        );
        for (const offer of nextOffers) {
          const productId = offer.productId || offer.id;
          const sectionIds = offer.parts
            .map((part) =>
              part.match(/^TGAT([123])\b/i)?.[1]
                ? `tgat${part.match(/^TGAT([123])\b/i)?.[1]}`
                : "",
            )
            .filter(Boolean);
          const existing = syncedProducts.find(
            (product) => product.id === productId,
          );
          const product = {
            ...existing,
            id: productId,
            name: offer.name,
            parts: offer.parts
              .map((part) => part.replace(/^TGAT[123]\s*/i, ""))
              .join(" + "),
            sectionIds,
            price: offer.price,
            payPrice: offer.payPrice ?? samplePayPrice(offer.price),
            status:
              nextTgat.status === "open" && offer.status === "open"
                ? "เปิดขาย"
                : "ปิดขาย",
            version: String(existing?.version || "TGAT-2026.A"),
            trial: false,
            contentStatus: String(existing?.contentStatus || "Draft"),
          };
          syncedProducts = [
            ...syncedProducts.filter((item) => item.id !== productId),
            product,
          ];
          const questionCount = sectionIds.reduce(
            (count, id) =>
              count +
              (examSettings.find((section) => section.id === id)
                ?.questionCount ||
                ({ tgat1: 60, tgat2: 80, tgat3: 60 } as Record<string, number>)[
                id
                ] ||
                0),
            0,
          );
          const set = {
            id: `${productId}:A`,
            productId,
            name: "A",
            version: product.version,
            contentStatus: product.contentStatus,
            questionCount,
          };
          syncedSets = [
            ...syncedSets.filter((item) => item.id !== set.id),
            set,
          ];
        }
        localStorage.setItem(
          adminMockKey("products"),
          JSON.stringify(syncedProducts),
        );
        localStorage.setItem(
          adminMockKey("exam-sets"),
          JSON.stringify(syncedSets),
        );
        window.dispatchEvent(new Event(WEBB_ADMIN_MOCK_UPDATED));
      }
      window.dispatchEvent(new Event("webb-catalog-updated"));
      setMessage(notice);
    } catch {
      setMessage("บันทึกใน Browser ไม่สำเร็จ ข้อมูลยังอยู่ในหน้านี้ชั่วคราว");
    }
  }

  function updateFamily(
    change: (family: CatalogFamily) => CatalogFamily,
    notice: string,
  ) {
    if (!selected || !canEdit) return;
    save(
      families.map((family) => {
        if (family.id !== selected.id) return family;
        const updated = change(family);
        return updated.status === "open" && !familyCanOpen(updated)
          ? { ...updated, status: "draft" }
          : updated;
      }),
      notice,
    );
  }

  function openFamilyContentEditor(family: CatalogFamily) {
    if (!canEdit) return;
    setFamilyContentDraft({
      id: family.id,
      name: family.name,
      homeSubtitle: family.homeSubtitle,
      detailDescription: family.detailDescription,
      homeCoverImage: family.homeCoverImage || "",
    });
  }

  function saveFamilyContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!familyContentDraft || !canEdit) return;
    const name = familyContentDraft.name.trim();
    if (!name) {
      setFamilyContentDraft({ ...familyContentDraft, error: "กรอกชื่อวิชาก่อนบันทึก" });
      return;
    }
    const next = families.map((family) =>
      family.id === familyContentDraft.id
        ? {
            ...family,
            name,
            homeSubtitle: familyContentDraft.homeSubtitle.trim(),
            detailDescription: familyContentDraft.detailDescription.trim(),
            homeCoverImage: familyContentDraft.homeCoverImage || undefined,
          }
        : family,
    );
    save(next, "บันทึกข้อมูลหน้าบ้านของหมวดวิชาแล้ว");
    setFamilyContentDraft(null);
  }

  function updateSet(change: (set: CatalogSet) => CatalogSet, notice: string) {
    if (!selectedSet) return;
    updateFamily(
      (family) =>
        family.flow === "set-first"
          ? {
            ...family,
            sets: family.sets.map((set) =>
              set.id === selectedSet.id ? change(set) : set,
            ),
          }
          : {
            ...family,
            subjects: family.subjects.map((subject) =>
              subject.id === selectedSubject?.id
                ? {
                  ...subject,
                  sets: subject.sets.map((set) =>
                    set.id === selectedSet.id ? change(set) : set,
                  ),
                }
                : subject,
            ),
          },
      notice,
    );
  }

  function getOfferClosureBlockers(offer: CatalogOffer, examSet = selectedSet.name) {
    const offerComponents = new Set([
      ...productComponents(offer.productId || offer.id),
      ...offer.parts.flatMap((part) => {
        const code = part.match(/^TGAT([123])\b/i)?.[0];
        return code ? [code.toLowerCase()] : [];
      }),
    ]);
    const matchesOffer = (productOrName: string) => {
      const partCode = productOrName.match(/\bTGAT([123])\b/i)?.[0].toLowerCase();
      const components = new Set([
        ...productComponents(productOrName),
        ...(partCode ? [partCode] : []),
      ]);
      return [...components].some((component) => offerComponents.has(component));
    };
    const sameSet = (value?: string) =>
      (value || "A").toLocaleUpperCase() === examSet.toLocaleUpperCase();
    const purchases = adminMockData.purchases.filter(
      (purchase) =>
        purchase.paymentStatus !== "refunded" &&
        purchase.examStatus !== "submitted" &&
        sameSet(purchase.examSet) &&
        matchesOffer(purchase.productId),
    );
    const attempts = adminMockData.attempts.filter(
      (attempt) =>
        attempt.status === "กำลังสอบ" &&
        sameSet(attempt.product.match(/ชุด\s+([A-D])/i)?.[1]) &&
        matchesOffer(attempt.product),
    );
    return { purchases, attempts };
  }

  function alertOfferCannotClose(
    offer: CatalogOffer,
    examSet = selectedSet.name,
  ) {
    const blockers = getOfferClosureBlockers(offer, examSet);
    if (!blockers.purchases.length && !blockers.attempts.length) return false;
    const details = [
      blockers.attempts.length ? `กำลังสอบ ${blockers.attempts.length} คน` : "",
      blockers.purchases.length ? `ซื้อสิทธิ์แล้วแต่ยังสอบไม่เสร็จ ${blockers.purchases.length} สิทธิ์` : "",
    ].filter(Boolean).join(" และ ");
    window.alert(
      `ไม่สามารถปิดการขาย ${offer.name} ชุด ${examSet} ได้ เนื่องจากมี${details} กรุณารอให้สอบเสร็จก่อน`,
    );
    return true;
  }

  function setOfferSalesStatus(offer: CatalogOffer, status: CatalogStatus) {
    if (!canEdit || !selectedSet || offer.status === status) return;
    if (status === "draft" && alertOfferCannotClose(offer)) return;
    updateSet(
      (set) => ({
        ...set,
        offers: set.offers.map((item) =>
          item.id === offer.id ? { ...item, status } : item,
        ),
      }),
      status === "open"
        ? `เปิดขาย ${offer.name} แล้ว`
        : `ปิดการขาย ${offer.name} แล้ว`,
    );
  }

  function updateSelectedSets(status: CatalogStatus) {
    if (!selected || !canEdit || selectedSetIds.length === 0) return;
    const selectedIds = new Set(selectedSetIds);
    const selectedSets = familySets(selected).filter((set) =>
      selectedIds.has(set.id),
    );
    if (status === "draft") {
      const blockedOffer = selectedSets
        .flatMap((set) => set.offers.map((offer) => ({ offer, setName: set.name })))
        .find(({ offer, setName }) => {
          if (offer.status !== "open") return false;
          const blockers = getOfferClosureBlockers(offer, setName);
          return blockers.purchases.length > 0 || blockers.attempts.length > 0;
        });
      if (blockedOffer) {
        alertOfferCannotClose(blockedOffer.offer, blockedOffer.setName);
        return;
      }
    }
    if (
      selectedSets.every((set) =>
        set.offers.every((offer) => offer.status === status),
      )
    ) {
      setMessage(
        status === "draft"
          ? "ชุดที่เลือกพักการขายอยู่แล้ว"
          : "ชุดที่เลือกเปิดขายอยู่แล้ว",
      );
      return;
    }
    updateFamily(
      (family) => ({
        ...family,
        sets: family.sets.map((set) =>
          selectedIds.has(set.id)
            ? {
                ...set,
                offers: set.offers.map((offer) => ({ ...offer, status })),
              }
            : set,
        ),
        subjects: family.subjects.map((subject) => ({
          ...subject,
          sets: subject.sets.map((set) =>
            selectedIds.has(set.id)
              ? {
                  ...set,
                  offers: set.offers.map((offer) => ({ ...offer, status })),
                }
              : set,
          ),
        })),
      }),
      status === "open"
        ? "เปิดขายชุดที่เลือกแล้ว"
        : "พักการขายชุดที่เลือกแล้ว",
    );
  }

  function applySalesAction() {
    if (!selected || !canEdit) return;
    if (salesAction === "pause-selected") updateSelectedSets("draft");
    if (salesAction === "open-selected") updateSelectedSets("open");
    if (salesAction === "pause-category") {
      if (selected.status === "draft") {
        setMessage("หมวดนี้พักการขายอยู่แล้ว");
      } else {
        const blockedOffer = familySets(selected)
          .flatMap((set) => set.offers.map((offer) => ({ offer, setName: set.name })))
          .find(({ offer, setName }) => {
            if (offer.status !== "open") return false;
            const blockers = getOfferClosureBlockers(offer, setName);
            return blockers.purchases.length > 0 || blockers.attempts.length > 0;
          });
        if (blockedOffer) {
          alertOfferCannotClose(blockedOffer.offer, blockedOffer.setName);
          setSalesAction("");
          return;
        }
        updateFamily(
          (family) => ({ ...family, status: "draft" }),
          "พักการขายทั้งหมวดแล้ว",
        );
      }
    }
    if (salesAction === "open-category" && familyCanOpen(selected)) {
      if (selected.status === "open") {
        setMessage("หมวดนี้เปิดการขายอยู่แล้ว");
      } else {
        updateFamily(
          (family) => ({ ...family, status: "open" }),
          "เปิดการขายทั้งหมวดแล้ว",
        );
      }
    }
    setSelectedSetIds([]);
    setSalesAction("");
  }

  function chooseFamily(id: string) {
    setSelectedId(id);
    setSubjectId("");
    setSetId("");
    setSelectedSetIds([]);
    setSalesAction("");
    setPreviewChoices({});
    setMessage("");
  }

  function closeModal() {
    setSelectedId("");
    setSelectedSetIds([]);
    setSalesAction("");
    setMessage("");
    requestAnimationFrame(() => openerRef.current?.focus());
  }


  function openPartModal(mode: PartModalState["mode"], part?: string) {
    const settings = part ? selectedSet?.partSettings?.[part] : undefined;
    const tutorPartId = part?.match(/^TGAT([123])\b/i)?.[1];
    const tutorKind = selected?.id === "alevel" ? "a-level" : selected?.id || "tgat";
    const tutors = part ? getTutorsForCategory(tutorKind) : [];
    const normalizeTitle = (value: string) => value
      .toLowerCase()
      .replace(/^a-?level\s*/i, "")
      .replace(/[^a-z0-9\u0E00-\u0E7F]/g, "");
    const normalizedPart = part ? normalizeTitle(part) : "";
    const tutorDraft = part
      ? tutors.find((tutor) => tutor.id === (tutorPartId ? `tgat${tutorPartId}` : "")) ||
        tutors.find((tutor) => normalizeTitle(tutor.title) === normalizedPart)
      : undefined;
    setPartModal({
      mode,
      part,
      name: part || "",
      questionCount: settings?.questionCount?.toString() || "",
      durationMinutes: settings?.durationMinutes?.toString() || "",
      choiceCount: settings?.choiceCount?.toString() || "",
      scoreMaximum: settings?.scoreMaximum?.toString() || "",
      examFileName: settings?.examFileName || "",
      answerFileName: settings?.answerFileName || "",
      answers: (settings?.answers || []).map((answer) => ({
        value: answer.value,
        score: String(answer.score),
      })),
      contentStatus: settings?.contentStatus || "Draft",
      ...(tutorDraft ? { tutorDraft: { ...tutorDraft, bullets: [...tutorDraft.bullets] } } : {}),
      ...(part ? { tutorId: tutorDraft?.id || (tutorPartId ? `tgat${tutorPartId}` : `${selected?.id || "category"}-${selectedSubject?.id || "set"}-${normalizedPart}`) } : {}),
    });
  }

  function openExamPreview(part: string) {
    const productId = part.match(/^TGAT[123]\b/i)?.[0].toLowerCase();
    if (!productId || !selectedSet || !selected) return;
    const plan = getExamPlan(productId, selectedSet.name);
    if (!plan.hasSuppliedExam) {
      setMessage(`ยังไม่มีไฟล์ข้อสอบสำหรับ Preview ของ ${part} ชุด ${selectedSet.name}`);
      return;
    }
    setExamPreviewSettings(selectedSet.partSettings?.[part] || null);
    setExamPreviewSetName(selectedSet.name);
    setExamPreviewProductId(productId);
  }

  function savePartModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!partModal || !selectedSet || !canEdit) return;
    const name =
      partModal.mode === "manage"
        ? partModal.part || ""
        : partModal.name.trim();
    if (!name)
      return setPartModal({ ...partModal, error: "กรอกชื่อพาร์ทก่อนบันทึก" });
    if (partModal.mode === "edit" && !partModal.tutorDraft?.tutor.trim())
      return setPartModal({ ...partModal, error: "กรอกชื่อติวเตอร์ประจำรายการก่อนบันทึก" });
    if (
      partModal.mode !== "manage" &&
      selectedSet.parts.some(
        (part) =>
          part !== partModal.part &&
          part.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    )
      return setPartModal({ ...partModal, error: "มีพาร์ทชื่อนี้แล้ว" });
    const numericFields = [
      partModal.questionCount,
      partModal.durationMinutes,
      partModal.choiceCount,
      partModal.scoreMaximum,
    ];
    if (
      numericFields.some(
        (value) =>
          value.trim() &&
          (!Number.isInteger(Number(value)) || Number(value) < 1),
      )
    ) {
      return setPartModal({
        ...partModal,
        error:
          "จำนวนข้อ เวลา ตัวเลือก และคะแนน ต้องเป็นจำนวนเต็มมากกว่า 0 หรือเว้นว่างไว้",
      });
    }
    if (
      partModal.answers.some(
        (answer) =>
          !answer.score.trim() ||
          !Number.isFinite(Number(answer.score)) ||
          Number(answer.score) < 0,
      )
    ) {
      return setPartModal({
        ...partModal,
        error: "คะแนนของเฉลยรายข้อต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป",
      });
    }
    const settings: CatalogPartSettings = {
      ...(partModal.questionCount.trim()
        ? { questionCount: Number(partModal.questionCount) }
        : {}),
      ...(partModal.durationMinutes.trim()
        ? { durationMinutes: Number(partModal.durationMinutes) }
        : {}),
      ...(partModal.choiceCount.trim()
        ? { choiceCount: Number(partModal.choiceCount) }
        : {}),
      ...(partModal.scoreMaximum.trim()
        ? { scoreMaximum: Number(partModal.scoreMaximum) }
        : {}),
      examFileName: partModal.examFileName.trim(),
      answerFileName: partModal.answerFileName.trim(),
      contentStatus: partModal.contentStatus,
      answers: partModal.answers.map((answer) => ({
        value: answer.value.trim(),
        score: Number(answer.score),
      })),
    };
    if (partModal.tutorDraft && selected) {
      const tutorKind = selected.id === "alevel" ? "a-level" : selected.id;
      const currentTutors = getTutorsForCategory(tutorKind);
      const nextTutors = [...currentTutors];
      const tutorIndex = nextTutors.findIndex((tutor) => tutor.id === partModal.tutorDraft?.id);
      const updatedTutor = { ...partModal.tutorDraft, title: name };
      if (tutorIndex >= 0) nextTutors[tutorIndex] = updatedTutor;
      else nextTutors.push(updatedTutor);
      saveTutorsForCategory(tutorKind, nextTutors);
    }
    updateSet(
      (set) => {
        const previousPart = partModal.part;
        const partSettings = { ...set.partSettings };
        if (previousPart && previousPart !== name)
          delete partSettings[previousPart];
        partSettings[name] = settings;
        return {
          ...set,
          parts:
            partModal.mode === "add"
              ? [...set.parts, name]
              : set.parts.map((part) => (part === previousPart ? name : part)),
          partSettings,
          ...(partModal.mode === "edit" && previousPart !== name
            ? {
              offers: set.offers.map((offer) => ({
                ...offer,
                parts: offer.parts.map((part) =>
                  part === previousPart ? name : part,
                ),
              })),
            }
            : {}),
        };
      },
      `${partModal.mode === "add" ? "เพิ่ม" : partModal.mode === "edit" ? "แก้ไข" : "บันทึกข้อมูล"} ${name} แล้ว`,
    );
    setPartModal(null);
  }

  function addOffer() {
    if (!selectedSet || !canEdit) return;
    setOfferModal({
      name: "",
      price: "179",
      payPrice: "197",
      status: "draft",
      parts: [...selectedSet.parts],
    });
  }

  function editOffer(offer: CatalogOffer) {
    setOfferModal({
      id: offer.id,
      productId: offer.productId,
      name: offer.name,
      price: String(offer.price),
      payPrice: String(offer.payPrice ?? samplePayPrice(offer.price)),
      status: offer.status,
      parts: [...offer.parts],
    });
  }

  function saveOfferModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!offerModal || !selectedSet || !canEdit) return;
    const name = offerModal.name.trim();
    const price = Number(offerModal.price);
    const payPrice = Number(offerModal.payPrice);
    if (!name)
      return setOfferModal({
        ...offerModal,
        error: "กรอกชื่อแพ็กเกตก่อนบันทึก",
      });
    if (!offerModal.price.trim() || !Number.isInteger(price) || price < 0)
      return setOfferModal({
        ...offerModal,
        error: "กรอกราคาเป็นจำนวนเต็มตั้งแต่ 0 บาท",
      });
    if (
      !offerModal.payPrice.trim() ||
      !Number.isInteger(payPrice) ||
      payPrice < 0
    )
      return setOfferModal({
        ...offerModal,
        error: "กรอกยอดเรียกเก็บเป็นจำนวนเต็มตั้งแต่ 0 บาท",
      });
    if (
      selectedSet.offers.some(
        (offer) =>
          offer.id !== offerModal.id &&
          offer.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    )
      return setOfferModal({
        ...offerModal,
        error: "มีแพ็กเกตชื่อนี้ในชุดแล้ว",
      });
    const id = offerModal.id || makeId("offer");
    const productId =
      offerModal.productId ||
      (selected?.id === "tgat"
        ? `tgat-custom-${id.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`
        : undefined);
    const offer: CatalogOffer = {
      id,
      ...(productId ? { productId } : {}),
      name,
      price,
      payPrice,
      status: offerModal.status,
      parts: offerModal.parts.filter((part) =>
        selectedSet.parts.includes(part),
      ),
    };
    const currentOffer = selectedSet.offers.find((item) => item.id === id);
    if (
      currentOffer?.status === "open" &&
      offer.status === "draft" &&
      alertOfferCannotClose(currentOffer)
    ) {
      setOfferModal({
        ...offerModal,
        error: "ยังปิดการขายไม่ได้ เนื่องจากมีสิทธิ์สอบที่ยังไม่เสร็จ",
      });
      return;
    }
    updateSet(
      (set) => ({
        ...set,
        offers: offerModal.id
          ? set.offers.map((item) => (item.id === id ? offer : item))
          : [...set.offers, offer],
      }),
      `${offerModal.id ? "อัปเดต" : "สร้าง"} ${name} แล้ว`,
    );
    setOfferModal(null);
  }

  async function removeItem(
    kind: "part" | "offer",
    id: string,
  ) {
    if (!canEdit) return;
    const confirmed = await confirmWebBAction({
      title: "ลบรายการนี้หรือไม่?",
      text: "รายการจะถูกลบออกจาก ข้อมูลจำลองหลังบ้านในเบราว์เซอร์นี้",
      confirmText: "ลบรายการ",
      danger: true,
    });
    if (!confirmed) return;
    if (kind === "part") {
      updateSet((set) => {
        const partSettings = { ...set.partSettings };
        delete partSettings[id];
        return {
          ...set,
          parts: set.parts.filter((part) => part !== id),
          partSettings,
          offers: set.offers.map((offer) => ({
            ...offer,
            parts: offer.parts.filter((part) => part !== id),
          })),
        };
      }, "ลบพาร์ทและถอดออกจากแพ็กเกตแล้ว");
    } else {
      updateSet(
        (set) => ({
          ...set,
          offers: set.offers.filter((offer) => offer.id !== id),
        }),
        "ลบแพ็กเกตแล้ว",
      );
    }
  }

  return (
    <main className="space-y-6 text-slate-900">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div
          className={
            isSetPage && selected && selectedSet
              ? "flex min-w-0 flex-nowrap items-center gap-4"
              : ""
          }
        >
          <h1
            className={`mt-1 text-2xl font-extrabold ${isSetPage ? "shrink-0" : ""
              }`}
          >
            {isSetPage
              ? `${selected?.name || "ประเภทสอบ"} · ชุด ${selectedSet?.name || "..."}`
              : "คลังข้อสอบ"}
          </h1>
          {/* {isSetPage ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <Link
              href="/webb/admin/exam-catalog"
              className="font-semibold text-indigo-700 underline"
            >
              ← คลังข้อสอบ
            </Link>
            <span className="text-slate-500">
              {selectedSubject ? `${selectedSubject.name} · ` : ""}
              เลือกขั้นตอนที่ต้องการจัดการด้านล่าง
            </span>
          </div>
        ) : (
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
            เลือกประเภทสอบเพื่อดูโครงสร้างในหน้าต่างสรุป
            แล้วเลือกชุดที่ต้องการจัดการ
          </p>
        )} */}
          {isSetPage && selected && selectedSet && (
            <nav
              aria-label={`เมนูจัดการ ${selected.name} ชุด ${selectedSet.name}`}
              className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-1"
            >
              {setManagementTabs
                .filter((tab) => !isTgatA || tab.id !== "offers")
                .map((tab) => {
                  const warning = menuNeedsAttention(tab.id);
                  const active = managementTab === tab.id;
                  const TabIcon = managementTabIcons[tab.id];
                  const label =
                    tab.id === "overview"
                      ? `ภาพรวมชุด ${selectedSet.name}`
                      : tab.label;
                  const warningHint =
                    tab.id === "content"
                      ? "ยังไม่มีพาร์ทหรือข้อมูลข้อสอบในชุดนี้"
                      : tab.id === "access"
                        ? "มีคำร้องล่าสุดรอการพิจารณา · เปิดเมนูและดำเนินการเพื่อเคลียร์แจ้งเตือน"
                        : "";
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      aria-current={active ? "step" : undefined}
                      title={warning ? warningHint : undefined}
                      onClick={() => openManagementTab(tab.id)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold ${active ? "bg-[#211d4f] text-white" : warning ? "border border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                    >
                      <TabIcon aria-hidden="true" className="size-4 shrink-0" />
                      {label}
                      {warning && (
                        <span
                          aria-hidden="true"
                          className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-extrabold leading-none text-white"
                        >
                          {tab.id === "access" ? unreadAccessCount : "!"}
                        </span>
                      )}
                    </button>
                  );
                })}
            </nav>
          )}
        </div>
      </header>

      {message && (isSetPage || !selected) && (
        <div
          role="status"
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
        >
          {message}
        </div>
      )}

      {!isSetPage && (
        <section
          aria-label="ประเภทสอบ"
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
        >
          {families.map((family) => (
            <div
              key={family.id}
              className={`relative rounded-2xl border px-4 pb-4 pt-5 shadow-sm ${selected?.id === family.id ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200" : "border-slate-200 bg-white hover:border-indigo-300"}`}
            >
              {(() => {
                const openSetCount = familySets(family).filter((set) =>
                  set.offers.some((offer) => offer.status === "open"),
                ).length;
                const statusLabel =
                  family.id === "tgat" && openSetCount > 0
                    ? `เปิดขายแล้ว ${openSetCount} ชุด`
                    : family.status === "open"
                      ? "เปิดการขาย"
                      : "ยังไม่เปิดขาย";
                return (
              <span
                className={`absolute right-4 top-0 z-10 -translate-y-1/2 rounded-full border px-2.5 py-0.5 text-[11px] font-bold shadow-sm ${family.status === "open" || openSetCount > 0 ? "border-emerald-200 bg-white text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}
              >
                {statusLabel}
              </span>
                );
              })()}
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    openerRef.current = event.currentTarget;
                    chooseFamily(family.id);
                  }}
                  aria-pressed={selected?.id === family.id}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <Image
                    src={family.homeCoverImage || WEBB_MOCK_IMAGE}
                    alt={`รูปปก ${family.name}`}
                    width={48}
                    height={36}
                    unoptimized
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                  <b className="text-lg">{family.name}</b>
                </button>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  chooseFamily(family.id);
                }}
                aria-pressed={selected?.id === family.id}
                className="mt-2 block w-full text-left"
              >
                <span className="mt-2 block text-xs leading-5 text-slate-600">
                  {flowText(family.flow)}
                </span>
              </button>
              <span className="mt-2 block text-xs text-slate-500">
                {familySets(family).length} ชุด ·{" "}
                {familySets(family).reduce(
                  (total, set) => total + set.offers.length,
                  0,
                )}{" "}
                แพ็กเกต
              </span>
            </div>
          ))}
        </section>
      )}


      {isSetPage && loaded && (!selected || !selectedSet) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          ไม่พบชุดสอบนี้ใน ข้อมูลในเบราว์เซอร์ปัจจุบัน{" "}
          <Link
            href="/webb/admin/exam-catalog"
            className="font-semibold text-indigo-700 underline"
          >
            กลับไปเลือกชุด
          </Link>
        </div>
      )}

      {isSetPage &&
        selected &&
        selectedSet &&
        managementTab !== "content" &&
        managementTab !== "offers" &&
        (!isTgatA || managementTab === "overview") && (
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                {/* <p className="text-xs font-bold text-indigo-700">
                  {selected.name}
                  {selectedSubject ? ` · ${selectedSubject.name}` : ""} · ชุด{" "}
                  {selectedSet.name}
                </p> */}
                <h2 className="mt-1 text-xl font-extrabold">
                  {managementTab === "overview"
                    ? `ภาพรวมชุด ${selectedSet.name}`
                    : setManagementTabs.find((tab) => tab.id === managementTab)
                      ?.label}
                </h2>
              </div>

            </div>
            {managementTab === "overview" && (
              <>
                <p className="text-sm leading-6 text-slate-600">
                  เลือกขั้นตอน 1–5 ด้านบนเพื่อจัดการชุดนี้
                  {selected.flow === "subject-first"
                    ? " · วิชาย่อยนี้มีชุดสอบแยกกัน"
                    : ""}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {[
                    [
                      "พาร์ท / วิชา",
                      String(selectedSet.parts.length),
                      selectedSet.parts.length
                        ? selectedSet.parts.join(" · ")
                        : "ยังไม่ตั้งค่า",
                    ],
                    [
                      "แพ็กเกต",
                      String(selectedSet.offers.length),
                      selectedSet.offers
                        .map((offer) => offer.name)
                        .join(" · ") || "ยังไม่สร้างแพ็กเกต",
                    ],
                    [
                      "สิทธิ์ / คำร้อง",
                      String(
                        scopedPurchases.filter(
                          (purchase) => purchase.paymentStatus !== "refunded",
                        ).length +
                        scopedRequests.length +
                        (futureDemoRecord ? 2 : 0),
                      ),
                      `${scopedPurchases.filter((purchase) => purchase.paymentStatus !== "refunded").length + (futureDemoRecord ? 1 : 0)} สิทธิ์ · ${scopedRequests.length + (futureDemoRecord ? 1 : 0)} คำร้อง`,
                    ],
                    [
                      "การเข้าสอบ",
                      String(
                        scopedAttempts.length + (futureDemoRecord ? 1 : 0),
                      ),
                      `${scopedAttempts.filter((attempt) => attempt.status === "ส่งแล้ว").length + (futureDemoRecord ? 1 : 0)} ส่งแล้ว · ${scopedAttempts.filter((attempt) => attempt.status === "กำลังสอบ").length} กำลังสอบ`,
                    ],
                    [
                      "ผลสอบ",
                      String(
                        scopedAttempts.filter(
                          (attempt) =>
                            attempt.status === "ส่งแล้ว" &&
                            attempt.score !== "—",
                        ).length + (futureDemoRecord ? 1 : 0),
                      ),
                      `${scopedRankings.length + (futureDemoRecord ? 1 : 0)} Ranking · ${scopedSolutions.length + (futureDemoRecord ? 1 : 0)} สื่อเฉลย`,
                    ],
                  ].map(([label, value, detail]) => (
                    <article
                      key={label}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="text-xs font-semibold text-slate-500">
                        {label}
                      </p>
                      <p className="mt-1 text-2xl font-extrabold text-slate-900">
                        {value}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {detail}
                      </p>
                    </article>
                  ))}
                </div>
                {!isTgatA && (
                  <section
                    id="offer-summary"
                    className="space-y-3 rounded-xl border border-slate-200 p-4"
                  >
                    <div>
                      <h3 className="font-bold">2 · รูปแบบการเปิดใช้</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        สรุปแพ็กเกต ราคา และสถานะการเลือกของชุดนี้
                      </p>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[680px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                          <tr>
                            <th className="px-4 py-3">
                              แพ็กเกตที่ผู้เรียนเลือก
                            </th>
                            <th className="px-4 py-3">ข้อสอบที่รวม</th>
                            <th className="px-4 py-3">ราคา / ยอดชำระ</th>
                            <th className="px-4 py-3">สถานะหน้าบ้าน</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedSet.offers.map((offer) => {
                            const configuredProduct = adminProducts.find(
                              (product) => product.id === offer.productId,
                            );
                            const basePrice =
                              configuredProduct?.price ?? offer.price;
                            const payPrice =
                              configuredProduct?.payPrice ??
                              offer.payPrice ??
                              samplePayPrice(basePrice);
                            return (
                              <tr key={offer.id}>
                                <td className="px-4 py-3 font-semibold">
                                  {offer.name}
                                </td>
                                <td className="px-4 py-3">
                                  {offer.parts.join(" · ") || "ยังไม่ผูกพาร์ท"}
                                </td>
                                <td className="px-4 py-3">
                                  <b>{formatPrice(payPrice)}</b>
                                  <small className="mt-1 block text-xs text-slate-500">
                                    ราคาสินค้า {formatPrice(basePrice)}
                                  </small>
                                </td>
                                <td className="px-4 py-3">
                                  {selected.id === "tgat" &&
                                    offer.id === "tgat-a-full"
                                    ? clientTgatOpen
                                      ? "เปิดซื้อ · ไฟล์พร้อม · ข้อมูลตัวอย่าง"
                                      : "ปิดชั่วคราว · ข้อมูลตัวอย่าง หลังบ้าน"
                                    : "ร่าง · ปิดการเลือก"}
                                </td>
                              </tr>
                            );
                          })}
                          {selectedSet.offers.length === 0 && (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-4 py-6 text-center text-slate-500"
                              >
                                ยังไม่มีแพ็กเกตในชุดนี้
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

              </>
            )}
            {managementTab === "access" &&
              (selected.id !== "tgat" ? (
                futureDemoRecord ? (
                  <div className="space-y-3">
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                      ข้อมูลตัวอย่างสำหรับนำเสนอ · บริการ {selected.name}{" "}
                      ยังปิดอยู่และไม่มีการซื้อหรือสิทธิ์จริงจาก Client
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                          <tr>
                            <th className="px-4 py-3">ผู้เรียนตัวอย่าง</th>
                            <th className="px-4 py-3">แพ็กเกต / ชุด</th>
                            <th className="px-4 py-3">สิทธิ์ตัวอย่าง</th>
                            <th className="px-4 py-3">คำร้องตัวอย่าง</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-3">
                              <b>{futureDemoRecord.student}</b>
                              <small className="mt-1 block text-xs text-slate-500">
                                {futureDemoRecord.studentCode} ·{" "}
                                {futureDemoRecord.grade} ·{" "}
                                {futureDemoRecord.province}
                              </small>
                            </td>
                            <td className="px-4 py-3">
                              {futureDemoRecord.packageName} · ชุด{" "}
                              {selectedSet.name}
                              <small className="mt-1 block text-xs text-slate-500">
                                {futureDemoRecord.purchaseRef}
                              </small>
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                                สิทธิ์จำลอง · ยังไม่มีสิทธิ์จริง
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <b>{futureDemoRecord.requestId}</b>
                              <small className="mt-1 block text-xs leading-5 text-slate-500">
                                {futureDemoRecord.requestReason}
                              </small>
                              <span className="mt-1 inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                รอตรวจ · ตัวอย่าง
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="font-bold">
                      ยังไม่มีรายการสิทธิ์หรือคำร้องจากผู้เรียน
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {selected.name} ยังปิดบริการในหน้าบ้าน ·
                      โครงสร้างชุดและแพ็กเกตเป็นแผนในอนาคต
                      จึงยังไม่มีการซื้อหรือคำร้อง
                    </p>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[650px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-500">
                        <tr>
                          <th className="px-4 py-3">ผู้ซื้อ</th>
                          <th className="px-4 py-3">แพ็กเกต / ชุด</th>
                          <th className="px-4 py-3">สิทธิ์สอบ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {scopedPurchases.map((purchase) => (
                          <tr key={purchase.ref}>
                            <td className="px-4 py-3">
                              {purchase.profileSnapshot.firstName}{" "}
                              {purchase.profileSnapshot.lastName}{" "}
                              <span className="text-xs text-slate-400">
                                {purchase.ref}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              Full TGAT · ชุด {purchase.examSet || "A"}
                            </td>
                            <td className="px-4 py-3">
                              {purchase.paymentStatus === "refunded"
                                ? "คืนเงินแล้ว · ไม่มีสิทธิ์"
                                : "มีสิทธิ์สอบ"}
                            </td>
                          </tr>
                        ))}
                        {scopedPurchases.length === 0 && (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-6 text-center text-slate-500"
                            >
                              ยังไม่มีรายการซื้อชุดนี้
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <WebBExamApprovals
                    compact
                    productId="tgat-full"
                    examSet={selectedSet?.name}
                  />
                </div>
              ))}
            {managementTab === "activity" &&
              (selected.id !== "tgat" ? (
                futureDemoRecord ? (
                  <div className="space-y-3">
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                      ประวัติสอบนี้เป็นข้อมูลตัวอย่างสำหรับนำเสนอ · ยังไม่มี
                      Attempt จริงจาก Client
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                          <tr>
                            <th className="px-4 py-3">รหัส Attempt</th>
                            <th className="px-4 py-3">ผู้เรียน</th>
                            <th className="px-4 py-3">ชุด / แพ็กเกต</th>
                            <th className="px-4 py-3">ส่งข้อสอบเมื่อ</th>
                            <th className="px-4 py-3">เวลาที่ใช้</th>
                            <th className="px-4 py-3">สถานะ</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-3 font-semibold">
                              {futureDemoRecord.attemptId}
                            </td>
                            <td className="px-4 py-3">
                              {futureDemoRecord.student}
                              <small className="mt-1 block text-xs text-slate-500">
                                {futureDemoRecord.studentCode}
                              </small>
                            </td>
                            <td className="px-4 py-3">
                              ชุด {selectedSet.name}
                              <small className="mt-1 block text-xs text-slate-500">
                                {futureDemoRecord.packageName}
                              </small>
                            </td>
                            <td className="px-4 py-3">
                              {futureDemoRecord.submittedAt}
                            </td>
                            <td className="px-4 py-3">
                              {futureDemoRecord.duration}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                ส่งแล้ว · ข้อมูลตัวอย่าง
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                    ยังไม่มีการสอบ {selected.name} จาก Client เพราะบริการปิดอยู่
                  </div>
                )
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-4 py-3">รหัส Attempt</th>
                        <th className="px-4 py-3">ชุด</th>
                        <th className="px-4 py-3">สถานะ</th>
                        <th className="px-4 py-3">คะแนน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scopedAttempts.map((attempt) => (
                        <tr key={attempt.id}>
                          <td className="px-4 py-3">{attempt.id}</td>
                          <td className="px-4 py-3">
                            ชุด{" "}
                            {attempt.product.match(/ชุด\s+([A-D])/i)?.[1] ||
                              "A"}
                          </td>
                          <td className="px-4 py-3">{attempt.status}</td>
                          <td className="px-4 py-3">{attempt.score}</td>
                        </tr>
                      ))}
                      {scopedAttempts.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-6 text-center text-slate-500"
                          >
                            ยังไม่มีประวัติการสอบ TGAT ในชุดนี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))}
            {managementTab === "results" &&
              (selected.id !== "tgat" ? (
                futureDemoRecord ? (
                  <div className="space-y-4">
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                      ผลสอบและ Ranking เป็นข้อมูลตัวอย่างสำหรับนำเสนอ ·
                      ไม่มีผลสอบจริงของ {selected.name} ใน Client
                    </p>
                    <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
                      <article className="rounded-xl border border-slate-200 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold">
                              ผลสอบฉบับสมบูรณ์ · ชุด {selectedSet.name}
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">
                              {futureDemoRecord.student} ·{" "}
                              {futureDemoRecord.studentCode} · ส่งเมื่อ{" "}
                              {futureDemoRecord.submittedAt}
                            </p>
                          </div>
                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                            คะแนนรวม {futureDemoRecord.total}/100
                          </span>
                        </div>
                        <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100">
                          {futureDemoRecord.partScores.map((part) => (
                            <div
                              key={part.name}
                              className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                            >
                              <span>{part.name}</span>
                              <b>
                                {part.score}/{part.maximum}
                              </b>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                          <b>เวลาที่ใช้</b>
                          <span className="ml-2 text-slate-600">
                            {futureDemoRecord.duration} · สอบครั้งที่ 1
                          </span>
                        </div>
                      </article>
                      <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <h3 className="font-bold">Ranking ตัวอย่าง</h3>
                        <p className="mt-2 text-2xl font-extrabold text-slate-900">
                          อันดับ {futureDemoRecord.rank}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          เทียบผู้ส่งข้อสอบสำเร็จในชุดและเวอร์ชันเดียวกัน
                        </p>
                      </article>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                    ยังไม่มีผลสอบหรือ Ranking ของ {selected.name} จาก Client
                    เพราะบริการปิดอยู่
                  </div>
                )
              ) : (
                <article className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-bold">ผลคะแนนจากการส่งข้อสอบ</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {
                      scopedAttempts.filter(
                        (attempt) =>
                          attempt.status === "ส่งแล้ว" && attempt.score !== "—",
                      ).length
                    }{" "}
                    Attempt มีคะแนน · {scopedRankings.length} รายการใน Ranking
                  </p>
                  <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                    Client เปิดดูผลหลังส่งข้อสอบ และ Ranking
                    อ่านจากผลสอบที่บันทึกในตัวอย่างนี้
                  </p>
                </article>
              ))}
            {managementTab === "solutions" &&
              selected.id === "tgat" && (
                <WebBAdminDemo
                  key={`tgat-solution-media-${selectedSet.id}`}
                  activeScreen="exam-management"
                  initialExamTab="solutions"
                  initialProductId="tgat-full"
                  embedded
                />
              )}
            {managementTab === "solutions" &&
              selected.id !== "tgat" &&
              (futureDemoRecord ? (
                <section className="space-y-3 rounded-xl border border-slate-200 p-4">
                  <div>
                    <h3 className="font-bold">
                      สื่อเฉลยสำหรับผู้เรียน · {selected.name} ชุด{" "}
                      {selectedSet.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      ตัวอย่างสำหรับโครงสร้างอนาคต · ยังไม่แสดงใน Client
                      เพราะบริการปิดอยู่
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="font-semibold">
                      {futureDemoRecord.solutionTitle} ·{" "}
                      {futureDemoRecord.solutionDuration}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {futureDemoRecord.tutor}
                    </p>
                    <p className="mt-3 text-sm">
                      ไฟล์ PDF: {futureDemoRecord.solutionFile}
                    </p>
                    <span className="mt-3 inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      ยังไม่เผยแพร่
                    </span>
                  </div>
                </section>
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  ยังไม่มีสื่อเฉลยตัวอย่างสำหรับ {selected.name}
                </p>
              ))}
            <p className="text-xs text-slate-500">
              ข้อมูลผู้เรียนและเหตุการณ์ในหน้านี้จำลองขึ้นเพื่อการนำเสนอ ·
              ยังไม่เชื่อมฐานข้อมูลจริง
            </p>
          </section>
        )}

      {selected &&
        (!isSetPage ||
          (selectedSet &&
            (managementTab === "content" || managementTab === "offers"))) && (
          <WebBModalPortal enabled={!isSetPage}>
            <div
              className={
                isSetPage
                  ? "space-y-5"
                  : "fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-0 backdrop-blur-sm sm:p-4"
              }
              onMouseDown={(event) => {
                if (!isSetPage && event.target === event.currentTarget)
                  closeModal();
              }}
            >
              <div
                ref={dialogRef}
                role={isSetPage ? undefined : "dialog"}
                aria-modal={isSetPage ? undefined : true}
                aria-labelledby={isSetPage ? undefined : "catalog-dialog-title"}
                className={
                  isSetPage
                    ? "space-y-5"
                    : "flex h-full w-full max-w-6xl flex-col overflow-hidden bg-slate-50 shadow-2xl sm:h-[min(92vh,900px)] sm:rounded-2xl"
                }
              >
                {!isSetPage && (
                  <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
                    <div>
                      <h2
                        id="catalog-dialog-title"
                        className="text-lg font-extrabold"
                      >
                        คลังข้อสอบ / {selected.name}
                      </h2>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        รูปแบบการเลือก · {flowText(selected.flow)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openFamilyContentEditor(selected)}
                        disabled={!canEdit}
                        aria-label={`แก้ไขหน้าบ้าน ${selected.name}`}
                        title={`แก้ไขชื่อ รูปปก และรายละเอียด ${selected.name}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <LuPencil aria-hidden="true" className="size-4" />
                        แก้ไข
                      </button>
                      <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={closeModal}
                        className={secondaryButton}
                        aria-label={`ปิดรายละเอียด ${selected.name}`}
                      >
                        <LuX aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  </div>
                )}
                <div
                  className={
                    isSetPage
                      ? "space-y-5"
                      : "min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6"
                  }
                >
                  {message && !isSetPage && (
                    <div
                      role="status"
                      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
                    >
                      {message}
                    </div>
                  )}

                  <section
                    aria-label={`จัดการ ${selected.name}`}
                    className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    {!isSetPage && selected.flow === "subject-first" && (
                      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h3 className="font-bold"> เลือกวิชาย่อย</h3>
                            <p className="mt-1 text-xs text-slate-500">
                              เลือกหนึ่งวิชาเพื่อดูชุดสอบที่อยู่ภายใน
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {selected.subjects.length} วิชา
                            </span>
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full min-w-[600px] table-fixed text-left text-sm">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                              <tr>
                                <th className="w-[30%] px-3 py-3">วิชามาตรฐาน</th>
                                <th className="w-[25%] px-3 py-3">
                                  ชุด / แพ็กเกต
                                </th>
                                <th className="w-[20%] px-3 py-3">สถานะข้อมูล</th>
                                <th className="w-[25%] px-3 py-3 text-right">
                                  การทำงาน
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selected.subjects.map((subject) => {
                                const active = selectedSubject?.id === subject.id;
                                const offers = subject.sets.reduce(
                                  (count, set) => count + set.offers.length,
                                  0,
                                );
                                return (
                                  <tr
                                    key={subject.id}
                                    className={
                                      active
                                        ? "bg-indigo-50/70"
                                        : "bg-white hover:bg-slate-50"
                                    }
                                  >
                                    <td className="px-3 py-3">
                                      <span className="inline-flex max-w-full rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-800">
                                        {subject.name}
                                      </span>
                                    </td>
                                    <td className="px-3 py-3 text-xs text-slate-600">
                                      {subject.sets.length} ชุด · {offers} แพ็กเกต
                                    </td>
                                    <td className="px-3 py-3">
                                      <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${subject.sets.length ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                                      >
                                        {subject.sets.length
                                          ? "มีชุดสอบ"
                                          : "ยังไม่มีชุด"}
                                      </span>
                                    </td>
                                    <td className="px-3 py-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSubjectId(subject.id);
                                          setSetId("");
                                          setSelectedSetIds([]);
                                          setPreviewChoices({});
                                        }}
                                        className={
                                          active
                                            ? primaryButton
                                            : secondaryButton
                                        }
                                      >
                                        {active ? "เลือกแล้ว" : "ดูชุดสอบ"}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                              {selected.subjects.length === 0 && (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="px-4 py-8 text-center text-sm text-slate-500"
                                  >
                                    ยังไม่มีวิชาย่อย กด “เพิ่มวิชาย่อย”
                                    เพื่อเริ่มต้น
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {!isSetPage &&
                      (selected.flow === "set-first" || selectedSubject) && (
                        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h3 className="font-bold">
                                {" "}
                                เลือกชุดสอบ
                                {selectedSubject
                                  ? `ของ ${selectedSubject.name}`
                                  : ""}
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                แต่ละแถวคือหนึ่งชุด กด “จัดการชุดนี้”
                                เพื่อเปิดหน้าจัดการข้อสอบโดยตรง
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const headers = ["ชื่อชุด", "พาร์ท/วิชาย่อย", "จำนวนแพ็กเกต", "สถานะขาย"];
                                  const rows = sets.map((s) => {
                                    const openOffers = s.offers.filter((o) => o.status === "open").length;
                                    return [
                                      `ชุด ${s.name}`,
                                      s.parts.join(" · ") || "ไม่มีพาร์ทย่อย",
                                      `${s.offers.length} แพ็กเกต`,
                                      openOffers ? `เปิด ${openOffers} แพ็กเกต` : "ยังไม่เปิดขาย",
                                    ];
                                  });
                                  downloadCsvData(`exam_sets_${selected.id}_${new Date().toISOString().slice(0, 10)}`, headers, rows);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                                title="ดาวน์โหลด CSV รายการชุดสอบ"
                              >
                                <LuDownload className="size-3.5 text-slate-500" />
                                <span>ดาวน์โหลด CSV</span>
                              </button>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {sets.length} ชุด
                              </span>
                              {/* <span
                                className={`rounded-full px-3 py-1.5 text-xs font-bold ${selected.status === "open" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
                              >
                                {selected.status === "open"
                                  ? "หมวดเปิดขาย"
                                  : "หมวดยังไม่เปิดขาย"}
                              </span> */}
                            </div>
                          </div>
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full min-w-[690px] table-fixed text-left text-sm">
                              <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                                <tr>
                                  <th className="w-[8%] px-3 py-3">
                                    <input
                                      type="checkbox"
                                      aria-label="เลือกทุกชุดสอบ"
                                      checked={
                                        sets.length > 0 &&
                                        sets.every((set) =>
                                          selectedSetIds.includes(set.id),
                                        )
                                      }
                                      disabled={!canEdit || sets.length === 0}
                                      onChange={(event) =>
                                        setSelectedSetIds(
                                          event.target.checked
                                            ? sets.map((set) => set.id)
                                            : [],
                                        )
                                      }
                                      className="size-4 accent-[#211d4f]"
                                    />
                                  </th>
                                  <th className="w-[12%] px-3 py-3">ชุดสอบ</th>
                                  <th className="w-[32%] px-3 py-3">
                                    พาร์ท / รายวิชา
                                  </th>
                                  <th className="w-[14%] px-3 py-3">แพ็กเกต</th>
                                  <th className="w-[14%] px-3 py-3">สถานะ</th>
                                  <th className="w-[20%] px-3 py-3 text-right">
                                    การทำงาน
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {sets.map((set) => {
                                  const openOffers = set.offers.filter(
                                    (offer) => offer.status === "open",
                                  ).length;
                                  return (
                                    <tr
                                      key={set.id}
                                      className="bg-white hover:bg-slate-50"
                                    >
                                      <td className="px-3 py-3">
                                        <input
                                          type="checkbox"
                                          aria-label={`เลือกชุด ${set.name}`}
                                          checked={selectedSetIds.includes(set.id)}
                                          disabled={!canEdit}
                                          onChange={(event) =>
                                            setSelectedSetIds((current) =>
                                              event.target.checked
                                                ? [...current, set.id]
                                                : current.filter(
                                                    (id) => id !== set.id,
                                                  ),
                                            )
                                          }
                                          className="size-4 accent-[#211d4f]"
                                        />
                                      </td>
                                      <td className="px-3 py-3">
                                        <b>ชุด {set.name}</b>
                                      </td>
                                      <td className="px-3 py-3">
                                        <div className="flex flex-wrap gap-1">
                                          {set.parts.length ? (
                                            set.parts.map((part) => (
                                              <span
                                                key={part}
                                                className="inline-flex max-w-full rounded-full bg-violet-50 px-2 py-1 text-[11px] font-semibold leading-4 text-violet-800"
                                              >
                                                {part}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-xs text-slate-400">
                                              ไม่มีพาร์ทย่อย
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-3 py-3 text-xs text-slate-600">
                                        {set.offers.length} แพ็กเกต
                                      </td>
                                      <td className="px-3 py-3">
                                        <span
                                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${openOffers ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                                        >
                                          {openOffers
                                            ? "เปิดขายแล้ว"
                                            : "ยังไม่เปิดขาย"}
                                        </span>
                                      </td>
                                      <td className="px-3 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <Link
                                            href={`/webb/admin/exam-catalog/${encodeURIComponent(selected.id)}/${encodeURIComponent(set.id)}`}
                                            className={primaryButton}
                                          >
                                            จัดการชุดนี้
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {sets.length === 0 && (
                                  <tr>
                                    <td
                                      colSpan={6}
                                      className="px-4 py-8 text-center text-sm text-slate-500"
                                    >
                                      ยังไม่มีชุดสอบ กด “เพิ่มชุดสอบ”
                                      เพื่อเริ่มต้น
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    {isSetPage && selectedSet && (
                      <div className="space-y-4">
                        {managementTab === "content" && (
                          <div className="rounded-xl border border-slate-200 p-4">
                            <h3 className="font-bold">
                              เนื้อหาในชุด {selectedSet.name}
                            </h3>
                            <>
                              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[900px] text-left text-sm">
                                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                                    <tr>
                                      <th className="px-4 py-3">พาร์ท / วิชา</th>
                                      <th className="px-4 py-3">สถานะ</th>
                                      <th className="px-4 py-3">อยู่ในแพ็กเกต</th>
                                      <th className="px-4 py-3 text-right">
                                        จัดการ
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {selectedSet.parts.map((part) => {
                                      const settings =
                                        selectedSet.partSettings?.[part];
                                      const contentStatus =
                                        settings?.contentStatus || "Draft";
                                      const completionPercent =
                                        contentStatus === "เผยแพร่"
                                          ? 100
                                          : contentStatus === "รอตรวจ"
                                            ? 60
                                            : 0;
                                      const completionTextTone =
                                        completionPercent === 100
                                          ? "text-emerald-700"
                                          : completionPercent >= 60
                                            ? "text-amber-700"
                                            : "text-rose-700";
                                      return (
                                        <tr key={part}>
                                          <td className="px-4 py-3 font-semibold">
                                            {part}
                                          </td>
                                          <td className="px-4 py-3">
                                            <span
                                              className={`text-xs font-semibold ${completionTextTone}`}
                                            >
                                              ดำเนินการแล้ว {completionPercent}%
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 text-xs text-slate-600">
                                            {selectedSet.offers
                                              .filter((offer) =>
                                                offer.parts.includes(part),
                                              )
                                              .map((offer) => offer.name)
                                              .join(" · ") || "ยังไม่ผูกแพ็กเกต"}
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  openPartModal("manage", part)
                                                }
                                                className={primaryButton}
                                              >
                                                จัดการ
                                              </button>
                                              {selected.id === "tgat" && (
                                                <button
                                                  type="button"
                                                  onClick={() => openExamPreview(part)}
                                                  aria-label={`Preview ข้อสอบ ${part}`}
                                                  title={`Preview ข้อสอบ ${part} ก่อนเปิดขาย`}
                                                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                                >
                                                  <LuEye aria-hidden="true" className="size-4" />
                                                  Preview
                                                </button>
                                              )}
                                              {canEdit && (
                                                <>
                                                  <button
                                                    type="button"
                                                    aria-label={`แก้ไขชื่อและข้อมูลติวเตอร์ ${part}`}
                                                    title={`แก้ไขชื่อและข้อมูลติวเตอร์ ${part}`}
                                                    onClick={() =>
                                                      openPartModal("edit", part)
                                                    }
                                                    className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                  >
                                                    <LuPencil
                                                      aria-hidden="true"
                                                      className="size-3.5"
                                                    />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    aria-label={`ลบ ${part}`}
                                                    title={`ลบ ${part}`}
                                                    onClick={() =>
                                                      void removeItem(
                                                        "part",
                                                        part,
                                                      )
                                                    }
                                                    className="inline-flex size-10 items-center justify-center rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50"
                                                  >
                                                    <LuTrash2
                                                      aria-hidden="true"
                                                      className="size-4"
                                                    />
                                                  </button>
                                                </>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                    {selectedSet.parts.length === 0 && (
                                      <tr>
                                        <td
                                          colSpan={5}
                                          className="px-4 py-6 text-center text-slate-500"
                                        >
                                          ยังไม่มีพาร์ทข้อสอบ
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => openPartModal("add")}
                                  className={`${primaryButton} mt-4`}
                                >
                                  <LuPlus
                                    aria-hidden="true"
                                    className="mr-1 inline size-4"
                                  />
                                  สร้างพาร์ท / วิชา
                                </button>
                              )}
                              {isTgatA && (
                                <div className="mt-6 border-t border-slate-200 pt-5">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <h3 className="font-bold">
                                        สินค้าและแพ็กเกตของชุด {selectedSet.name}
                                      </h3>
                                      <p className="mt-1 text-xs text-slate-500">
                                        เลือกพาร์ทจากเนื้อหาด้านบน
                                        แล้วกำหนดราคาและสถานะขายในหน้าต่างเดียว
                                      </p>
                                    </div>
                                    {canEdit && (
                                      <button
                                        type="button"
                                        onClick={addOffer}
                                        className={`${primaryButton} inline-flex items-center`}
                                      >
                                        <LuPlus
                                          aria-hidden="true"
                                          className="mr-1 size-4"
                                        />
                                        สร้างแพ็กเกต
                                      </button>
                                    )}
                                  </div>
                                  <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full min-w-[680px] text-left text-sm">
                                      <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                                        <tr>
                                          <th className="px-4 py-3">
                                            สินค้า / แพ็กเกต
                                          </th>
                                          <th className="px-4 py-3">
                                            เนื้อหาที่รวม
                                          </th>
                                          <th className="px-4 py-3">
                                            ราคาสินค้าจริง / ยอดรวม Payso
                                          </th>
                                          <th className="px-4 py-3 text-right">
                                            จัดการ
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {selectedSet.offers.map((offer) => (
                                          <tr key={offer.id}>
                                            <td className="px-4 py-3 font-semibold">
                                              {offer.name}
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="flex flex-wrap gap-1">
                                                {offer.parts.map((part) => (
                                                  <span
                                                    key={part}
                                                    className="rounded-full bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-800"
                                                  >
                                                    {part.split(" ")[0]}
                                                  </span>
                                                ))}
                                                {offer.parts.length === 0 && (
                                                  <span className="text-xs text-slate-400">
                                                    ยังไม่เลือกเนื้อหา
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3">
                                              <b>
                                                {formatPrice(
                                                  offer.payPrice ??
                                                  samplePayPrice(offer.price),
                                                )}
                                              </b>
                                              <small className="mt-1 block text-xs text-slate-500">
                                                ราคาสินค้า{" "}
                                                {formatPrice(offer.price)}
                                              </small>
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="flex justify-end gap-2">
                                                <button
                                                  type="button"
                                                  disabled={!canEdit}
                                                  onClick={() =>
                                                    setOfferSalesStatus(
                                                      offer,
                                                      offer.status === "open" ? "draft" : "open",
                                                    )
                                                  }
                                                  aria-label={`${offer.status === "open" ? "ปิดการขาย" : "เปิดขาย"} ${offer.name}`}
                                                  className={`rounded-xl border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${offer.status === "open" ? "border-amber-200 text-amber-800 hover:bg-amber-50" : "border-emerald-200 text-emerald-800 hover:bg-emerald-50"}`}
                                                >
                                                  {offer.status === "open" ? "ปิดการขาย" : "เปิดขาย"}
                                                </button>
                                                <button
                                                  type="button"
                                                  aria-label={`แก้ไข ${offer.name}`}
                                                  title={`แก้ไข ${offer.name}`}
                                                  onClick={() => editOffer(offer)}
                                                  className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                                >
                                                  <LuPencil
                                                    aria-hidden="true"
                                                    className="size-4"
                                                  />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    void removeItem(
                                                      "offer",
                                                      offer.id,
                                                    )
                                                  }
                                                  aria-label={`ลบแพ็กเกต ${offer.name}`}
                                                  title={`ลบแพ็กเกต ${offer.name}`}
                                                  className="inline-flex size-10 items-center justify-center rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50"
                                                >
                                                  <LuTrash2
                                                    aria-hidden="true"
                                                    className="size-4"
                                                  />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                        {selectedSet.offers.length === 0 && (
                                          <tr>
                                            <td
                                              colSpan={5}
                                              className="px-4 py-6 text-center text-slate-500"
                                            >
                                              ยังไม่มีสินค้าและแพ็กเกตในชุดนี้
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </>
                          </div>
                        )}

                        {managementTab === "offers" && (
                          <div className="rounded-xl border border-slate-200 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <h3 className="font-bold">
                                  แพ็กเกตของชุด {selectedSet.name}
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                  จัดการชื่อ เนื้อหาที่รวม ราคา
                                  และสถานะในหน้าต่างเดียว · สถานะ Draft
                                  จะยังไม่แสดงให้ผู้เรียนเลือก
                                </p>
                              </div>
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={addOffer}
                                  className={`${primaryButton} inline-flex items-center`}
                                >
                                  <LuPlus
                                    aria-hidden="true"
                                    className="mr-1.5 size-4"
                                  />
                                  เพิ่มแพ็กเกต
                                </button>
                              )}
                            </div>
                            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                              <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                                  <tr>
                                    <th className="px-4 py-3">ชื่อแพ็กเกต</th>
                                    <th className="px-4 py-3">เนื้อหาที่รวม</th>
                                    <th className="px-4 py-3">
                                      ราคาสินค้าจริง / ยอดรวม Payso
                                    </th>
                                    <th className="px-4 py-3">สถานะ</th>
                                    <th className="px-4 py-3 text-right">
                                      จัดการ
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {selectedSet.offers.map((offer) => (
                                    <tr key={offer.id}>
                                      <td className="px-4 py-3 font-semibold">
                                        {offer.name}
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                          {offer.parts.map((part) => (
                                            <span
                                              key={part}
                                              className="rounded-full bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-800"
                                            >
                                              {part}
                                            </span>
                                          ))}
                                          {offer.parts.length === 0 && (
                                            <span className="text-xs text-slate-400">
                                              ยังไม่เลือกเนื้อหา
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <b>
                                          {formatPrice(
                                            offer.payPrice ??
                                            samplePayPrice(offer.price),
                                          )}
                                        </b>
                                        <small className="mt-1 block text-xs text-slate-500">
                                          ราคาสินค้า {formatPrice(offer.price)}
                                        </small>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span
                                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${offer.status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                                        >
                                          {offer.status === "open"
                                            ? "เปิดขาย"
                                            : "ยังไม่เปิดขาย"}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                          {canEdit && (
                                            <>
                                              <button
                                                type="button"
                                                aria-label={`แก้ไข ${offer.name}`}
                                                title={`แก้ไข ${offer.name}`}
                                                onClick={() => editOffer(offer)}
                                                className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                              >
                                                <LuPencil
                                                  aria-hidden="true"
                                                  className="size-4"
                                                />
                                              </button>
                                              <button
                                                type="button"
                                                aria-label={`ลบแพ็กเกต ${offer.name}`}
                                                title={`ลบแพ็กเกต ${offer.name}`}
                                                onClick={() =>
                                                  void removeItem(
                                                    "offer",
                                                    offer.id,
                                                  )
                                                }
                                                className="inline-flex size-10 items-center justify-center rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50"
                                              >
                                                <LuTrash2
                                                  aria-hidden="true"
                                                  className="size-4"
                                                />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                  {selectedSet.offers.length === 0 && (
                                    <tr>
                                      <td
                                        colSpan={5}
                                        className="px-4 py-6 text-center text-slate-500"
                                      >
                                        ยังไม่มีแพ็กเกตในชุดนี้
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {!isSetPage && (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                        <div>
                          <b className="text-sm">สถานะหมวด {selected.name}</b>
                          <p className="mt-1 text-xs text-slate-500">
                            เปิดหมวดได้เมื่อมีแพ็กเกตที่เปิดอย่างน้อยหนึ่งรายการ ·
                            แพ็กเกตที่เป็นร่างยังเลือกไม่ได้
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {selectedSetIds.length > 0 && (
                            <span
                              className="text-xs font-semibold text-slate-600"
                              aria-live="polite"
                            >
                              เลือก {selectedSetIds.length} ชุด
                            </span>
                          )}
                          {canEdit && (
                            <>
                              <div className="min-w-[250px]">
                                <AdminSelect
                                  value={salesAction}
                                  onChange={(value) =>
                                    setSalesAction(
                                      value as typeof salesAction,
                                    )
                                  }
                                  placeholder="เลือกคำสั่งสถานะการขาย"
                                  ariaLabel="เลือกคำสั่งสถานะการขาย"
                                  options={[
                                    {
                                      value: "pause-selected",
                                      label: "พักการขายชุดที่เลือก",
                                    },
                                    {
                                      value: "open-selected",
                                      label: "เปิดขายชุดที่เลือก",
                                    },
                                    {
                                      value: "pause-category",
                                      label: "พักการขายทั้งหมวด",
                                    },
                                    {
                                      value: "open-category",
                                      label: "เปิดการขายทั้งหมวด",
                                    },
                                  ]}
                                />
                              </div>
                              <button
                                type="button"
                                disabled={
                                  !salesAction ||
                                  ((salesAction === "pause-selected" ||
                                    salesAction === "open-selected") &&
                                    selectedSetIds.length === 0) ||
                                  (salesAction === "open-category" &&
                                    !familyCanOpen(selected))
                                }
                                onClick={applySalesAction}
                                className={primaryButton}
                              >
                                นำไปใช้
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </section>


                  {/* {!isSetPage && <section aria-label="ตัวอย่างเส้นทางผู้สมัคร" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <p className="text-xs font-bold text-amber-800">PREVIEW · ตัวอย่างใน Admin</p>
        <h2 className="mt-1 text-xl font-bold">ผู้สมัครจะเลือกอะไรตามลำดับ</h2>
        <p className="mt-1 text-sm text-slate-600">กดวิชาย่อยและชุดด้านบนเพื่อดูแพ็กเกตของเส้นทางนั้น สถานะสีเทาแสดงรายการที่ยังเลือกซื้อไม่ได้</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-slate-500">ประเภทสอบ</p><b className="mt-1 block">{selected.name}</b><p className="mt-1 text-xs text-slate-500">{selected.status === "open" ? "แสดงและเลือกได้" : "แสดง แต่ปิดการเลือกซื้อ"}</p></div>
          <div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-slate-500">{selected.flow === "subject-first" ? "วิชาย่อย / ชุด" : "ชุด / พาร์ท"}</p><b className="mt-1 block">{selectedSubject ? `${selectedSubject.name} / ` : ""}{selectedSet ? `ชุด ${selectedSet.name}` : "รอเพิ่มข้อมูล"}</b><p className="mt-1 text-xs text-slate-500">{selectedSet?.parts.length ? selectedSet.parts.join(" · ") : "ไม่มีพาร์ทย่อยในชุดนี้"}</p></div>
          <div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-slate-500">แพ็กเกตที่เลือกได้</p><b className="mt-1 block">{selectedSet?.offers.filter((offer) => selected.status === "open" && offer.status === "open").length || 0} จาก {selectedSet?.offers.length || 0} แพ็กเกต</b><p className="mt-1 text-xs text-slate-500">ราคาและสถานะแยกตามแพ็กเกต</p></div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {sets.map((set) => <div key={set.id} className="rounded-xl border border-amber-200 bg-white p-3">
            <b className="text-sm">ชุด {set.name}</b>
            <div className="mt-2 flex flex-col gap-2">
              {set.offers.map((offer) => {
                const enabled = selected.status === "open" && offer.status === "open";
                const picked = previewChoices[set.id] === offer.id;
                return <button key={offer.id} type="button" disabled={!enabled} aria-pressed={picked} onClick={() => setPreviewChoices((current) => ({ ...current, [set.id]: current[set.id] === offer.id ? "" : offer.id }))}
                  className={`${choiceButton} text-left ${!enabled ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400" : picked ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-slate-900"}`}>
                  {offer.name} · {formatPrice(offer.payPrice ?? samplePayPrice(offer.price))}{!enabled ? " · ยังไม่เปิดขาย" : ""}
                </button>;
              })}
              {set.offers.length === 0 && <span className="text-xs text-slate-500">ยังไม่มีแพ็กเกต</span>}
            </div>
          </div>)}
          {sets.length === 0 && <span className="text-sm text-slate-500">ยังไม่มีชุดในเส้นทางนี้</span>}
        </div>
        <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4 text-sm">
          <b>สรุปที่เลือก</b>
          {(() => {
            const picked = sets.flatMap((set) => {
              const offer = set.offers.find((item) => item.id === previewChoices[set.id] && item.status === "open");
              return offer && selected.status === "open" ? [{ set, offer }] : [];
            });
            return <p className="mt-1 text-slate-600">{picked.length ? picked.map(({ set, offer }) => `ชุด ${set.name}: ${offer.name}`).join(" + ") : "ยังไม่ได้เลือกแพ็กเกต"} · รวม {formatPrice(picked.reduce((total, { offer }) => total + offer.price, 0))}</p>;
          })()}
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-600">ภาพนี้ใช้ประกอบการนำเสนอในหลังบ้าน ข้อมูลการสมัครและราคาบนหน้า Client ยังคงใช้ข้อมูลเดิมที่ตรวจผ่านแล้ว</p>
      </section>} */}
                </div>
              </div>
            </div>
          </WebBModalPortal>
        )}

      {isTgatA &&
        managementTab === "content" &&
        selectedSet.parts.length > 0 && (
          <p className="text-xs text-slate-500">
            เปิดแถวพาร์ทด้วยปุ่ม “จัดการ” เพื่อกำหนดจำนวนข้อ เวลา รูปแบบคำตอบ
            เฉลย และไฟล์ข้อสอบ · ทุกค่าบันทึกเป็น ข้อมูลตัวอย่าง
            ในเบราว์เซอร์นี้
          </p>
        )}
      {isTgatA &&
        ["access", "activity", "results", "solutions"].includes(
          managementTab,
        ) && (
          <WebBAdminDemo
            activeScreen="exam-management"
            initialExamTab={managementTab}
            initialProductId={initialProductId}
            embedded
            onStepChange={(tab, productId) => {
              if (productId) {
                const part = selectedSet?.parts.find((item) =>
                  item.toLowerCase().startsWith(productId),
                );
                if (part) {
                  openPartModal("manage", part);
                  return;
                }
              }
              openManagementTab(tab);
            }}
          />
        )}

      {partModal && (
        <WebBModalPortal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setPartModal(null);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="catalog-part-modal-title"
              className={`flex ${partModal.mode === "manage" ? "h-[94vh] max-h-[94vh] w-full max-w-[96vw] xl:max-w-[1600px] 2xl:max-w-[1720px]" : "max-h-[94vh] w-full max-w-5xl"} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div>
                  {partModal.mode === "manage" ? (
                    <div>
                      {/* <div className="flex items-center gap-2">
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                          {selected?.name}
                          {selectedSubject ? ` · ${selectedSubject.name}` : ""} · ชุด {selectedSet?.name}
                          {partModal.part ? ` · ${partModal.part}` : ""}
                        </span>
                      </div> */}
                      <h2
                        id="catalog-part-modal-title"
                        className="mt-1 text-lg font-bold text-slate-900"
                      >
                        คลังข้อสอบและเฉลยคำตอบ
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        จัดการไฟล์ข้อสอบ เวอร์ชัน และเฉลยคำตอบที่ใช้ตรวจคะแนนก่อนเผยแพร่
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-indigo-700">
                        {selected?.name}
                        {selectedSubject ? ` · ${selectedSubject.name}` : ""} · ชุด{" "}
                        {selectedSet?.name}
                      </p>
                      <h2
                        id="catalog-part-modal-title"
                        className="mt-1 text-lg font-bold"
                      >
                        {partModal.mode === "add"
                          ? "สร้างพาร์ท / วิชา"
                          : isTgatA
                            ? `แก้ไขชื่อพาร์ทและติวเตอร์ · ${partModal.part}`
                            : `แก้ไข ${partModal.part}`}
                      </h2>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPartModal(null)}
                  className={secondaryButton}
                  aria-label="ปิดหน้าต่าง"
                >
                  <LuX aria-hidden="true" className="size-4" />
                </button>
              </div>
              <div className={partModal.mode === "manage" ? "flex-1 min-h-0 overflow-hidden flex flex-col p-4 sm:p-5" : "min-h-0 overflow-y-auto p-4"}>
                {isTgatA && partModal.mode === "manage" ? (
                  managedPartProductId ? (
                    <WebBAdminDemo
                      key={managedPartProductId}
                      activeScreen="exam-management"
                      initialExamTab="content"
                      initialProductId={managedPartProductId}
                      embedded
                      hideProductSelector
                    />
                  ) : (
                    <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                      พาร์ทที่เพิ่มใหม่ยังไม่มีสินค้าและไฟล์ข้อสอบใน Client
                      จัดการชื่อได้จากปุ่มแก้ไขในตาราง
                    </p>
                  )
                ) : (
                  <form onSubmit={savePartModal} className="space-y-4">
                    {partModal.mode !== "manage" && (
                      <label className="block text-sm font-semibold">
                        ชื่อพาร์ท / วิชา
                        <WebBAdminInput
                          autoFocus
                          value={partModal.name}
                          onChange={(event) =>
                            setPartModal({
                              ...partModal,
                              name: event.target.value,
                              error: undefined,
                            })
                          }
                          className={`mt-2 ${inputClass}`}
                          placeholder="เช่น พาร์ทการคิดวิเคราะห์"
                        />
                      </label>
                    )}
                    {partModal.mode === "edit" && partModal.tutorDraft && (
                      <section className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                        <div>
                          <h3 className="font-bold text-slate-900">ข้อมูลติวเตอร์ประจำรายการ</h3>
                          <p className="mt-1 text-xs text-slate-600">แก้ไขข้อมูลติวเตอร์ของ {partModal.part} พร้อมชื่อพาร์ทในฟอร์มเดียวกัน</p>
                        </div>
                        {partModal.tutorDraft ? (
                          <>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="text-sm font-semibold">
                            ชื่อติวเตอร์
                            <WebBAdminInput
                              value={partModal.tutorDraft.tutor}
                              onChange={(event) => setPartModal({
                                ...partModal,
                                tutorDraft: { ...partModal.tutorDraft!, tutor: event.target.value },
                              })}
                              className={`mt-1 ${inputClass}`}
                              placeholder="ชื่อที่แสดงบนหน้า Client"
                            />
                          </label>
                          <label className="text-sm font-semibold">
                            วุฒิการศึกษา / มหาวิทยาลัย
                            <WebBAdminInput
                              value={partModal.tutorDraft.education || ""}
                              onChange={(event) => setPartModal({
                                ...partModal,
                                tutorDraft: { ...partModal.tutorDraft!, education: event.target.value },
                              })}
                              className={`mt-1 ${inputClass}`}
                              placeholder="เช่น ครุศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย"
                            />
                          </label>
                          <label className="text-sm font-semibold sm:col-span-2">
                            รูปโปรไฟล์ติวเตอร์
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                              {partModal.tutorDraft.image && (
                                <Image
                                  src={partModal.tutorDraft.image}
                                  alt={partModal.tutorDraft.tutor || "รูปติวเตอร์"}
                                  width={48}
                                  height={48}
                                  unoptimized
                                  className="size-12 rounded-full object-cover"
                                />
                              )}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                aria-label="เลือกรูปโปรไฟล์ติวเตอร์"
                                className="block max-w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-semibold file:text-indigo-700"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    if (typeof reader.result === "string") {
                                      setPartModal((current) => current?.tutorDraft
                                        ? { ...current, tutorDraft: { ...current.tutorDraft, image: reader.result as string } }
                                        : current);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </div>
                          </label>
                          <label className="text-sm font-semibold sm:col-span-2">
                            หัวข้อหลัก
                            <WebBAdminInput
                              value={partModal.tutorDraft.experience || ""}
                              onChange={(event) => setPartModal({
                                ...partModal,
                                tutorDraft: { ...partModal.tutorDraft!, experience: event.target.value },
                              })}
                              className={`mt-1 ${inputClass}`}
                              placeholder="เช่น ประสบการณ์สอน 5 ปี"
                            />
                          </label>
                        </div>
                        <div>
                          <p className="mb-2 text-sm font-semibold">หัวข้อย่อย (3 รายการ)</p>
                          <div className="grid gap-2 sm:grid-cols-3">
                            {[0, 1, 2].map((index) => (
                              <WebBAdminInput
                                key={index}
                                aria-label={`หัวข้อย่อยติวเตอร์ ${index + 1}`}
                                value={partModal.tutorDraft!.bullets[index] || ""}
                                onChange={(event) => {
                                  const bullets = [...partModal.tutorDraft!.bullets];
                                  bullets[index] = event.target.value;
                                  setPartModal({
                                    ...partModal,
                                    tutorDraft: { ...partModal.tutorDraft!, bullets },
                                  });
                                }}
                                className={inputClass}
                                placeholder={`หัวข้อย่อย ${index + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                          </>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-4">
                            <p className="text-sm text-slate-600">
                              รายการนี้ยังไม่มีข้อมูลติวเตอร์
                            </p>
                            <button
                              type="button"
                              onClick={() => setPartModal({
                                ...partModal,
                                tutorDraft: {
                                  id: partModal.tutorId || `${selected?.id || "category"}-${selectedSubject?.id || "set"}-${partModal.part || "part"}`,
                                  title: partModal.name || partModal.part || "",
                                  tutor: "",
                                  image: "",
                                  education: "",
                                  experience: "",
                                  bullets: ["", "", ""],
                                },
                              })}
                              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                              <LuPlus className="size-4" aria-hidden="true" />
                              เพิ่มข้อมูลติวเตอร์
                            </button>
                          </div>
                        )}
                      </section>
                    )}
                    {!isTgatA && (
                      <>
                        <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs leading-5 text-indigo-900">
                          ข้อมูลตัวอย่างสำหรับโครงสร้างอนาคต ตั้งค่าข้อสอบ ไฟล์
                          และสถานะได้โดยไม่เปิดบริการฝั่งผู้เรียน
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {(
                            [
                              ["questionCount", "จำนวนข้อ"],
                              ["durationMinutes", "เวลาสอบ (นาที)"],
                              ["choiceCount", "จำนวนตัวเลือก"],
                              ["scoreMaximum", "คะแนนเต็ม"],
                            ] as const
                          ).map(([key, label]) => (
                            <label key={key} className="text-sm font-semibold">
                              {label}
                              <WebBAdminInput
                                type="number"
                                min="1"
                                step="1"
                                value={partModal[key]}
                                onChange={(event) =>
                                  setPartModal({
                                    ...partModal,
                                    [key]: event.target.value,
                                    error: undefined,
                                  })
                                }
                                className={`mt-1 ${inputClass}`}
                                placeholder="ยังไม่กำหนด"
                              />
                            </label>
                          ))}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="text-sm font-semibold">
                            ไฟล์ข้อสอบ
                            <WebBAdminInput
                              value={partModal.examFileName}
                              onChange={(event) =>
                                setPartModal({
                                  ...partModal,
                                  examFileName: event.target.value,
                                })
                              }
                              className={`mt-1 ${inputClass}`}
                              placeholder="เช่น TPAT1-set-A.pdf"
                            />
                          </label>
                          <label className="text-sm font-semibold">
                            ไฟล์เฉลย
                            <WebBAdminInput
                              value={partModal.answerFileName}
                              onChange={(event) =>
                                setPartModal({
                                  ...partModal,
                                  answerFileName: event.target.value,
                                })
                              }
                              className={`mt-1 ${inputClass}`}
                              placeholder="เช่น TPAT1-set-A-solution.pdf"
                            />
                          </label>
                        </div>
                        <label className="block max-w-sm text-sm font-semibold">
                          สถานะเนื้อหา
                          <div className="mt-1">
                            <AdminSelect
                              value={partModal.contentStatus}
                              onChange={(value) =>
                                setPartModal({
                                  ...partModal,
                                  contentStatus:
                                    value as PartModalState["contentStatus"],
                                })
                              }
                              options={["Draft", "รอตรวจ", "เผยแพร่"].map(
                                (value) => ({ value, label: value }),
                              )}
                              ariaLabel="สถานะเนื้อหา"
                            />
                          </div>
                        </label>
                        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
                          <div>
                            <h3 className="font-bold">เฉลยรายข้อ</h3>
                            <p className="mt-1 text-xs text-slate-500">
                              เพิ่มคำตอบและคะแนนของแต่ละข้อ ·
                              บันทึกเป็นข้อมูลจำลองของประเภทสอบนี้
                            </p>
                          </div>
                          <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full min-w-[520px] text-left text-sm">
                              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                                <tr>
                                  <th className="px-3 py-2.5">ข้อ</th>
                                  <th className="px-3 py-2.5">คำตอบ</th>
                                  <th className="px-3 py-2.5">คะแนน</th>
                                  <th className="px-3 py-2.5 text-right">
                                    จัดการ
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {partModal.answers.map((answer, index) => (
                                  <tr key={index}>
                                    <td className="px-3 py-2.5 font-semibold">
                                      {index + 1}
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <WebBAdminInput
                                        aria-label={`เฉลยข้อ ${index + 1}`}
                                        value={answer.value}
                                        onChange={(event) =>
                                          setPartModal({
                                            ...partModal,
                                            answers: partModal.answers.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                    ...item,
                                                    value: event.target.value,
                                                  }
                                                  : item,
                                            ),
                                            error: undefined,
                                          })
                                        }
                                        className={inputClass}
                                        placeholder="กรอกคำตอบ"
                                      />
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <WebBAdminInput
                                        aria-label={`คะแนนข้อ ${index + 1}`}
                                        type="number"
                                        min="0"
                                        step="0.25"
                                        value={answer.score}
                                        onChange={(event) =>
                                          setPartModal({
                                            ...partModal,
                                            answers: partModal.answers.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                    ...item,
                                                    score: event.target.value,
                                                  }
                                                  : item,
                                            ),
                                            error: undefined,
                                          })
                                        }
                                        className="w-24 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                      />
                                    </td>
                                    <td className="px-3 py-2.5 text-right">
                                      <button
                                        type="button"
                                        aria-label={`ลบเฉลยข้อ ${index + 1}`}
                                        title={`ลบเฉลยข้อ ${index + 1}`}
                                        onClick={() =>
                                          setPartModal({
                                            ...partModal,
                                            answers: partModal.answers.filter(
                                              (_, itemIndex) =>
                                                itemIndex !== index,
                                            ),
                                          })
                                        }
                                        className="inline-flex size-10 items-center justify-center rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50"
                                      >
                                        <LuTrash2
                                          aria-hidden="true"
                                          className="size-4"
                                        />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                                {partModal.answers.length === 0 && (
                                  <tr>
                                    <td
                                      colSpan={4}
                                      className="px-3 py-5 text-center text-xs text-slate-500"
                                    >
                                      ยังไม่มีเฉลยรายข้อ
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setPartModal({
                                ...partModal,
                                answers: [
                                  ...partModal.answers,
                                  { value: "", score: "1" },
                                ],
                                error: undefined,
                              })
                            }
                            className={secondaryButton}
                          >
                            <LuPlus
                              aria-hidden="true"
                              className="mr-1.5 inline size-4"
                            />
                            เพิ่มเฉลยรายข้อ
                          </button>
                        </section>
                      </>
                    )}
                    {partModal.error && (
                      <p
                        role="alert"
                        className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
                      >
                        {partModal.error}
                      </p>
                    )}
                    <div className="flex justify-end border-t border-slate-100 pt-4">
                      <button type="submit" className={primaryButton}>
                        บันทึกข้อมูล
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          </div>
        </WebBModalPortal>
      )}

      <hr className="text-red-500" />

      {offerModal && (
        <WebBModalPortal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOfferModal(null);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="catalog-offer-modal-title"
              className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-indigo-700">
                    {selected?.name}
                    {selectedSubject ? ` · ${selectedSubject.name}` : ""} · ชุด{" "}
                    {selectedSet?.name} · แพ็กเกต
                  </p>
                  <h2
                    id="catalog-offer-modal-title"
                    className="mt-1 text-xl font-extrabold"
                  >
                    {offerModal.id ? "แก้ไขแพ็กเกต" : "สร้างแพ็กเกต"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    กำหนดชื่อ เนื้อหา ราคาสินค้าจริง และยอดเรียกเก็บ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOfferModal(null)}
                  className={secondaryButton}
                  aria-label="ปิดหน้าต่าง"
                >
                  <LuX aria-hidden="true" className="size-4" />
                </button>
              </div>
              <form onSubmit={saveOfferModal} className="mt-5 space-y-4">
                <label className="block text-sm font-semibold">
                  ชื่อสินค้า / แพ็กเกต
                  <WebBAdminInput
                    autoFocus
                    value={offerModal.name}
                    onChange={(event) =>
                      setOfferModal({
                        ...offerModal,
                        name: event.target.value,
                        error: undefined,
                      })
                    }
                    placeholder={
                      selected?.id === "tgat"
                        ? "เช่น Full TGAT หรือ TGAT2 + TGAT3"
                        : "เช่น แพ็กเกตครบทุกพาร์ท"
                    }
                    className={`mt-1.5 ${inputClass}`}
                  />
                </label>
                <fieldset>
                  <legend className="text-sm font-semibold">
                    เนื้อหาที่รวมในแพ็กเกต
                  </legend>
                  <p className="mt-1 text-xs text-slate-500">
                    เลือกพาร์ทหรือวิชาที่ผู้เรียนจะได้รับ
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {selectedSet?.parts.map((part) => (
                      <label
                        key={part}
                        className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm"
                      >
                        <WebBAdminInput
                          type="checkbox"
                          checked={offerModal.parts.includes(part)}
                          onChange={() =>
                            setOfferModal({
                              ...offerModal,
                              parts: offerModal.parts.includes(part)
                                ? offerModal.parts.filter((item) => item !== part)
                                : [...offerModal.parts, part],
                            })
                          }
                          className="mt-0.5"
                        />
                        <span>{part}</span>
                      </label>
                    ))}
                  </div>
                  {selectedSet?.parts.length === 0 && (
                    <p className="mt-2 text-xs text-amber-800">
                      เพิ่มพาร์ท / วิชาในเมนูข้อสอบและเฉลยก่อน
                      แล้วกลับมาเลือกเนื้อหาได้
                    </p>
                  )}
                </fieldset>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">
                    ราคาสินค้าจริง (บาท)
                    <WebBAdminInput
                      type="number"
                      min="0"
                      step="1"
                      value={offerModal.price}
                      onChange={(event) =>
                        setOfferModal({
                          ...offerModal,
                          price: event.target.value,
                          error: undefined,
                        })
                      }
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    ยอดเรียกเก็บรวม Payso (บาท)
                    <WebBAdminInput
                      type="number"
                      min="0"
                      step="1"
                      value={offerModal.payPrice}
                      onChange={(event) =>
                        setOfferModal({
                          ...offerModal,
                          payPrice: event.target.value,
                          error: undefined,
                        })
                      }
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </label>
                </div>
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                  ยอดเรียกเก็บตั้งแยกจากราคาสินค้าได้ · ค่าบริการ PromptPay QR และ
                  VAT ของ Payso แสดงแยกตามรายงาน
                </p>
                <label className="block max-w-sm text-sm font-semibold">
                  สถานะขาย
                  <div className="mt-1.5">
                    <AdminSelect
                      value={offerModal.status}
                      onChange={(value) =>
                        setOfferModal({
                          ...offerModal,
                          status: value as CatalogStatus,
                        })
                      }
                      options={[
                        { value: "draft", label: "ยังไม่เปิดขาย" },
                        { value: "open", label: "เปิดขาย" },
                      ]}
                      ariaLabel="สถานะขาย"
                    />
                  </div>
                </label>
                {offerModal.error && (
                  <p
                    role="alert"
                    className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
                  >
                    {offerModal.error}
                  </p>
                )}
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setOfferModal(null)}
                    className={secondaryButton}
                  >
                    ยกเลิก
                  </button>
                  <button type="submit" className={primaryButton}>
                    บันทึกแพ็กเกต
                  </button>
                </div>
              </form>
            </section>
          </div>
        </WebBModalPortal>
      )}

      {!isSetPage && (
        <section
          aria-label="ตัวอย่างรูปแบบการเลือกข้อสอบ"
          className="space-y-3"
        >
          <div>
            <h2 className="text-lg font-extrabold">
              ภาพจำลองเส้นทางและเมนูหลังบ้าน
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {(() => {
              const preview = {
                src: "/images/webb/exam-flow-both-types.webp",
                alt: "ตัวอย่างเส้นทางเลือกข้อสอบของนักเรียน A เปรียบเทียบ TGAT แบบประเภทสอบ ชุด พาร์ทและแพ็กเกต กับ TPAT แบบประเภทสอบ วิชาย่อย ชุดและแพ็กเกต",
                width: 1600,
                height: 1000,
              };
              return (
                <button
                  type="button"
                  onClick={() => setImagePreview(preview)}
                  aria-label={`ขยายภาพ: ${preview.alt}`}
                  title="กดเพื่อดูภาพขนาดใหญ่"
                  className="block w-full cursor-zoom-in rounded-2xl text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
                >
                  <Image
                    {...preview}
                    sizes="100vw"
                    className="h-auto w-full rounded-2xl border border-slate-200 shadow-sm transition-shadow hover:shadow-lg"
                  />
                </button>
              );
            })()}
          </div>
          <div className="space-y-8 pt-3">
            {managementImageGroups.map((group) => (
              <section
                key={group.id}
                aria-label={`ตัวอย่างเมนู ${group.title}`}
                className="space-y-3"
              >
                <div>
                  <h3 className="text-lg font-extrabold">
                    ตัวอย่างหน้าที่ของแต่ละเมนู · {group.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    แต่ละภาพอธิบายว่างานนี้ใช้ทำอะไร ·
                    ข้อมูลนักเรียนและสถานะเป็นข้อมูลจำลองสำหรับนำเสนอ ·
                    กดภาพเพื่อดูรายละเอียด
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {group.examples.map(([id, label, purpose, sample]) => {
                    const preview = {
                      src: `/images/webb/exam-menu-${group.id}-${id}.webp`,
                      alt: `${group.title} · ${label} ใช้สำหรับ${purpose} ตัวอย่าง: ${sample}`,
                      width: 1600,
                      height: 1000,
                    };
                    return (
                      <figure key={id} className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setImagePreview(preview)}
                          aria-label={`ขยายภาพ: ${preview.alt}`}
                          title="กดเพื่อดูภาพขนาดใหญ่"
                          className="block w-full cursor-zoom-in rounded-2xl text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
                        >
                          <Image
                            {...preview}
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="h-auto w-full rounded-2xl border border-slate-200 shadow-sm transition-shadow hover:shadow-lg"
                          />
                        </button>
                        <figcaption>
                          <b className="text-sm">{label}</b>
                          <p className="mt-0.5 text-xs leading-5 text-slate-500">
                            {purpose} · ตัวอย่างภาพ: {sample} ·
                            ข้อมูลประกอบเพื่อการนำเสนอ
                          </p>
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      )}

      {examPreviewProductId && portalTarget && (() => {
        const examProduct = WEBB_PRODUCTS.find((product) => product.id === examPreviewProductId);
        return examProduct ? createPortal(
          <div className="fixed inset-0 z-[10000] h-[100dvh] w-screen overflow-y-auto bg-white" role="dialog" aria-modal="true" aria-label={`Preview ข้อสอบ ${examProduct.name}`}>
            <WebBExam
              key={`preview-${examPreviewProductId}`}
              product={examProduct}
              examSet={examPreviewSetName}
              previewMode
              previewAnswerKey={examPreviewSettings?.answers || []}
              previewScoreMaximum={examPreviewSettings?.scoreMaximum}
              onPreviewExit={() => setExamPreviewProductId(null)}
            />
          </div>,
          portalTarget,
        ) : null;
      })()}

      {imagePreview &&
        portalTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] h-screen w-screen overflow-hidden bg-slate-950/95 [height:100dvh]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setImagePreview(null);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-label="ภาพตัวอย่างขนาดเต็มจอ"
              className="relative h-full w-full"
            >
              <button
                type="button"
                autoFocus
                onClick={() => setImagePreview(null)}
                aria-label="ปิดภาพขนาดใหญ่"
                title="ปิดภาพ"
                className="absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-slate-950/75 px-4 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur hover:bg-slate-800 sm:right-5 sm:top-5"
              >
                ปิด <LuX aria-hidden="true" className="size-4" />
              </button>
              <Image
                src={imagePreview.src}
                alt={imagePreview.alt}
                fill
                sizes="100vw"
                quality={100}
                priority
                className="object-contain p-1 sm:p-3"
              />
            </section>
          </div>,
          portalTarget,
        )}

      {familyContentDraft && (
        <WebBModalPortal>
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setFamilyContentDraft(null);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="family-content-title"
              className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 id="family-content-title" className="text-lg font-bold text-slate-900">
                    แก้ไขข้อมูลหน้าบ้าน · {familyContentDraft.name}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    ข้อมูลตัวอย่างจะบันทึกในเบราว์เซอร์นี้และแสดงบนหน้าบ้าน
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFamilyContentDraft(null)}
                  aria-label="ปิดหน้าต่างแก้ไข"
                  title="ปิดหน้าต่าง"
                  className="inline-flex rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <LuX aria-hidden="true" className="size-4" />
                </button>
              </header>
              <form onSubmit={saveFamilyContent} className="space-y-4 p-5">
                <label className="block text-sm font-semibold text-slate-700">
                  ชื่อหมวดวิชา
                  <WebBAdminInput
                    autoFocus
                    value={familyContentDraft.name}
                    onChange={(event) =>
                      setFamilyContentDraft({
                        ...familyContentDraft,
                        name: event.target.value,
                        error: undefined,
                      })
                    }
                    className={`mt-1.5 ${inputClass}`}
                    placeholder="เช่น TGAT"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  คำอธิบายสั้นบนการ์ดหน้าบ้าน
                  <WebBAdminInput
                    value={familyContentDraft.homeSubtitle}
                    onChange={(event) =>
                      setFamilyContentDraft({
                        ...familyContentDraft,
                        homeSubtitle: event.target.value,
                      })
                    }
                    className={`mt-1.5 ${inputClass}`}
                    placeholder="เช่น ความถนัดทั่วไป"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-[1.2fr_.8fr]">
                  <label className="block text-sm font-semibold text-slate-700">
                    รูปปกหมวดวิชา
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      aria-label={`เลือกรูปปก ${familyContentDraft.name}`}
                      className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-normal text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-semibold file:text-indigo-700"
                      onChange={async (event) => {
                        const file = event.currentTarget.files?.[0];
                        if (!file) return;
                        try {
                          const homeCoverImage = await compressCoverImage(file);
                          setFamilyContentDraft((current) =>
                            current
                              ? { ...current, homeCoverImage, error: undefined }
                              : current,
                          );
                        } catch (error) {
                          setFamilyContentDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  error:
                                    error instanceof Error
                                      ? error.message
                                      : "อ่านไฟล์รูปภาพไม่สำเร็จ",
                                }
                              : current,
                          );
                        }
                      }}
                    />
                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      PNG, JPG หรือ WebP · ไม่เกิน 8 MB
                    </span>
                  </label>
                  <Image
                    src={familyContentDraft.homeCoverImage || WEBB_MOCK_IMAGE}
                    alt={`ตัวอย่างรูปปก ${familyContentDraft.name}`}
                    width={640}
                    height={360}
                    unoptimized
                    className="h-28 w-full rounded-xl border border-slate-200 object-cover"
                  />
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  รายละเอียดหน้าแนะนำวิชา
                  <textarea
                    value={familyContentDraft.detailDescription}
                    onChange={(event) =>
                      setFamilyContentDraft({
                        ...familyContentDraft,
                        detailDescription: event.target.value,
                      })
                    }
                    rows={5}
                    className={`mt-1.5 ${inputClass}`}
                    placeholder="กรอกรายละเอียดที่จะแสดงเมื่อผู้เรียนกดดูรายละเอียด"
                  />
                </label>
                {familyContentDraft.error && (
                  <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {familyContentDraft.error}
                  </p>
                )}
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setFamilyContentDraft(null)}
                    className={secondaryButton}
                  >
                    ยกเลิก
                  </button>
                  <button type="submit" className={primaryButton}>
                    บันทึกข้อมูล
                  </button>
                </div>
              </form>
            </section>
          </div>
        </WebBModalPortal>
      )}
    </main>
  );
}
