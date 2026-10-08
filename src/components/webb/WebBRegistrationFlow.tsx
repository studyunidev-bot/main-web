"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type UIEvent } from "react";
import { WebBBrand } from "./PublicShell";
import {
  addDemoEmail,
  DEMO_ACCOUNT_KEY,
  DEMO_AUTH_KEY,
  DEMO_PROFILE_KEY,
  readDemoAccount,
  type DemoStudentProfile,
  safeWrite,
} from "./demo-store";

type Registration = DemoStudentProfile & { confirmPassword: string };
const emptyRegistration: Registration = {
  username: "", password: "", confirmPassword: "", citizenId: "", firstName: "", lastName: "",
  phone: "", email: "", province: "", school: "", education: "",
};
const provinces = ["กรุงเทพมหานคร", "เชียงใหม่", "ขอนแก่น", "ชลบุรี", "นครราชสีมา", "สงขลา", "ภูเก็ต", "อื่น ๆ"];
const schools = ["โรงเรียนเตรียมอุดมศึกษา", "โรงเรียนสวนกุหลาบวิทยาลัย", "โรงเรียนบดินทรเดชา (สิงห์ สิงหเสนี)", "โรงเรียนมหิดลวิทยานุสรณ์", "อื่น ๆ"];

const terms = [
  ["ข้อมูลบัญชี", "ผู้สมัครยืนยันว่าข้อมูลที่กรอกเป็นข้อมูลจริงและเป็นของตนเอง โดยเฉพาะชื่อ เลขประจำตัวประชาชน และช่องทางติดต่อ"],
  ["การดูแลบัญชี", "ผู้สมัครต้องเก็บชื่อผู้ใช้และรหัสผ่านไว้เป็นความลับ และรับผิดชอบการใช้งานที่เกิดขึ้นผ่านบัญชีของตน"],
  ["สิทธิ์สอบ", "ข้อสอบที่ซื้อเป็นสิทธิ์เฉพาะบัญชี ใช้เข้าสอบได้หนึ่งครั้ง เมื่อส่งคำตอบหรือหมดเวลาจะไม่สามารถเริ่มสอบชุดเดิมซ้ำได้ เว้นแต่ผู้ดูแลอนุมัติรอบใหม่"],
  ["กรณีการสอบสะดุด", "หากระบบหรืออุปกรณ์ขัดข้องจนออกจากห้องสอบ ระบบจำลองจะเริ่มการสอบรอบนั้นใหม่ตั้งแต่ต้น และให้ผู้ดูแลพิจารณาเปิดสิทธิ์เพิ่มเติมเป็นกรณีไป"],
  ["การซื้อและเฉลย", "ระบบจะแสดงรายการและยอดชำระก่อนยืนยัน การซื้อหนึ่งครั้งจะสร้างสิทธิ์สอบและสิทธิ์ดูวิดีโอเฉลยของชุดนั้นโดยไม่มีกำหนดใน Demo"],
  ["การใช้ข้อมูล", "ข้อมูลใช้เพื่อจัดการบัญชี การซื้อ การสอบ และแจ้งสถานะบริการ เช่น ใบเสร็จและผลสอบ ใน Demo ข้อมูลถูกเก็บในเบราว์เซอร์และไม่มีการส่งอีเมลจริง"],
];

