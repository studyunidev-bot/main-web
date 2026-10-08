"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProduct, formatBaht } from "./data";
import { PublicShell } from "./PublicShell";
import { DEMO_AUTH_KEY, readCurrentDemoPurchases, type DemoPurchase } from "./demo-store";

export default function WebBMyPurchases() {
  const [purchases, setPurchases] = useState<DemoPurchase[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    if (localStorage.getItem(DEMO_AUTH_KEY) !== "true") {
      window.location.replace("/webb/login");
      return;
    }
    setAuthChecked(true);
    setPurchases(readCurrentDemoPurchases());
    const refresh = () => setPurchases(readCurrentDemoPurchases());
    window.addEventListener("storage", refresh);
    window.addEventListener("webb-demo-purchases-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("webb-demo-purchases-updated", refresh);
    };
  }, []);

  if (!authChecked) return <main className="wb-inner-page" aria-busy="true" />;

  return <PublicShell><main className="webb-inner-page"><div className="webb-container">
    <header className="webb-page-head"><div><span className="webb-kicker">STUDY UNITH · บัญชีผู้เรียน</span><h1>รายการที่ซื้อแล้วของฉัน</h1><p>ประวัติคำสั่งซื้อ ข้อมูลผู้สมัคร ณ วันซื้อ และสิทธิ์ในแต่ละชุดข้อสอบ</p></div><Link href="/webb/products">＋ เลือกซื้อข้อสอบเพิ่ม</Link></header>
    {!purchases.length ? <section className="webb-card wb-purchase-empty"><span>▤</span><h2>ยังไม่มีรายการซื้อ</h2><p>เลือกชุดข้อสอบที่ต้องการเพื่อเพิ่มสิทธิ์ไว้ในบัญชี</p><Link className="webb-button webb-button-primary" href="/webb/products">ดูชุดข้อสอบ</Link></section> : <div className="wb-purchase-list">{purchases.map((purchase) => {
      const product = getProduct(purchase.productId);
      const submitted = purchase.examStatus === "submitted";
      const interrupted = purchase.examStatus === "interrupted";
      return <article className="webb-card wb-purchase-card" key={purchase.ref}>
        <div className="wb-purchase-heading"><div><span className="webb-kicker">{purchase.ref}</span><h2>{product.name}</h2><p>{product.parts}</p></div><strong>{formatBaht(purchase.amount)}</strong></div>
        <div className="wb-purchase-meta"><span>ซื้อเมื่อ <b>{purchase.purchasedAt}</b></span><span>ใบเสร็จ <b>{purchase.receipt}</b></span><span>ชำระผ่าน <b>{purchase.payment}</b></span></div>
        <details className="wb-purchase-snapshot"><summary>ข้อมูลผู้สมัครที่ใช้กับรายการนี้</summary><p>{purchase.profileSnapshot.firstName} {purchase.profileSnapshot.lastName} · {purchase.profileSnapshot.email} · {purchase.profileSnapshot.phone}</p><small>{purchase.profileSnapshot.school} · {purchase.profileSnapshot.province} · {purchase.profileSnapshot.education}</small></details>
        <div className="wb-purchase-rights"><span className={submitted || interrupted ? "is-used" : ""}>{submitted ? "สิทธิ์สอบใช้แล้ว" : interrupted ? "รออนุมัติสอบใหม่" : "สิทธิ์สอบพร้อมใช้งาน"}</span><span>วิดีโอเฉลย: ดูได้ตลอด</span></div>
        <div className="wb-purchase-actions">{submitted ? <><Link href={`/webb/solutions?product=${product.id}`}>ดูวิดีโอเฉลย →</Link><Link href={`/webb/results?product=${product.id}`}>ดูผลสอบ</Link></> : interrupted ? <span className="wb-purchase-wait">ติดต่อทีมช่วยเหลือเพื่อขอเปิดสอบใหม่</span> : <Link className="webb-button webb-button-primary" href={`/webb/rules?product=${product.id}&type=purchased&back=overview`}>เข้าสอบ</Link>}</div>
      </article>;
    })}</div>}
  </div></main></PublicShell>;
}
