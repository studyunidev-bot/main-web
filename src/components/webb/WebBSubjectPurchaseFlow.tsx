"use client";

import Link from "next/link";
import { useEffect, useState, useMemo, type ReactNode } from "react";
import WebBPaymentQrModal from "./WebBPaymentQrModal";
import WebBPaymentSuccess from "./WebBPaymentSuccess";
import { getExamPlan } from "./exam-documents";
import {
  createDemoOrder,
  DEMO_ACCOUNT_KEY,
  DEMO_AUTH_KEY,
  DEMO_PROFILE_KEY,
  getProductPrice,
  isDemoSalesOpen,
  isDemoContentPublished,
  isDemoStudentSuspended,
  productAvailability,
  readDemoOrders,
  readDemoAccount,
  readCurrentDemoPurchases,
  readDemoPurchases,
  setDemoOrderStatus,
  safeWrite,
  type DemoPurchase,
} from "./demo-store";

export type WebBSubjectPurchaseFlowProps = {
  isExistingUser?: boolean;
  onBackToSignupStep?: () => void;
  onProgressChange?: (percent: number) => void;
};

function UnavailableSubjectGroup({
  id,
  title,
  subjects,
  expandedDetails,
  onToggle,
  pickCheck,
}: {
  id: string;
  title: string;
  subjects: [string, string][];
  expandedDetails: string[];
  onToggle: (id: string) => void;
  pickCheck: (on: boolean, disabled?: boolean) => ReactNode;
}) {
  const expanded = expandedDetails.includes(id);
  return <section className="wb-pick-card wb-pick-unavailable-card">
    <button type="button" className="wb-pick-group-toggle" aria-expanded={expanded} onClick={() => onToggle(id)}>
      {pickCheck(false, true)}
      <span><strong>{title}</strong><small>{subjects.length} วิชา · ยังไม่เปิดให้บริการ</small></span>
      <b aria-hidden="true">{expanded ? "⌃" : "⌄"}</b>
    </button>
    {expanded && <div className="wb-pick-subject-details">{subjects.map(([name, info]) => <article key={name}>
      {pickCheck(false, true)}
      <strong>{name}</strong>
      <span>⏱ {info.split(" · ")[0]} · 📝 {info.split(" · ")[1]} · ยังไม่เปิดให้บริการ</span>
    </article>)}</div>}
  </section>;
}

