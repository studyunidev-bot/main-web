"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { WebBBrand } from "./PublicShell";

type Registration = {
  username: string;
  citizenId: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  province: string;
  school: string;
  education: string;
  acceptedTerms: boolean;
  subjects: string[];
};

const emptyRegistration: Registration = {
  username: "",
  citizenId: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  province: "",
  school: "",
  education: "",
  acceptedTerms: false,
  subjects: ["TGAT"],
};

const offerings = [
  { id: "TGAT", label: "TGAT ความถนัดทั่วไป", price: 179, type: "TGAT" },
  { id: "TPAT1", label: "TPAT1 ความถนัดแพทย์", price: 179, type: "TPAT" },
  { id: "TPAT2", label: "TPAT2 ความถนัดศิลปกรรมศาสตร์", price: 179, type: "TPAT" },
  { id: "TPAT3", label: "TPAT3 ความถนัดวิทยาศาสตร์ เทคโนโลยี และวิศวกรรมศาสตร์", price: 179, type: "TPAT" },
  { id: "TPAT4", label: "TPAT4 ความถนัดทางสถาปัตยกรรมศาสตร์", price: 179, type: "TPAT" },
  { id: "A-Level", label: "A-Level ความรู้ทางวิชาการ", price: 79, type: "other" },
  { id: "NETSAT", label: "NETSAT มหาวิทยาลัยขอนแก่น", price: 89, type: "other" },
];

const stepTitles = ["สร้างบัญชีของคุณ", "กรอกข้อมูลส่วนตัว", "เลือกวิชาที่ต้องการสอบ", "ตรวจสอบความถูกต้องและยอดชำระ"];
const stepIcons = ["➤", "♙", "☷", "▦"];
const formatBaht = (amount: number) => `${new Intl.NumberFormat("th-TH").format(amount)} บาท`;

