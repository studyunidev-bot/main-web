"use client";

import Link from "next/link";
import { useContext, useEffect, useMemo, useState } from "react";
import { WEBB_PRODUCTS, formatThaiDateTime, formatThaiDateTimeValue } from "./data";
import {
  productsOverlap,
  safeRead,
  safeWrite,
  type DemoPurchase,
} from "./demo-store";
import { WebBAdminRoleContext } from "./WebBAdminAccess";
import { toast } from "react-toastify";
import AdminSelect from "@/components/ui/AdminSelect";
import { LuPlus, LuCheck, LuX, LuMessageSquare, LuImage, LuUpload, LuTrash2 } from "react-icons/lu";
import WebBModalPortal from "./WebBModalPortal";
import WebBAdminInput from "./WebBAdminInput";
import WebBAdminTable, {
  adminTableCellClass as td,
  adminTableHeadClass as th,
} from "./WebBAdminTable";
import { adminMockKey, readAdminMockPurchases, writeAdminMockPurchases, WEBB_ADMIN_MOCK_UPDATED } from "./webb-admin-mock-store";

type Ticket = {
  id: string;
  student: string;
  product: string;
  productId?: string;
  purchaseRef?: string;
  username?: string;
  examSet?: string;
  reason: string;
  date: string;
  status: "รอตรวจ" | "อนุมัติ" | "ไม่อนุมัติ";
  evidenceImage?: string;
};
const initialTickets: Ticket[] = [{ id: "TKT-2570-0001", student: "วริศรา รุ่งเรือง", product: "Full TGAT · ชุด A", productId: "tgat-full", purchaseRef: "DO-2570-0007", username: "varisara", examSet: "A", reason: "อินเทอร์เน็ตขัดข้องระหว่างทำ TGAT3 ระบบส่งคำตอบไม่ครบ ขอเปิดสอบใหม่ตามสิทธิ์รายการซื้อ", date: "2026-10-06 11:42", status: "รอตรวจ" }];
export function readExamRequests(): Ticket[] {
  return safeRead<Ticket[]>(adminMockKey("tickets"), initialTickets);
}

