"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WEBB_PRODUCTS } from "./data";
import { DEMO_PURCHASES_KEY, examAnswersStorageKey, examResultStorageKey, readDemoPurchases, safeRead, safeWrite, type DemoPurchase } from "./demo-store";

type Ticket = { id: string; student: string; product: string; productId?: string; purchaseRef?: string; username?: string; reason: string; date: string; status: "รอตรวจสอบ" | "อนุมัติ" | "ไม่อนุมัติ" };
const initialTickets: Ticket[] = [
  { id: "REQ-001", student: "นภัส Demo", product: "TGAT3", reason: "อินเทอร์เน็ตหลุดระหว่างส่งข้อสอบ", date: "2026-10-04 15:10", status: "รอตรวจสอบ" },
  { id: "REQ-002", student: "ธนกร สาธิต", product: "Full TGAT", reason: "หน้าจอค้างขณะทำข้อสอบ", date: "2026-10-03 10:42", status: "รอตรวจสอบ" },
];
export default function WebBExamApprovals() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [purchases, setPurchases] = useState<DemoPurchase[]>([]);
  const [purchaseRef, setPurchaseRef] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setTickets(safeRead("webb-admin-demo:tickets", initialTickets));
    const savedPurchases = readDemoPurchases().filter((purchase) => purchase.profileSnapshot.username !== "ผู้ใช้งานที่ถูกลบไปแล้ว");
    setPurchases(savedPurchases);
    setPurchaseRef(savedPurchases[0]?.ref || "");
  }, []);

  function persist(next: Ticket[]) {
    setTickets(next);
    safeWrite("webb-admin-demo:tickets", next);
  }

  function addRequest() {
    if (!reason.trim()) { setMessage("กรุณาระบุเหตุผลหรือข้อตกลงที่ตรวจสอบภายนอกแล้ว"); return; }
    const selectedPurchase = purchases.find((item) => item.ref === purchaseRef);
    if (!selectedPurchase) { setMessage("เลือกสิทธิ์ซื้อที่ต้องการเปิดสอบใหม่ก่อน"); return; }
    const selected = WEBB_PRODUCTS.find((item) => item.id === selectedPurchase.productId);
    const selectedStudent = `${selectedPurchase.profileSnapshot.firstName} ${selectedPurchase.profileSnapshot.lastName}`.trim();
    const ticket: Ticket = {
      id: `REQ-${String(Date.now()).slice(-6)}`,
      student: selectedStudent,
      product: selected?.name || selectedPurchase.productId,
      productId: selectedPurchase.productId,
      purchaseRef: selectedPurchase.ref,
      username: selectedPurchase.profileSnapshot.username,
      reason: reason.trim(),
      date: new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
      status: "รอตรวจสอบ",
    };
    persist([ticket, ...tickets]);
    setReason("");
    setMessage("เพิ่มคำร้องสอบใหม่แล้ว · Demo");
  }

  function approve(ticket: Ticket) {
    if (!ticket.purchaseRef || !ticket.productId || !ticket.username) {
      setMessage("คำร้องตัวอย่างนี้ยังไม่ได้ผูกกับรายการซื้อจริง จึงอนุมัติสิทธิ์ไม่ได้");
      return;
    }
    const selected = WEBB_PRODUCTS.find((item) => item.id === ticket.productId);
    const productId = ticket.productId;
    const purchases = readDemoPurchases();
    const linkedPurchase = purchases.find((purchase) => purchase.ref === ticket.purchaseRef && purchase.profileSnapshot.username.toLowerCase() === ticket.username?.toLowerCase());
    if (!linkedPurchase) {
      setMessage("ไม่พบรายการซื้อที่ผูกกับคำร้องนี้ กรุณาตรวจสอบรายการซื้อก่อนอนุมัติ");
      return;
    }
    const nextPurchases: DemoPurchase[] = purchases.map((purchase) => {
      if (purchase.ref === ticket.purchaseRef) return { ...purchase, examStatus: "available" };
      return purchase;
    });
    safeWrite(DEMO_PURCHASES_KEY, nextPurchases);
    setPurchases(nextPurchases.filter((purchase) => purchase.profileSnapshot.username !== "ผู้ใช้งานที่ถูกลบไปแล้ว"));
    window.dispatchEvent(new Event("webb-demo-purchases-updated"));
    localStorage.setItem(examResultStorageKey(productId, "purchased", ticket.username), JSON.stringify({ status: "authorized", approvedAt: Date.now(), request: ticket.id, purchaseRef: ticket.purchaseRef }));
    localStorage.removeItem(examAnswersStorageKey(productId, "purchased", ticket.username));
    const currentAttempts = safeRead<{ id: string; student: string; username?: string; product: string; started: string; status: string; score: string }[]>("webb-admin-demo:attempts", []);
    const retry = { id: `ATT-${String(Date.now()).slice(-6)}`, student: ticket.student, username: ticket.username, product: `${selected?.name || ticket.product} · รอบอนุมัติใหม่`, started: "รอเริ่มสอบ", status: "รอเริ่มสอบ", score: "—" };
    safeWrite("webb-admin-demo:attempts", [retry, ...currentAttempts]);
    const log = safeRead<{ time: string; actor: string; action: string; target: string }[]>("webb-admin-demo:logs", []);
    safeWrite("webb-admin-demo:logs", [{ time: new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }), actor: "ผู้ดูแลระบบ Demo", action: "อนุมัติสอบใหม่", target: `${ticket.student} · ${ticket.product} · ${ticket.id}` }, ...log]);
    persist(tickets.map((row) => row.id === ticket.id ? { ...row, status: "อนุมัติ" } : row));
    setMessage(`เปิดสิทธิ์รอบใหม่ให้ ${ticket.student} แล้ว · ประวัติเดิมยังอยู่`);
  }

  function reject(ticket: Ticket) {
    persist(tickets.map((row) => row.id === ticket.id ? { ...row, status: "ไม่อนุมัติ" } : row));
    setMessage(`ปฏิเสธคำร้อง ${ticket.id} แล้ว`);
  }

  return <div className="space-y-6 text-slate-900">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><span className="text-xs font-bold uppercase tracking-[.18em] text-amber-700">STUDY UNITH · WEB B</span><h1 className="mt-1 text-2xl font-extrabold">อนุมัติเปิดสอบใหม่</h1><p className="mt-1 text-sm text-slate-500">ใช้เมื่อผู้เรียนหลุด เข้าสอบไม่ได้ หรือมีข้อตกลงให้สอบใหม่ · ทุกการอนุมัติจะบันทึกประวัติ</p></div><Link className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold" href="/webb/admin/dashboard#entitlements">กลับหน้าจัดการ WEB-B</Link></header>
    {message && <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900" role="status">{message}<button className="ml-3" onClick={() => setMessage("")}>ปิด</button></div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold">สร้างคำร้องจากการตกลงภายนอก</h2><p className="mt-1 text-xs text-slate-500">เลือกสิทธิ์ซื้อจริงเพื่อผูกการอนุมัติกับผู้เรียนและชุดข้อสอบที่ถูกต้อง</p><div className="mt-4 grid gap-3 md:grid-cols-[2fr_1.5fr_auto]">
      <label className="grid gap-1 text-xs font-semibold text-slate-600">รายการซื้อ<select value={purchaseRef} onChange={(e) => setPurchaseRef(e.target.value)} disabled={!purchases.length} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"><option value="">{purchases.length ? "เลือกรายการซื้อ" : "ยังไม่มีรายการซื้อใน Demo"}</option>{purchases.map((item) => { const exam = WEBB_PRODUCTS.find((row) => row.id === item.productId); return <option key={item.ref} value={item.ref}>{item.profileSnapshot.firstName} {item.profileSnapshot.lastName} · {exam?.name || item.productId} · {item.ref}</option>; })}</select></label>
      <label className="grid gap-1 text-xs font-semibold text-slate-600">เหตุผล<textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="เช่น ระบบหลุดกลางคัน และตรวจสอบกับผู้เรียนแล้ว" className="min-h-10 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
      <button disabled={!purchaseRef} className="self-end rounded-xl bg-[#211d4f] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300" onClick={addRequest}>เพิ่มคำร้อง</button>
    </div></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="font-bold">คำร้องและรายการรออนุมัติ</h2><p className="mt-1 text-xs text-slate-500">อนุมัติแล้วจะล้างคำตอบรอบก่อน เปิดสิทธิ์สอบใหม่ และเก็บรอบเก่าไว้ในประวัติ</p></div>
      <div className="grid gap-3">{tickets.map((ticket) => <article key={ticket.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><b>{ticket.student} · {ticket.product}</b><p className="mt-1 text-sm text-slate-600">{ticket.reason}</p><small className="mt-1 block text-slate-400">{ticket.id} · {ticket.date}{ticket.purchaseRef ? ` · รายการ ${ticket.purchaseRef}` : " · ตัวอย่างข้อมูล"}</small></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${ticket.status === "รอตรวจสอบ" ? "bg-amber-100 text-amber-800" : ticket.status === "อนุมัติ" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"}`}>{ticket.status}</span></div>{ticket.status === "รอตรวจสอบ" && <div className="mt-3 flex gap-2"><button disabled={!ticket.purchaseRef} className="rounded-lg bg-[#211d4f] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300" onClick={() => approve(ticket)}>{ticket.purchaseRef ? "อนุมัติเปิดสอบใหม่" : "ตัวอย่าง · ยังไม่ผูกสิทธิ์ซื้อ"}</button><button className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700" onClick={() => reject(ticket)}>ปฏิเสธ</button></div>}</article>)}{tickets.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">ยังไม่มีคำร้อง</p>}</div>
    </section>
  </div>;
}