export default function WebBSubjectPurchaseFlow({
  isExistingUser = true,
  onBackToSignupStep,
  onProgressChange,
}: WebBSubjectPurchaseFlowProps) {
  // Step 3 = subject and set selection, 5 = review, 6 = success
  const [subStep, setSubStep] = useState<3 | 5 | 6>(3);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [, setCatalogRevision] = useState(0);
  const [paymentDeadline, setPaymentDeadline] = useState<number | null>(null);
  const [paymentSecondsRemaining, setPaymentSecondsRemaining] = useState<number | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<string[]>([]);
  const [expandedDetails, setExpandedDetails] = useState<string[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<DemoPurchase | null>(null);

  // Already owned sets (only applicable for existing users)
  const [ownedSets, setOwnedSets] = useState<Record<string, string[]>>({});
  const [ownedOther, setOwnedOther] = useState<Record<string, boolean>>({
    alevel: false,
    netsat: false,
  });

  // Newly selected sets
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedSets, setSelectedSets] = useState<Record<string, string[]>>({
    tgat: [],
    tpat1: [],
    tpat2: [],
    tpat3: [],
    tpat4: [],
  });

  const [otherSelected, setOtherSelected] = useState<Record<string, boolean>>({
    alevel: false,
    netsat: false,
  });

  const [notice, setNotice] = useState("");
  const [checkoutRef, setCheckoutRef] = useState(() => `DO-${new Date().getFullYear() + 543}-${String(Date.now()).slice(-6)}`);
  const tgatSetPrice = getProductPrice("tgat-full");
  const tgatAvailable = isDemoSalesOpen() && productAvailability().get("tgat-full") !== false && isDemoContentPublished("tgat-full");

  useEffect(() => {
    const refreshCatalog = () => setCatalogRevision((revision) => revision + 1);
    window.addEventListener("webb-demo-products-updated", refreshCatalog);
    window.addEventListener("storage", refreshCatalog);
    return () => {
      window.removeEventListener("webb-demo-products-updated", refreshCatalog);
      window.removeEventListener("storage", refreshCatalog);
    };
  }, []);

  useEffect(() => {
    const account = readDemoAccount();
    const pending = [...readDemoOrders()].find((order) => order.status === "รอชำระ" && (!account || order.profileSnapshot.username.toLowerCase() === account.username.toLowerCase()));
    if (!pending) return;
    if (pending.expiresAt <= Date.now()) {
      setDemoOrderStatus(pending.ref, "หมดอายุ");
      return;
    }
    setCheckoutRef(pending.ref);
    setPaymentDeadline(pending.expiresAt);
    setPaymentSecondsRemaining(Math.ceil((pending.expiresAt - Date.now()) / 1000));
    const restoredSets = pending.items.reduce<Record<string, string[]>>((sets, item) => {
      if (item.examSet) sets.tgat = [...(sets.tgat || []), item.examSet];
      return sets;
    }, {});
    setSelectedSets((current) => ({ ...current, ...restoredSets }));
    if (restoredSets.tgat?.length) setSelectedSubjects((current) => current.includes("tgat") ? current : [...current, "tgat"]);
    setShowPaymentQR(true);
  }, []);

  useEffect(() => {
    if (paymentDeadline === null || subStep === 6) return;
    let timer = 0;
    const updateRemainingTime = () => {
      const seconds = Math.max(0, Math.ceil((paymentDeadline - Date.now()) / 1000));
      setPaymentSecondsRemaining(seconds);
      if (seconds === 0) {
        setDemoOrderStatus(checkoutRef, "หมดอายุ");
        window.clearInterval(timer);
      }
    };
    timer = window.setInterval(updateRemainingTime, 1000);
    updateRemainingTime();
    return () => window.clearInterval(timer);
  }, [paymentDeadline, subStep, checkoutRef]);

  useEffect(() => {
    const refreshOrder = () => {
      const order = readDemoOrders().find((row) => row.ref === checkoutRef);
      if (!order) return;
      if (order.status === "สำเร็จ") {
        if (subStep !== 6 && !completedOrder) handleCompletePayment();
      } else if (order.status !== "รอชำระ") {
        setShowPaymentQR(false);
        setNotice(`คำสั่งซื้อ ${order.status.toLowerCase()} แล้ว`);
      }
    };
    window.addEventListener("storage", refreshOrder);
    window.addEventListener("webb-demo-orders-updated", refreshOrder);
    return () => {
      window.removeEventListener("storage", refreshOrder);
      window.removeEventListener("webb-demo-orders-updated", refreshOrder);
    };
  }, [checkoutRef, subStep, completedOrder]);

  useEffect(() => {
    const isAuth = localStorage.getItem(DEMO_AUTH_KEY) === "true";
    setLoggedIn(isAuth);

    // Read incoming subject and set from URL query params or localStorage
    let targetSubject: string | null = null;
    let targetSet: string | null = null;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      targetSubject = params.get("subject")?.toLowerCase() || null;
      targetSet = params.get("set")?.toUpperCase() || null;

      if (!targetSubject) {
        try {
          const saved = localStorage.getItem("webb-intended-subject");
          if (saved) {
            const parsed = JSON.parse(saved);
            targetSubject = parsed.subject?.toLowerCase() || null;
            targetSet = parsed.set?.toUpperCase() || null;
          }
        } catch {
          /* ignore */
        }
      }
    }

    const validSets = ["A"];
    const chosenSet = targetSet && validSets.includes(targetSet) ? targetSet : "A";

    if (isExistingUser) {
      // Build owned sets from purchases and localStorage
      const currentPurchases = readCurrentDemoPurchases();
      const owned: Record<string, string[]> = {};
      const otherOwned: Record<string, boolean> = { alevel: false, netsat: false };

      try {
        const customOwned = localStorage.getItem("webb-demo-purchased-sets");
        if (customOwned) {
          const parsed = JSON.parse(customOwned);
          Object.keys(parsed).forEach((key) => {
            if (Array.isArray(parsed[key])) {
              owned[key] = Array.from(new Set([...(owned[key] || []), ...parsed[key]]));
            } else if (typeof parsed[key] === "boolean") {
              otherOwned[key] = parsed[key];
            }
          });
        }
      } catch {
        /* ignore */
      }

      // Also parse from currentPurchases product IDs if available
      currentPurchases.forEach((p) => {
        const id = p.productId.toLowerCase();
        const examSet = p.examSet || "A";
        if (["tgat", "tgat-full", "tgat1", "tgat2", "tgat3", "tgat23"].includes(id)) {
          owned.tgat = Array.from(new Set([...(owned.tgat || []), examSet]));
        }
        if (["tpat1", "tpat2", "tpat3", "tpat4"].includes(id)) {
          owned[id] = Array.from(new Set([...(owned[id] || []), examSet]));
        }
        if (id.includes("alevel")) otherOwned.alevel = true;
        if (id.includes("netsat")) otherOwned.netsat = true;
      });

      // If user navigated specifically to buy targetSubject and chosenSet,
      // it must not be marked as owned or disabled so they can purchase it
      if (targetSubject && owned[targetSubject]) {
        owned[targetSubject] = owned[targetSubject].filter((s) => s !== chosenSet);
      }

      setOwnedSets(owned);
      setOwnedOther(otherOwned);
    }

    // Auto-select the target subject and set
    if (targetSubject) {
      if (targetSubject === "tgat") {
        setSelectedSubjects((prev) => prev.includes(targetSubject!) ? prev : [...prev, targetSubject!]);
        setSelectedSets((prev) => ({
          ...prev,
          [targetSubject]: [chosenSet],
        }));
      }
      try {
        localStorage.removeItem("webb-intended-subject");
      } catch {
        /* ignore */
      }
    }
  }, [isExistingUser]);

  const isSetOwned = (subjectId: string, set: string) => {
    if (subjectId === "tgat" && set === "A") return false;
    if (!isExistingUser) return false;
    return (ownedSets[subjectId] || []).includes(set);
  };

  const toggleSet = (subjectId: string, set: string) => {
    if (subjectId !== "tgat" || !getExamPlan("tgat-full", set).hasSuppliedExam) return;
    if (isSetOwned(subjectId, set)) return; // Already owned, cannot re-select
    setNotice("");
    setSelectedSets((prev) => {
      const current = prev[subjectId] || [];
      const newSets = current.includes(set)
        ? current.filter((s) => s !== set)
        : [...current, set].sort();
      return { ...prev, [subjectId]: newSets };
    });
  };

  const toggleSubject = (subjectId: string) => {
    if (subjectId !== "tgat") return;
    setNotice("");
    const wasSelected = selectedSubjects.includes(subjectId);
    setSelectedSubjects((prev) => wasSelected
      ? prev.filter((id) => id !== subjectId)
      : [...prev, subjectId]);
    if (wasSelected) setSelectedSets((sets) => ({ ...sets, [subjectId]: [] }));
  };

  const tgatCount = selectedSets["tgat"]?.length || 0;
  const tpat1Count = selectedSets["tpat1"]?.length || 0;
  const tpat2Count = selectedSets["tpat2"]?.length || 0;
  const tpat3Count = selectedSets["tpat3"]?.length || 0;
  const tpat4Count = selectedSets["tpat4"]?.length || 0;
  const alevelCount = otherSelected["alevel"] ? 1 : 0;
  const netsatCount = otherSelected["netsat"] ? 1 : 0;

  const tpatTotalCount = tpat1Count + tpat2Count + tpat3Count + tpat4Count;
  const totalItems = tgatCount + tpatTotalCount + alevelCount + netsatCount;
  const totalPrice = tgatCount * tgatSetPrice + tpat1Count * getProductPrice("tpat1") + tpat2Count * getProductPrice("tpat2") + tpat3Count * getProductPrice("tpat3") + tpat4Count * getProductPrice("tpat4") + (alevelCount + netsatCount) * 179;
  const selectedOrderItems = Object.entries(selectedSets).flatMap(([subjectId, sets]) =>
    subjectId === "tgat"
      ? sets.filter((examSet) => getExamPlan("tgat-full", examSet).hasSuppliedExam).map((examSet) => ({ productId: "tgat-full", examSet, baseAmount: tgatSetPrice, amount: tgatSetPrice }))
      : [],
  );
  const selectedSubjectCount = selectedSubjects.length + alevelCount + netsatCount;
  const selectedTpatSubjects = [
    { id: "tpat1", title: "TPAT1 ความถนัดแพทย์" },
    { id: "tpat2", title: "TPAT2 ความถนัดศิลปกรรมศาสตร์" },
    { id: "tpat3", title: "TPAT3 ความถนัดด้านวิทยาศาสตร์ เทคโนโลยี และวิศวกรรมศาสตร์" },
    { id: "tpat4", title: "TPAT4 ความถนัดทางสถาปัตยกรรมศาสตร์" },
  ].map((subject) => ({ ...subject, sets: selectedSets[subject.id] || [] }))
    .filter((subject) => subject.sets.length > 0);

  function isReviewExpanded(id: string) {
    return expandedReviews.includes(id);
  }

  function toggleReview(id: string) {
    setExpandedReviews((current) => current.includes(id)
      ? current.filter((expandedId) => expandedId !== id)
      : [...current, id]);
  }

  function toggleDetails(id: string) {
    setExpandedDetails((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  }

  function pickCheck(on: boolean, disabled = false) {
    return (
      <span className={`wb-pick-check${on ? " is-on" : ""}${disabled ? " is-disabled" : ""}`} aria-hidden="true">
        {on && (
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
        )}
      </span>
    );
  }

  function renderSetButtons(subjectId: string) {
    return (
      <div className="wb-pick-pills">
        {["A"].map((set) => {
          const available = subjectId === "tgat" && tgatAvailable && getExamPlan("tgat-full", set).hasSuppliedExam;
          const owned = available && isSetOwned(subjectId, set);
          const selected = (selectedSets[subjectId] || []).includes(set);
          return (
            <button
              type="button"
              key={set}
              disabled={owned || !available}
              title={owned ? "คุณมีสิทธิ์ในชุดนี้แล้ว ไม่สามารถซื้อซ้ำได้" : !available ? "ยังไม่มีไฟล์ข้อสอบชุดนี้" : undefined}
              className={`wb-pick-pill${selected ? " is-on" : ""}${owned ? " is-owned" : ""}${!available ? " is-unavailable" : ""}`}
              onClick={() => toggleSet(subjectId, set)}
            >
              ชุด {set}{owned && <small> (มีสิทธิ์แล้ว)</small>}{!available && <small> (ยังไม่เปิดให้บริการ)</small>}
            </button>
          );
        })}
      </div>
    );
  }

  function renderExamBlock(id: string, title: string, nested = false, detail = "") {
    const available = id === "tgat" && tgatAvailable && getExamPlan("tgat-full", "A").hasSuppliedExam;
    const selected = available && selectedSubjects.includes(id);
    const sets = selectedSets[id] || [];
    const block = (
      <>
        <div
          className={`wb-pick-head${!available ? " is-unavailable" : ""}`}
          role={available ? "checkbox" : undefined}
          aria-checked={selected}
          aria-disabled={!available}
          tabIndex={available ? 0 : -1}
          onClick={() => available && toggleSubject(id)}
          onKeyDown={(event) => {
            if (!available) return;
            if (event.key === " " || event.key === "Enter") { event.preventDefault(); toggleSubject(id); }
          }}
        >
          {pickCheck(selected)}
          <div className="wb-pick-head-text">
            <strong>{title}</strong>
            <span>
              ⏱ {detail ? detail.split(" · ")[0] : "180 นาที"} · 📝 {detail ? detail.split(" · ")[1] : "200 ข้อ"}
              {!available && " · ยังไม่เปิดให้บริการ"}
            </span>
          </div>
          <b className="wb-pick-price">{available ? (sets.length > 0 ? `${sets.length * tgatSetPrice} บาท` : `${tgatSetPrice} บาท/ชุด`) : ""}</b>
        </div>
        {selected && <>
          <hr className="wb-pick-divider" />
          <p className="wb-pick-hint">เลือกชุดข้อสอบ <span>(มีไฟล์พร้อมสอบเฉพาะชุด A)</span></p>
          {renderSetButtons(id)}
        </>}
      </>
    );
    return nested ? <div className={`wb-pick-sub${selected ? " is-on" : ""}${!available ? " is-unavailable" : ""}`}>{block}</div> : block;
  }

  function renderDetail(rows: { key: string; label: string }[]) {
    if (rows.length === 0) return null;
    return (
      <div className="wb-pick-detail">
        <strong>รายละเอียดข้อสอบ</strong>
        {rows.map((row) => <div key={row.key}><span>{row.label}</span><span>{tgatSetPrice} บาท</span></div>)}
      </div>
    );
  }

  function demoAccount() {
    const savedAccount = readDemoAccount();
    const account = savedAccount || {
      username: "sss",
      password: "sss",
      firstName: "สมชาย",
      lastName: "ศิริกุล",
      email: "somchai@example.com",
      phone: "082-2193-291",
      province: "ขอนแก่น",
      school: "โรงเรียนตัวอย่างวิทยา",
      education: "ม.6",
      citizenId: "1-6799-12345-34-1",
    };
    if (!savedAccount) {
      safeWrite(DEMO_ACCOUNT_KEY, account);
      safeWrite(DEMO_PROFILE_KEY, account);
      safeWrite(DEMO_AUTH_KEY, true);
      window.dispatchEvent(new Event("webb-demo-auth-updated"));
    }
    return {
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
  }

  function openPaymentModal() {
    if (!tgatAvailable || selectedOrderItems.length === 0 || !isDemoSalesOpen()) {
      setNotice("ชุดข้อสอบนี้ปิดขายหรือไม่มีรายการที่พร้อมซื้อแล้ว กรุณาตรวจสอบรายการอีกครั้ง");
      return;
    }
    const profileSnapshot = demoAccount();
    if (isDemoStudentSuspended(profileSnapshot.username, profileSnapshot.email)) {
      setNotice("บัญชีนี้ถูกระงับโดยผู้ดูแล จึงทำรายการซื้อข้อสอบไม่ได้ใน Demo");
      return;
    }
    const existingRef = readDemoOrders().find((order) => order.ref === checkoutRef);
    const orderRef = existingRef && existingRef.status !== "รอชำระ"
      ? `DO-${new Date().getFullYear() + 543}-${String(Date.now()).slice(-6)}`
      : checkoutRef;
    const expiresAt = Date.now() + (59 * 60 + 24) * 1000;
    const order = createDemoOrder({
      ref: orderRef,
      profileSnapshot,
      items: selectedOrderItems,
      amount: totalPrice,
      method: "QR Demo · ไม่ใช่การชำระเงินจริง",
      status: "รอชำระ",
      createdAt: new Date().toISOString(),
      expiresAt,
    });
    setCheckoutRef(order.ref);
    setPaymentDeadline(order.expiresAt);
    setPaymentSecondsRemaining(Math.max(0, Math.ceil((order.expiresAt - Date.now()) / 1000)));
    setShowPaymentQR(true);
  }

  function handleCompletePayment() {
    if (paymentDeadline === null || Date.now() >= paymentDeadline || paymentSecondsRemaining === null || paymentSecondsRemaining <= 0) return;
    if (!tgatAvailable || !isDemoSalesOpen()) {
      setShowPaymentQR(false);
      setNotice("ชุดข้อสอบนี้ปิดขายแล้ว กรุณาตรวจสอบรายการอีกครั้ง");
      return;
    }
    const completed = setDemoOrderStatus(checkoutRef, "สำเร็จ");
    if (!completed) return;
    setShowPaymentQR(false);
    try {
      const nextOwned = { ...ownedSets };
      selectedOrderItems.forEach(({ examSet }) => {
        if (examSet) nextOwned.tgat = Array.from(new Set([...(nextOwned.tgat || []), examSet]));
      });
      localStorage.setItem("webb-demo-purchased-sets", JSON.stringify({ ...nextOwned, ...ownedOther }));
      setOwnedSets(nextOwned);
    } catch { /* The purchase record remains the source of truth. */ }
    const firstPurchase = readDemoPurchases().find((purchase) => purchase.orderRef === checkoutRef);
    if (!firstPurchase) return;
    const purchaseRow = { ...firstPurchase, ref: checkoutRef, amount: totalPrice, baseAmount: totalPrice };
    localStorage.setItem("webb-demo-order", JSON.stringify({
      ref: checkoutRef,
      product: selectedOrderItems[0]?.productId || "tgat-full",
      amount: totalPrice,
      payment: completed.method,
      date: completed.paidAt,
      status: "ชำระเงินสำเร็จ (Demo)",
    }));
    setCompletedOrder(purchaseRow);
    setSubStep(6);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function downloadDemoQr() {
    const svg = document.getElementById("webb-demo-order-qr");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${checkoutRef}-demo-qr.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  // STEP 6: Success Screen
  if (subStep === 6 && completedOrder) {
    return (
      <div className="wb-subject-purchase-success-wrap">
        <Link
          className="wb-brand wb-subject-success-brand"
          href="/webb"
          aria-label="เรียนต่อมหาลัย TCAS Mock Exam หน้าแรก"
        >
          <span className="wb-brand-symbol" aria-hidden="true">
            <span className="wb-brand-person wb-brand-yellow"><i /><b /></span>
            <span className="wb-brand-person wb-brand-orange"><i /><b /></span>
            <span className="wb-brand-person wb-brand-blue"><i /><b /></span>
          </span>
          <span className="wb-brand-copy">
            <strong>เรียนต่อมหาลัย</strong>
            <small>TCAS MOCK EXAM</small>
          </span>
        </Link>
        <WebBPaymentSuccess
          orderRef={completedOrder.ref}
          paidDate={completedOrder.purchasedAt}
          paymentMethod="QR Payment"
          subjectsSummary={`${selectedSubjectCount} วิชา`}
          totalAmount={completedOrder.amount}
          homeHref="/webb"
          examHref="/webb/student?view=exam#exam-list"
        />
      </div>
    );
  }

  return (
    <div className="wb-pick-wrap">
     

      {/* STEP 3: Selection (design: Figma/UXUI/Sign Up/D_Sign Up St_3.png) */}
      {subStep === 3 && (
        <div className="wb-pick">
          <div className="wb-pick-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="4" fill="#ffce00" stroke="#111" strokeWidth="1.3" />
              <path d="M7.4 9l1.2 1.2 2-2.4" stroke="#111" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="9" cy="20" r="3.6" stroke="#111" strokeWidth="1.3" />
              <circle cx="9" cy="31" r="3.6" stroke="#111" strokeWidth="1.3" />
              <line x1="17" y1="9" x2="35" y2="9" stroke="#bbb" strokeWidth="1.3" />
              <line x1="17" y1="20" x2="35" y2="20" stroke="#bbb" strokeWidth="1.3" />
              <line x1="17" y1="31" x2="35" y2="31" stroke="#bbb" strokeWidth="1.3" />
            </svg>
          </div>
          <h1 className="wb-pick-title">{isExistingUser ? "เลือกซื้อข้อสอบเพิ่ม" : "เลือกวิชาที่ต้องการสอบ"}</h1>
          <p className="wb-pick-lead">เลือกชุดข้อสอบที่เปิดจำหน่าย · เลือกแล้ว {selectedSubjectCount} วิชา</p>

          <div className="wb-pick-list">
            <section className={`wb-pick-card${selectedSubjects.includes("tgat") ? " is-on" : ""}`}>
              {renderExamBlock("tgat", "TGAT ความถนัดทั่วไป")}
              {renderDetail(selectedSets.tgat.map((set) => ({ key: `tgat-${set}`, label: `TGAT ความถนัดทั่วไป ชุด ${set}` })))}
            </section>

            <UnavailableSubjectGroup
              id="tpat"
              title="TPAT ความถนัดทางวิชาชีพ"
              subjects={[
                ["TPAT1 ความถนัดแพทย์", "210 นาที · 90 ข้อ"],
                ["TPAT2 ความถนัดศิลปกรรมศาสตร์", "180 นาที · 150 ข้อ"],
                ["TPAT3 ความถนัดด้านวิทยาศาสตร์ เทคโนโลยี และวิศวกรรมศาสตร์", "180 นาที · 70 ข้อ"],
                ["TPAT4 ความถนัดทางสถาปัตยกรรมศาสตร์", "180 นาที · 40 ข้อ"],
                ["TPAT5 ความถนัดครุศาสตร์-ศึกษาศาสตร์", "180 นาที · 100 ข้อ"],
              ]}
              expandedDetails={expandedDetails}
              onToggle={toggleDetails}
              pickCheck={pickCheck}
            />
            <UnavailableSubjectGroup
              id="alevel"
              title="A-Level ความรู้ทางวิชาการ"
              subjects={[
                ["คณิตศาสตร์ประยุกต์ 1", "90 นาที · 30 ข้อ"], ["คณิตศาสตร์ประยุกต์ 2", "90 นาที · 30 ข้อ"],
                ["วิทยาศาสตร์ประยุกต์", "90 นาที · 30 ข้อ"], ["ฟิสิกส์", "90 นาที · 30 ข้อ"],
                ["เคมี", "90 นาที · 35 ข้อ"], ["ชีววิทยา", "90 นาที · 40 ข้อ"], ["สังคมศึกษา", "90 นาที · 50 ข้อ"],
                ["ภาษาไทย", "90 นาที · 50 ข้อ"], ["ภาษาอังกฤษ", "90 นาที · 80 ข้อ"], ["ภาษาฝรั่งเศส", "90 นาที · 50 ข้อ"],
                ["ภาษาเยอรมัน", "90 นาที · 50 ข้อ"], ["ภาษาญี่ปุ่น", "90 นาที · 50 ข้อ"], ["ภาษาเกาหลี", "90 นาที · 50 ข้อ"],
                ["ภาษาจีน", "90 นาที · 50 ข้อ"], ["ภาษาบาลี", "90 นาที · 50 ข้อ"], ["ภาษาสเปน", "90 นาที · 50 ข้อ"],
              ]}
              expandedDetails={expandedDetails}
              onToggle={toggleDetails}
              pickCheck={pickCheck}
            />
            <UnavailableSubjectGroup
              id="netsat"
              title="NETSAT"
              subjects={[
                ["ความฉลาดรู้ทั่วไปด้านภาษา: ภาษาไทย", "90 นาที · 50 ข้อ"],
                ["ความฉลาดรู้ทั่วไปด้านภาษา: ภาษาอังกฤษ", "90 นาที · 50 ข้อ"],
                ["ความฉลาดรู้ทั่วไปด้านคณิตศาสตร์", "90 นาที · 50 ข้อ"],
                ["ความฉลาดรู้เฉพาะด้าน: วิทยาศาสตร์และเทคโนโลยี", "90 นาที · 50 ข้อ"],
                ["ความฉลาดรู้เฉพาะด้าน: ฟิสิกส์", "90 นาที · 50 ข้อ"],
                ["ความฉลาดรู้เฉพาะด้าน: เคมี", "90 นาที · 50 ข้อ"],
                ["ความฉลาดรู้เฉพาะด้าน: ชีววิทยา", "90 นาที · 50 ข้อ"],
              ]}
              expandedDetails={expandedDetails}
              onToggle={toggleDetails}
              pickCheck={pickCheck}
            />
          </div>

          {notice && <p className="wb-pick-notice" role="alert">{notice}</p>}

          <div className="wb-pick-actions">
            <button
              type="button"
              className="wb-pick-back"
              onClick={() => {
                if (onBackToSignupStep) onBackToSignupStep();
                else window.location.href = "/webb";
              }}
            >
              {isExistingUser ? "กลับสู่หน้าหลัก" : "ย้อนกลับ"}
            </button>
            <button
              type="button"
              className="wb-pick-next"
              onClick={() => {
                if (totalItems > 0) {
                  const firstReviewRow = tgatCount > 0 ? "tgat" : selectedTpatSubjects[0]?.id;
                  setExpandedReviews(firstReviewRow ? [firstReviewRow] : []);
                  setSubStep(5);
                  onProgressChange?.(100);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  setNotice("กรุณาเลือกวิชาและชุดข้อสอบอย่างน้อย 1 ชุด");
                }
              }}
            >
              ถัดไป <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Review */}
      {subStep === 5 && (
        <div className="wb-registration-step-extra">
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ display: "inline-block" }}>
              <rect x="4" y="4" width="10" height="10" rx="2" fill="#ffce00" />
              <rect x="18" y="4" width="10" height="10" rx="2" fill="#ffce00" />
              <rect x="4" y="18" width="10" height="10" rx="2" stroke="#111" strokeWidth="1.5" />
              <rect x="18" y="18" width="10" height="10" rx="2" stroke="#ccc" strokeWidth="1.5" strokeDasharray="2 2" />
            </svg>
          </div>
          <h1 style={{ textAlign: "center", fontSize: "26px", fontWeight: 800, margin: "0 0 8px" }}>
            ตรวจสอบความถูกต้องและยอดชำระ
          </h1>
          <p className="wb-registration-lead" style={{ textAlign: "center", marginBottom: "28px" }}>
            โปรดตรวจสอบก่อนชำระเงิน — เมื่อชำระแล้วไม่สามารถยกเลิกหรือคืนเงินได้
          </p>

          <div
            className="wb-order-review"
            style={{ border: "1px solid #e7e9eb", borderRadius: "16px", padding: "20px", background: "#fff" }}
          >
            <div className="wb-review-table">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: "#666",
                  borderBottom: "1px solid #e7e9eb",
                  paddingBottom: "12px",
                  marginBottom: "16px",
                }}
              >
                <span>รายการ</span>
                <span>ราคา</span>
              </div>

              {tgatCount > 0 && (
                <div className="wb-review-line" style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "15px" }}>TGAT ความถนัดทั่วไป</strong>
                    <span style={{ fontSize: "15px", fontWeight: 700 }}>{tgatCount * tgatSetPrice} บาท</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>⏱ 180 นาที 📝 200 ข้อ</div>
                  <button type="button" className="wb-review-detail-toggle" aria-expanded={isReviewExpanded("tgat")} onClick={() => toggleReview("tgat")}>
                    <span>รายละเอียดข้อสอบ</span><span aria-hidden="true">{isReviewExpanded("tgat") ? "⌃" : "⌄"}</span>
                  </button>
                  {isReviewExpanded("tgat") && <div className="wb-review-detail-panel">
                    {selectedSets["tgat"].map((set) => (
                      <div key={set} style={{ marginBottom: "10px", color: "#111" }}>
                        <strong style={{ display: "block", marginBottom: "4px" }}>ชุดข้อสอบ {set}</strong>
                        <span style={{ display: "block" }}>TGAT1 การสื่อสารภาษาอังกฤษ · 60 นาที · 60 ข้อ</span>
                        <span style={{ display: "block" }}>TGAT2 การคิดอย่างมีเหตุผล · 60 นาที · 80 ข้อ</span>
                        <span style={{ display: "block" }}>TGAT3 สมรรถนะการทำงาน · 60 นาที · 60 ข้อ</span>
                      </div>
                    ))}
                  </div>}
                </div>
              )}

              {selectedTpatSubjects.map((subject) => (
                <div className="wb-review-line" style={{ marginBottom: "20px" }} key={subject.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "15px" }}>{subject.title}</strong>
                    <span style={{ fontSize: "15px", fontWeight: 700 }}>{subject.sets.length * getProductPrice(subject.id)} บาท</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>⏱ 180 นาที 📝 200 ข้อ</div>
                  <button type="button" className="wb-review-detail-toggle" aria-expanded={isReviewExpanded(subject.id)} onClick={() => toggleReview(subject.id)}>
                    <span>รายละเอียดข้อสอบ</span><span aria-hidden="true">{isReviewExpanded(subject.id) ? "⌃" : "⌄"}</span>
                  </button>
                  {isReviewExpanded(subject.id) && <div className="wb-review-detail-panel">
                    {subject.sets.map((set) => (
                      <div key={`${subject.id}-${set}`} style={{ marginBottom: "4px", color: "#111", fontWeight: 600 }}>
                        {subject.title} · ชุด {set}
                      </div>
                    ))}
                  </div>}
                </div>
              ))}

              {otherSelected.alevel && (
                <div className="wb-review-line" style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ fontSize: "15px" }}>A-Level ความรู้ทางวิชาการ</strong>
                  <span style={{ fontSize: "15px", fontWeight: 700 }}>179 บาท</span>
                </div>
              )}

              {otherSelected.netsat && (
                <div className="wb-review-line" style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ fontSize: "15px" }}>NETSAT</strong>
                  <span style={{ fontSize: "15px", fontWeight: 700 }}>179 บาท</span>
                </div>
              )}

              <div
                className="wb-review-total"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fff9e6",
                  padding: "16px",
                  borderRadius: "12px",
                  marginTop: "16px",
                }}
              >
                <strong style={{ fontSize: "15px" }}>ยอดชำระทั้งหมด ({totalItems} ชุด)</strong>
                <strong style={{ fontSize: "18px", color: "#111" }}>{totalPrice} บาท</strong>
              </div>
            </div>
          </div>

          <p style={{ textAlign: "center", fontSize: "12px", color: "#666", marginTop: "24px" }}>
            🔒 ข้อมูลของคุณถูกจัดเก็บอย่างปลอดภัย ชำระผ่าน QR Promptpay
          </p>

          <div className="wb-registration-actions" style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
            <button
              type="button"
              className="wb-registration-back"
              onClick={() => {
                setSubStep(3);
                onProgressChange?.(75);
              }}
              style={{
                flex: 1,
                padding: "14px",
                background: "#fff",
                border: "1.5px solid #111",
                borderRadius: "999px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ย้อนกลับ
            </button>
            <button
              type="button"
              className="wb-registration-next"
              onClick={() => {
                openPaymentModal();
              }}
              style={{
                flex: 1,
                padding: "14px",
                background: "#ffce00",
                color: "#111",
                border: "none",
                borderRadius: "999px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ชำระเงิน {totalPrice} บาท →
            </button>
          </div>

        </div>
      )}

      {showPaymentQR && (
        <WebBPaymentQrModal
          checkoutRef={checkoutRef}
          totalPrice={totalPrice}
          remainingSeconds={paymentSecondsRemaining ?? 59 * 60 + 24}
          onClose={() => setShowPaymentQR(false)}
          onDownload={downloadDemoQr}
          onSimulatePaid={handleCompletePayment}
        />
      )}
    </div>
  );
}
