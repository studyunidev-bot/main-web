"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBaht, type ExamProduct } from "./data";
import { PublicShell } from "./PublicShell";
import { WebBImage } from "./WebBImage";
import {
  addDemoEmail,
  DEMO_AUTH_KEY,
  DEMO_PURCHASES_KEY,
  productAvailability,
  productIsOwnedOrOverlapping,
  readDemoAccount,
  readCurrentDemoPurchases,
  readDemoPurchases,
  safeWrite,
  type DemoPurchase,
  type DemoStudentProfile,
} from "./demo-store";

export default function WebBCheckout({ product }: { product: ExamProduct }) {
  const [payment, setPayment] = useState<"qr" | "card">("qr");
  const [account, setAccount] = useState<DemoStudentProfile | null>(null);
  const [purchases, setPurchases] = useState<DemoPurchase[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [available, setAvailable] = useState(true);
  const [completed, setCompleted] = useState<DemoPurchase | null>(null);
  const total = product.price + Math.ceil(product.price * 0.1);

  useEffect(() => {
    setAccount(readDemoAccount());
    setPurchases(readCurrentDemoPurchases());
    setLoggedIn(localStorage.getItem(DEMO_AUTH_KEY) === "true");
    setAvailable(productAvailability().get(product.id) !== false);
  }, [product.id]);

  const duplicate = productIsOwnedOrOverlapping(product.id, purchases);
  const canPay = !!account && loggedIn && available && !duplicate;

  function payDemo() {
    if (!canPay || !account) return;
    const now = new Date();
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
    const row: DemoPurchase = {
      ref,
      productId: product.id,
      amount: total,
      baseAmount: product.price,
      payment: payment === "qr" ? "QR Payment · Demo" : "Credit card · Demo",
      purchasedAt: now.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
      purchasedAtIso: now.toISOString(),
      receipt: `RC-${ref}`,
      profileSnapshot,
      examStatus: "available",
      attempts: 0,
    };
    const next = [...readDemoPurchases(), row];
    setPurchases(next);
    setCompleted(row);
    safeWrite(DEMO_PURCHASES_KEY, next);
    localStorage.setItem("webb-demo-order", JSON.stringify({ ref, product: product.id, amount: total, payment: row.payment, date: row.purchasedAt, status: "ชำระเงินสำเร็จ (Demo)" }));
    addDemoEmail(account.email, `ใบเสร็จรับเงินอิเล็กทรอนิกส์ ${row.receipt}`, `รับชำระเงิน ${formatBaht(total)} สำหรับ ${product.name} · เลขคำสั่งซื้อ ${ref} (อีเมลนี้เป็นการจำลอง)`);
  }

  return <PublicShell><main className="webb-inner-page"><div className="webb-container">
    <header className="webb-page-head"><div><span className="webb-kicker">STUDY UNITH · TGAT</span><h1>{completed ? "ชำระเงินสำเร็จ" : "ยืนยันคำสั่งซื้อ"}</h1><p>{completed ? "ระบบจำลองส่งใบเสร็จอิเล็กทรอนิกส์ไปยังอีเมลของคุณแล้ว" : "ตรวจสอบชุดสอบและเลือกวิธีชำระเงินจำลอง"}</p></div><Link href={completed ? "/webb/status" : "/webb/products"}>{completed ? "รายการที่ซื้อแล้วของฉัน →" : "กลับไปเลือกชุดสอบ"}</Link></header>
    {!completed ? <div className="webb-checkout-grid">
      <section className="webb-card"><h2>สรุปชุดฝึกสอบ</h2><div className="webb-checkout-product"><div className="webb-checkout-thumb"><WebBImage className="webb-cover-image" /></div><div><b>{product.name}</b><span>{product.parts}</span><small>สิทธิ์สอบ 1 ครั้ง · ดูวิดีโอเฉลยได้ตลอด</small></div><strong>{formatBaht(product.price)}</strong></div>
        <div className="webb-price-row"><span>ราคาชุดสอบ</span><b>{formatBaht(product.price)}</b></div><div className="webb-price-row"><span>ส่วนเพิ่มราคาตัวอย่าง</span><b>{formatBaht(total - product.price)}</b></div><div className="webb-price-row webb-price-total"><span>ยอดชำระรวม</span><b>{formatBaht(total)}</b></div>
        <h3 className="wb-snapshot-title">ข้อมูลผู้สมัครที่จะบันทึกกับรายการนี้</h3>
        {account ? <div className="wb-snapshot-card"><b>{account.firstName} {account.lastName}</b><span>{account.email} · {account.phone}</span><small>{account.school} · {account.province} · {account.education}</small><Link href="/webb/profile">แก้ไขข้อมูลก่อนซื้อ</Link></div> : <p className="webb-muted">เข้าสู่ระบบเพื่อเลือกข้อมูลบัญชี</p>}
        <p className="webb-muted">ข้อมูลชุดนี้จะเป็น Snapshot ของรายการที่ซื้อแล้ว การแก้ไขโปรไฟล์ภายหลังจะมีผลกับการซื้อครั้งถัดไปเท่านั้น</p>
      </section>
      <section className="webb-card"><h2>เลือกวิธีชำระเงิน</h2>
        <div className="webb-payment-options"><button className={payment === "qr" ? "active" : ""} onClick={() => setPayment("qr")}>▦ <span><b>สแกนจ่าย QR</b><small>จำลองการชำระเงินผ่าน QR</small></span></button><button className={payment === "card" ? "active" : ""} onClick={() => setPayment("card")}>▤ <span><b>บัตรเครดิต</b><small>จำลองการชำระเงินด้วยบัตร</small></span></button></div>
        {payment === "qr" ? <div className="webb-qr"><div className="webb-qr-pattern">▦</div><b>QR สำหรับ Demo</b><span>ไม่มีการเรียกผู้ให้บริการจริง</span></div> : <div className="webb-form-grid"><label>หมายเลขบัตร<input placeholder="0000 0000 0000 0000" /></label><label>ชื่อบนบัตร<input placeholder="ชื่อ นามสกุล" /></label><label>วันหมดอายุ<input placeholder="MM/YY" /></label><label>รหัส CVV<input placeholder="•••" /></label></div>}
        {!account && <p className="wb-checkout-warning">สมัครสมาชิกก่อนซื้อชุดข้อสอบ <Link href="/webb/register">สมัครสมาชิก →</Link></p>}
        {account && !loggedIn && <p className="wb-checkout-warning">เข้าสู่ระบบเพื่อซื้อชุดข้อสอบ <Link href="/webb/login">เข้าสู่ระบบ →</Link></p>}
        {duplicate && <p className="wb-checkout-warning">บัญชีนี้มีสิทธิ์ในวิชาที่รวมอยู่ในชุดนี้แล้ว <Link href="/webb/products">เลือกชุดอื่น →</Link></p>}
        {!available && <p className="wb-checkout-warning">สินค้านี้ยังไม่เปิดขาย <Link href="/webb/products">ดูสินค้าทั้งหมด →</Link></p>}
        <button className="webb-button webb-button-primary webb-full" disabled={!canPay} onClick={payDemo}>ยืนยันชำระ {formatBaht(total)}</button>
        {!available && <small className="wb-demo-only-note">ปิดการขายโดยผู้ดูแลระบบ</small>}
      </section>
    </div> : <section className="webb-card wb-checkout-success"><span>✓</span><h2>ขอบคุณที่สั่งซื้อ</h2><p>เลขคำสั่งซื้อ <b>{completed.ref}</b></p><p>ใบเสร็จอิเล็กทรอนิกส์ <b>{completed.receipt}</b></p><p>ส่งไปยัง <b>{completed.profileSnapshot.email}</b> · จำลองการส่งอีเมลแล้ว</p><div className="wb-checkout-success-actions"><Link className="webb-button webb-button-primary" href={`/webb/rules?product=${completed.productId}&type=purchased&back=overview`}>เริ่มทำข้อสอบ</Link><Link className="webb-button webb-button-secondary" href="/webb/status">รายการที่ซื้อแล้วของฉัน</Link></div></section>}
  </div></main></PublicShell>;
}
