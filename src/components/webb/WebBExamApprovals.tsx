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
  status: "รอตรวจสอบ" | "อนุมัติ" | "ไม่อนุมัติ";
};
const initialTickets: Ticket[] = [{ id: "TKT-2570-0001", student: "วริศรา รุ่งเรือง", product: "Full TGAT · ชุด A", productId: "tgat-full", purchaseRef: "DO-2570-0007", username: "varisara", examSet: "A", reason: "อินเทอร์เน็ตขัดข้องระหว่างทำ TGAT3 ระบบส่งคำตอบไม่ครบ ขอเปิดสอบใหม่ตามสิทธิ์รายการซื้อ", date: "2026-10-06 11:42", status: "รอตรวจสอบ" }];
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

  const statusTone: Record<Ticket["status"], string> = {
    รอตรวจสอบ: "bg-amber-100 text-amber-800",
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
            <p className="mt-1 text-sm text-slate-500">ตรวจคำร้องที่ผู้เรียนส่งเข้ามา และบันทึกผลการพิจารณา</p>
          </div>
          <Link className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold" href="/webb/admin/real-exams">กลับไปชุดจริง</Link>
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
            <div className="min-w-48">
              <AdminSelect
                value={statusFilter}
                onChange={setStatusFilter}
                ariaLabel="กรองสถานะคำร้อง"
                options={["ทั้งหมด", "รอตรวจสอบ", "อนุมัติ", "ไม่อนุมัติ"].map((value) => ({
                  value,
                  label: value,
                }))}
              />
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
                    <td className={td}>{ticket.reason}</td>
                    <td className={td}><span className={"rounded-full px-2.5 py-1 text-xs font-bold " + statusTone[ticket.status]}>{ticket.status}</span></td>
                    <td className={td}>
                      {ticket.status === "รอตรวจสอบ" ? (
                        <div className="flex gap-2">
                          <button disabled={!canEdit || !ticket.purchaseRef} className="rounded-lg bg-[#211d4f] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300" onClick={() => approve(ticket)}>อนุมัติเปิดสอบใหม่</button>
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
    </div>
  );
}
