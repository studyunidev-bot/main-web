"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import WebBPaymentSuccess from "./WebBPaymentSuccess";
import {
  addDemoEmail,
  DEMO_AUTH_KEY,
  DEMO_PURCHASES_KEY,
  readDemoAccount,
  readCurrentDemoPurchases,
  readDemoPurchases,
  safeWrite,
  type DemoPurchase,
} from "./demo-store";

export type WebBSubjectPurchaseFlowProps = {
  isExistingUser?: boolean;
  onBackToSignupStep?: () => void;
};

// Default owned sets for an existing enrolled student in Demo
const DEFAULT_EXISTING_OWNED_SETS: Record<string, string[]> = {
  tgat: ["A"],
  tpat1: ["A"],
};

export default function WebBSubjectPurchaseFlow({
  isExistingUser = true,
  onBackToSignupStep,
}: WebBSubjectPurchaseFlowProps) {
  // Step 3 = Subject selection, Step 4 = Review, Step 5 = Success
  const [subStep, setSubStep] = useState<3 | 4 | 5>(3);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<DemoPurchase | null>(null);

  // Already owned sets (only applicable for existing users)
  const [ownedSets, setOwnedSets] = useState<Record<string, string[]>>({});
  const [ownedOther, setOwnedOther] = useState<Record<string, boolean>>({
    alevel: false,
    netsat: false,
  });

  // Newly selected sets
  const [selectedSets, setSelectedSets] = useState<Record<string, string[]>>({
    tgat: isExistingUser ? [] : ["A"],
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

    const validSets = ["A", "B", "C", "D"];
    const chosenSet = targetSet && validSets.includes(targetSet) ? targetSet : "A";

    if (isExistingUser) {
      // Build owned sets from purchases and localStorage
      const currentPurchases = readCurrentDemoPurchases();
      const owned: Record<string, string[]> = { ...DEFAULT_EXISTING_OWNED_SETS };
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
        if (id.includes("tgat-b") || id.includes("tgat2")) {
          owned.tgat = Array.from(new Set([...(owned.tgat || []), "B"]));
        }
        if (id.includes("tpat2")) {
          owned.tpat2 = Array.from(new Set([...(owned.tpat2 || []), "A"]));
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
      if (["tgat", "tpat1", "tpat2", "tpat3", "tpat4"].includes(targetSubject)) {
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
    if (!isExistingUser) return false;
    return (ownedSets[subjectId] || []).includes(set);
  };

  const isOtherOwned = (id: string) => {
    if (!isExistingUser) return false;
    return !!ownedOther[id];
  };

  const toggleSet = (subjectId: string, set: string) => {
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
    setNotice("");
    setSelectedSets((prev) => {
      const current = prev[subjectId] || [];
      if (current.length > 0) {
        return { ...prev, [subjectId]: [] };
      } else {
        // Pick first available set that is NOT owned
        const allSets = ["A", "B", "C", "D"];
        const availableSet = allSets.find((s) => !isSetOwned(subjectId, s)) || "A";
        return { ...prev, [subjectId]: [availableSet] };
      }
    });
  };

  const toggleOther = (id: string) => {
    if (isOtherOwned(id)) return;
    setNotice("");
    setOtherSelected((prev) => ({ ...prev, [id]: !prev[id] }));
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
  const totalPrice = totalItems * 179;
  const selectedSubjectCount =
    Object.keys(selectedSets).filter((k) => selectedSets[k].length > 0).length +
    alevelCount +
    netsatCount;

  function renderSetButtons(subjectId: string) {
    return (
      <div className="wb-pick-pills">
        {["A", "B", "C", "D"].map((set) => {
          const owned = isSetOwned(subjectId, set);
          const isSelected = (selectedSets[subjectId] || []).includes(set);
          return (
            <button
              type="button"
              key={set}
              disabled={owned}
              title={owned ? "คุณมีสิทธิ์ในชุดนี้แล้ว ไม่สามารถซื้อซ้ำได้" : undefined}
              className={`wb-pick-pill${isSelected ? " is-on" : ""}${owned ? " is-owned" : ""}`}
              onClick={() => toggleSet(subjectId, set)}
            >
              ชุด {set}
              {owned && <small> (มีสิทธิ์แล้ว)</small>}
            </button>
          );
        })}
      </div>
    );
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

  function renderExamBlock(id: string, title: string, count: number, nested: boolean) {
    return (
      <div className={nested ? `wb-pick-sub${count > 0 ? " is-on" : ""}` : undefined}>
        <div className="wb-pick-head" role="checkbox" aria-checked={count > 0} tabIndex={0} onClick={() => toggleSubject(id)} onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleSubject(id); } }}>
          {pickCheck(count > 0)}
          <div className="wb-pick-head-text">
            <strong>{title}</strong>
            <span>⏱ 180 นาที &nbsp;📝 60 ข้อ</span>
          </div>
          <b className="wb-pick-price">{count > 0 ? `${count * 179} บาท` : "179 บาท/ชุด"}</b>
        </div>
        <hr className="wb-pick-divider" />
        <p className="wb-pick-hint">เลือกชุดข้อสอบ <span>(เลือกมากกว่า 1 ชุดข้อสอบ)</span></p>
        {renderSetButtons(id)}
      </div>
    );
  }

  function renderSimpleRow(id: string, title: string, count: number) {
    return (
      <div className={`wb-pick-sub is-row${count > 0 ? " is-on" : ""}`} role="checkbox" aria-checked={count > 0} tabIndex={0} onClick={() => toggleSubject(id)} onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleSubject(id); } }}>
        {pickCheck(count > 0)}
        <div className="wb-pick-head-text">
          <strong>{title}</strong>
          <span>⏱ 180 นาที &nbsp;📝 60 ข้อ</span>
        </div>
        <b className="wb-pick-price">{count > 0 ? "179 บาท" : "179 บาท/ชุด"}</b>
      </div>
    );
  }

  function renderDetail(rows: { key: string; label: string }[]) {
    return (
      <div className="wb-pick-detail">
        <strong>รายละเอียดข้อสอบ</strong>
        {rows.map((r) => (
          <div key={r.key}><span>{r.label}</span><span>179 บาท</span></div>
        ))}
      </div>
    );
  }

  function handleCompletePayment() {
    setShowPaymentQR(false);

    // Save purchase to demo store
    const account = readDemoAccount() || {
      username: "somchai",
      firstName: "สมชาย",
      lastName: "ศิริกุล",
      email: "somchai@example.com",
      phone: "082-2193-291",
      province: "ขอนแก่น",
      school: "โรงเรียนตัวอย่างวิทยา",
      education: "ม.6",
      citizenId: "1-6799-12345-34-1",
    };

    const now = new Date();
    const ref = `DO-${now.getFullYear() + 543}-${String(Date.now()).slice(-6)}`;
    const purchasedAt = now.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

    // Store newly purchased sets into localStorage so they appear as owned
    try {
      const nextOwned = { ...ownedSets };
      Object.keys(selectedSets).forEach((key) => {
        if (selectedSets[key].length > 0) {
          nextOwned[key] = Array.from(new Set([...(nextOwned[key] || []), ...selectedSets[key]]));
        }
      });
      const nextOther = { ...ownedOther, ...otherSelected };
      localStorage.setItem("webb-demo-purchased-sets", JSON.stringify({ ...nextOwned, ...nextOther }));
      setOwnedSets(nextOwned);
      setOwnedOther(nextOther);
    } catch {
      /* ignore */
    }

    const purchaseRow: DemoPurchase = {
      ref,
      productId: "tgat-full",
      amount: totalPrice,
      baseAmount: totalPrice,
      payment: "QR PromptPay · Demo",
      purchasedAt,
      purchasedAtIso: now.toISOString(),
      receipt: `RC-${ref}`,
      profileSnapshot: {
        username: account.username,
        citizenId: account.citizenId,
        firstName: account.firstName,
        lastName: account.lastName,
        phone: account.phone,
        email: account.email,
        province: account.province,
        school: account.school,
        education: account.education,
      },
      examStatus: "available",
      attempts: 0,
    };

    const allPurchases = [...readDemoPurchases(), purchaseRow];
    safeWrite(DEMO_PURCHASES_KEY, allPurchases);
    localStorage.setItem(
      "webb-demo-order",
      JSON.stringify({
        ref,
        product: "tgat-full",
        amount: totalPrice,
        payment: purchaseRow.payment,
        date: purchasedAt,
        status: "ชำระเงินสำเร็จ (Demo)",
      })
    );
    addDemoEmail(
      account.email,
      `ยืนยันการสั่งซื้อข้อสอบ ${ref}`,
      `คุณได้ทำการสั่งซื้อข้อสอบเพิ่มเติมจำนวน ${totalItems} ชุด ยอดชำระ ${totalPrice} บาท สำเร็จแล้ว`
    );

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("webb-demo-purchases-updated"));
    }

    setCompletedOrder(purchaseRow);
    setSubStep(5);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // STEP 5: Success Screen
  if (subStep === 5 && completedOrder) {
    return (
      <div style={{ maxWidth: "560px", margin: "20px auto 40px", padding: "0 16px" }}>
        <WebBPaymentSuccess
          orderRef={completedOrder.ref}
          paidDate={completedOrder.purchasedAt}
          paymentMethod={completedOrder.payment}
          subjectsSummary={`${selectedSubjectCount} วิชา (${totalItems} ชุดข้อสอบ)`}
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
          <p className="wb-pick-lead">เลือกได้มากกว่า 1 วิชา · เลือกแล้ว {selectedSubjectCount} วิชา</p>

          <div className="wb-pick-list">
            <section className={`wb-pick-card${tgatCount > 0 ? " is-on" : ""}`}>
              {renderExamBlock("tgat", "TGAT ความถนัดทั่วไป", tgatCount, false)}
              {tgatCount > 0 && renderDetail(selectedSets["tgat"].map((s) => ({ key: `tgat-${s}`, label: `TGAT ความถนัดทั่วไป ชุด ${s}` })))}
            </section>

            <section className={`wb-pick-card${tpatTotalCount > 0 ? " is-on" : ""}`}>
              <div className="wb-pick-head" role="checkbox" aria-checked={tpatTotalCount > 0} tabIndex={0} onClick={() => toggleSubject("tpat1")}>
                {pickCheck(tpatTotalCount > 0)}
                <div className="wb-pick-head-text"><strong>TPAT ความถนัดทางวิชาชีพ</strong></div>
              </div>
              {renderExamBlock("tpat1", "TPAT1 ความถนัดแพทย์", tpat1Count, true)}
              {renderExamBlock("tpat2", "TPAT2 ความถนัดศิลปกรรมศาสตร์", tpat2Count, true)}
              {renderSimpleRow("tpat3", "TPAT3 ความถนัดศิลปกรรมศาสตร์", tpat3Count)}
              {renderSimpleRow("tpat4", "TPAT4 ความถนัดเทคโนโลยีและวิศวกรรมศาสตร์", tpat4Count)}
              {tpatTotalCount > 0 && renderDetail([
                ...(selectedSets["tpat1"] || []).map((s) => ({ key: `tpat1-${s}`, label: `TPAT1 ความถนัดแพทย์ ชุด ${s}` })),
                ...(selectedSets["tpat2"] || []).map((s) => ({ key: `tpat2-${s}`, label: `TPAT2 ความถนัดศิลปกรรมศาสตร์ ชุด ${s}` })),
                ...(tpat3Count > 0 ? [{ key: "tpat3", label: "TPAT3 ความถนัดศิลปกรรมศาสตร์ ชุด A" }] : []),
                ...(tpat4Count > 0 ? [{ key: "tpat4", label: "TPAT4 ความถนัดเทคโนโลยีและวิศวกรรมศาสตร์ ชุด A" }] : []),
              ])}
            </section>

            {/* A-Level / NETSAT: ไม่มีสินค้า — แสดงแต่กดไม่ได้ */}
            <div className="wb-pick-other is-disabled" aria-disabled="true">
              {pickCheck(false, true)}
              <strong>A-Level ความรู้ทางวิชาการ</strong>
              <em>ยังไม่เปิดจำหน่าย</em>
            </div>
            <div className="wb-pick-other is-disabled" aria-disabled="true">
              {pickCheck(false, true)}
              <strong>NETSAT</strong>
              <em>ยังไม่เปิดจำหน่าย</em>
            </div>
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
                  setSubStep(4);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  setNotice("กรุณาเลือกวิชาที่ต้องการสอบอย่างน้อย 1 ชุด");
                }
              }}
            >
              ถัดไป <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review */}
      {subStep === 4 && (
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
                    <span style={{ fontSize: "15px", fontWeight: 700 }}>{tgatCount * 179} บาท</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>⏱ 180 นาที 📝 60 ข้อ</div>
                  <div style={{ background: "#f8f9fa", padding: "12px", borderRadius: "10px", fontSize: "12px", color: "#444" }}>
                    {selectedSets["tgat"].map((set) => (
                      <div key={set} style={{ fontWeight: 600, marginBottom: "4px", color: "#111" }}>
                        ชุดข้อสอบ {set}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tpatTotalCount > 0 && (
                <div className="wb-review-line" style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "15px" }}>TPAT ความถนัดทางวิชาชีพ</strong>
                    <span style={{ fontSize: "15px", fontWeight: 700 }}>{tpatTotalCount * 179} บาท</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>⏱ 180 นาที 📝 60 ข้อ</div>
                  <div style={{ background: "#f8f9fa", padding: "12px", borderRadius: "10px", fontSize: "12px", color: "#444" }}>
                    {(selectedSets["tpat1"] || []).map((set) => (
                      <div key={`tpat1-${set}`} style={{ fontWeight: 600, marginBottom: "4px", color: "#111" }}>
                        TPAT1 แพทย์ ชุด {set}
                      </div>
                    ))}
                    {(selectedSets["tpat2"] || []).map((set) => (
                      <div key={`tpat2-${set}`} style={{ fontWeight: 600, marginBottom: "4px", color: "#111" }}>
                        TPAT2 ศิลปกรรม ชุด {set}
                      </div>
                    ))}
                    {tpat3Count > 0 && (
                      <div style={{ fontWeight: 600, marginBottom: "4px", color: "#111" }}>TPAT3 วิทยาศาสตร์ ชุด A</div>
                    )}
                    {tpat4Count > 0 && (
                      <div style={{ fontWeight: 600, marginBottom: "4px", color: "#111" }}>TPAT4 สถาปัตย์ ชุด A</div>
                    )}
                  </div>
                </div>
              )}

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
            🔒 ข้อมูลของคุณถูกจัดเก็บอย่างปลอดภัย · ชำระผ่าน QR PromptPay
          </p>

          <div className="wb-registration-actions" style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
            <button
              type="button"
              className="wb-registration-back"
              onClick={() => setSubStep(3)}
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
              onClick={() => setShowPaymentQR(true)}
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

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button
              style={{
                background: "transparent",
                border: "none",
                color: "#28629a",
                textDecoration: "underline",
                fontSize: "13px",
                cursor: "pointer",
                padding: "8px",
              }}
              onClick={handleCompletePayment}
            >
              จำลองการชำระเงินสำเร็จ (ข้ามหน้าสแกน QR)
            </button>
          </div>
        </div>
      )}

      {/* QR MODAL (Matching Figma D_Payment QR.png) */}
      {showPaymentQR && (
        <div
          className="wb-terms-overlay"
          role="presentation"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <button
            type="button"
            className="wb-terms-backdrop"
            aria-label="ปิด"
            onClick={() => setShowPaymentQR(false)}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, border: "none", background: "transparent" }}
          />
          <section
            role="dialog"
            aria-modal="true"
            style={{
              position: "relative",
              maxWidth: "380px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: 0,
              background: "#fff",
              borderRadius: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
              zIndex: 1001,
            }}
          >
            <button
              type="button"
              onClick={() => setShowPaymentQR(false)}
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                border: "none",
                background: "#f0f0f0",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              ✕
            </button>

            <div style={{ padding: "24px 20px 20px", textAlign: "center" }}>
              <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 800 }}>สแกน QR เพื่อชำระเงิน</h2>
              <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#666" }}>
                ชำระเงินผ่านแอปพลิเคชันได้ทุกธนาคาร<br />ดูวิธีชำระเงินด้านล่าง
              </p>

              <div style={{ border: "1px solid #e0e0e0", borderRadius: "16px", overflow: "hidden" }}>
                <div
                  style={{
                    background: "#0f365d",
                    padding: "12px",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      background: "#fff",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0f365d">
                      <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
                    </svg>
                  </div>
                  <div style={{ textAlign: "left", lineHeight: 1.1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 800 }}>THAI QR</div>
                    <div style={{ fontSize: "10px", letterSpacing: "1px" }}>PAYMENT</div>
                  </div>
                </div>

                <div style={{ padding: "18px 16px" }}>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      background: "#fff1f1",
                      color: "#ef4444",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                      marginBottom: "14px",
                    }}
                  >
                    ชำระภายใน 59:24 นาที
                  </div>

                  <div
                    style={{
                      width: "140px",
                      height: "140px",
                      margin: "0 auto 12px",
                      background: "#fff",
                      border: "1px solid #eee",
                      padding: "6px",
                      borderRadius: "8px",
                    }}
                  >
                    <svg viewBox="0 0 100 100" width="100%" height="100%">
                      <rect x="10" y="10" width="30" height="30" fill="none" stroke="#000" strokeWidth="4" />
                      <rect x="60" y="10" width="30" height="30" fill="none" stroke="#000" strokeWidth="4" />
                      <rect x="10" y="60" width="30" height="30" fill="none" stroke="#000" strokeWidth="4" />
                      <rect x="18" y="18" width="14" height="14" fill="#000" />
                      <rect x="68" y="18" width="14" height="14" fill="#000" />
                      <rect x="18" y="68" width="14" height="14" fill="#000" />
                      <rect x="55" y="55" width="35" height="35" fill="#000" rx="4" />
                      <rect x="50" y="10" width="6" height="6" fill="#000" />
                      <rect x="50" y="20" width="6" height="6" fill="#000" />
                      <rect x="10" y="45" width="6" height="6" fill="#000" />
                      <rect x="25" y="45" width="15" height="6" fill="#000" />
                    </svg>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: "14px", marginBottom: "2px" }}>
                    บริษัทเรียนต่อมหาลัย จำกัด
                  </div>
                  <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "8px" }}>
                    รองรับทุกแอปธนาคาร · ยืนยันการชำระอัตโนมัติ
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "16px", marginBottom: "14px", color: "#111" }}>
                    ยอดที่ต้องชำระ {totalPrice} บาท
                  </div>
                  <button
                    type="button"
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "#fff",
                      border: "1.5px solid #111",
                      borderRadius: "999px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ดาวน์โหลด QR Code
                  </button>
                </div>
              </div>

              <div
                style={{
                  background: "#f8f9fa",
                  borderRadius: "12px",
                  padding: "14px",
                  marginTop: "14px",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>วิธีชำระเงินง่ายๆ</div>
                <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "11px", color: "#555", lineHeight: 1.6 }}>
                  <li>เปิดแอปธนาคาร แล้วเลือกสแกน QR</li>
                  <li>ตรวจสอบยอดเงินให้ตรง แล้วกดชำระ</li>
                  <li>ยืนยันการชำระเงิน</li>
                </ol>
              </div>

              <button
                type="button"
                style={{
                  marginTop: "14px",
                  background: "transparent",
                  border: "none",
                  color: "#28629a",
                  textDecoration: "underline",
                  fontSize: "12px",
                  cursor: "pointer",
                  padding: "6px",
                  fontWeight: 600,
                }}
                onClick={handleCompletePayment}
              >
                จำลองการชำระเงินสำเร็จ
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
