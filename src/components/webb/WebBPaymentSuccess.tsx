"use client";

import Link from "next/link";
import { formatBaht, formatThaiDateTime } from "./data";

export type WebBPaymentSuccessProps = {
  orderRef: string;
  paidDate?: string;
  paymentMethod?: string;
  subjectsSummary?: string;
  totalAmount: number;
  homeHref?: string;
  examHref?: string;
};

export default function WebBPaymentSuccess({
  orderRef,
  paidDate,
  paymentMethod = "QR Payment",
  subjectsSummary = "1 วิชา",
  totalAmount,
  homeHref = "/webb",
  examHref = "/webb/student?view=exam#exam-list",
}: WebBPaymentSuccessProps) {
  const isDemoOrder = paymentMethod.toLowerCase().includes("demo");
  const displayRef = orderRef.startsWith("#") ? orderRef : `#${orderRef}`;
  const displayDate =
    paidDate ||
    formatThaiDateTime();

  return (
    <section className="wb-payment-success-card" aria-label="ชำระเงินสำเร็จ">
      {/* Figma Illustration: Document with green check badge & sparkle stars */}
      <div className="wb-payment-success-icon-wrap" aria-hidden="true">
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Tilted Document Sheet */}
          <g transform="rotate(-6 48 48)">
            <rect
              x="22"
              y="16"
              width="50"
              height="64"
              rx="8"
              fill="#FFFFFF"
              stroke="#E2E8F0"
              strokeWidth="2"
            />
            {/* Document lines */}
            <line
              x1="30"
              y1="28"
              x2="52"
              y2="28"
              stroke="#CBD5E1"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="30"
              y1="36"
              x2="62"
              y2="36"
              stroke="#E2E8F0"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="30"
              y1="44"
              x2="62"
              y2="44"
              stroke="#E2E8F0"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="30"
              y1="52"
              x2="50"
              y2="52"
              stroke="#E2E8F0"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>

          {/* Green Circle Badge */}
          <circle
            cx="49"
            cy="44"
            r="23"
            fill="#22C55E"
            style={{ filter: "drop-shadow(0 4px 10px rgba(34, 197, 94, 0.35))" }}
          />

          {/* Checkmark */}
          <path
            d="M40 44.5L46.5 51L58.5 37"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Golden Sparkles */}
          <path
            d="M18 24L20 18L22 24L28 26L22 28L20 34L18 28L12 26L18 24Z"
            fill="#FBBF24"
            opacity="0.9"
            transform="scale(0.65) translate(4, 8)"
          />
          <path
            d="M74 16L75.5 11L77 16L82 17.5L77 19L75.5 24L74 19L69 17.5L74 16Z"
            fill="#FBBF24"
            opacity="0.9"
            transform="scale(0.7) translate(34, -2)"
          />
          <path
            d="M78 60L79.5 56L81 60L85 61.5L81 63L79.5 67L78 63L74 61.5L78 60Z"
            fill="#FBBF24"
            opacity="0.85"
            transform="scale(0.65) translate(44, 28)"
          />
          <circle cx="24" cy="58" r="3" fill="#FBBF24" opacity="0.8" />
          <circle cx="78" cy="38" r="2.5" fill="#FBBF24" opacity="0.8" />
        </svg>
      </div>

      <h1 className="wb-payment-success-title">ชำระเงินสำเร็จ</h1>
      <p className="wb-payment-success-sub">
        {isDemoOrder ? "บันทึกรายการทดลองแล้ว ไม่มีการชำระเงินจริงหรือเชื่อมต่อธนาคาร" : "การสมัครสอบเสร็จสมบูรณ์แล้ว คุณสามารถเข้าสู่ห้องสอบได้ทันที"}
      </p>

      <p className="wb-payment-success-ref">
        หมายเลขคำสั่งซื้อ: <span>{displayRef}</span>
      </p>

      {/* Summary Box */}
      <div className="wb-payment-success-summary">
        <div className="wb-payment-summary-row">
          <span className="wb-summary-label">{isDemoOrder ? "วันที่ทำรายการ" : "วันที่ชำระ"}</span>
          <span className="wb-summary-value">{displayDate}</span>
        </div>
        <div className="wb-payment-summary-row">
          <span className="wb-summary-label">ช่องทางชำระ</span>
          <span className="wb-summary-value">{paymentMethod}</span>
        </div>
        <div className="wb-payment-summary-row">
          <span className="wb-summary-label">วิชาที่สมัคร</span>
          <span className="wb-summary-value">{subjectsSummary}</span>
        </div>
        <div className="wb-payment-summary-divider" />
        <div className="wb-payment-summary-row wb-payment-summary-total">
          <span className="wb-summary-label">{isDemoOrder ? "ยอดตัวอย่าง" : "ยอดชำระ"}</span>
          <span className="wb-summary-value wb-total-amount">
            {formatBaht(totalAmount)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="wb-payment-success-actions">
        <Link href={homeHref} className="wb-payment-btn-home">
          กลับสู่หน้าหลัก
        </Link>
        <Link href={examHref} className="wb-payment-btn-exam">
          เข้าสู่ห้องสอบ <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