export default function WebBRegistrationFlow({ initialStep = 1 }: { initialStep?: number }) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [registration, setRegistration] = useState(emptyRegistration);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const total = useMemo(
    () => offerings.reduce((sum, offering) => sum + (registration.subjects.includes(offering.id) ? offering.price : 0), 0),
    [registration.subjects],
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem("webb-registration");
      if (saved) setRegistration({ ...emptyRegistration, ...JSON.parse(saved) });
    } catch {
      localStorage.removeItem("webb-registration");
    }
  }, []);

  useEffect(() => {
    const nextStep = Math.max(1, Math.min(5, initialStep));
    setStep(nextStep);
  }, [initialStep]);

  function update<K extends keyof Registration>(key: K, value: Registration[K]) {
    setRegistration((current) => {
      const next = { ...current, [key]: value };
      localStorage.setItem("webb-registration", JSON.stringify(next));
      return next;
    });
  }

  function goTo(nextStep: number) {
    setNotice("");
    setStep(nextStep);
    router.push(`/webb/register?step=${nextStep}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 1 && registration.password !== registration.confirmPassword) {
      setNotice("กรุณาตรวจสอบรหัสผ่านและยืนยันรหัสผ่านให้ตรงกัน");
      return;
    }
    if (step === 2 && !registration.acceptedTerms) {
      setNotice("กรุณายอมรับนโยบายความเป็นส่วนตัวและเงื่อนไขการสมัคร");
      return;
    }
    goTo(step + 1);
  }

  function toggleSubject(subjectId: string) {
    const exists = registration.subjects.includes(subjectId);
    update("subjects", exists
      ? registration.subjects.filter((item) => item !== subjectId)
      : [...registration.subjects, subjectId]);
  }

  function confirmDemoPayment() {
    const order = {
      ref: `SU-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      amount: total,
      product: "tgat-full",
      subjects: registration.subjects,
      payment: "QR PromptPay (Demo)",
      date: new Date().toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" }),
    };
    localStorage.setItem("webb-demo-order", JSON.stringify(order));
    localStorage.setItem("webb-demo-profile", JSON.stringify(registration));
    setPaymentOpen(false);
    goTo(5);
  }

  const selectedOfferings = offerings.filter((offering) => registration.subjects.includes(offering.id));
  const tgatOfferings = offerings.filter((offering) => offering.type === "TGAT");
  const tpatOfferings = offerings.filter((offering) => offering.type === "TPAT");
  const otherOfferings = offerings.filter((offering) => offering.type === "other");

  return (
    <div className={`webb-site wb-shell wb-registration-page${step === 5 ? " is-success" : ""}`}>
      {step === 5 ? (
        <RegistrationSuccess registration={registration} total={total} />
      ) : (
        <>
          <header className="wb-registration-header">
            <WebBBrand />
            <nav aria-label="เมนูสมัครสมาชิก">
              <Link href="/webb">กลับสู่หน้าหลัก</Link>
              <Link className="wb-pill-button wb-pill-outline" href="/webb/login">เข้าสู่ระบบ</Link>
            </nav>
            <Link className="wb-registration-close" href="/webb" aria-label="กลับหน้าหลัก">×</Link>
            <div className="wb-registration-progress" aria-hidden="true">
              <span style={{ width: `${step * 25}%` }} />
            </div>
          </header>

          <main className={`wb-registration-main is-step-${step}`}>
            <span className="wb-registration-icon" aria-hidden="true">{stepIcons[step - 1]}</span>
            <h1>{stepTitles[step - 1]}</h1>
            <p className="wb-registration-lead">
              {step === 1 && "สร้างบัญชีผู้ใช้งานเพื่อเข้าสู่ห้องสอบภายหลัง"}
              {step === 2 && "ระบบจะยึดข้อมูล ณ วันที่สอบ"}
              {step === 3 && `เลือกได้มากกว่า 1 วิชา · เลือกแล้ว ${registration.subjects.length} วิชา`}
              {step === 4 && "โปรดตรวจสอบก่อนชำระเงิน — เมื่อชำระแล้วไม่สามารถยกเลิกหรือคืนเงินได้"}
            </p>

            {step === 1 && (
              <form className="wb-registration-form wb-account-step" onSubmit={submitStep}>
                <label>ชื่อผู้ใช้งาน<input value={registration.username} onChange={(e) => update("username", e.target.value)} placeholder="ชื่อผู้ใช้งาน" autoComplete="username" required /></label>
                <label>เลขบัตรประชาชน<input value={registration.citizenId} onChange={(e) => update("citizenId", e.target.value.replace(/\D/g, "").slice(0, 13))} placeholder="เลขบัตรประชาชน" inputMode="numeric" minLength={13} maxLength={13} required /></label>
                <label>ตั้งค่ารหัสผ่าน<span className="wb-registration-password"><input type={showPassword ? "text" : "password"} value={registration.password} onChange={(e) => update("password", e.target.value)} placeholder="รหัสผ่าน" autoComplete="new-password" minLength={8} required /><button type="button" aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "ซ่อน" : "แสดง"}</button></span></label>
                <label>ยืนยันรหัสผ่าน<span className="wb-registration-password"><input type={showConfirmPassword ? "text" : "password"} value={registration.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="ยืนยันรหัสผ่าน" autoComplete="new-password" minLength={8} required /><button type="button" aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} onClick={() => setShowConfirmPassword((visible) => !visible)}>{showConfirmPassword ? "ซ่อน" : "แสดง"}</button></span></label>
                <RegistrationActions step={step} onBack={goTo} />
                {notice && <p className="wb-registration-notice" role="alert">{notice}</p>}
              </form>
            )}

            {step === 2 && (
              <form className="wb-registration-form wb-profile-step" onSubmit={submitStep}>
                <label>ชื่อ<input value={registration.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="ชื่อ" autoComplete="given-name" required /></label>
                <label>นามสกุล<input value={registration.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="นามสกุล" autoComplete="family-name" required /></label>
                <label>เบอร์โทรศัพท์<input value={registration.phone} onChange={(e) => update("phone", e.target.value)} placeholder="เบอร์โทรศัพท์" type="tel" autoComplete="tel" required /></label>
                <label>อีเมล<input value={registration.email} onChange={(e) => update("email", e.target.value)} placeholder="อีเมล" type="email" autoComplete="email" required /></label>
                <label>จังหวัด<select value={registration.province} onChange={(e) => update("province", e.target.value)} required><option value="">จังหวัด</option>{["กรุงเทพมหานคร", "เชียงใหม่", "ขอนแก่น", "ชลบุรี", "นครราชสีมา", "สงขลา", "ภูเก็ต", "อื่น ๆ"].map((province) => <option key={province}>{province}</option>)}</select></label>
                <label>โรงเรียน<select value={registration.school} onChange={(e) => update("school", e.target.value)} required><option value="">โรงเรียน</option>{["โรงเรียนเตรียมอุดมศึกษา", "โรงเรียนสวนกุหลาบวิทยาลัย", "โรงเรียนบดินทรเดชา (สิงห์ สิงหเสนี)", "โรงเรียนมหิดลวิทยานุสรณ์", "อื่น ๆ"].map((school) => <option key={school}>{school}</option>)}</select></label>
                <label className="is-wide">ระดับการศึกษา<select value={registration.education} onChange={(e) => update("education", e.target.value)} required><option value="">ระดับการศึกษา</option><option>มัธยมศึกษาปีที่ 4</option><option>มัธยมศึกษาปีที่ 5</option><option>มัธยมศึกษาปีที่ 6</option><option>เทียบเท่า / จบการศึกษาแล้ว</option></select></label>
                <label className="wb-registration-terms is-wide"><input type="checkbox" checked={registration.acceptedTerms} onChange={(e) => update("acceptedTerms", e.target.checked)} /><span>อ่านและยอมรับ <a href="#privacy" onClick={(e) => { e.preventDefault(); setNotice("นโยบายความเป็นส่วนตัว: ข้อมูลนี้ใช้สำหรับการสมัครและการสอบเท่านั้น"); }}>นโยบายความเป็นส่วนตัว</a> และ <a href="#terms" onClick={(e) => { e.preventDefault(); setNotice("เงื่อนไขการสมัคร: โปรดตรวจสอบข้อมูลและวิชาก่อนชำระเงิน"); }}>เงื่อนไขการสมัคร</a> เรียบร้อยแล้ว</span></label>
                <RegistrationActions step={step} onBack={goTo} />
                {notice && <p className="wb-registration-notice is-wide" role="status">{notice}</p>}
              </form>
            )}

            {step === 3 && (
              <div className="wb-subject-select">
                <SubjectGroup title="TGAT ความถนัดทั่วไป" offerings={tgatOfferings} selected={registration.subjects} onToggle={toggleSubject} />
                <SubjectGroup title="TPAT ความถนัดทางวิชาชีพ" offerings={tpatOfferings} selected={registration.subjects} onToggle={toggleSubject} />
                <div className="wb-other-subjects">{otherOfferings.map((offering) => <label className="wb-other-subject" key={offering.id}><input type="checkbox" checked={registration.subjects.includes(offering.id)} onChange={() => toggleSubject(offering.id)} /><span><b>{offering.label}</b><small>⏱ 180 นาที · 📝 60 ข้อ</small></span><strong>{formatBaht(offering.price)}</strong></label>)}</div>
                <div className="wb-registration-actions"><button type="button" className="wb-registration-back" onClick={() => goTo(2)}>ย้อนกลับ</button><button type="button" className="wb-registration-next" disabled={!registration.subjects.length} onClick={() => goTo(4)}>ถัดไป </button></div>
              </div>
            )}

            {step === 4 && (
              <section className="wb-order-review">
                <div className="wb-review-table"><div className="wb-review-heading"><span>รายการ</span><span>ราคา</span></div>{selectedOfferings.map((offering, index) => <details className="wb-review-line" key={offering.id} open={index === 0}><summary><span>{offering.label}<small>⏱ 180 นาที · 📝 60 ข้อ</small></span><b>{formatBaht(offering.price)}</b><i aria-hidden="true">⌄</i></summary><p>รายละเอียดข้อสอบ<br />{offering.label} · ชุดฝึกสอบตัวอย่าง</p></details>)}<div className="wb-review-total"><b>ยอดชำระทั้งหมด ({selectedOfferings.length} วิชา)</b><strong>{formatBaht(total)}</strong></div></div>
                <p className="wb-payment-note">🔒 ข้อมูลของคุณถูกจัดเก็บอย่างปลอดภัย · ชำระผ่าน QR PromptPay</p>
                <div className="wb-registration-actions"><button type="button" className="wb-registration-back" onClick={() => goTo(3)}>ย้อนกลับ</button><button type="button" className="wb-registration-next" onClick={() => setPaymentOpen(true)}>ชำระเงิน {formatBaht(total)} </button></div>
              </section>
            )}
            {paymentOpen && <PaymentDialog total={total} onClose={() => setPaymentOpen(false)} onPaid={confirmDemoPayment} />}
          </main>
          <footer className="wb-registration-footer">© 2569 บริษัท เรียนต่อมหาลัย จำกัด</footer>
        </>
      )}
    </div>
  );
}

