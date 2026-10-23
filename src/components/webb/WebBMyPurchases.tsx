"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LuMessageSquare, LuCopy, LuCheck, LuX } from "react-icons/lu";
import { getProduct, formatBaht, formatThaiDateTimeValue } from "./data";
import { PublicShell } from "./PublicShell";
import { DEMO_AUTH_KEY, readCurrentDemoPurchases, readDemoAccount, readDemoOrders, safeRead, safeWrite, type DemoOrder, type DemoPurchase } from "./demo-store";
import { getExamPlan } from "./exam-documents";
import { formatThaiDateTime } from "./data";
import { inputWebBValue } from "./confirm";
import { toast } from "react-toastify";
import WebBModalPortal from "./WebBModalPortal";

type RetryRequest = { id: string; student: string; product: string; productId: string; purchaseRef: string; username: string; examSet: string; reason: string; date: string; status: "รอตรวจสอบ" | "อนุมัติ" | "ไม่อนุมัติ" };

export default function WebBMyPurchases() {
  const [purchases, setPurchases] = useState<DemoPurchase[]>([]);
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [retryRequests, setRetryRequests] = useState<RetryRequest[]>([]);
  const [lineModalPurchase, setLineModalPurchase] = useState<DemoPurchase | null>(null);
  const [copied, setCopied] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    if (localStorage.getItem(DEMO_AUTH_KEY) !== "true") {
      window.location.replace("/webb/login");
      return;
    }
    setAuthChecked(true);
    setPurchases(readCurrentDemoPurchases());
    const refresh = () => {
      setPurchases(readCurrentDemoPurchases());
      const username = readDemoAccount()?.username.toLowerCase();
      setOrders(readDemoOrders().filter((order) => !username || order.profileSnapshot.username.toLowerCase() === username));
      setRetryRequests(safeRead("webb-admin-demo:tickets", []));
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("webb-demo-purchases-updated", refresh);
    window.addEventListener("webb-demo-orders-updated", refresh);
    window.addEventListener("webb-admin-demo-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("webb-demo-purchases-updated", refresh);
      window.removeEventListener("webb-demo-orders-updated", refresh);
      window.removeEventListener("webb-admin-demo-updated", refresh);
    };
  }, []);

  async function requestAnotherAttempt(purchase: DemoPurchase) {
    const account = readDemoAccount();
    if (!account) return;
    const existing = retryRequests.find((request) => request.purchaseRef === purchase.ref && request.status === "รอตรวจสอบ");
    if (existing) {
      toast.info("ส่งคำร้องรายการนี้แล้ว · กำลังรอตรวจสอบ");
      return;
    }
    const reason = await inputWebBValue({ title: "ขอสิทธิ์สอบใหม่", value: "ระบบขัดข้องระหว่างสอบ", placeholder: "ระบุเหตุผลที่ต้องการให้ตรวจสอบ" });
    if (!reason?.trim()) return;
    const nextRequest: RetryRequest = {
      id: `REQ-${String(Date.now()).slice(-6)}`,
      student: `${purchase.profileSnapshot.firstName} ${purchase.profileSnapshot.lastName}`.trim(),
      product: getProduct(purchase.productId).name,
      productId: purchase.productId,
      purchaseRef: purchase.ref,
      username: purchase.profileSnapshot.username,
      examSet: purchase.examSet || "A",
      reason: reason.trim(),
      date: formatThaiDateTime(),
      status: "รอตรวจสอบ",
    };
    const next = [nextRequest, ...safeRead<RetryRequest[]>("webb-admin-demo:tickets", [])];
    safeWrite("webb-admin-demo:tickets", next);
    setRetryRequests(next);
    window.dispatchEvent(new Event("webb-admin-demo-updated"));
    toast.success("ส่งคำร้องให้ผู้ดูแลตรวจสอบแล้ว");
  }

  if (!authChecked) return <main className="wb-inner-page" aria-busy="true" />;

  return <PublicShell><main className="webb-inner-page"><div className="webb-container">
    <header className="webb-page-head"><div><span className="webb-kicker">STUDY UNITH · บัญชีผู้เรียน</span><h1>รายการที่ซื้อแล้วของฉัน</h1><p>ประวัติคำสั่งซื้อ ข้อมูลผู้สมัคร ณ วันซื้อ และสิทธิ์ในแต่ละชุดข้อสอบ</p></div><Link href="/webb/products">＋ เลือกซื้อข้อสอบเพิ่ม</Link></header>
    {orders.length > 0 && <section className="webb-card mb-5 p-5"><h2 className="text-lg font-bold">สถานะคำสั่งซื้อ</h2><div className="mt-3 grid gap-2">{orders.map((order) => <div key={order.ref} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div><b className="font-mono text-sm">{order.ref}</b><p className="text-sm text-slate-500">{formatThaiDateTimeValue(order.createdAt)} · {order.method} · {formatBaht(order.amount)}</p></div><div className="flex items-center gap-3"><strong className={order.status === "สำเร็จ" ? "text-emerald-700" : order.status === "รอชำระ" ? "text-amber-700" : "text-slate-500"}>{order.status}</strong>{order.status === "รอชำระ" && <Link className="webb-button webb-button-primary" href={`/webb/checkout?product=${order.items[0]?.productId || "tgat-full"}`}>ชำระต่อ</Link>}{["หมดอายุ", "ยกเลิก", "ไม่สำเร็จ"].includes(order.status) && <Link className="webb-button webb-button-secondary" href={`/webb/checkout?product=${order.items[0]?.productId || "tgat-full"}`}>สั่งซื้อใหม่</Link>}</div></div>)}</div></section>}
    {!purchases.length ? <section className="webb-card wb-purchase-empty"><span>▤</span><h2>ยังไม่มีรายการซื้อ</h2><p>เลือกชุดข้อสอบที่ต้องการเพื่อเพิ่มสิทธิ์ไว้ในบัญชี</p><Link className="webb-button webb-button-primary" href="/webb/products">ดูชุดข้อสอบ</Link></section> : <div className="wb-purchase-list">{purchases.map((purchase) => {
      const product = getProduct(purchase.productId);
      const submitted = purchase.examStatus === "submitted";
      const interrupted = purchase.examStatus === "interrupted";
      const examAvailable = getExamPlan(product.id, purchase.examSet || "A").hasSuppliedExam;
      const request = retryRequests.find((item) => item.purchaseRef === purchase.ref);
      return <article className="webb-card wb-purchase-card" key={purchase.ref}>
        <div className="wb-purchase-heading"><div><span className="webb-kicker">{purchase.ref}</span><h2>{product.name}</h2><p>{product.parts}</p></div><strong>{formatBaht(purchase.amount)}</strong></div>
        <div className="wb-purchase-meta"><span>ซื้อเมื่อ <b>{formatThaiDateTimeValue(purchase.purchasedAtIso || purchase.purchasedAt)}</b></span><span>ใบเสร็จ <b>{purchase.receipt}</b></span><span>ชำระผ่าน <b>{purchase.payment}</b></span></div>
        <details className="wb-purchase-snapshot"><summary>ข้อมูลผู้สมัครที่ใช้กับรายการนี้</summary><p>{purchase.profileSnapshot.firstName} {purchase.profileSnapshot.lastName} · {purchase.profileSnapshot.email} · {purchase.profileSnapshot.phone}</p><small>{purchase.profileSnapshot.school} · {purchase.profileSnapshot.province} · {purchase.profileSnapshot.education}</small></details>
        <div className="wb-purchase-rights"><span className={submitted || interrupted ? "is-used" : ""}>{submitted ? "สิทธิ์สอบใช้แล้ว" : interrupted ? "รออนุมัติสอบใหม่" : examAvailable ? "สิทธิ์สอบพร้อมใช้งาน" : "รอไฟล์ข้อสอบ"}</span><span>เฉลย PDF: เปิดหลังส่งข้อสอบ</span></div>
        <div className="wb-purchase-actions">
          {submitted ? (
            <>
              <Link href={`/webb/solutions?product=${product.id}&set=${encodeURIComponent(purchase.examSet || "A")}&ref=${encodeURIComponent(purchase.ref)}`}>ดูเฉลย PDF →</Link>
              <Link href={`/webb/results?product=${product.id}`}>ดูผลสอบ</Link>
            </>
          ) : interrupted ? (
            request?.status === "รอตรวจสอบ" ? (
              <span className="wb-purchase-wait">แจ้งเรื่องผ่าน LINE แล้ว · เจ้าหน้าที่กำลังตรวจสอบ</span>
            ) : request?.status === "อนุมัติ" ? (
              <Link className="webb-button webb-button-primary" href={`/webb/rules?product=${product.id}&set=${encodeURIComponent(purchase.examSet || "A")}&ref=${encodeURIComponent(purchase.ref)}&type=purchased&back=overview`}>
                เข้าสอบรอบใหม่
              </Link>
            ) : (
              <button
                type="button"
                className="webb-button webb-button-secondary inline-flex items-center gap-1.5"
                onClick={() => {
                  setCopied(false);
                  setLineModalPurchase(purchase);
                }}
              >
                <LuMessageSquare className="size-3.5" />
                <span>ขอสอบใหม่ (ติดต่อทาง LINE)</span>
              </button>
            )
          ) : examAvailable ? (
            <Link className="webb-button webb-button-primary" href={`/webb/rules?product=${product.id}&set=${encodeURIComponent(purchase.examSet || "A")}&ref=${encodeURIComponent(purchase.ref)}&type=purchased&back=overview`}>
              เข้าสอบ
            </Link>
          ) : (
            <span className="wb-purchase-wait">ไฟล์ข้อสอบชุดนี้ยังไม่พร้อม</span>
          )}
        </div>
      </article>;
    })}</div>}
  </div></main>

  {lineModalPurchase && (
    <WebBModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setLineModalPurchase(null);
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="line-modal-title"
          className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <LuMessageSquare className="size-5" />
              </div>
              <div>
                <h2 id="line-modal-title" className="text-base font-bold text-slate-900">
                  ขั้นตอนการขอสิทธิ์สอบใหม่
                </h2>
                <p className="text-xs text-slate-500">
                  ติดต่อพูดคุยกับเจ้าหน้าที่ส่วนตัวทาง LINE Official
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLineModalPurchase(null)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="ปิดหน้าต่าง"
            >
              <LuX className="size-4" />
            </button>
          </div>

          <div className="space-y-4 p-6 text-sm text-slate-600">
            <div className="rounded-xl bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-900 border border-amber-200/60">
              <strong className="block font-semibold mb-1 text-amber-950">
                📌 คำแนะนำสำหรับผู้เรียน:
              </strong>
              กรณีเกิดเหตุขัดข้องระหว่างทำข้อสอบ (เช่น อินเทอร์เน็ตหลุด อุปกรณ์ดับ หรือปิดหน้าต่างโดยไม่ตั้งใจ) <strong>นักเรียนจะต้องติดต่อทักหาเจ้าหน้าที่ทาง LINE ส่วนตัว</strong> เพื่อแจ้งรายละเอียดและหลักฐาน หากเจ้าหน้าที่ตรวจสอบความถูกต้องแล้ว เจ้าหน้าที่จะดำเนินการเปิดเคสและอนุมัติสิทธิ์สอบใหม่ให้ในระบบทันที
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">วิชาที่สอบ:</span>
                <strong className="text-xs text-slate-800">
                  {getProduct(lineModalPurchase.productId).name} (ชุด {lineModalPurchase.examSet || "A"})
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">รหัสคำสั่งซื้อ (Ref):</span>
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-700">
                  <span>{lineModalPurchase.ref}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(lineModalPurchase.ref);
                      setCopied(true);
                      toast.success("คัดลอกรหัสคำสั่งซื้อแล้ว นำไปแจ้งเจ้าหน้าที่ทาง LINE ได้เลย");
                      setTimeout(() => setCopied(false), 2500);
                    }}
                    className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-sans text-indigo-700 hover:bg-indigo-100"
                    title="คัดลอกเลขอ้างอิง"
                  >
                    {copied ? <LuCheck className="size-3 text-emerald-600" /> : <LuCopy className="size-3" />}
                    <span>{copied ? "คัดลอกแล้ว" : "คัดลอก"}</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/80 pt-2">
                <span className="text-xs text-slate-500">LINE Official:</span>
                <strong className="text-xs text-emerald-700 font-semibold">
                  @studyunith
                </strong>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-500">
              <p>1. แจ้งชื่อ-นามสกุล และรหัสคำสั่งซื้อ <code>{lineModalPurchase.ref}</code></p>
              <p>2. แจ้งเวลาที่เกิดปัญหาและแนบภาพถ่ายหน้าจอหลักฐาน</p>
              <p>3. เจ้าหน้าที่จะเปิดเคสและอนุมัติสิทธิ์สอบใหม่ให้ในระบบโดยตรง</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={() => setLineModalPurchase(null)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              ปิด
            </button>
            <a
              href="https://line.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              <LuMessageSquare className="size-4" />
              <span>เปิด LINE @studyunith</span>
            </a>
          </div>
        </section>
      </div>
    </WebBModalPortal>
  )}
  </PublicShell>;
}