export default function WebBRegistrationFlow({ initialStep = 1 }: { initialStep?: number }) {
  const [step, setStep] = useState(initialStep === 2 ? 2 : 1);
  const [registration, setRegistration] = useState(emptyRegistration);
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsRead, setTermsRead] = useState(false);
  const [created, setCreated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DEMO_AUTH_KEY) === "true") {
      window.location.replace("/webb/student?view=overview");
      return;
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("webb-registration");
      if (saved) setRegistration({ ...emptyRegistration, ...JSON.parse(saved) });
    } catch {
      localStorage.removeItem("webb-registration");
    }
  }, []);

  useEffect(() => {
    if (!termsOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTermsOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [termsOpen]);

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
    window.history.replaceState(null, "", `/webb/register?step=${nextStep}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (registration.password !== registration.confirmPassword) {
      setNotice("กรุณาตรวจสอบรหัสผ่านและยืนยันรหัสผ่านให้ตรงกัน");
      return;
    }
    goTo(2);
  }

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTermsRead(false);
    setTermsOpen(true);
  }

  function confirmRegistration() {
    if (!termsRead) return;
    const existing = readDemoAccount();
    if (existing && (existing.username.toLowerCase() === registration.username.trim().toLowerCase() || existing.email.toLowerCase() === registration.email.trim().toLowerCase())) {
      setTermsOpen(false);
      setNotice("ชื่อผู้ใช้หรืออีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบ หรือใช้ข้อมูลบัญชีอื่น");
      return;
    }
    const profile: DemoStudentProfile = {
      username: registration.username,
      password: registration.password,
      citizenId: registration.citizenId,
      firstName: registration.firstName,
      lastName: registration.lastName,
      phone: registration.phone,
      email: registration.email,
      province: registration.province,
      school: registration.school,
      education: registration.education,
    };
    safeWrite(DEMO_ACCOUNT_KEY, profile);
    safeWrite(DEMO_PROFILE_KEY, profile);
    localStorage.setItem(DEMO_AUTH_KEY, "true");
    window.dispatchEvent(new Event("webb-demo-auth-updated"));
    localStorage.setItem("webb-registration", JSON.stringify(registration));
    addDemoEmail(profile.email, "สมัครสมาชิก Study Unith สำเร็จ", `ยินดีต้อนรับ ${profile.firstName} ${profile.lastName} · บัญชีผู้ใช้ ${profile.username} พร้อมใช้งานแล้ว (อีเมลนี้เป็นการจำลอง)`);
    setTermsOpen(false);
    setCreated(true);
  }

  function onTermsScroll(event: UIEvent<HTMLDivElement>) {
    const el = event.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setTermsRead(true);
  }

  if (!authChecked) return <main className="wb-registration-page" aria-busy="true" />;

  return (
    <div className="webb-site wb-shell wb-registration-page">
      {!created ? <>
        <header className="wb-registration-header">
          <WebBBrand />
          <nav aria-label="เมนูสมัครสมาชิก">
            <Link href="/webb">กลับสู่หน้าหลัก</Link>
            <Link className="wb-pill-button wb-pill-outline" href="/webb/login">เข้าสู่ระบบ</Link>
          </nav>
          <Link className="wb-registration-close" href="/webb" aria-label="กลับหน้าหลัก">×</Link>
          <div className="wb-registration-progress" aria-hidden="true"><span style={{ width: `${step * 50}%` }} /></div>
        </header>

        <main className={`wb-registration-main is-step-${step}`}>
          <span className="wb-registration-icon" aria-hidden="true">{step === 1 ? "♙" : "✍"}</span>
          <h1>{step === 1 ? "สร้างบัญชีผู้เรียน" : "กรอกข้อมูลผู้สมัคร"}</h1>
          <p className="wb-registration-lead">{step === 1 ? "สร้างบัญชีไว้เลือกซื้อชุดข้อสอบและจัดการสิทธิ์สอบ" : "ข้อมูลชุดนี้จะถูกบันทึกตามวันที่ซื้อข้อสอบแต่ละรายการ"}</p>

          {step === 1 && <form className="wb-registration-form wb-account-step" onSubmit={submitAccount}>
            <label>ชื่อผู้ใช้<input value={registration.username} onChange={(e) => update("username", e.target.value)} placeholder="ตั้งชื่อผู้ใช้" autoComplete="username" required /></label>
            <label>เลขบัตรประชาชน<input value={registration.citizenId} onChange={(e) => update("citizenId", e.target.value.replace(/\D/g, "").slice(0, 13))} placeholder="เลขบัตรประชาชน 13 หลัก" inputMode="numeric" minLength={13} maxLength={13} required /></label>
            <label>ตั้งค่ารหัสผ่าน<span className="wb-registration-password"><input type={showPassword ? "text" : "password"} value={registration.password} onChange={(e) => update("password", e.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร" autoComplete="new-password" minLength={8} required /><button type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "ซ่อน" : "แสดง"}</button></span></label>
            <label>ยืนยันรหัสผ่าน<span className="wb-registration-password"><input type={showConfirmPassword ? "text" : "password"} value={registration.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="กรอกรหัสผ่านอีกครั้ง" autoComplete="new-password" minLength={8} required /><button type="button" onClick={() => setShowConfirmPassword((v) => !v)}>{showConfirmPassword ? "ซ่อน" : "แสดง"}</button></span></label>
            <div className="wb-registration-actions"><button className="wb-registration-next" type="submit">ถัดไป</button></div>
            {notice && <p className="wb-registration-notice" role="alert">{notice}</p>}
          </form>}

          {step === 2 && <form className="wb-registration-form wb-profile-step" onSubmit={submitProfile}>
            <label>ชื่อ<input value={registration.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="ชื่อ" autoComplete="given-name" required /></label>
            <label>นามสกุล<input value={registration.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="นามสกุล" autoComplete="family-name" required /></label>
            <label>เบอร์โทรศัพท์<input value={registration.phone} onChange={(e) => update("phone", e.target.value)} placeholder="เบอร์โทรศัพท์" type="tel" autoComplete="tel" required /></label>
            <label>อีเมล<input value={registration.email} onChange={(e) => update("email", e.target.value)} placeholder="อีเมลสำหรับรับแจ้งเตือน" type="email" autoComplete="email" required /></label>
            <label>จังหวัด<select value={registration.province} onChange={(e) => update("province", e.target.value)} required><option value="">เลือกจังหวัด</option>{provinces.map((province) => <option key={province}>{province}</option>)}</select></label>
            <label>โรงเรียน<select value={registration.school} onChange={(e) => update("school", e.target.value)} required><option value="">เลือกโรงเรียน</option>{schools.map((school) => <option key={school}>{school}</option>)}</select></label>
            <label className="is-wide">ระดับการศึกษา<select value={registration.education} onChange={(e) => update("education", e.target.value)} required><option value="">เลือกระดับการศึกษา</option><option>มัธยมศึกษาปีที่ 4</option><option>มัธยมศึกษาปีที่ 5</option><option>มัธยมศึกษาปีที่ 6</option><option>เทียบเท่า / จบการศึกษาแล้ว</option></select></label>
            <div className="wb-registration-actions"><button type="button" className="wb-registration-back" onClick={() => goTo(1)}>ย้อนกลับ</button><button className="wb-registration-next" type="submit">สมัครสมาชิก</button></div>
            {notice && <p className="wb-registration-notice is-wide" role="alert">{notice}</p>}
          </form>}
        </main>
        <footer className="wb-registration-footer">© 2569 บริษัท เรียนต่อมหาลัย จำกัด</footer>
      </> : <main className="wb-registration-success"><WebBBrand /><section className="wb-success-card">
        <span className="wb-success-check" aria-hidden="true">✓</span><h1>สมัครสมาชิกสำเร็จ</h1>
        <p>บัญชีของคุณพร้อมใช้งานแล้ว ระบบจำลองส่งอีเมลยืนยันไปที่ <b>{registration.email}</b></p>
        <div className="wb-success-summary"><span>ชื่อผู้ใช้ <b>{registration.username}</b></span><span>ผู้สมัคร <b>{registration.firstName} {registration.lastName}</b></span><span>การแจ้งเตือน <b>สมัครสมาชิกสำเร็จ · Demo</b></span></div>
        <div className="wb-success-actions"><Link href="/webb">กลับสู่หน้าหลัก</Link><Link href="/webb/products">เลือกซื้อข้อสอบ</Link></div>
      </section></main>}

      {termsOpen && <div className="wb-terms-overlay" role="presentation">
        <button type="button" className="wb-terms-backdrop" aria-label="ปิดข้อกำหนด" onClick={() => setTermsOpen(false)} />
        <section className="wb-terms-dialog" role="dialog" aria-modal="true" aria-labelledby="wb-terms-title">
          <header><span>ก่อนสมัครสมาชิก</span><h2 id="wb-terms-title">ข้อกำหนดการสมัครและใช้งาน</h2><p>ข้อความตัวอย่างสำหรับประสบการณ์ Demo</p></header>
          <div className="wb-terms-scroll" onScroll={onTermsScroll} tabIndex={0}>
            <p className="wb-terms-intro">กรุณาอ่านข้อกำหนดทั้งหมดจนถึงด้านล่าง ก่อนยืนยันการสมัคร</p>
            {terms.map(([title, detail], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{detail}</p></div></article>)}
            <p className="wb-terms-demo-note">หมายเหตุ: ข้อความนี้เป็นตัวอย่าง UX สำหรับระบบจำลอง ไม่ใช่เอกสารข้อกำหนดทางกฎหมายฉบับใช้งานจริง</p>
          </div>
          <footer><span className={termsRead ? "is-read" : ""}>{termsRead ? "✓ อ่านครบแล้ว" : "เลื่อนลงเพื่ออ่านให้ครบก่อนสมัคร"}</span><button type="button" disabled={!termsRead} onClick={confirmRegistration}>ยอมรับและสมัคร</button></footer>
        </section>
      </div>}
    </div>
  );
}
