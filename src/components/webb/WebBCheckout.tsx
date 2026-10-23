"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBaht, type ExamProduct } from "./data";
import { PublicShell } from "./PublicShell";
import { WebBImage } from "./WebBImage";
import WebBPaymentSuccess from "./WebBPaymentSuccess";
import WebBPaymentQrModal from "./WebBPaymentQrModal";
import { getExamPlan } from "./exam-documents";
import {
  createDemoOrder,
  DEMO_AUTH_KEY,
  getProductPrice,
  isDemoContentPublished,
  isDemoSalesOpen,
  isDemoStudentSuspended,
  productAvailability,
  productIsOwnedOrOverlapping,
  readDemoAccount,
  readCurrentDemoPurchases,
  readDemoOrders,
  readDemoPurchases,
  setDemoOrderStatus,
  type DemoPurchase,
  type DemoStudentProfile,
} from "./demo-store";

export default function WebBCheckout({ product }: { product: ExamProduct }) {
  const [payment, setPayment] = useState<"qr" | "card">("qr");
  const [account, setAccount] = useState<DemoStudentProfile | null>(null);
  const [purchases, setPurchases] = useState<DemoPurchase[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [available, setAvailable] = useState(true);
  const [basePrice, setBasePrice] = useState(product.price);
  const [completed, setCompleted] = useState<DemoPurchase | null>(null);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [checkoutRef, setCheckoutRef] = useState(() => `DO-${new Date().getFullYear() + 543}-${String(Date.now()).slice(-6)}`);
  const [paymentDeadline, setPaymentDeadline] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const total = basePrice + Math.ceil(basePrice * 0.1);

  useEffect(() => {
    setAccount(readDemoAccount());
    setPurchases(readCurrentDemoPurchases());
    setLoggedIn(localStorage.getItem(DEMO_AUTH_KEY) === "true");
    const refreshCatalog = () => {
      setAvailable(isDemoSalesOpen() && productAvailability().get(product.id) !== false && isDemoContentPublished(product.id));
      setBasePrice(getProductPrice(product.id));
    };
    refreshCatalog();
    window.addEventListener("webb-demo-products-updated", refreshCatalog);
    window.addEventListener("storage", refreshCatalog);
    return () => {
      window.removeEventListener("webb-demo-products-updated", refreshCatalog);
      window.removeEventListener("storage", refreshCatalog);
    };
  }, [product.id]);

  useEffect(() => {
    const orders = readDemoOrders().filter((order) => order.profileSnapshot.username.toLowerCase() === account?.username.toLowerCase() && order.items.some((item) => item.productId === product.id));
    const paid = orders.find((order) => order.status === "สำเร็จ");
    if (paid) {
      setCheckoutRef(paid.ref);
      finishPayment(paid.ref);
      return;
    }
    const pending = orders.find((order) => order.status === "รอชำระ");
    if (!pending) return;
    if (pending.expiresAt <= Date.now()) {
      setDemoOrderStatus(pending.ref, "หมดอายุ");
      return;
    }
    setCheckoutRef(pending.ref);
    finishPayment(pending.ref);
  }, [account?.username, product.id]);

  useEffect(() => {
    if (paymentDeadline === null) return;
    const update = () => {
      const seconds = Math.max(0, Math.ceil((paymentDeadline - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) {
        setDemoOrderStatus(checkoutRef, "หมดอายุ");
        window.clearInterval(timer);
      }
    };
    const timer = window.setInterval(update, 1000);
    update();
    return () => window.clearInterval(timer);
  }, [paymentDeadline, checkoutRef]);

  useEffect(() => {
    const refreshOrder = () => {
      const order = readDemoOrders().find((row) => row.ref === checkoutRef);
      if (!order) return;
      if (order.status === "สำเร็จ") {
        setShowPaymentQR(false);
        if (!completed) finishPayment(order.ref);
      } else if (order.status !== "รอชำระ") {
        setShowPaymentQR(false);
      }
    };
    window.addEventListener("storage", refreshOrder);
    window.addEventListener("webb-demo-orders-updated", refreshOrder);
    return () => {
      window.removeEventListener("storage", refreshOrder);
      window.removeEventListener("webb-demo-orders-updated", refreshOrder);
    };
  }, [checkoutRef, completed]);

  const duplicate = productIsOwnedOrOverlapping(product.id, purchases);
  const hasExamFile = getExamPlan(product.id, "A").hasSuppliedExam && isDemoContentPublished(product.id);
  const suspended = !!account && isDemoStudentSuspended(account.username, account.email);
  const canPay = !!account && loggedIn && available && hasExamFile && !duplicate && !suspended;

  function payDemo() {
    if (!canPay || !account || isDemoStudentSuspended(account.username, account.email) || !isDemoSalesOpen() || productAvailability().get(product.id) === false || !getExamPlan(product.id, "A").hasSuppliedExam) return;
    const now = new Date();
    const existingPending = readDemoOrders().find((order) => order.status === "รอชำระ" && order.profileSnapshot.username.toLowerCase() === account.username.toLowerCase() && order.items.some((item) => item.productId === product.id));
    if (existingPending && existingPending.expiresAt > now.getTime()) {
      setCheckoutRef(existingPending.ref);
      finishPayment(existingPending.ref);
      return;
    }
    if (existingPending) setDemoOrderStatus(existingPending.ref, "หมดอายุ");
    const ref = `DO-${now.getFullYear() + 543}-${String(Date.now()).slice(-6)}`;
    const profileSnapshot = {
      username: account.username,
      citizenId: account.citizenId,
      firstName: account.firstName,
      lastName: account.lastName,
      phone: account.phone,
      email: account.email,
      province: account.province,
      school: account.school,
      education: account.education,
    };
    const method = payment === "qr" ? "QR Payment · Demo" : "Credit card · Demo";
    const order = createDemoOrder({
      ref,
      profileSnapshot,
      items: [{ productId: product.id, baseAmount: basePrice, amount: total }],
      amount: total,
      method,
      status: "รอชำระ",
      createdAt: now.toISOString(),
      expiresAt: now.getTime() + (59 * 60 + 24) * 1000,
    });
    setCheckoutRef(order.ref);
    finishPayment(order.ref);
  }

  function finishPayment(ref: string) {
    const order = setDemoOrderStatus(ref, "สำเร็จ");
    if (!order) return;
    const row = readDemoPurchases().find((purchase) => purchase.orderRef === ref);
    if (!row) return;
    setPurchases(readCurrentDemoPurchases());
    const orderItem = order.items.find((item) => item.productId === product.id);
    setCompleted({ ...row, ref, amount: order.amount, baseAmount: orderItem?.baseAmount ?? row.baseAmount });
    localStorage.setItem("webb-demo-order", JSON.stringify({ ref, product: product.id, amount: order.amount, payment: order.method, date: order.paidAt, status: "ชำระเงินสำเร็จ (Demo)" }));
  }

  return (
    <PublicShell>
      <main className="webb-inner-page">
        <div className="webb-container">
          {!completed ? (
            <>
              <header className="webb-page-head">
                <div>
                  <h1>ยืนยันคำสั่งซื้อ</h1>
                  <p>ตรวจสอบชุดสอบและเลือกวิธีชำระเงินจำลอง</p>
                </div>
                <Link href="/webb/products">กลับไปเลือกชุดสอบ</Link>
              </header>
              <div className="webb-checkout-grid">
                <section className="webb-card">
                  <h2>สรุปชุดฝึกสอบ</h2>
                  <div className="webb-checkout-product">
                    <div className="webb-checkout-thumb">
                      <WebBImage className="webb-cover-image" />
                    </div>
                    <div>
                      <b>{product.name}</b>
                      <span>{product.parts}</span>
                      <small>สิทธิ์สอบ 1 ครั้ง · ดูวิดีโอเฉลยได้ตลอด</small>
                    </div>
                    <strong>{formatBaht(basePrice)}</strong>
                  </div>
                  <div className="webb-price-row">
                    <span>ราคาชุดสอบ</span>
                    <b>{formatBaht(basePrice)}</b>
                  </div>
                  <div className="webb-price-row">
                    <span>ส่วนเพิ่มราคาตัวอย่าง</span>
                    <b>{formatBaht(total - basePrice)}</b>
                  </div>
                  <div className="webb-price-row webb-price-total">
                    <span>ยอดชำระรวม</span>
                    <b>{formatBaht(total)}</b>
                  </div>
                  <h3 className="wb-snapshot-title">ข้อมูลผู้สมัครที่จะบันทึกกับรายการนี้</h3>
                  {account ? (
                    <div className="wb-snapshot-card">
                      <b>{account.firstName} {account.lastName}</b>
                      <span>{account.email} · {account.phone}</span>
                      <small>{account.school} · {account.province} · {account.education}</small>
                      <Link href="/webb/profile">แก้ไขข้อมูลก่อนซื้อ</Link>
                    </div>
                  ) : (
                    <p className="webb-muted">เข้าสู่ระบบเพื่อเลือกข้อมูลบัญชี</p>
                  )}
                  <p className="webb-muted">ข้อมูลชุดนี้จะเป็น Snapshot ของรายการที่ซื้อแล้ว การแก้ไขโปรไฟล์ภายหลังจะมีผลกับการซื้อครั้งถัดไปเท่านั้น</p>
                </section>
                <section className="webb-card">
                  <h2>เลือกวิธีชำระเงิน</h2>
                  <div className="webb-payment-options">
                    <button className={payment === "qr" ? "active" : ""} onClick={() => setPayment("qr")}>
                      ▦ <span><b>สแกนจ่าย QR</b><small>จำลองการชำระเงินผ่าน QR</small></span>
                    </button>
                    <button className={payment === "card" ? "active" : ""} onClick={() => setPayment("card")}>
                      ▤ <span><b>บัตรเครดิต</b><small>จำลองการชำระเงินด้วยบัตร</small></span>
                    </button>
                  </div>
                  {payment === "qr" ? (
                    <div className="webb-qr">
                      <div className="webb-qr-pattern">▦</div>
                      <b>QR สำหรับ Demo</b>
                      <span>ไม่มีการเรียกผู้ให้บริการจริง</span>
                    </div>
                  ) : (
                    <div className="webb-form-grid">
                      <label>หมายเลขบัตร<input placeholder="0000 0000 0000 0000" /></label>
                      <label>ชื่อบนบัตร<input placeholder="ชื่อ นามสกุล" /></label>
                      <label>วันหมดอายุ<input placeholder="MM/YY" /></label>
                      <label>รหัส CVV<input placeholder="•••" /></label>
                    </div>
                  )}
                  {!account && <p className="wb-checkout-warning">สมัครสมาชิกก่อนซื้อชุดข้อสอบ <Link href="/webb/register">สมัครสมาชิก →</Link></p>}
                  {account && !loggedIn && <p className="wb-checkout-warning">เข้าสู่ระบบเพื่อซื้อชุดข้อสอบ <Link href="/webb/login">เข้าสู่ระบบ →</Link></p>}
                  {suspended && <p className="wb-checkout-warning">บัญชีถูกระงับโดยผู้ดูแล จึงทำรายการซื้อไม่ได้ใน Demo</p>}
                  {duplicate && <p className="wb-checkout-warning">บัญชีนี้มีสิทธิ์ในวิชาที่รวมอยู่ในชุดนี้แล้ว <Link href="/webb/products">เลือกชุดอื่น →</Link></p>}
                  {!hasExamFile && <p className="wb-checkout-warning">ยังไม่มีไฟล์ข้อสอบและเฉลยสำหรับชุดนี้ <Link href="/webb/products">เลือก TGAT ชุดที่มีไฟล์ →</Link></p>}
                  {!available && <p className="wb-checkout-warning">สินค้านี้ยังไม่เปิดขาย <Link href="/webb/products">ดูสินค้าทั้งหมด →</Link></p>}
                  <button className="webb-button webb-button-primary webb-full" disabled={!canPay} onClick={payDemo}>{payment === "qr" ? "สร้าง QR และชำระเงินจำลอง" : `จำลองชำระ ${formatBaht(total)}`}</button>
                  {!available && <small className="wb-demo-only-note">ปิดการขายโดยผู้ดูแลระบบ</small>}
                </section>
              </div>
            </>
          ) : (
            <WebBPaymentSuccess
              orderRef={completed.ref}
              paidDate={completed.purchasedAt}
              paymentMethod={completed.payment}
              subjectsSummary={`${product.name} (${product.parts})`}
              totalAmount={completed.amount}
              homeHref="/webb"
              examHref="/webb/student?view=exam#exam-list"
            />
          )}
          {showPaymentQR && <WebBPaymentQrModal checkoutRef={checkoutRef} totalPrice={total} remainingSeconds={remainingSeconds} onClose={() => setShowPaymentQR(false)} onDownload={() => { const svg = document.getElementById("webb-demo-order-qr"); if (!svg) return; const url = URL.createObjectURL(new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${checkoutRef}-demo-qr.svg`; anchor.click(); URL.revokeObjectURL(url); }} onSimulatePaid={() => { if (paymentDeadline && Date.now() < paymentDeadline) { setShowPaymentQR(false); finishPayment(checkoutRef); } }} />}
        </div>
      </main>
    </PublicShell>
  );
}