export default function WebBExamApprovals({
  compact = false,
  productId,
  productName,
  examSet,
  canManage,
}: {
  compact?: boolean;
  productId?: string;
  productName?: string;
  examSet?: string;
  canManage?: boolean;
}) {
  const role = useContext(WebBAdminRoleContext);
  const [roleCanView, setRoleCanView] = useState(role === "Super Admin");
  const [roleCanManage, setRoleCanManage] = useState(role === "Super Admin");
  const canView = role === "Super Admin" || roleCanView;
  const canEdit = canManage ?? roleCanManage;
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [isCreateCaseOpen, setIsCreateCaseOpen] = useState(false);
  const [selectedPurchaseRef, setSelectedPurchaseRef] = useState("");
  const [caseReason, setCaseReason] = useState("");
  const [caseImage, setCaseImage] = useState("");
  const [initialDecision, setInitialDecision] = useState<"approve" | "pending">("approve");

  useEffect(() => {
    const refreshPermission = () => {
      if (role === "Super Admin") {
        setRoleCanView(true);
        setRoleCanManage(true);
        return;
      }
      try {
        const saved = localStorage.getItem(adminMockKey("role-permissions"));
        const permissions = saved
          ? JSON.parse(saved) as Record<string, { students?: { view?: boolean; approve?: boolean } }>
          : null;
        const studentPermissions = permissions?.[role]?.students;
        setRoleCanView(studentPermissions?.view ?? role === "Support");
        const approvalPermission = studentPermissions?.approve;
        setRoleCanManage(approvalPermission ?? role === "Support");
      } catch {
        setRoleCanView(false);
        setRoleCanManage(false);
      }
    };
    refreshPermission();
    window.addEventListener("storage", refreshPermission);
    window.addEventListener(WEBB_ADMIN_MOCK_UPDATED, refreshPermission);
    return () => {
      window.removeEventListener("storage", refreshPermission);
      window.removeEventListener(WEBB_ADMIN_MOCK_UPDATED, refreshPermission);
    };
  }, [role]);

  useEffect(() => {
    const refresh = () => {
      const nextTickets = readExamRequests();
      setTickets(nextTickets);
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(WEBB_ADMIN_MOCK_UPDATED, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(WEBB_ADMIN_MOCK_UPDATED, refresh);
    };
  }, []);

  const visibleTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        const matchesProduct =
          !productId ||
          (ticket.productId
            ? productsOverlap(productId, ticket.productId)
            : productsOverlap(productId, ticket.product || productName || ""));
        const matchesSet = !examSet || (ticket.examSet || "A").toLocaleUpperCase() === examSet.toLocaleUpperCase();
        return (
          matchesProduct &&
          matchesSet &&
          (statusFilter === "ทั้งหมด" || ticket.status === statusFilter)
        );
      }),
    [tickets, productId, productName, examSet, statusFilter],
  );

  function persist(next: Ticket[]) {
    setTickets(next);
    safeWrite(adminMockKey("tickets"), next);
    window.dispatchEvent(new Event(WEBB_ADMIN_MOCK_UPDATED));
  }

  function approve(ticket: Ticket) {
    if (!ticket.purchaseRef || !ticket.productId || !ticket.username) {
      toast.error("คำร้องนี้ยังไม่ได้ผูกกับรายการซื้อ จึงอนุมัติสิทธิ์ไม่ได้");
      return;
    }
    const selected = WEBB_PRODUCTS.find((item) => item.id === ticket.productId);
    const purchases = readAdminMockPurchases();
    const linkedPurchase = purchases.find(
      (purchase) =>
        purchase.paymentStatus === "paid" &&
        purchase.ref === ticket.purchaseRef &&
        purchase.profileSnapshot.username.toLowerCase() === ticket.username?.toLowerCase(),
    );
    if (!linkedPurchase) {
      toast.error("ไม่พบรายการซื้อที่ผูกกับคำร้องนี้ กรุณาตรวจสอบรายการซื้อก่อนอนุมัติ");
      return;
    }
    const examSet = ticket.examSet || linkedPurchase.examSet || "A";
    const nextPurchases: DemoPurchase[] = purchases.map((purchase) =>
      purchase.ref === ticket.purchaseRef
        ? { ...purchase, examStatus: "available" }
        : purchase,
    );
    writeAdminMockPurchases(nextPurchases);
    const attempts = safeRead<Record<string, unknown>[]>(adminMockKey("attempts"), []);
    const retry = {
      id: "ATT-" + String(Date.now()).slice(-6),
      student: ticket.student,
      username: ticket.username,
      product: (selected?.name || ticket.product) + " · ชุด " + examSet + " · รอบอนุมัติใหม่",
      started: "รอเริ่มสอบ",
      status: "รอเริ่มสอบ",
      score: "—",
      events: [
        {
          time: formatThaiDateTime(),
          action: "อนุมัติคำร้อง",
          detail: ticket.id + " · เปิดสิทธิ์สอบใหม่ ชุด " + examSet,
        },
      ],
    };
    safeWrite(adminMockKey("attempts"), [retry, ...attempts]);
    const logs = safeRead<{ time: string; actor: string; action: string; target: string }[]>(
      adminMockKey("logs"),
      [],
    );
    safeWrite(adminMockKey("logs"), [
      {
        time: formatThaiDateTime(),
        actor: "ผู้ดูแลระบบ · " + role,
        action: "อนุมัติสอบใหม่",
        target: ticket.student + " · " + ticket.product + " · " + ticket.id,
      },
      ...logs,
    ]);
    persist(tickets.map((row) => (row.id === ticket.id ? { ...row, status: "อนุมัติ" } : row)));
    toast.success("เปิดสิทธิ์รอบใหม่ให้ " + ticket.student + " แล้ว · ประวัติเดิมยังอยู่");
  }

  function reject(ticket: Ticket) {
    persist(tickets.map((row) => (row.id === ticket.id ? { ...row, status: "ไม่อนุมัติ" } : row)));
    const logs = safeRead<{ time: string; actor: string; action: string; target: string }[]>(
      adminMockKey("logs"),
      [],
    );
    safeWrite(adminMockKey("logs"), [
      {
        time: formatThaiDateTime(),
        actor: "ผู้ดูแลระบบ · " + role,
        action: "ปฏิเสธคำร้องสอบใหม่",
        target: ticket.student + " · " + ticket.product + " · " + ticket.id,
      },
      ...logs,
    ]);
    toast.info("ปฏิเสธคำร้อง " + ticket.id + " แล้ว");
  }

  function handleCreateCase() {
    const purchases = readAdminMockPurchases();
    const purchase = purchases.find((p) => p.ref === selectedPurchaseRef) || purchases[0];
    if (!purchase) {
      toast.error("กรุณาเลือกรายการซื้อของผู้เรียน");
      return;
    }
    const studentName = purchase.profileSnapshot
      ? `${purchase.profileSnapshot.firstName} ${purchase.profileSnapshot.lastName}`.trim()
      : "ผู้เรียน";
    const product = WEBB_PRODUCTS.find((p) => p.id === purchase.productId);
    const productName = product ? product.name : purchase.productId;
    const examSet = purchase.examSet || "A";
    const ticketId = `TKT-${new Date().getFullYear() + 543}-${String(Date.now()).slice(-4)}`;
    const fullReason = caseReason.trim() || "ผู้เรียนแจ้งเหตุขัดข้อง ขอเปิดสิทธิ์สอบใหม่";

    const newTicket: Ticket = {
      id: ticketId,
      student: studentName,
      product: `${productName} · ชุด ${examSet}`,
      productId: purchase.productId,
      purchaseRef: purchase.ref,
      username: purchase.profileSnapshot.username,
      examSet,
      reason: fullReason,
      date: new Date().toISOString(),
      status: initialDecision === "approve" ? "อนุมัติ" : "รอตรวจ",
      evidenceImage: caseImage || undefined,
    };

    if (initialDecision === "approve") {
      const nextPurchases: DemoPurchase[] = purchases.map((p) =>
        p.ref === purchase.ref ? { ...p, examStatus: "available" } : p,
      );
      writeAdminMockPurchases(nextPurchases);

      const attempts = safeRead<Record<string, unknown>[]>(adminMockKey("attempts"), []);
      const retry = {
        id: "ATT-" + String(Date.now()).slice(-6),
        student: studentName,
        username: purchase.profileSnapshot.username,
        product: `${productName} · ชุด ${examSet} · รอบอนุมัติใหม่ (LINE)`,
        started: "รอเริ่มสอบ",
        status: "รอเริ่มสอบ",
        score: "—",
        events: [
          {
            time: formatThaiDateTime(),
            action: "เจ้าหน้าที่เปิดเคสและอนุมัติสอบใหม่",
            detail: `${ticketId} · เปิดสิทธิ์สอบใหม่ ชุด ${examSet} (บันทึกจาก LINE)`,
          },
        ],
      };
      safeWrite(adminMockKey("attempts"), [retry, ...attempts]);

      const logs = safeRead<{ time: string; actor: string; action: string; target: string }[]>(
        adminMockKey("logs"),
        [],
      );
      safeWrite(adminMockKey("logs"), [
        {
          time: formatThaiDateTime(),
          actor: "ผู้ดูแลระบบ · " + role,
          action: "เปิดเคสและอนุมัติสอบใหม่ (LINE)",
          target: `${studentName} · ${productName} · ${ticketId}`,
        },
        ...logs,
      ]);

      persist([newTicket, ...tickets]);
      toast.success(`เปิดเคสและอนุมัติสิทธิ์สอบใหม่ให้ ${studentName} เรียบร้อยแล้ว`);
    } else {
      const logs = safeRead<{ time: string; actor: string; action: string; target: string }[]>(
        adminMockKey("logs"),
        [],
      );
      safeWrite(adminMockKey("logs"), [
        {
          time: formatThaiDateTime(),
          actor: "ผู้ดูแลระบบ · " + role,
          action: "เปิดเคสขอสอบใหม่ (LINE)",
          target: `${studentName} · ${productName} · ${ticketId}`,
        },
        ...logs,
      ]);

      persist([newTicket, ...tickets]);
      toast.success(`บันทึกเคสขอสอบใหม่ ${ticketId} เรียบร้อยแล้ว`);
    }

    setIsCreateCaseOpen(false);
    setCaseReason("");
    setCaseImage("");
  }

  const statusTone: Record<Ticket["status"], string> = {
    รอตรวจ: "bg-amber-100 text-amber-800",
    อนุมัติ: "bg-emerald-100 text-emerald-800",
    ไม่อนุมัติ: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="space-y-4 text-slate-900">
      {!compact && (
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.18em] text-amber-700">STUDY UNITH · WEB B</span>
            <h1 className="mt-1 text-2xl font-extrabold">อนุมัติเปิดสอบใหม่</h1>
            <p className="mt-1 text-sm text-slate-500">บันทึกเคสขอสอบใหม่จากนักเรียน (ทาง LINE) และเปิดสิทธิ์สอบใหม่ในระบบ</p>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsCreateCaseOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
              >
                <LuPlus className="size-4" />
                <span>เปิดเคสขอสอบใหม่ (จาก LINE)</span>
              </button>
            )}
            <Link className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold" href="/webb/admin/real-exams">กลับไปชุดจริง</Link>
          </div>
        </header>
      )}
      {!canView ? (
        <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-600">บทบาท {role} ไม่มีสิทธิ์ดูคำร้องสอบใหม่</p>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-bold">คำร้องและรายการรออนุมัติ</h2>
            <p className="mt-1 text-xs text-slate-500">ตรวจเทียบกับรายการซื้อและชุดข้อสอบก่อนอนุมัติ · ประวัติเดิมยังอยู่หลังเปิดสิทธิ์รอบใหม่</p>
          </div>
          {!canEdit && <p className="mb-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-600">บทบาท {role} ดูคำร้องได้ แต่ไม่มีสิทธิ์จัดการคำร้อง</p>}
          <WebBAdminTable
            rows={visibleTickets}
            getSearchText={(ticket) =>
              [ticket.id, ticket.student, ticket.username, ticket.product, ticket.productId, ticket.purchaseRef, ticket.reason]
                .filter(Boolean)
                .join(" ")
            }
            searchPlaceholder="ค้นหาผู้เรียน เลขคำร้อง หรือรายการซื้อ"
            ariaLabel="ตารางคำร้องสอบใหม่"
            emptyMessage={statusFilter === "ทั้งหมด" ? "ยังไม่มีคำร้องขอสอบใหม่จากผู้เรียน" : "ไม่พบคำร้องตามตัวกรองนี้"}
            resetKey={statusFilter}
            toolbar={
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-44">
                  <AdminSelect
                    value={statusFilter}
                    onChange={setStatusFilter}
                    ariaLabel="กรองสถานะคำร้อง"
                    options={["ทั้งหมด", "รอตรวจ", "อนุมัติ", "ไม่อนุมัติ"].map((value) => ({
                      value,
                      label: value,
                    }))}
                  />
                </div>
                {canEdit && compact && (
                  <button
                    type="button"
                    onClick={() => setIsCreateCaseOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 whitespace-nowrap"
                  >
                    <LuPlus className="size-3.5" />
                    <span>เปิดเคสใหม่</span>
                  </button>
                )}
              </div>
            }
          >
            {(pageTickets) => (
              <table className="w-full min-w-[1040px] text-left">
                <thead>
                  <tr>
                    {["คำร้อง / วันเวลา", "ผู้เรียน", "ชุด / รายการซื้อ", "เหตุผล", "สถานะ", "การทำงาน"].map((heading) => (
                      <th className={th} key={heading}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className={td}><b>{ticket.id}</b><small className="mt-1 block text-xs text-slate-400">{formatThaiDateTimeValue(ticket.date)}</small></td>
                      <td className={td}><b>{ticket.student}</b><small className="mt-1 block text-xs text-slate-400">{ticket.username || "ไม่พบชื่อบัญชี"}</small></td>
                      <td className={td}>{ticket.product} · ชุด {ticket.examSet || "A"}<small className="mt-1 block font-mono text-xs text-slate-400">{ticket.purchaseRef || "ไม่มีเลขอ้างอิงรายการซื้อ"}</small></td>
                      <td className={td}>
                        <div>{ticket.reason}</div>
                        {ticket.evidenceImage && (
                          <div className="mt-1">
                            <a
                              href={ticket.evidenceImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                            >
                              <LuImage className="size-3" />
                              <span>ดูรูปหลักฐาน</span>
                            </a>
                          </div>
                        )}
                      </td>
                      <td className={td}><span className={"rounded-full px-2.5 py-1 text-xs font-bold " + statusTone[ticket.status]}>{ticket.status}</span></td>
                      <td className={td}>
                        {ticket.status === "รอตรวจ" ? (
                          <div className="flex gap-2">
                            <button disabled={!canEdit || !ticket.purchaseRef} className="rounded-lg bg-[#211d4f] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300" onClick={() => approve(ticket)}>อนุมัติ</button>
                            <button disabled={!canEdit} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50" onClick={() => reject(ticket)}>ปฏิเสธ</button>
                          </div>
                        ) : <span className="text-xs text-slate-500">ดำเนินการแล้ว</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </WebBAdminTable>
        </section>
      )}

      {isCreateCaseOpen && (
        <WebBModalPortal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setIsCreateCaseOpen(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-case-title"
              className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    เจ้าหน้าที่บันทึกเคส
                  </span>
                  <h2 id="create-case-title" className="mt-0.5 text-lg font-bold text-slate-900">
                    เปิดเคสขอสอบใหม่
                  </h2>

                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateCaseOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="ปิดหน้าต่าง"
                >
                  <LuX className="size-4" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    นักเรียน
                  </label>
                  {(() => {
                    const purchases = readAdminMockPurchases();
                    const options = purchases.map((p) => {
                      const prod = WEBB_PRODUCTS.find((item) => item.id === p.productId);
                      const name = p.profileSnapshot
                        ? `${p.profileSnapshot.firstName} ${p.profileSnapshot.lastName}`
                        : "ผู้เรียน";
                      return {
                        value: p.ref,
                        label: `${name} · ${prod?.name || p.productId} (ชุด ${p.examSet || "A"}) · [${p.ref}]`,
                      };
                    });
                    const currentVal = selectedPurchaseRef || (options[0]?.value ?? "");
                    return (
                      <AdminSelect
                        value={currentVal}
                        onChange={(val) => setSelectedPurchaseRef(val)}
                        ariaLabel="เลือกนักเรียน"
                        options={options}
                      />
                    );
                  })()}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    เหตุผล
                  </label>
                  <textarea
                    rows={3}
                    value={caseReason}
                    onChange={(e) => setCaseReason(e.target.value)}
                    placeholder="เช่น นักเรียนแจ้งอินเทอร์เน็ตที่บ้านตัดระหว่างทำข้อสอบ TGAT3 ขอเปิดสิทธิ์สอบใหม่"
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    แนบรูป
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
                      <LuUpload className="size-4 text-indigo-600" />
                      <span>เบราซ์ไฟล์รูปหลักฐาน...</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            if (base64) {
                              setCaseImage(base64);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>

                    {caseImage && (
                      <div className="flex items-center gap-2">
                        <div className="relative size-12 overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                          <img
                            src={caseImage}
                            alt="หลักฐาน"
                            className="size-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setCaseImage("")}
                          className="rounded-lg p-1.5 text-xs text-rose-600 hover:bg-rose-50"
                          title="ลบรูป"
                        >
                          <LuTrash2 className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    การดำเนินการ
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-xs transition-colors ${initialDecision === "approve"
                        ? "border-emerald-500 bg-emerald-50/60 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="case-decision"
                        checked={initialDecision === "approve"}
                        onChange={() => setInitialDecision("approve")}
                        className="mt-0.5"
                      />
                      <div>
                        <strong className="block">อนุมัติเปิดสอบทันที</strong>
                        <span className="text-[11px] text-slate-500">
                          ปลดล็อกสิทธิ์สอบให้นักเรียนเข้าทำข้อสอบใหม่ได้ทันที
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-xs transition-colors ${initialDecision === "pending"
                        ? "border-amber-500 bg-amber-50/60 text-amber-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="case-decision"
                        checked={initialDecision === "pending"}
                        onChange={() => setInitialDecision("pending")}
                        className="mt-0.5"
                      />
                      <div>
                        <strong className="block">บันทึกเป็นเคสรอตรวจ</strong>
                        <span className="text-[11px] text-slate-500">
                          สร้างคำร้องในระบบไว้รอให้ Super Admin พิจารณาต่อ
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsCreateCaseOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleCreateCase}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
                >
                  บันทึกเคสสอบใหม่
                </button>
              </div>
            </section>
          </div>
        </WebBModalPortal>
      )}
    </div>
  );
}
