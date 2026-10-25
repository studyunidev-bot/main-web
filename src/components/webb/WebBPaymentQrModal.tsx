"use client";

import { QRCodeSVG } from "qrcode.react";
import { LuX } from "react-icons/lu";

const qrCenterMark = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="5" fill="#123e65"/><path d="M8 7h11a5 5 0 0 1 5 5v8h-5v-8H8v13h8v5H8a5 5 0 0 1-5-5V12a5 5 0 0 1 5-5Z" fill="white"/><path d="M15 16h6v7l8 7H15V16Z" fill="#26b6ab"/></svg>',
)}`;

type WebBPaymentQrModalProps = {
  checkoutRef: string;
  totalPrice: number;
  remainingSeconds: number;
  onClose: () => void;
  onDownload: () => void;
  onSimulatePaid: () => void;
};

export default function WebBPaymentQrModal({
  checkoutRef,
  totalPrice,
  remainingSeconds,
  onClose,
  onDownload,
  onSimulatePaid,
}: WebBPaymentQrModalProps) {
  const isExpired = remainingSeconds <= 0;
  const remainingTime = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  return (
    <div className="wb-subject-payment-overlay">
      <button
        type="button"
        className="wb-subject-payment-backdrop"
        aria-label="ปิดหน้าชำระเงิน"
        onClick={onClose}
      />
      <section
        className="wb-subject-payment-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wb-subject-payment-title"
      >
        <button
          type="button"
          className="wb-subject-payment-close"
          aria-label="ปิด"
          onClick={onClose}
        >
          <LuX aria-hidden="true" className="size-5" />
        </button>

        <h2 id="wb-subject-payment-title">สแกน QR เพื่อชำระเงิน</h2>
        <p className="wb-subject-payment-intro">
          ชำระเงินผ่านแอปพลิเคชันได้ทุกธนาคาร
          <br />
          ดูวิธีชำระเงินด้านล่าง
        </p>

        <div className="wb-subject-qr-card">
          <div className="wb-subject-qr-brand" aria-label="THAI QR PAYMENT">
            <span className="wb-subject-qr-brand-logo" aria-hidden="true" />
          </div>

          <div className="wb-subject-qr-content">
            <span
              className={`wb-subject-qr-expiry${isExpired ? " is-expired" : ""}`}
              role="timer"
              aria-live="off"
            >
              {isExpired ? "หมดเวลาชำระเงิน" : `ชำระภายใน ${remainingTime} นาที`}
            </span>
            <QRCodeSVG
              id="webb-demo-order-qr"
              className="wb-subject-qr-code"
              value={`STUDYUNITH-DEMO|${checkoutRef}|${totalPrice}`}
              size={128}
              level="H"
              imageSettings={{ src: qrCenterMark, width: 26, height: 26, excavate: true }}
              title={`QR ข้อมูลคำสั่งซื้อทดลอง ${checkoutRef} ยอด ${totalPrice} บาท ไม่ใช่ QR ชำระเงินจริง`}
            />
            <strong className="wb-subject-qr-payee">บริษัทเรียนต่อมหาลัย จำกัด</strong>
            <p className="wb-subject-qr-note">
              รองรับทุกแอปธนาคาร · ระบบจะยืนยันการชำระอัตโนมัติ
            </p>
            <p className="wb-subject-qr-amount">
              ยอดที่ต้องชำระ <b>{totalPrice} บาท</b>
            </p>
            <button type="button" className="wb-subject-qr-download" onClick={onDownload} disabled={isExpired}>
              ดาวน์โหลด QR Code
            </button>
          </div>
        </div>

        <div className="wb-subject-payment-instructions">
          <strong>วิธีชำระเงินง่ายๆ</strong>
          <ol>
            <li>เปิดแอปธนาคาร แล้วเลือกสแกน QR</li>
            <li>ตรวจสอบยอดเงินให้ตรง แล้วกดชำระ</li>
            <li>ยืนยันการชำระเงิน</li>
          </ol>
        </div>
        <button
          type="button"
          className="wb-subject-payment-simulate"
          onClick={onSimulatePaid}
          disabled={isExpired}
        >
          {isExpired ? "หมดเวลาชำระเงิน" : "จำลองชำระเงินแล้ว"}
        </button>
      </section>
    </div>
  );
}
