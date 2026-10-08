"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { PublicShell } from "./PublicShell";
import { WEBB_PRODUCTS, formatBaht } from "./data";
import {
  DEMO_AUTH_KEY,
  productAvailability,
  productIsOwnedOrOverlapping,
  readDemoAccount,
  readCurrentDemoPurchases,
  type DemoPurchase,
} from "./demo-store";

export default function WebBProductCatalog() {
  const [purchases, setPurchases] = useState<DemoPurchase[]>([]);
  const [available, setAvailable] = useState<Map<string, boolean>>(new Map());
  const [loggedIn, setLoggedIn] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);

  useEffect(() => {
    setPurchases(readCurrentDemoPurchases());
    setAvailable(productAvailability());
    setLoggedIn(localStorage.getItem(DEMO_AUTH_KEY) === "true");
    setHasAccount(!!readDemoAccount());
  }, []);

  const items = useMemo(() => WEBB_PRODUCTS.map((product) => ({
    ...product,
    available: available.get(product.id) !== false,
    duplicate: productIsOwnedOrOverlapping(product.id, purchases),
  })), [available, purchases]);

  return <PublicShell><main className="wb-inner-page wb-catalog-page"><div className="webb-container">
    <header className="webb-page-head"><div><h1>เลือกซื้อชุดข้อสอบ</h1><p>เลือกได้หลายชุด สิทธิ์สอบที่ซื้อแล้วจะอยู่ในบัญชีของคุณ</p></div>{loggedIn && <Link href="/webb/status">รายการที่ซื้อแล้วของฉัน →</Link>}</header>
    {!loggedIn && <aside className="wb-catalog-login-note"><b>{hasAccount ? "เข้าสู่ระบบก่อนซื้อ" : "สมัครสมาชิกก่อนซื้อ"}</b><span>การซื้อจะบันทึกในบัญชีและเก็บข้อมูลผู้สมัคร ณ วันที่ซื้อ</span><Link href={hasAccount ? "/webb/login" : "/webb/register"}>{hasAccount ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</Link></aside>}
    <div className="wb-catalog-grid">{items.map((product) => {
      const disabled = !product.available || product.duplicate;
      const reason = !product.available ? "ยังไม่เปิดขาย" : product.duplicate ? "มีสิทธิ์ชุดนี้หรือวิชาที่รวมอยู่แล้ว" : !loggedIn ? hasAccount ? "เข้าสู่ระบบเพื่อซื้อ" : "สมัครก่อนซื้อ" : "พร้อมซื้อ";
      return <article className={`wb-catalog-card${disabled ? " is-disabled" : ""}`} key={product.id}>
        <div className={`wb-catalog-cover wb-cover-${product.id}`} style={{ "--cover-accent": product.color } as CSSProperties & Record<"--cover-accent", string>}>
          <Image src="/images/webb/product-cover-students.webp" alt={`ภาพปกชุดข้อสอบ ${product.name}`} fill sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw" />
          <span className="wb-catalog-cover-shade" />
          <span className="wb-catalog-cover-brand">STUDY UNITH <i>·</i> TGAT PRACTICE</span>
          <span className="wb-catalog-cover-title">{product.name}</span>
          <span className="wb-catalog-cover-subtitle">{product.parts}</span>
          <span className="wb-catalog-cover-edition">MOCK EXAM <b>2026</b></span>
          <span className={`wb-catalog-cover-status${disabled ? " is-disabled" : ""}`}>{product.duplicate ? "มีสิทธิ์แล้ว" : !product.available ? "ปิดขาย" : "พร้อมสอบ"}</span>
        </div>
        <div className="wb-catalog-card-top"><span style={{ backgroundColor: product.color }} /> <small>{reason}</small></div>
        <div className="wb-catalog-code">{product.name}</div>
        <h2>{product.parts}</h2><p>{product.description}</p>
        <div className="wb-catalog-price"><strong>{formatBaht(product.price)}</strong><small>สิทธิ์สอบ 1 ครั้ง · ดูวิดีโอเฉลยได้ตลอด</small></div>
        {disabled ? <button type="button" disabled>{product.duplicate ? "ซื้อซ้ำไม่ได้" : "ยังไม่เปิดขาย"}</button> : !loggedIn ? <Link href={hasAccount ? "/webb/login" : "/webb/register"}>{hasAccount ? "เข้าสู่ระบบก่อนซื้อ" : "สมัครก่อนซื้อ"} <span>→</span></Link> : <Link href={`/webb/checkout?product=${product.id}`}>เลือกชุดนี้ <span>→</span></Link>}
      </article>;
    })}</div>
    {loggedIn && <aside className="wb-catalog-purchase-summary"><div><b>ซื้อไปแล้ว {purchases.length} รายการ</b><span>ประวัติการซื้อและสิทธิ์สอบของคุณ</span></div><Link href="/webb/status">ดูรายการที่ซื้อแล้ว</Link></aside>}
  </div></main></PublicShell>;
}
