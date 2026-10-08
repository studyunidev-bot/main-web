"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { WEBB_PRODUCTS, WEBB_DEMO_LABEL, formatBaht } from "./data";
import { DEMO_PURCHASES_KEY, defaultSocialSettings, productsOverlap, readDemoAccount, readDemoPurchases, readSocialSettings, safeWrite, writeSocialSettings, type SocialSettings } from "./demo-store";

type DemoOrder = {
  ref: string;
  student: string;
  username?: string;
  product: string;
  base: number;
  charged: number;
  method: string;
  day: string;
  status: "สำเร็จ" | "รอชำระ" | "หมดอายุ" | "คืนเงินแล้ว";
};
type DemoStudent = {
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
type DemoProduct = {
  id: string;
  name: string;
  parts: string;
  price: number;
  payPrice: number;
  status: "เปิดขาย" | "ปิดขาย";
  version: string;
  trial: boolean;
};
type DemoTicket = {
  id: string;
  student: string;
  username?: string;
  product: string;
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
};
type DemoAdmin = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ใช้งาน" | "ปิดใช้งาน";
};
type DemoLog = { time: string; actor: string; action: string; target: string };

const initialOrders: DemoOrder[] = [
  {
    ref: "DO-2570-0001",
    student: "ศิรศักดิ์ ผู้เรียน Demo",
    product: "Full TGAT",
    base: 250,
    charged: 275,
    method: "PromptPay QR",
    day: "2026-10-05",
    status: "สำเร็จ",
  },
  {
    ref: "DO-2570-0002",
    student: "กมลชนก ตัวอย่าง",
    product: "TGAT1",
    base: 100,
    charged: 110,
    method: "บัตรเครดิต",
    day: "2026-10-04",
    status: "สำเร็จ",
  },
  {
    ref: "DO-2570-0003",
    student: "ธนกร สาธิต",
    product: "TGAT2 + TGAT3",
    base: 180,
    charged: 198,
    method: "PromptPay QR",
    day: "2026-10-03",
    status: "สำเร็จ",
  },
  {
    ref: "DO-2570-0004",
    student: "นภัส Demo",
    product: "TGAT3",
    base: 100,
    charged: 110,
    method: "บัตรเครดิต",
    day: "2026-10-02",
    status: "รอชำระ",
  },
  {
    ref: "DO-2570-0005",
    student: "ปาริชาติ ตัวอย่าง",
    product: "TGAT1",
    base: 100,
    charged: 110,
    method: "PromptPay QR",
    day: "2026-10-01",
    status: "หมดอายุ",
  },
];
const initialStudents: DemoStudent[] = [
  {
    id: "ST-001",
    name: "ศิรศักดิ์ ผู้เรียน Demo",
    email: "sirasak@example.test",
    grade: "ม.6",
    school: "โรงเรียนตัวอย่างวิทยา",
    joined: "2026-09-21",
    status: "ใช้งาน",
    entitlements: 2,
  },
  {
    id: "ST-002",
    name: "กมลชนก ตัวอย่าง",
    email: "kamonchanok@example.test",
    grade: "ม.6",
    school: "โรงเรียนเตรียมศึกษา",
    joined: "2026-09-24",
    status: "ใช้งาน",
    entitlements: 1,
  },
  {
    id: "ST-003",
    name: "ธนกร สาธิต",
    email: "thanakorn@example.test",
    grade: "ม.5",
    school: "โรงเรียนสาธิต",
    joined: "2026-10-01",
    status: "ใช้งาน",
    entitlements: 1,
  },
  {
    id: "ST-004",
    name: "นภัส Demo",
    email: "napas@example.test",
    grade: "ม.6",
    school: "โรงเรียนตัวอย่างวิทยา",
    joined: "2026-10-03",
    status: "ระงับ",
    entitlements: 0,
  },
];
const initialProducts: DemoProduct[] = WEBB_PRODUCTS.map((p, i) => ({
  id: p.id,
  name: p.name,
  parts: p.parts,
  price: p.price,
  payPrice: Math.round(p.price * 1.1),
  status: "เปิดขาย",
  version: `TGAT-2026.${i + 1}`,
  trial: i === 0,
}));
const initialTickets: DemoTicket[] = [
  {
    id: "REQ-001",
    student: "นภัส Demo",
    product: "TGAT3",
    reason: "อินเทอร์เน็ตหลุดระหว่างส่งข้อสอบ",
    date: "2026-10-04 15:10",
    status: "รอตรวจสอบ",
  },
  {
    id: "REQ-002",
    student: "ธนกร สาธิต",
    product: "Full TGAT",
    reason: "หน้าจอค้างขณะทำข้อสอบ",
    date: "2026-10-03 10:42",
    status: "รอตรวจสอบ",
  },
];
const initialAttempts: DemoAttempt[] = [
  {
    id: "ATT-001",
    student: "ศิรศักดิ์ ผู้เรียน Demo",
    product: "Full TGAT · ชุด A",
    started: "2026-10-05 09:10",
    status: "ส่งแล้ว",
    score: "178 / 300",
  },
  {
    id: "ATT-002",
    student: "กมลชนก ตัวอย่าง",
    product: "TGAT1 · ชุด A",
    started: "2026-10-04 13:00",
    status: "ส่งแล้ว",
    score: "62 / 100",
  },
  {
    id: "ATT-003",
    student: "ธนกร สาธิต",
    product: "TGAT2 + TGAT3",
    started: "2026-10-03 10:00",
    status: "ผิดปกติ",
    score: "—",
  },
  {
    id: "ATT-004",
    student: "นภัส Demo",
    product: "TGAT3 · ชุด A",
    started: "2026-10-02 15:00",
    status: "ยกเลิก",
    score: "—",
  },
];
const initialAdmins: DemoAdmin[] = [
  {
    id: "ADM-001",
    name: "ผู้ดูแลระบบ Demo",
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
    actor: "ผู้ดูแลระบบ Demo",
    action: "เข้าสู่ระบบ Demo",
    target: "Web B Admin",
  },
  {
    time: "2026-10-04 15:13",
    actor: "ทีมช่วยเหลือ",
    action: "ตรวจคำร้องขอสอบใหม่",
    target: "REQ-001",
  },
  {
    time: "2026-10-04 13:05",
    actor: "ทีมการเงิน",
    action: "ตรวจสอบ Webhook",
    target: "DO-2570-0002",
  },
];