function RegistrationActions({ step, onBack }: { step: number; onBack: (step: number) => void }) {
  return <div className="wb-registration-actions">{step > 1 && <button type="button" className="wb-registration-back" onClick={() => onBack(step - 1)}>ย้อนกลับ</button>}<button className="wb-registration-next" type="submit">ถัดไป </button></div>;
}

function SubjectGroup({ title, offerings: group, selected, onToggle }: { title: string; offerings: typeof offerings; selected: string[]; onToggle: (id: string) => void }) {
  const chosen = group.filter((offering) => selected.includes(offering.id));
  return <section className={`wb-subject-group${chosen.length ? " is-selected" : ""}`}><label className="wb-subject-group-title"><input type="checkbox" checked={chosen.length > 0} onChange={() => group.forEach((offering) => { if (Boolean(chosen.length) === selected.includes(offering.id)) onToggle(offering.id); })} /><b>{title}</b></label><div className="wb-subject-options">{group.map((offering) => <label className="wb-subject-option" key={offering.id}><input type="checkbox" checked={selected.includes(offering.id)} onChange={() => onToggle(offering.id)} /><span><b>{offering.id === "TGAT" ? "ชุด A" : offering.id.slice(-1) === "1" ? "ชุด A" : `ชุด ${offering.id.slice(-1)}`}</b><small>{offering.label}</small></span><strong>{formatBaht(offering.price)}</strong></label>)}</div></section>;
}

