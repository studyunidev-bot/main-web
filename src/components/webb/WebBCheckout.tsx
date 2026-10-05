"use client";

import Link from "next/link";
import { useState } from "react";
import { formatBaht, type ExamProduct } from "./data";
import { PublicShell } from "./PublicShell";
import { WebBImage } from "./WebBImage";

export default function WebBCheckout({ product }: { product: ExamProduct }) {
  const [payment, setPayment] = useState<"qr" | "card">("qr");
  const [notice, setNotice] = useState("");
  const total = product.price + Math.ceil(product.price * 0.1);
  function payDemo() {
    const order = {
      ref: "DO-2570-0001",
      product: product.id,
      amount: total,
      payment: payment === "qr" ? "QR Payment" : "Credit card",
      date: new Date().toLocaleDateString("th-TH", {
        timeZone: "Asia/Bangkok",
      }),
      status: "ชำระเงินสำเร็จ (Demo)",
    };
    localStorage.setItem("webb-demo-order", JSON.stringify(order));
    setNotice("ชำระเงินจำลองสำเร็จ · เพิ่มสิทธิ์สอบในบัญชี Demo แล้ว");
  }
  return (
    <PublicShell>
      <main className="webb-inner-page">
        <div className="webb-container">
          <header className="webb-page-head">
            <div>
              <span className="webb-kicker">STUDY UNITH · TGAT</span>
              <h1>ยืนยันคำสั่งซื้อ</h1>
              <p>ตรวจสอบชุดสอบและเลือกวิธีชำระเงินจำลอง</p>
            </div>
            <Link href="/webb#products">กลับไปเลือกชุดสอบ</Link>
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
                  <small>สิทธิ์ทำข้อสอบ 1 ครั้ง · Demo</small>
                </div>
                <strong>{formatBaht(product.price)}</strong>
              </div>
              <div className="webb-price-row">
                <span>ราคาชุดสอบ</span>
                <b>{formatBaht(product.price)}</b>
              </div>
              <div className="webb-price-row">
                <span>ส่วนเพิ่มราคาตัวอย่าง</span>
                <b>{formatBaht(total - product.price)}</b>
              </div>
              <div className="webb-price-row webb-price-total">
                <span>ยอดชำระรวม</span>
                <b>{formatBaht(total)}</b>
              </div>
              <p className="webb-muted">
                ตัวอย่าง: ราคาชุดสอบ 100 บาท + ส่วนเพิ่มตัวอย่าง 10 บาท = 110
                บาท ส่วนเพิ่มนี้ไม่ใช่อัตราค่าธรรมเนียมจริงของ Payso
              </p>
            </section>
            <section className="webb-card">
              <h2>เลือกวิธีชำระเงิน</h2>
              <div className="webb-payment-options">
                <button
                  className={payment === "qr" ? "active" : ""}
                  onClick={() => setPayment("qr")}
                >
                  ▦{" "}
                  <span>
                    <b>สแกนจ่าย QR</b>
                    <small>จำลองการชำระเงินผ่าน QR</small>
                  </span>
                </button>
                <button
                  className={payment === "card" ? "active" : ""}
                  onClick={() => setPayment("card")}
                >
                  ▤{" "}
                  <span>
                    <b>บัตรเครดิต</b>
                    <small>จำลองการชำระเงินด้วยบัตร</small>
                  </span>
                </button>
              </div>
              {payment === "qr" ? (
                <div className="webb-qr">
                  <div className="webb-qr-pattern">▦</div>
                  <b>QR สำหรับ Demo</b>
                  <span>ไม่มีการเรียก Payso จริง</span>
                </div>
              ) : (
                <div className="webb-form-grid">
                  <label>
                    หมายเลขบัตร
                    <input placeholder="0000 0000 0000 0000" />
                  </label>
                  <label>
                    ชื่อบนบัตร
                    <input placeholder="ชื่อ นามสกุล" />
                  </label>
                  <label>
                    วันหมดอายุ
                    <input placeholder="MM/YY" />
                  </label>
                  <label>
                    รหัส CVV
                    <input placeholder="•••" />
                  </label>
                </div>
              )}
              <button
                className="webb-button webb-button-primary webb-full"
                onClick={payDemo}
              >
                ยืนยันชำระ {formatBaht(total)}
              </button>
              {notice && (
                <p className="webb-success-note" role="status">
                  ✓ {notice} <Link href="/webb/student">ไปหน้าผู้เรียน →</Link>
                </p>
              )}
            </section>
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