function useDemoData<T>(key: string, seed: T) {
  const [value, setValue] = useState(seed);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`webb-admin-demo:${key}`);
      if (saved) setValue(JSON.parse(saved) as T);
    } catch {
      // Keep the built-in demo data if browser storage is unavailable.
    }
  }, [key]);
  const update = (next: T | ((current: T) => T)) => {
    setValue((current) => {
      const updated =
        typeof next === "function"
          ? (next as (current: T) => T)(current)
          : next;
      try {
        localStorage.setItem(`webb-admin-demo:${key}`, JSON.stringify(updated));
      } catch {
        // The current page remains usable without persistence.
      }
      return updated;
    });
  };
  return [value, update] as const;
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </article>
  );
}
function Section({
  id,
  title,
  detail,
  action,
  children,
}: {
  id: string;
  title: string;
  detail?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const styles =
    variant === "primary"
      ? "bg-[#211d4f] text-white hover:bg-[#332e71]"
      : variant === "danger"
        ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${styles}`}
    >
      {children}
    </button>
  );
}
function Badge({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "gray" | "green" | "amber" | "red" | "blue";
}) {
  const colors = {
    gray: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-rose-50 text-rose-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${colors[tone]}`}
    >
      {children}
    </span>
  );
}
const th =
  "whitespace-nowrap px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500";
const td =
  "border-t border-slate-100 px-3 py-3 align-middle text-sm text-slate-700";