function PaymentDialog({ total, onClose, onPaid }: { total: number; onClose: () => void; onPaid: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return <div className="wb-payment-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="wb-payment-dialog" role="dialog" aria-modal="true" aria-labelledby="wb-payment-title"><button type="button" className="wb-payment-close" aria-label="ปิดหน้าชำระเงิน" onClick={onClose}>×</button><h2 id="wb-payment-title">สแกน QR เพื่อชำระเงิน</h2><p>ชำระเงินผ่านแอปพลิเคชันได้ทุกธนาคาร<br />ดูวิธีชำระเงินด้านล่าง</p><div className="wb-qr-card"><div className="wb-qr-brand">▦ <b>THAI QR<br />PAYMENT</b></div><span className="wb-qr-expiry">ชำระภายใน 59:24 นาที</span><div className="wb-qr-placeholder" aria-label="QR Code ตัวอย่าง">▦</div><b>บริษัท เรียนต่อมหาลัย จำกัด</b><small>รองรับทุกแอปธนาคาร · ระบบจะยืนยันการชำระอัตโนมัติ</small><p>ยอดที่ต้องชำระ <strong>{formatBaht(total)}</strong></p><button type="button" className="wb-qr-download" onClick={() => window.print()}>ดาวน์โหลด QR Code</button></div><div className="wb-payment-instructions"><b>วิธีชำระเงินง่ายๆ</b><ol><li>เปิดแอปธนาคาร แล้วเลือกสแกน QR</li><li>ตรวจสอบยอดเงินให้ตรง แล้วกดชำระ</li><li>ยืนยันการชำระเงิน</li></ol></div><button type="button" className="wb-demo-paid" onClick={onPaid}>ยืนยันชำระเงิน (Demo)</button></section></div>;
}

function RegistrationSuccess({ registration, total }: { registration: Registration; total: number }) {
  const [receipt, setReceipt] = useState("SU-2570-0001");
  useEffect(() => {
    try {
      const order = JSON.parse(localStorage.getItem("webb-demo-order") ?? "{}");
      if (order.ref) setReceipt(order.ref);
    } catch {
      /* Keep the display reference. */
    }
  }, []);
  return <main className="wb-registration-success"><WebBBrand /><section className="wb-success-card"><span className="wb-success-check" aria-hidden="true">✓</span><h1>ชำระเงินสำเร็จ</h1><p>การสมัครสอบเสร็จสมบูรณ์แล้ว คุณสามารถเข้าสู่ห้องสอบได้ทันที</p><b className="wb-success-reference">หมายเลขคำสั่งซื้อ: #{receipt}</b><div className="wb-success-summary"><span>ผู้สมัคร <b>{[registration.firstName, registration.lastName].filter(Boolean).join(" ") || registration.username}</b></span><span>ช่องทางชำระ <b>QR Payment</b></span><span>วิชาที่สมัคร <b>{registration.subjects.length} วิชา</b></span><span className="wb-success-total">ยอดชำระ <b>{formatBaht(total)}</b></span></div><div className="wb-success-actions"><Link href="/webb">กลับสู่หน้าหลัก</Link><Link href="/webb/student">เข้าสู่ห้องสอบ </Link></div></section></main>;
}