const money = (n: number) =>
  `${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;
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

export default function WebBAdminDemo() {
  const [orders, setOrders] = useDemoData<DemoOrder[]>("orders", initialOrders);
  const [students, setStudents] = useDemoData<DemoStudent[]>(
    "students",
    initialStudents,
  );
  const [products, setProducts] = useDemoData<DemoProduct[]>(
    "products",
    initialProducts,
  );
  const [tickets, setTickets] = useDemoData<DemoTicket[]>(
    "tickets",
    initialTickets,
  );
  const [attempts, setAttempts] = useDemoData<DemoAttempt[]>(
    "attempts",
    initialAttempts,
  );
  const [admins, setAdmins] = useDemoData<DemoAdmin[]>("admins", initialAdmins);
  const [logs, setLogs] = useDemoData<DemoLog[]>("logs", initialLogs);
  const [orderQuery, setOrderQuery] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [message, setMessage] = useState("");
  const minimumRank = 100;
  const [publishedResults, setPublishedResults] = useState(true);
  const [openSales, setOpenSales] = useState(true);
  const [consentRequired, setConsentRequired] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [emailNoticeEnabled, setEmailNoticeEnabled] = useState(true);
  const [socialSettings, setSocialSettings] = useState<SocialSettings>(defaultSocialSettings);
  const [paymentProvider, setPaymentProvider] = useState(
    "Demo Payment · ไม่เชื่อมต่อจริง",
  );
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
      type: "payment.pending",
      status: "รอดำเนินการ",
      received: "2026-10-02 11:20",
    },
  ] as {
    id: string;
    order: string;
    type: string;
    status: string;
    received: string;
  }[]);
  const [solutions, setSolutions] = useDemoData("solutions", [
    {
      id: "SOL-001",
      name: "เฉลยละเอียด TGAT1",
      product: "TGAT1 · ชุด A",
      kind: "PDF",
      access: "หลังส่งข้อสอบ",
      active: true,
    },
    {
      id: "SOL-002",
      name: "วิดีโอเฉลย TGAT2",
      product: "TGAT2 · ชุด A",
      kind: "Video",
      access: "ผู้ซื้อชุดสอบ",
      active: true,
    },
    {
      id: "SOL-003",
      name: "คู่มือการสอบ",
      product: "ทุกชุด",
      kind: "PDF",
      access: "ทุกบัญชี",
      active: false,
    },
  ]);
  const [answerKey, setAnswerKey] = useDemoData<string[]>("answer-key", [
    "A",
    "C",
    "B",
    "D",
    "A",
  ]);
  useEffect(() => setSocialSettings(readSocialSettings()), []);
  useEffect(() => {
    const account = readDemoAccount();
    const purchases = readDemoPurchases();
    if (account) {
      const name = `${account.firstName} ${account.lastName}`.trim();
      const joined = new Date().toISOString().slice(0, 10);
      setStudents((current) => {
        const existing = current.find((row) => row.email.toLowerCase() === account.email.toLowerCase() || row.username?.toLowerCase() === account.username.toLowerCase());
        if (existing?.status === "ลบข้อมูลแล้ว") return current;
        const student: DemoStudent = {
          id: existing?.id || `ST-${account.username.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || Date.now()}`,
          name,
          username: account.username,
          email: account.email,
          grade: account.education.includes("6") ? "ม.6" : account.education.includes("5") ? "ม.5" : "ม.4",
          school: account.school,
          joined: existing?.joined || joined,
          status: "ใช้งาน",
          entitlements: purchases.filter((purchase) => purchase.profileSnapshot.username.toLowerCase() === account.username.toLowerCase()).length,
        };
        return existing ? current.map((row) => row.id === existing.id ? student : row) : [student, ...current];
      });
    }
    if (purchases.length) {
      setOrders((current) => {
        const next = [...current];
        for (const purchase of purchases) {
          if (next.some((row) => row.ref === purchase.ref)) continue;
          const item = WEBB_PRODUCTS.find((product) => product.id === purchase.productId);
          const purchasedDate = new Date(purchase.purchasedAtIso || purchase.purchasedAt);
          next.unshift({
            ref: purchase.ref,
            student: `${purchase.profileSnapshot.firstName} ${purchase.profileSnapshot.lastName}`.trim(),
            username: purchase.profileSnapshot.username,
            product: item?.name || purchase.productId,
            base: purchase.baseAmount,
            charged: purchase.amount,
            method: purchase.payment,
            day: Number.isNaN(purchasedDate.getTime()) ? new Date().toISOString().slice(0, 10) : purchasedDate.toISOString().slice(0, 10),
            status: "สำเร็จ",
          });
        }
        return next;
      });
    }
  }, []);
  const settingToggles: {
    label: string;
    enabled: boolean;
    toggle: () => void;
  }[] = [
    {
      label: "บังคับยอมรับ Privacy Notice / Terms ก่อนสมัคร",
      enabled: consentRequired,
      toggle: () => setConsentRequired((v) => !v),
    },
    {
      label: "เปิด Google Tag Manager หลัง Consent",
      enabled: trackingEnabled,
      toggle: () => setTrackingEnabled((v) => !v),
    },
    {
      label: "ส่งอีเมลเมื่อสมัคร/ชำระเงิน/สอบเสร็จ",
      enabled: emailNoticeEnabled,
      toggle: () => setEmailNoticeEnabled((v) => !v),
    },
  ];

  const successful = orders.filter((order) => order.status === "สำเร็จ");
  const gross = successful.reduce((sum, order) => sum + order.base, 0);
  const charged = successful.reduce((sum, order) => sum + order.charged, 0);
  const fee = successful.reduce(
    (sum, order) => sum + Math.round(order.charged * 0.03 * 100) / 100,
    0,
  );
  const filteredOrders = useMemo(
    () =>
      orders.filter((row) =>
        `${row.ref} ${row.student} ${row.product} ${row.status}`
          .toLowerCase()
          .includes(orderQuery.toLowerCase()),
      ),
    [orders, orderQuery],
  );
  const filteredStudents = useMemo(
    () =>
      students.filter((row) =>
        `${row.id} ${row.name} ${row.email} ${row.school}`
          .toLowerCase()
          .includes(studentQuery.toLowerCase()),
      ),
    [students, studentQuery],
  );

  function hasActiveAttempt(productName: string) {
    return attempts.some((attempt) =>
      attempt.status === "กำลังสอบ" && productsOverlap(attempt.product, productName),
    );
  }

  function deleteStudent(student: DemoStudent) {
    if (student.status === "ลบข้อมูลแล้ว") return;
    if (!window.confirm(`ลบข้อมูลส่วนตัวของ ${student.name} ไหม? ประวัติซื้อและสอบจะเก็บไว้แบบไม่ระบุตัวตน`)) return;
    const deletedName = "ผู้ใช้งานที่ถูกลบไปแล้ว";
    setStudents((current) => current.map((row) => row.id === student.id ? {
      ...row, name: deletedName, username: deletedName, email: "—", grade: "—", school: "—", status: "ลบข้อมูลแล้ว",
    } : row));
    setOrders((current) => current.map((row) => row.student === student.name || (!!student.username && row.username?.toLowerCase() === student.username.toLowerCase()) ? { ...row, student: deletedName, username: deletedName } : row));
    setAttempts((current) => current.map((row) => row.student === student.name || (!!student.username && row.username?.toLowerCase() === student.username.toLowerCase()) ? { ...row, student: deletedName, username: deletedName } : row));
    setTickets((current) => current.map((row) => row.student === student.name || (!!student.username && row.username?.toLowerCase() === student.username.toLowerCase()) ? { ...row, student: deletedName, username: deletedName } : row));
    const existingPurchases = readDemoPurchases();
    const associatedEmails = new Set([student.email.toLowerCase(), ...existingPurchases.filter((purchase) => purchase.profileSnapshot.email === student.email || (!!student.username && purchase.profileSnapshot.username.toLowerCase() === student.username.toLowerCase())).map((purchase) => purchase.profileSnapshot.email.toLowerCase())]);
    const purchases = existingPurchases.map((purchase) => purchase.profileSnapshot.email === student.email || (!!student.username && purchase.profileSnapshot.username.toLowerCase() === student.username.toLowerCase())
      ? { ...purchase, profileSnapshot: { ...purchase.profileSnapshot, username: "ผู้ใช้งานที่ถูกลบไปแล้ว", citizenId: "", firstName: deletedName, lastName: "", phone: "", email: "", province: "", school: "", education: "" } }
      : purchase);
    safeWrite(DEMO_PURCHASES_KEY, purchases);
    window.dispatchEvent(new Event("webb-demo-purchases-updated"));
    try {
      const rankingResults = JSON.parse(localStorage.getItem("webb-demo-ranking-results") || "[]") as { username: string; email: string; student: string; grade: string; province: string }[];
      localStorage.setItem("webb-demo-ranking-results", JSON.stringify(rankingResults.map((row) => row.email === student.email || (!!student.username && row.username.toLowerCase() === student.username.toLowerCase()) ? { ...row, username: "ผู้ใช้งานที่ถูกลบไปแล้ว", email: "", student: deletedName, grade: "", province: "" } : row)));
      window.dispatchEvent(new Event("webb-demo-ranking-updated"));
      const account = JSON.parse(localStorage.getItem("webb-demo-account") || "null") as { email?: string; username?: string } | null;
      if (account?.email === student.email || (!!student.username && account?.username?.toLowerCase() === student.username.toLowerCase())) {
        ["webb-demo-account", "webb-demo-profile", "webb-demo-student-auth", "webb-registration"].forEach((key) => localStorage.removeItem(key));
        window.dispatchEvent(new Event("webb-demo-auth-updated"));
      }
      const emails = JSON.parse(localStorage.getItem("webb-demo-emails") || "[]") as { to: string }[];
      localStorage.setItem("webb-demo-emails", JSON.stringify(emails.map((email) => associatedEmails.has(email.to.toLowerCase()) ? { ...email, to: "ผู้ใช้งานที่ถูกลบไปแล้ว" } : email)));
    } catch { /* Keep the demo audit history even if stored data is malformed. */ }
    logAction("ลบข้อมูลส่วนตัวผู้เรียนและเก็บประวัติแบบไม่ระบุตัวตน", student.id);
  }

  function logAction(action: string, target: string) {
    const time = new Date().toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    });
    setLogs((current) => [
      { time, actor: "ผู้ดูแลระบบ Demo", action, target },
      ...current,
    ]);
    setMessage(`${action} · ${target} (Demo)`);
  }
  function createProduct() {
    const name = window.prompt("ชื่อชุดข้อสอบใหม่", "TGAT1 · ชุด B");
    if (!name) return;
    const product: DemoProduct = {
      id: `demo-${Date.now()}`,
      name,
      parts: "ระบุพาร์ทข้อสอบ",
      price: 100,
      payPrice: 110,
      status: "ปิดขาย",
      version: "Draft-1",
      trial: false,
    };
    setProducts((current) => [...current, product]);
    logAction("สร้างชุดข้อสอบ", name);
  }
  function addStudent() {
    const name = window.prompt("ชื่อผู้เรียน Demo", "ผู้เรียนใหม่ Demo");
    if (!name) return;
    const student: DemoStudent = {
      id: `ST-${String(Date.now()).slice(-4)}`,
      name,
      email: "new-student@example.test",
      grade: "ม.6",
      school: "โรงเรียนตัวอย่างวิทยา",
      joined: new Date().toISOString().slice(0, 10),
      status: "ใช้งาน",
      entitlements: 0,
    };
    setStudents((current) => [student, ...current]);
    logAction("เพิ่มบัญชีผู้เรียน", student.id);
  }
  function addAdmin() {
    const email = window.prompt("อีเมลผู้ดูแลใหม่", "staff@example.test");
    if (!email) return;
    const role =
      window.prompt("Role: Content / Support / Finance", "Support") ||
      "Support";
    const admin: DemoAdmin = {
      id: `ADM-${String(Date.now()).slice(-4)}`,
      name: email.split("@")[0],
      email,
      role,
      status: "ใช้งาน",
    };
    setAdmins((current) => [...current, admin]);
    logAction("เพิ่มผู้ดูแล", email);
  }

  const exportOrders = () =>
    downloadCsv(
      "web-b-demo-orders.csv",
      [
        "เลขคำสั่งซื้อ",
        "ผู้เรียน",
        "สินค้า",
        "ราคาขาย",
        "ยอดชำระ",
        "วิธีชำระ",
        "สถานะ",
      ],
      filteredOrders.map((r) => [
        r.ref,
        r.student,
        r.product,
        r.base,
        r.charged,
        r.method,
        r.status,
      ]),
    );
  const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

  return (
    <div className="space-y-7 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div>
          <b className="text-sm text-amber-950">{WEBB_DEMO_LABEL}</b>
          <p className="mt-0.5 text-xs text-amber-800">
            การแก้ไขถูกเก็บไว้ใน Browser นี้เท่านั้น · ไม่มีการเรียก Payment
            Provider หรือเขียนฐานข้อมูล
          </p>
        </div>
        <Link
          href="/webb"
          className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950"
        >
          เปิดหน้าบ้าน Web-B ↗
        </Link>
      </div>
      {message && (
        <div
          role="status"
          className="fixed right-5 top-20 z-40 flex max-w-md items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl"
        >
          {message}
          <button
            onClick={() => setMessage("")}
            className="ml-auto rounded px-2 py-1 text-slate-300 hover:bg-white/10"
          >
            ปิด
          </button>
        </div>
      )}

      <Section
        id="overview"
        title="ภาพรวมแพลตฟอร์มฝึกสอบ"
        detail="สรุปกิจกรรมของ Web-B · ข้อมูลตัวอย่างเพื่อสาธิต"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["สมาชิกทั้งหมด", students.length, "บัญชี Demo"],
            [
              "คำสั่งซื้อสำเร็จ",
              successful.length,
              `${orders.filter((o) => o.status === "รอชำระ").length} รายการรอชำระ`,
            ],
            ["ยอดขายก่อนค่าธรรมเนียม", money(gross), "เฉพาะรายการสำเร็จ"],
            [
              "ยอดรับสุทธิ Demo",
              money(charged - fee),
              "หักค่าธรรมเนียมสมมติ 3%",
            ],
          ].map(([label, value, hint]) => (
            <Panel key={String(label)} className="!p-5">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-3 text-2xl font-extrabold">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{hint}</p>
            </Panel>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <Panel>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold">กิจกรรมคำสั่งซื้อ</h3>
                <p className="mt-1 text-xs text-slate-500">
                  จำนวนรายการตามข้อมูลจำลอง
                </p>
              </div>
              <Badge tone="blue">5 รายการล่าสุด</Badge>
            </div>
            <div className="mt-6 flex h-40 items-end gap-3 border-b border-l border-slate-100 px-4">
              {[32, 55, 40, 73, 58, 91, 67, 82, 49, 75, 63, 100].map(
                (height, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-amber-300 hover:bg-indigo-500"
                    style={{ height: `${height}%` }}
                    title={`${height}%`}
                  />
                ),
              )}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-400">
              <span>1 ต.ค.</span>
              <span>10 ต.ค.</span>
              <span>20 ต.ค.</span>
              <span>31 ต.ค.</span>
            </div>
          </Panel>
          <Panel>
            <h3 className="font-bold">รายการที่ควรตรวจสอบ</h3>
            <div className="mt-4 space-y-3">
              {[
                [
                  "คำร้องขอสอบใหม่",
                  tickets.filter((t) => t.status === "รอตรวจสอบ").length,
                  "#entitlements",
                ],
                [
                  "ชำระเงินรอยืนยัน",
                  orders.filter((o) => o.status === "รอชำระ").length,
                  "#orders",
                ],
                [
                  "ผลสอบที่พักการเผยแพร่",
                  attempts.filter((a) => a.status === "ผิดปกติ").length,
                  "#results",
                ],
              ].map(([label, value, href]) => (
                <a
                  key={String(label)}
                  href={String(href)}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-sm hover:bg-amber-50"
                >
                  <span>{label}</span>
                  <b>{value}</b>
                </a>
              ))}
            </div>
          </Panel>
        </div>
        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">ชุดข้อสอบที่เปิดขาย</h3>
            <a
              href="#products"
              className="text-sm font-semibold text-indigo-700"
            >
              จัดการชุดสอบ →
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border border-slate-100 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <b className="text-sm">{product.name}</b>
                  <Badge tone={product.status === "เปิดขาย" ? "green" : "gray"}>
                    {product.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {formatBaht(product.price)} · {product.version}
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
        action={<Button onClick={addStudent}>＋ เพิ่มผู้เรียน Demo</Button>}
      >
        <Panel>
          <input
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
            placeholder="ค้นหาชื่อ อีเมล โรงเรียน หรือรหัสผู้เรียน"
            className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
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
                {filteredStudents.map((student) => (
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
                    <td className={td}>{student.joined}</td>
                    <td className={td}>{student.entitlements} ชุด</td>
                    <td className={td}>
                      <Badge
                        tone={student.status === "ใช้งาน" ? "green" : "red"}
                      >
                        {student.status}
                      </Badge>
                    </td>
                    <td className={td}>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            logAction("เปิดดูโปรไฟล์ผู้เรียน", student.id)
                          }
                        >
                          ดูข้อมูล
                        </Button>
                        <Button
                          disabled={student.status === "ลบข้อมูลแล้ว"}
                          variant={student.status === "ใช้งาน" ? "danger" : "outline"}
                          onClick={() => {
                            const status: DemoStudent["status"] =
                              student.status === "ใช้งาน" ? "ระงับ" : "ใช้งาน";
                            setStudents((current) =>
                              current.map((s) =>
                                s.id === student.id ? { ...s, status } : s,
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
                          {student.status === "ใช้งาน" ? "ระงับ" : student.status === "ระงับ" ? "เปิดใช้" : "ลบแล้ว"}
                        </Button>
                        <Button variant="danger" disabled={student.status === "ลบข้อมูลแล้ว"} onClick={() => deleteStudent(student)}>ลบข้อมูล</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </Section>

      <Section
        id="products"
        title="วิชาและชุดข้อสอบ"
        detail="จัดการสินค้า เวอร์ชัน ราคาเปิดขาย และชุดทดลอง"
        action={<Button onClick={createProduct}>＋ เพิ่มชุดข้อสอบ</Button>}
      >
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr>
                  {[
                    "สินค้า / พาร์ท",
                    "เวอร์ชัน",
                    "ราคาขาย",
                  "ยอดเรียกเก็บ Demo",
                  "ชุดทดลอง",
                    "มีสินค้า",
                    "การทำงาน",
                  ].map((h) => (
                    <th className={th} key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className={td}>
                      <b>{product.name}</b>
                      <small className="mt-1 block text-xs text-slate-400">
                        {product.parts}
                      </small>
                    </td>
                    <td className={td}>{product.version}</td>
                    <td className={td}>{formatBaht(product.price)}</td>
                    <td className={td}>{formatBaht(product.payPrice)}</td>
                    <td className={td}>
                      <Badge tone={product.trial ? "blue" : "gray"}>
                        {product.trial ? "เปิด" : "ปิด"}
                      </Badge>
                    </td>
                    <td className={td}>
                      <button type="button" role="switch" aria-checked={product.status === "เปิดขาย"} aria-label={`สถานะสินค้า ${product.name}`} onClick={() => {
                        setProducts((current) => current.map((p) => p.id === product.id ? { ...p, status: (p.status === "เปิดขาย" ? "ปิดขาย" : "เปิดขาย") as DemoProduct["status"] } : p));
                        logAction("เปลี่ยนสถานะสินค้า", `${product.name} · ${product.status === "เปิดขาย" ? "ไม่มีสินค้า" : "มีสินค้า"}`);
                      }} className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-2.5 text-xs font-bold ${product.status === "เปิดขาย" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
                        <span className={`relative h-4 w-7 rounded-full ${product.status === "เปิดขาย" ? "bg-emerald-500" : "bg-slate-400"}`}><i className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${product.status === "เปิดขาย" ? "left-3.5" : "left-0.5"}`} /></span>
                        {product.status === "เปิดขาย" ? "มีสินค้า" : "ไม่มีสินค้า"}
                      </button>
                    </td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const price = Number(
                              window.prompt(
                                "ตั้งราคาขาย Demo",
                                String(product.price),
                              ),
                            );
                            if (!Number.isFinite(price) || price < 0) return;
                            setProducts((current) =>
                              current.map((p) =>
                                p.id === product.id
                                  ? {
                                      ...p,
                                      price,
                                      payPrice: Math.round(price * 1.1),
                                    }
                                  : p,
                              ),
                            );
                            logAction("แก้ราคาชุดสอบ", product.name);
                          }}
                        >
                          แก้ราคา
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setProducts((current) =>
                              current.map((p) =>
                                p.id === product.id
                                  ? { ...p, trial: !p.trial }
                                  : p,
                              ),
                            );
                            logAction("เปลี่ยนชุดทดลอง", product.name);
                          }}
                        >
                          ชุดทดลอง
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            ราคา PaySoon/ยอดที่ส่งให้ผู้ให้บริการเป็นข้อมูลจำลอง
            ตัวอย่างจริงต้องเก็บราคาขายและยอดเรียกเก็บเป็น Snapshot แยกกันใน
            Order
          </p>
        </Panel>
      </Section>

      <Section
        id="content"
        title="คลังข้อสอบและเฉลย"
        detail="อัปโหลดไฟล์ข้อสอบ จัดการเวอร์ชัน คำตอบ และตรวจชุดก่อนเผยแพร่"
        action={
          <Button
            onClick={() => logAction("สร้างชุดเนื้อหา Draft", "TGAT Demo")}
          >
            ＋ สร้างชุดเนื้อหา
          </Button>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold">เวอร์ชันชุดข้อสอบ</h3>
                <p className="mt-1 text-xs text-slate-500">
                  ชุดที่มีผู้สอบแล้วควรสร้างเวอร์ชันใหม่แทนการแก้ไฟล์เดิม
                </p>
              </div>
              <Badge tone="amber">ตรวจสอบก่อนเผยแพร่</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {products.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                >
                  <div>
                    <b className="text-sm">
                      {product.name} · {product.version}
                    </b>
                    <p className="mt-1 text-xs text-slate-500">
                      {product.parts} · 60 ข้อ · 180 นาที
                    </p>
                    {hasActiveAttempt(product.name) && <p className="mt-1 text-xs font-bold text-rose-700">มีผู้เข้าสอบอยู่ · ล็อกการแก้ไขข้อมูล</p>}
                  </div>
                  <div className="flex gap-2">
                    <Badge tone="blue">Draft</Badge>
                    <Button variant="outline" disabled={hasActiveAttempt(product.name)} onClick={() => logAction("เปิดแก้ไขข้อมูลข้อสอบ", product.version)}>
                      {hasActiveAttempt(product.name) ? "ล็อกแก้ไข" : "แก้ไขข้อมูลสอบ"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        logAction("ตรวจตัวอย่างข้อสอบ", product.version)
                      }
                    >
                      ดู Preview
                    </Button>
                    <Button disabled={hasActiveAttempt(product.name)}
                      onClick={() =>
                        logAction("ส่งตรวจชุดข้อสอบ", product.version)
                      }
                    >
                      ส่งตรวจ
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <label className="mt-4 grid gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm">
              <b>อัปโหลด PDF ข้อสอบ</b>
              <span className="text-xs text-slate-500">
                Demo เท่านั้น · เลือกไฟล์เพื่อแสดงชื่อใน Browser ไม่ส่งขึ้น
                Storage
              </span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  setMessage(
                    `เลือกไฟล์ ${e.target.files[0].name} แล้ว (Demo ยังไม่อัปโหลดจริง)`,
                  )
                }
                className="mx-auto max-w-full text-xs"
              />
            </label>
          </Panel>
          <Panel>
            <h3 className="font-bold">ตัวอย่างจัดการเฉลยรายข้อ</h3>
            <p className="mt-1 text-xs text-slate-500">
              TGAT1 · ชุด A · เฉลยจะเปิดให้ตามสิทธิ์หลังส่งข้อสอบ
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    {["ข้อ", "คำตอบ", "คะแนน", "ตรวจแล้ว"].map((x) => (
                      <th className={th} key={x}>
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {answerKey.map((answer, i) => (
                    <tr key={i}>
                      <td className={td}>{i + 1}</td>
                      <td className={td}>
                        <select
                          value={answer}
                          disabled={hasActiveAttempt("TGAT1") || hasActiveAttempt("Full TGAT")}
                          onChange={(e) =>
                            setAnswerKey((current) =>
                              current.map((value, index) =>
                                index === i ? e.target.value : value,
                              ),
                            )
                          }
                          className="rounded-lg border px-2 py-1"
                        >
                          <option>A</option>
                          <option>B</option>
                          <option>C</option>
                          <option>D</option>
                        </select>
                      </td>
                      <td className={td}>1</td>
                      <td className={td}>
                        <input
                          type="checkbox"
                          defaultChecked
                          aria-label={`ตรวจคำตอบข้อ ${i + 1}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button disabled={hasActiveAttempt("TGAT1") || hasActiveAttempt("Full TGAT")} onClick={() => logAction("บันทึกเฉลย Demo", "TGAT1 ชุด A")}>
              บันทึกเฉลย
            </Button>
          </Panel>
        </div>
      </Section>

      <Section
        id="orders"
        title="คำสั่งซื้อ"
        detail="ค้นหาและตรวจสอบสถานะคำสั่งซื้อ ตัวเลขและการเปลี่ยนสถานะเป็น Demo"
        action={
          <Button variant="outline" onClick={exportOrders}>
            ดาวน์โหลด CSV
          </Button>
        }
      >
        <Panel>
          <input
            value={orderQuery}
            onChange={(e) => setOrderQuery(e.target.value)}
            placeholder="ค้นหาผู้เรียน เลขคำสั่งซื้อ หรือชุดสอบ"
            className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead>
                <tr>
                  {[
                    "เลขที่ / วันที่",
                    "ผู้เรียน / สินค้า",
                    "ราคาขาย",
                    "ยอดชำระ",
                    "ช่องทาง",
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
                {filteredOrders.map((order) => (
                  <tr key={order.ref}>
                    <td className={td}>
                      <b className="font-mono text-xs">{order.ref}</b>
                      <small className="mt-1 block text-xs text-slate-400">
                        {order.day}
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
                    <td className={td}>{order.method}</td>
                    <td className={td}>
                      <Badge
                        tone={
                          order.status === "สำเร็จ"
                            ? "green"
                            : order.status === "รอชำระ"
                              ? "amber"
                              : order.status === "คืนเงินแล้ว"
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
                          onClick={() =>
                            logAction(
                              "ดูรายละเอียด Order / Payment Reference",
                              order.ref,
                            )
                          }
                        >
                          รายละเอียด
                        </Button>
                        {order.status === "รอชำระ" && (
                          <Button
                            onClick={() => {
                              setOrders((current) =>
                                current.map((o) =>
                                  o.ref === order.ref
                                    ? { ...o, status: "สำเร็จ" as const }
                                    : o,
                                ),
                              );
                              setStudents((current) =>
                                current.map((s) =>
                                  s.name === order.student
                                    ? { ...s, entitlements: s.entitlements + 1 }
                                    : s,
                                ),
                              );
                              logAction(
                                "ยืนยันชำระเงินและเปิดสิทธิ์ Demo",
                                order.ref,
                              );
                            }}
                          >
                            ยืนยัน Demo
                          </Button>
                        )}
                        {order.status === "สำเร็จ" && (
                          <Button
                            variant="danger"
                            onClick={() => {
                              if (!window.confirm(`จำลองคืนเงิน ${order.ref}?`))
                                return;
                              setOrders((current) =>
                                current.map((o) =>
                                  o.ref === order.ref
                                    ? { ...o, status: "คืนเงินแล้ว" as const }
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
                                "จำลองคืนเงินและถอนสิทธิ์ Demo",
                                order.ref,
                              );
                            }}
                          >
                            คืนเงิน Demo
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </Section>

      <Section
        id="payments"
        title="การชำระเงินและ Webhook"
        detail="ดู Payment Reference, สถานะ Provider และจำลองการตรวจซ้ำแบบ idempotent"
      >
        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <b>ผู้ให้บริการที่เลือก</b>
              <p className="mt-1 text-sm text-slate-500">{paymentProvider}</p>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                logAction("ตรวจสถานะการเชื่อมต่อ", paymentProvider)
              }
            >
              ตรวจการเชื่อมต่อ
            </Button>
          </div>
          <div className="overflow-x-auto">
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
                {webhookEvents.map((event) => (
                  <tr key={event.id}>
                    <td className={`${td} font-mono text-xs`}>{event.id}</td>
                    <td className={td}>{event.order}</td>
                    <td className={td}>{event.type}</td>
                    <td className={td}>{event.received}</td>
                    <td className={td}>
                      <Badge
                        tone={
                          event.status === "ประมวลผลแล้ว" ? "green" : "amber"
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
                                    status: "ตรวจซ้ำแล้ว · ไม่สร้างสิทธิ์ซ้ำ",
                                  }
                                : e,
                            ),
                          );
                          logAction("จำลองตรวจ Webhook ซ้ำ", event.id);
                        }}
                      >
                        ตรวจซ้ำ Demo
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        title="สิทธิ์สอบและคำร้องสอบใหม่"
        detail="ตรวจสิทธิ์ที่ซื้อ ประวัติการสอบ และจำลอง Manual Approval พร้อมบันทึก Audit Log"
      >
        <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
          <Panel>
            <h3 className="font-bold">สิทธิ์สอบล่าสุด</h3>
            <div className="mt-4 space-y-3">
              {students.slice(0, 4).map((student) => (
                <div
                  key={student.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                >
                  <div>
                    <b className="text-sm">{student.name}</b>
                    <p className="mt-1 text-xs text-slate-500">
                      {student.entitlements} สิทธิ์ · TGAT Demo
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStudents((current) =>
                          current.map((s) =>
                            s.id === student.id
                              ? { ...s, entitlements: s.entitlements + 1 }
                              : s,
                          ),
                        );
                        logAction("เพิ่มสิทธิ์สอบ Manual", student.id);
                      }}
                    >
                      ＋ เพิ่มสิทธิ์
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (student.entitlements < 1) return;
                        setStudents((current) =>
                          current.map((s) =>
                            s.id === student.id
                              ? {
                                  ...s,
                                  entitlements: Math.max(0, s.entitlements - 1),
                                }
                              : s,
                          ),
                        );
                        logAction("ถอนสิทธิ์สอบ Manual", student.id);
                      }}
                    >
                      − ถอนสิทธิ์
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <h3 className="font-bold">คำร้องขอสอบใหม่</h3>
            <div className="mt-4 space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-xl border border-slate-100 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <b>
                        {ticket.id} · {ticket.student}
                      </b>
                      <p className="mt-1 text-sm">{ticket.reason}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {ticket.product} · {ticket.date}
                      </p>
                    </div>
                    <Badge
                      tone={
                        ticket.status === "รอตรวจสอบ"
                          ? "amber"
                          : ticket.status === "อนุมัติ"
                            ? "green"
                            : "red"
                      }
                    >
                      {ticket.status}
                    </Badge>
                  </div>
                  {ticket.status === "รอตรวจสอบ" && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={() => {
                          setTickets((current) =>
                            current.map((t) =>
                              t.id === ticket.id
                                ? { ...t, status: "อนุมัติ" as const }
                                : t,
                            ),
                          );
                          setAttempts((current) => [
                            ...current,
                            {
                              id: `ATT-${String(Date.now()).slice(-3)}`,
                              student: ticket.student,
                              product: `${ticket.product} · รอบที่อนุมัติใหม่`,
                              started: "รอเริ่มสอบ",
                              status: "กำลังสอบ",
                              score: "—",
                            },
                          ]);
                          logAction("อนุมัติคำร้องสอบใหม่", ticket.id);
                        }}
                      >
                        อนุมัติสอบใหม่
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          setTickets((current) =>
                            current.map((t) =>
                              t.id === ticket.id
                                ? { ...t, status: "ไม่อนุมัติ" as const }
                                : t,
                            ),
                          );
                          logAction("ไม่อนุมัติคำร้อง", ticket.id);
                        }}
                      >
                        ไม่อนุมัติ
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </Section>

      <Section
        id="attempts"
        title="ประวัติการเข้าสอบ"
        detail="ดูสถานะ เวลา คะแนน และเหตุผิดปกติของการสอบจำลอง"
      >
        <Panel>
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
                {attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td className={`${td} font-mono text-xs`}>{attempt.id}</td>
                    <td className={td}>{attempt.student}</td>
                    <td className={td}>{attempt.product}</td>
                    <td className={td}>{attempt.started}</td>
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
                          onClick={() =>
                            logAction("ดู Log การทำข้อสอบ", attempt.id)
                          }
                        >
                          ดู Log
                        </Button>
                        {attempt.status === "ผิดปกติ" && (
                          <Button
                            onClick={() => {
                              setAttempts((current) =>
                                current.map((a) =>
                                  a.id === attempt.id
                                    ? { ...a, status: "ยกเลิก" as const }
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
              </tbody>
            </table>
          </div>
        </Panel>
      </Section>

      <Section
        id="results"
        title="ผลสอบและ Ranking"
        detail="ตรวจผลรายพาร์ท คำนวณคะแนนซ้ำ และกำหนดการเผยแพร่ Ranking"
      >
        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <b>รอบผลสอบ TGAT Demo · ชุด A</b>
              <p className="mt-1 text-xs text-slate-500">
                จัดอันดับภายในชุดและเวอร์ชันเดียวกัน · แสดงชื่อแบบปกปิด
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAttempts((current) =>
                    current.map((a) =>
                      a.status === "ส่งแล้ว"
                        ? { ...a, score: "คำนวณใหม่ · 2026-10-05" }
                        : a,
                    ),
                  );
                  logAction("สั่งคำนวณคะแนนใหม่", "TGAT Demo · ชุด A");
                }}
              >
                คำนวณใหม่ Demo
              </Button>
              <Button
                onClick={() => {
                  setPublishedResults((current) => !current);
                  logAction(
                    publishedResults ? "พักการเผยแพร่ผลสอบ" : "เผยแพร่ผลสอบ",
                    "TGAT Demo · ชุด A",
                  );
                }}
              >
                {publishedResults ? "พักผลสอบ" : "เผยแพร่ผลสอบ"}
              </Button>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl bg-slate-50 p-4">
            <div className="grid gap-1 text-xs font-semibold text-slate-500">เกณฑ์เปิดตัวกรอง Ranking<strong className="text-base text-slate-800">มากกว่า {minimumRank} คน</strong></div>
            <Badge tone={publishedResults ? "green" : "amber"}>
              {publishedResults ? "เผยแพร่แล้ว" : "พักการเผยแพร่"}
            </Badge>
            <span className="text-xs text-slate-500">
              ขั้นต่ำปัจจุบัน {minimumRank} คน
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  {[
                    "อันดับ Demo",
                    "ผู้เข้าสอบ",
                    "TGAT1",
                    "TGAT2",
                    "TGAT3",
                    "รวม",
                    "สถานะ",
                  ].map((x) => (
                    <th className={th} key={x}>
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  [1, "ศิรศักดิ์ ผ.", 68, 56, 54, 178],
                  [2, "กมลชนก ต.", 62, 51, 49, 162],
                  [3, "ธนกร ส.", 59, 48, 46, 153],
                ].map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => (
                      <td className={td} key={i}>
                        {cell}
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
          <p className="mt-4 text-xs text-slate-500">
            แนวทาง Demo ใช้ผลสอบครั้งแรกที่ส่งสำเร็จ
            หากรอบเดิมถูกยกเลิกจากปัญหาระบบจึงใช้รอบสอบใหม่ที่อนุมัติ
          </p>
        </Panel>
      </Section>

      <Section
        id="solutions"
        title="เฉลยและสื่อประกอบ"
        detail="จัดการ PDF / วิดีโอ และกำหนดสิทธิ์เข้าถึงตามชุดข้อสอบ"
      >
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr>
                  {[
                    "เนื้อหา",
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
                {solutions.map((solution) => (
                  <tr key={solution.id}>
                    <td className={td}>
                      <b>{solution.name}</b>
                      <small className="mt-1 block text-xs text-slate-400">
                        {solution.id}
                      </small>
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
                            solution.active ? "พักสื่อเฉลย" : "เผยแพร่สื่อเฉลย",
                            solution.id,
                          );
                        }}
                      >
                        {solution.active ? "พักเผยแพร่" : "เผยแพร่"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label className="mt-4 grid gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm">
            <b>เพิ่ม PDF / วิดีโอ Demo</b>
            <span className="text-xs text-slate-500">
              ไฟล์ที่เลือกจะไม่ถูกอัปโหลดไป Server
            </span>
            <input
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
                    product: "TGAT Demo · ชุด A",
                    kind: file.type.includes("video") ? "Video" : "PDF",
                    access: "หลังส่งข้อสอบ",
                    active: false,
                  },
                ]);
                logAction("เพิ่มไฟล์สื่อ Demo", file.name);
              }}
              className="mx-auto max-w-full text-xs"
            />
          </label>
        </Panel>
      </Section>

      <Section
        id="finance"
        title="รายงานการเงิน"
        detail="คำนวณจากข้อมูล Order Demo · อัตราค่าธรรมเนียม 3% ใช้สาธิตเท่านั้น"
        action={
          <Button variant="outline" onClick={exportOrders}>
            ดาวน์โหลด CSV
          </Button>
        }
      >
        <Panel>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["ราคาสินค้ารวม", money(gross)],
              ["ยอดเรียกเก็บ", money(charged)],
              ["ส่วนเพิ่มจากผู้เรียน", money(charged - gross)],
              ["ค่าธรรมเนียมจำลอง", money(fee)],
              ["ยอดรับสุทธิ Demo", money(charged - fee)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-4">
                <span className="text-xs text-slate-500">{label}</span>
                <b className="mt-2 block text-lg">{value}</b>
              </div>
            ))}
          </div>
          <div className="mt-5 flex h-40 items-end gap-3 border-b border-l border-slate-100 px-4">
            {[38, 58, 44, 83, 67, 96, 61, 75, 51, 88, 70, 100].map(
              (height, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-emerald-300"
                  style={{ height: `${height}%` }}
                />
              ),
            )}
          </div>
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            ยอดสุทธินี้หักเฉพาะค่าธรรมเนียมตัวอย่าง 3% ยังไม่ใช่ยอดรับจาก
            Provider จริง และยังไม่หักต้นทุนอื่น
          </p>
        </Panel>
      </Section>

      <Section
        id="admins"
        title="ผู้ดูแลและสิทธิ์การใช้งาน"
        detail="ตัวอย่าง Role ตั้งต้น: Super Admin, Content, Support และ Finance พร้อมสิทธิ์รายเมนู"
        action={<Button onClick={addAdmin}>＋ เพิ่มผู้ดูแล Demo</Button>}
      >
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Panel>
            <h3 className="font-bold">บัญชีผู้ดูแล</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr>
                    {["ผู้ดูแล", "Role", "สถานะ", "จัดการ"].map((x) => (
                      <th className={th} key={x}>
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                      <td className={td}>
                        <b>{admin.name}</b>
                        <small className="mt-1 block text-xs text-slate-400">
                          {admin.email}
                        </small>
                      </td>
                      <td className={td}>{admin.role}</td>
                      <td className={td}>
                        <Badge
                          tone={admin.status === "ใช้งาน" ? "green" : "gray"}
                        >
                          {admin.status}
                        </Badge>
                      </td>
                      <td className={td}>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAdmins((current) =>
                              current.map((a) =>
                                a.id === admin.id
                                  ? {
                                      ...a,
                                      status: (a.status === "ใช้งาน"
                                        ? "ปิดใช้งาน"
                                        : "ใช้งาน") as DemoAdmin["status"],
                                    }
                                  : a,
                              ),
                            );
                            logAction("เปลี่ยนสถานะผู้ดูแล", admin.id);
                          }}
                        >
                          เปลี่ยนสถานะ
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel>
            <h3 className="font-bold">สิทธิ์เริ่มต้นตาม Role</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[570px] text-left">
                <thead>
                  <tr>
                    {["เมนู", "ดู", "เพิ่ม", "แก้ไข", "อนุมัติ"].map((x) => (
                      <th className={th} key={x}>
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Dashboard", 1, 0, 0, 0],
                    ["ข้อสอบ / เฉลย", 1, 1, 1, 0],
                    ["สมาชิก / สิทธิ์สอบ", 1, 0, 1, 1],
                    ["Payment / คืนเงิน", 1, 0, 0, 1],
                    ["ผลสอบ / Ranking", 1, 0, 1, 1],
                  ].map((row) => (
                    <tr key={String(row[0])}>
                      <td className={td}>
                        <b>{row[0]}</b>
                      </td>
                      {row.slice(1).map((allowed, index) => (
                        <td key={index} className={td}>
                          <input
                            type="checkbox"
                            defaultChecked={Boolean(allowed)}
                            aria-label={`${row[0]} permission ${index}`}
                            onChange={() =>
                              logAction(
                                "แก้ไข Permission Matrix Demo",
                                `${row[0]} · ${index + 1}`,
                              )
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              ระบบจริงควรตรวจสิทธิ์ฝั่ง Server ทุก API และบันทึก Audit Log
              สำหรับการอนุมัติหรือเปลี่ยนข้อมูลสำคัญ
            </p>
          </Panel>
        </div>
      </Section>

      <Section
        id="audit"
        title="Audit Log และเหตุการณ์ระบบ"
        detail="ตัวอย่างประวัติการเปลี่ยน Payment, สิทธิ์สอบ, ผลสอบ และการตั้งค่าของ Admin"
      >
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr>
                  {["วันเวลา", "ผู้ดำเนินการ", "การกระทำ", "รายการอ้างอิง"].map(
                    (x) => (
                      <th className={th} key={x}>
                        {x}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={`${log.time}-${i}`}>
                    <td className={td}>{log.time}</td>
                    <td className={td}>{log.actor}</td>
                    <td className={td}>{log.action}</td>
                    <td className={`${td} font-mono text-xs`}>{log.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </Section>

      <Section
        id="settings"
        title="ตั้งค่าระบบและการเชื่อมต่อ"
        detail="ค่าจำลองสำหรับสาธิต · ไม่มีการเรียกใช้บริการภายนอกจริง"
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel>
            <h3 className="font-bold">การขายและผู้ให้บริการชำระเงิน</h3>
            <label className="mt-4 grid gap-1 text-sm font-semibold">
              ผู้ให้บริการ
              <select
                value={paymentProvider}
                onChange={(e) => setPaymentProvider(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
              >
                <option>Demo Payment · ไม่เชื่อมต่อจริง</option>
                <option>Stripe · ยังไม่เชื่อมต่อจริง</option>
                <option>PaySoon · ยังไม่เชื่อมต่อจริง</option>
              </select>
            </label>
            <label className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
              <span>
                <b>เปิดขายชุดสอบ</b>
                <small className="mt-1 block text-xs text-slate-500">
                  ควบคุมการแสดงสินค้าในหน้า Web-B
                </small>
              </span>
              <input
                type="checkbox"
                checked={openSales}
                onChange={() => {
                  setOpenSales((current) => !current);
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
                บันทึก Demo
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  logAction("ทดสอบ Callback URL", "/api/payment/webhook (Demo)")
                }
              >
                ทดสอบ Webhook
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              เลือก Provider จริงและตรวจการรองรับ PromptPay / บัตรก่อนเปิด
              Production
            </p>
          </Panel>
          <Panel>
            <h3 className="font-bold">นโยบาย ความยินยอม และการแจ้งเตือน</h3>
            {settingToggles.map(({ label, enabled, toggle }) => (
              <label
                key={label}
                className="mt-3 flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3 text-sm"
              >
                <span>{label}</span>
                <input type="checkbox" checked={enabled} onChange={toggle} />
              </label>
            ))}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                onClick={() => logAction("บันทึกนโยบายและ Consent", "Web-B")}
              >
                บันทึก Demo
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  logAction(
                    "เปิดการตั้งค่า Cookie Consent",
                    "Necessary / Analytics / Marketing",
                  )
                }
              >
                จัดการ Cookie Policy
              </Button>
            </div>
          </Panel>
        </div>
        <Panel>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="font-bold">ตั้งค่า Social และช่องทางช่วยเหลือ</h3><p className="mt-1 text-xs text-slate-500">บันทึกที่จุดเดียว แล้วแสดงทั้งปุ่ม Social ลอยหน้าแรกและหน้าต่างช่วยเหลือทั่ว WEB-B</p></div>
            <Button onClick={() => { writeSocialSettings(socialSettings); logAction("บันทึกช่องทาง Social กลาง", "WEB-B"); }}>บันทึกช่องทาง</Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {([
              ["lineId", "LINE ID", "@บัญชี LINE"],
              ["lineUrl", "ลิงก์ LINE", "https://line.me/..."],
              ["facebookUrl", "Facebook", "https://facebook.com/..."],
              ["instagramUrl", "Instagram", "https://instagram.com/..."],
              ["tiktokUrl", "TikTok", "https://tiktok.com/@..."],
              ["youtubeUrl", "YouTube", "https://youtube.com/@..."],
              ["supportEmail", "อีเมลช่วยเหลือ", "support@example.com"],
            ] as [keyof SocialSettings, string, string][]).map(([key, label, placeholder]) => <label className="grid gap-1 text-xs font-semibold text-slate-600" key={key}>{label}<input value={socialSettings[key]} onChange={(event) => setSocialSettings((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-amber-400" /></label>)}
          </div>
        </Panel>
      </Section>

      <Panel className="flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div>
          <b>ล้างข้อมูล Demo ที่บันทึกไว้ใน Browser นี้</b>
          <p className="mt-1 text-xs text-slate-500">
            รีเซ็ตเฉพาะข้อมูล Web-B Admin Demo ของ Browser ปัจจุบัน
          </p>
        </div>
        <Button
          variant="danger"
          onClick={() => {
            if (
              !window.confirm(
                "รีเซ็ตข้อมูล Web-B Admin Demo ทั้งหมดใน Browser นี้?",
              )
            )
              return;
            [
              "orders",
              "students",
              "products",
              "tickets",
              "attempts",
              "admins",
              "logs",
              "webhooks",
              "solutions",
              "answer-key",
            ].forEach((key) =>
              localStorage.removeItem(`webb-admin-demo:${key}`),
            );
            window.location.reload();
          }}
        >
          รีเซ็ตข้อมูล Demo
        </Button>
      </Panel>
    </div>
  );
}
