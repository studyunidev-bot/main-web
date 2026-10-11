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
  const [termsRead, setTermsRead] = useState(true);
  const [isSuccessScreen, setIsSuccessScreen] = useState(false);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
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
    if (nextStep <= 5) {
      window.history.replaceState(null, "", `/webb/register?step=${nextStep}`);
    }
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
    setIsSuccessScreen(true);
  }

  function onTermsScroll(event: UIEvent<HTMLDivElement>) {
    if (termsRead) return;
    const target = event.target as HTMLDivElement;
    // Allow a small threshold of 10px to account for decimal scaling issues
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      setTermsRead(true);
    }
  }

  const [selectedSets, setSelectedSets] = useState<Record<string, string[]>>({
    'tgat': ['A'],
    'tpat1': [],
    'tpat2': [],
    'tpat3': [],
    'tpat4': []
  });

  const [otherSelected, setOtherSelected] = useState<Record<string, boolean>>({
    'alevel': false,
    'netsat': false
  });

  const toggleSet = (subjectId: string, set: string) => {
    setSelectedSets(prev => {
      const current = prev[subjectId] || [];
      const newSets = current.includes(set) ? current.filter(s => s !== set) : [...current, set].sort();
      return { ...prev, [subjectId]: newSets };
    });
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSets(prev => {
      const current = prev[subjectId] || [];
      if (current.length > 0) {
        return { ...prev, [subjectId]: [] };
      } else {
        return { ...prev, [subjectId]: ['A'] };
      }
    });
  };

  const toggleOther = (id: string) => {
    setOtherSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const tgatCount = selectedSets['tgat']?.length || 0;
  const tpat1Count = selectedSets['tpat1']?.length || 0;
  const tpat2Count = selectedSets['tpat2']?.length || 0;
  const tpat3Count = selectedSets['tpat3']?.length || 0;
  const tpat4Count = selectedSets['tpat4']?.length || 0;
  const alevelCount = otherSelected['alevel'] ? 1 : 0;
  const netsatCount = otherSelected['netsat'] ? 1 : 0;

  const tpatTotalCount = tpat1Count + tpat2Count + tpat3Count + tpat4Count;
  const totalItems = tgatCount + tpatTotalCount + alevelCount + netsatCount;
  const totalPrice = totalItems * 179;
  const selectedSubjectCount = Object.keys(selectedSets).filter(k => selectedSets[k].length > 0).length + alevelCount + netsatCount;

  const renderSetButtons = (subjectId: string) => (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
      {['A', 'B', 'C', 'D'].map(set => {
        const isSelected = (selectedSets[subjectId] || []).includes(set);
        return (
          <span
            key={set}
            onClick={() => toggleSet(subjectId, set)}
            style={{
              padding: '6px 14px',
              background: isSelected ? '#111' : 'transparent',
              color: isSelected ? '#fff' : '#111',
              border: isSelected ? '1px solid #111' : '1px solid #ccc',
              borderRadius: '20px',
              fontSize: '11px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            ชุด {set}
          </span>
        );
      })}
    </div>
  );

  if (!authChecked) return <main className="wb-registration-page" aria-busy="true" />;

  return (
    <div className="webb-site wb-shell wb-registration-page">
      {isSuccessScreen ? <main className="wb-registration-success"><WebBBrand /><section className="wb-success-card">
        <span className="wb-success-check" aria-hidden="true">✓</span><h1>สมัครสมาชิกสำเร็จ</h1>
        <p>บัญชีของคุณพร้อมใช้งานแล้ว ระบบจำลองส่งอีเมลยืนยันไปที่ <b>{registration.email}</b></p>
        <div className="wb-success-summary"><span>ชื่อผู้ใช้ <b>{registration.username}</b></span><span>ผู้สมัคร <b>{registration.firstName} {registration.lastName}</b></span><span>การแจ้งเตือน <b>สมัครสมาชิกสำเร็จ · Demo</b></span></div>
        <div className="wb-success-actions"><Link href="/webb">กลับสู่หน้าหลัก</Link><button type="button" className="wb-pill-button wb-pill-yellow" onClick={() => { setIsSuccessScreen(false); goTo(3); }}>เลือกซื้อข้อสอบ</button></div>
      </section></main> : <>
        <header className="wb-registration-header">
          <WebBBrand />
          <nav aria-label="เมนูสมัครสมาชิก">
            <Link href="/webb">กลับสู่หน้าหลัก</Link>
            <Link className="wb-pill-button wb-pill-outline" href="/webb/login">เข้าสู่ระบบ</Link>
          </nav>
          <Link className="wb-registration-close" href="/webb" aria-label="กลับหน้าหลัก">×</Link>
          <div className="wb-registration-progress" aria-hidden="true"><span style={{ width: `${step <= 2 ? step * 50 : 100}%` }} /></div>
        </header>

        <main className={`wb-registration-main is-step-${step}`}>
          {step <= 2 && <>
            <span className="wb-registration-icon" aria-hidden="true">{step === 1 ? "♙" : "✍"}</span>
            <h1>{step === 1 ? "สร้างบัญชีผู้เรียน" : "กรอกข้อมูลผู้สมัคร"}</h1>
            <p className="wb-registration-lead">{step === 1 ? "สร้างบัญชีไว้เลือกซื้อชุดข้อสอบและจัดการสิทธิ์สอบ" : "ข้อมูลชุดนี้จะถูกบันทึกตามวันที่ซื้อข้อสอบแต่ละรายการ"}</p>
          </>}

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

          {step === 3 && <div className="wb-registration-step-extra">
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ display: 'inline-block' }}>
                <circle cx="24" cy="10" r="4" fill="#ffce00" />
                <path d="M22 10L23.5 11.5L26 8.5" stroke="#111" strokeWidth="1.5" />
                <circle cx="24" cy="24" r="3.5" stroke="#ccc" />
                <circle cx="24" cy="38" r="3.5" stroke="#ccc" />
                <line x1="24" y1="16" x2="24" y2="19" stroke="#ccc" />
                <line x1="24" y1="30" x2="24" y2="33" stroke="#ccc" />
                <line x1="29" y1="10" x2="36" y2="10" stroke="#ccc" />
                <line x1="29" y1="24" x2="36" y2="24" stroke="#ccc" />
                <line x1="29" y1="38" x2="36" y2="38" stroke="#ccc" />
              </svg>
            </div>
            <h1>เลือกวิชาที่ต้องการสอบ</h1>
            <p className="wb-registration-lead">เลือกได้มากกว่า 1 วิชา · เลือกแล้ว {selectedSubjectCount} วิชา</p>

            <div className="wb-subject-select">
              <div className="wb-subject-group" style={{ background: tgatCount > 0 ? '#fff3cd' : '#f8f9fa', borderColor: tgatCount > 0 ? '#ffe69c' : '#e9ecef' }}>
                <label className="wb-subject-group-title" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={tgatCount > 0} onChange={() => toggleSubject('tgat')} style={{ accentColor: '#111' }} />
                  <strong>TGAT ความถนัดทั่วไป</strong>
                  <span style={{ marginLeft: 'auto' }}>{tgatCount > 0 ? `${tgatCount * 179} บาท` : '179 บาท/ชุด'}</span>
                </label>
                <div style={{ padding: '0 4px', fontSize: '12px', color: '#666', marginTop: '-8px', marginBottom: '12px' }}>
                  ⏱ 180 นาที 📝 60 ข้อ
                </div>
                <div style={{ padding: '0 4px', fontSize: '11px', color: '#111', fontWeight: 600, marginBottom: '8px' }}>เลือกชุดข้อสอบ <span style={{ color: '#888', fontWeight: 'normal' }}>(เลือกกว่า 1 ชุดข้อสอบ)</span></div>
                <div style={{ padding: '0 4px' }}>{renderSetButtons('tgat')}</div>
                {tgatCount > 0 && <div className="wb-subject-options" style={{ borderColor: '#ffe69c' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>รายละเอียดข้อสอบ</div>
                  {selectedSets['tgat'].map(set => (
                    <div key={`tgat-${set}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#444', marginBottom: '4px' }}>
                      <span>TGAT ความถนัดทั่วไป ชุด {set}</span><span>179 บาท</span>
                    </div>
                  ))}
                </div>}
              </div>

              <div className="wb-subject-group" style={{ background: tpatTotalCount > 0 ? '#fff3cd' : '#f8f9fa', borderColor: tpatTotalCount > 0 ? '#ffe69c' : '#e9ecef' }}>
                <label className="wb-subject-group-title" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={tpatTotalCount > 0} onChange={() => toggleSubject('tpat1')} style={{ accentColor: '#111' }} />
                  <strong>TPAT ความถนัดทางวิชาชีพ</strong>
                  <span style={{ marginLeft: 'auto' }}>{tpatTotalCount > 0 ? `${tpatTotalCount * 179} บาท` : ''}</span>
                </label>

                <div style={{ background: tpat1Count > 0 ? '#fff9e6' : '#fff', borderRadius: '12px', padding: '12px', marginBottom: '8px', border: '1px solid', borderColor: tpat1Count > 0 ? '#ffe69c' : '#eee' }}>
                  <label className="wb-subject-group-title" style={{ padding: 0, marginBottom: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={tpat1Count > 0} onChange={() => toggleSubject('tpat1')} style={{ accentColor: '#111' }} />
                    <strong style={{ fontSize: '13px' }}>TPAT1 ความถนัดแพทย์</strong>
                    <span style={{ marginLeft: 'auto', fontSize: '13px' }}>{tpat1Count > 0 ? `${tpat1Count * 179} บาท` : '179 บาท/ชุด'}</span>
                  </label>
                  <div style={{ fontSize: '11px', color: '#666', paddingLeft: '30px', marginBottom: '10px' }}>⏱ 180 นาที 📝 60 ข้อ</div>
                  <div style={{ fontSize: '11px', color: '#111', fontWeight: 600, paddingLeft: '30px', marginBottom: '8px' }}>เลือกชุดข้อสอบ <span style={{ color: '#888', fontWeight: 'normal' }}>(เลือกกว่า 1 ชุดข้อสอบ)</span></div>
                  <div style={{ paddingLeft: '26px' }}>{renderSetButtons('tpat1')}</div>
                </div>

                <div style={{ background: tpat2Count > 0 ? '#fff9e6' : '#fff', borderRadius: '12px', padding: '12px', marginBottom: '8px', border: '1px solid', borderColor: tpat2Count > 0 ? '#ffe69c' : '#eee' }}>
                  <label className="wb-subject-group-title" style={{ padding: 0, marginBottom: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={tpat2Count > 0} onChange={() => toggleSubject('tpat2')} style={{ accentColor: '#111' }} />
                    <strong style={{ fontSize: '13px' }}>TPAT2 ความถนัดศิลปกรรมศาสตร์</strong>
                    <span style={{ marginLeft: 'auto', fontSize: '13px' }}>{tpat2Count > 0 ? `${tpat2Count * 179} บาท` : '179 บาท/ชุด'}</span>
                  </label>
                  <div style={{ fontSize: '11px', color: '#666', paddingLeft: '30px', marginBottom: '10px' }}>⏱ 180 นาที 📝 60 ข้อ</div>
                  <div style={{ fontSize: '11px', color: '#111', fontWeight: 600, paddingLeft: '30px', marginBottom: '8px' }}>เลือกชุดข้อสอบ <span style={{ color: '#888', fontWeight: 'normal' }}>(เลือกกว่า 1 ชุดข้อสอบ)</span></div>
                  <div style={{ paddingLeft: '26px' }}>{renderSetButtons('tpat2')}</div>
                </div>

                <div style={{ background: tpat3Count > 0 ? '#fff9e6' : '#fff', borderRadius: '12px', padding: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', border: '1px solid', borderColor: tpat3Count > 0 ? '#ffe69c' : '#eee' }} onClick={() => toggleSubject('tpat3')}>
                  <input type="checkbox" checked={tpat3Count > 0} readOnly style={{ accentColor: '#111' }} />
                  <div>
                    <strong style={{ fontSize: '13px' }}>TPAT3 ความถนัดวิทยาศาสตร์</strong>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>⏱ 180 นาที 📝 60 ข้อ</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '13px' }}>{tpat3Count > 0 ? '179 บาท' : '179 บาท/ชุด'}</span>
                </div>

                <div style={{ background: tpat4Count > 0 ? '#fff9e6' : '#fff', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', border: '1px solid', borderColor: tpat4Count > 0 ? '#ffe69c' : '#eee' }} onClick={() => toggleSubject('tpat4')}>
                  <input type="checkbox" checked={tpat4Count > 0} readOnly style={{ accentColor: '#111' }} />
                  <div>
                    <strong style={{ fontSize: '13px' }}>TPAT4 ความถนัดสถาปัตยกรรมศาสตร์</strong>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>⏱ 180 นาที 📝 60 ข้อ</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '13px' }}>{tpat4Count > 0 ? '179 บาท' : '179 บาท/ชุด'}</span>
                </div>

                {tpatTotalCount > 0 && <div className="wb-subject-options" style={{ borderColor: '#ffe69c', marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>รายละเอียดข้อสอบ</div>
                  {(selectedSets['tpat1'] || []).map(set => (
                    <div key={`tpat1-${set}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#444', marginBottom: '4px' }}>
                      <span>TPAT1 ความถนัดแพทย์ ชุด {set}</span><span>179 บาท</span>
                    </div>
                  ))}
                  {(selectedSets['tpat2'] || []).map(set => (
                    <div key={`tpat2-${set}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#444', marginBottom: '4px' }}>
                      <span>TPAT2 ความถนัดศิลปกรรมศาสตร์ ชุด {set}</span><span>179 บาท</span>
                    </div>
                  ))}
                  {tpat3Count > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#444', marginBottom: '4px' }}>
                    <span>TPAT3 ความถนัดวิทยาศาสตร์ ชุด A</span><span>179 บาท</span>
                  </div>}
                  {tpat4Count > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#444', marginBottom: '4px' }}>
                    <span>TPAT4 ความถนัดสถาปัตยกรรมศาสตร์ ชุด A</span><span>179 บาท</span>
                  </div>}
                </div>}
              </div>

              <label className="wb-other-subject" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={otherSelected.alevel} onChange={() => toggleOther('alevel')} style={{ accentColor: '#111' }} />
                <strong>A-Level ความรู้ทางวิชาการ</strong>
                <span style={{ marginLeft: 'auto', fontSize: '13px' }}>{otherSelected.alevel ? '179 บาท' : '179 บาท/ชุด'}</span>
              </label>

              <label className="wb-other-subject" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={otherSelected.netsat} onChange={() => toggleOther('netsat')} style={{ accentColor: '#111' }} />
                <strong>NETSAT</strong>
                <span style={{ marginLeft: 'auto', fontSize: '13px' }}>{otherSelected.netsat ? '179 บาท' : '179 บาท/ชุด'}</span>
              </label>

            </div>

            <div className="wb-registration-actions" style={{ marginTop: '32px' }}>
              <button type="button" className="wb-registration-back" onClick={() => setIsSuccessScreen(true)}>ย้อนกลับ</button>
              <button className="wb-registration-next" onClick={() => { if (totalItems > 0) goTo(4); else setNotice("กรุณาเลือกวิชาที่ต้องการสอบอย่างน้อย 1 วิชา"); }}>{totalItems > 0 ? `ชำระเงิน ${totalPrice} บาท ` : 'ถัดไป '}</button>
            </div>
          </div>}

          {step === 4 && <div className="wb-registration-step-extra">
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ display: 'inline-block' }}>
                <rect x="4" y="4" width="10" height="10" rx="2" fill="#ffce00" />
                <rect x="18" y="4" width="10" height="10" rx="2" fill="#ffce00" />
                <rect x="4" y="18" width="10" height="10" rx="2" stroke="#111" strokeWidth="1.5" />
                <rect x="18" y="18" width="10" height="10" rx="2" stroke="#ccc" strokeWidth="1.5" strokeDasharray="2 2" />
              </svg>
            </div>
            <h1>ตรวจสอบความถูกต้องและยอดชำระ</h1>
            <p className="wb-registration-lead">โปรดตรวจสอบก่อนชำระเงิน — เมื่อชำระแล้วไม่สามารถยกเลิกหรือคืนเงินได้</p>

            <div className="wb-order-review" style={{ border: '1px solid #e7e9eb', borderRadius: '16px', padding: '16px' }}>
              <div className="wb-review-table">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', borderBottom: '1px solid #e7e9eb', paddingBottom: '12px', marginBottom: '16px' }}>
                  <span>รายการ</span><span>ราคา</span>
                </div>

                {tgatCount > 0 && <div className="wb-review-line" style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '15px' }}>TGAT ความถนัดทั่วไป</strong>
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>{tgatCount * 179} บาท</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>⏱ 180 นาที 📝 60 ข้อ</div>
                  <details open style={{ background: '#f8f9fa', padding: '12px', borderRadius: '12px' }}>
                    <summary style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, cursor: 'pointer', listStyle: 'none' }}>
                      รายละเอียดข้อสอบ <span style={{ fontSize: '10px' }}>⌃</span>
                    </summary>
                    <div style={{ marginTop: '12px', fontSize: '11px', color: '#444' }}>
                      {selectedSets['tgat'].map(set => <div key={set} style={{ fontWeight: 600, marginBottom: '6px', color: '#111' }}>ชุดข้อสอบ {set}</div>)}
                    </div>
                  </details>
                </div>}

                {tpatTotalCount > 0 && <div className="wb-review-line" style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '15px' }}>TPAT ความถนัดทางวิชาชีพ</strong>
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>{tpatTotalCount * 179} บาท</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>⏱ 180 นาที 📝 60 ข้อ</div>
                  <details open style={{ background: '#f8f9fa', padding: '12px', borderRadius: '12px' }}>
                    <summary style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, cursor: 'pointer', listStyle: 'none' }}>
                      รายละเอียดข้อสอบ <span style={{ fontSize: '10px' }}>⌄</span>
                    </summary>
                    <div style={{ marginTop: '12px', fontSize: '11px', color: '#444' }}>
                      {(selectedSets['tpat1'] || []).map(set => <div key={`tpat1-${set}`} style={{ fontWeight: 600, marginBottom: '6px', color: '#111' }}>TPAT1 แพทย์ ชุด {set}</div>)}
                      {(selectedSets['tpat2'] || []).map(set => <div key={`tpat2-${set}`} style={{ fontWeight: 600, marginBottom: '6px', color: '#111' }}>TPAT2 ศิลปกรรม ชุด {set}</div>)}
                      {tpat3Count > 0 && <div style={{ fontWeight: 600, marginBottom: '6px', color: '#111' }}>TPAT3 วิทยาศาสตร์ ชุด A</div>}
                      {tpat4Count > 0 && <div style={{ fontWeight: 600, marginBottom: '6px', color: '#111' }}>TPAT4 สถาปัตย์ ชุด A</div>}
                    </div>
                  </details>
                </div>}

                {otherSelected.alevel && <div className="wb-review-line" style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '15px' }}>A-Level ความรู้ทางวิชาการ</strong>
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>179 บาท</span>
                  </div>
                </div>}

                {otherSelected.netsat && <div className="wb-review-line" style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '15px' }}>NETSAT</strong>
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>179 บาท</span>
                  </div>
                </div>}

                <div className="wb-review-total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff9e6', padding: '16px', borderRadius: '12px' }}>
                  <strong style={{ fontSize: '14px' }}>ยอดชำระทั้งหมด ({totalItems} ชุด)</strong>
                  <strong style={{ fontSize: '16px' }}>{totalPrice} บาท</strong>
                </div>
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: '24px' }}>
              🔒 ข้อมูลของคุณถูกจัดเก็บอย่างปลอดภัย · ชำระผ่าน QR PromptPay
            </p>

            <div className="wb-registration-actions" style={{ marginTop: '24px' }}>
              <button type="button" className="wb-registration-back" onClick={() => goTo(3)}>ย้อนกลับ</button>
              <button className="wb-registration-next" onClick={() => setShowPaymentQR(true)}>ชำระเงิน {totalPrice} บาท </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button style={{ background: 'transparent', border: 'none', color: '#28629a', textDecoration: 'underline', fontSize: '13px', cursor: 'pointer', padding: '8px' }} onClick={() => goTo(5)}>จำลองการชำระเงินสำเร็จ (ข้ามหน้าสแกน QR)</button>
            </div>
          </div>}

          {step === 5 && <div className="wb-registration-step-extra" style={{ textAlign: 'center', padding: '40px 20px', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: '#22c55e', color: '#fff', marginBottom: '24px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h1 style={{ color: '#22c55e', fontSize: '28px', marginBottom: '12px' }}>ชำระเงินสำเร็จ</h1>
            <p className="wb-registration-lead" style={{ marginBottom: '32px' }}>การสมัครสอบเสร็จสมบูรณ์แล้ว คุณสามารถเข้าสู่ห้องสอบได้ทันที</p>

            <p style={{ fontWeight: 800, fontSize: '16px', marginBottom: '16px' }}>หมายเลขคำสั่งซื้อ: #990118097</p>

            <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '24px', textAlign: 'left', fontSize: '14px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ color: '#666' }}>วันที่ชำระ</span>
                <span style={{ fontWeight: 500 }}>27/07/2569, 10:23</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ color: '#666' }}>ช่องทางชำระ</span>
                <span style={{ fontWeight: 500 }}>QR Payment</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ color: '#666' }}>วิชาที่สมัคร</span>
                <span style={{ fontWeight: 500 }}>{selectedSubjectCount} วิชา</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>ยอดชำระ</span>
                <span style={{ fontWeight: 800, fontSize: '16px' }}>{totalPrice} บาท</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button type="button" onClick={() => window.location.replace("/webb")} style={{ flex: 1, padding: '14px', background: '#fff', border: '1.5px solid #111', borderRadius: '999px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>กลับสู่หน้าหลัก</button>
              <button type="button" onClick={() => window.location.replace("/webb/student?view=overview")} style={{ flex: 1, padding: '14px', background: '#ffce00', border: 'none', borderRadius: '999px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>เข้าสู่ห้องสอบ</button>
            </div>
          </div>}

        </main>
        <footer className="wb-registration-footer">© 2569 บริษัท เรียนต่อมหาลัย จำกัด</footer>
      </>}

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

      {showPaymentQR && <div className="wb-terms-overlay" role="presentation" style={{ background: 'rgba(255,250,235,0.9)', zIndex: 1000 }}>
        <button type="button" className="wb-terms-backdrop" aria-label="ปิด" onClick={() => setShowPaymentQR(false)} style={{ background: 'transparent' }} />
        <section className="wb-terms-dialog" role="dialog" aria-modal="true" style={{ maxWidth: '360px', maxHeight: '95vh', overflowY: 'auto', padding: 0, background: '#fff', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
          <button type="button" onClick={() => setShowPaymentQR(false)} style={{ position: 'absolute', top: '12px', right: '12px', width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#f0f0f0', cursor: 'pointer' }}>✕</button>
          <div style={{ padding: '20px 16px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800 }}>สแกน QR เพื่อชำระเงิน</h2>
            <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#666' }}>ชำระเงินผ่านแอปได้ทุกธนาคาร</p>

            <div style={{ border: '1px solid #e0e0e0', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ background: '#113a6b', padding: '10px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', background: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#113a6b"><path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" /></svg>
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>THAI QR</div>
                  <div style={{ fontSize: '10px' }}>PAYMENT</div>
                </div>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'inline-block', padding: '4px 12px', background: '#ffebeb', color: '#e84c3d', borderRadius: '20px', fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>
                  ชำระภายใน 59:24 นาที
                </div>
                <div style={{ width: '130px', height: '130px', margin: '0 auto 12px', background: '#fff', border: '1px solid #eee', position: 'relative' }}>
                  <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <rect x="10" y="10" width="30" height="30" fill="none" stroke="#000" strokeWidth="4" />
                    <rect x="60" y="10" width="30" height="30" fill="none" stroke="#000" strokeWidth="4" />
                    <rect x="10" y="60" width="30" height="30" fill="none" stroke="#000" strokeWidth="4" />
                    <rect x="18" y="18" width="14" height="14" fill="#000" />
                    <rect x="68" y="18" width="14" height="14" fill="#000" />
                    <rect x="18" y="68" width="14" height="14" fill="#000" />
                    <rect x="55" y="55" width="35" height="35" fill="#000" rx="4" />
                    <rect x="50" y="10" width="6" height="6" fill="#000" /><rect x="50" y="20" width="6" height="6" fill="#000" /><rect x="10" y="45" width="6" height="6" fill="#000" /><rect x="25" y="45" width="15" height="6" fill="#000" />
                  </svg>
                </div>
                <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '2px' }}>บริษัทเรียนต่อมหาลัย จำกัด</div>
                <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px' }}>รองรับทุกแอปธนาคาร · ยืนยันการชำระอัตโนมัติ</div>
                <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '12px' }}>ยอดที่ต้องชำระ {totalPrice} บาท</div>
                <button style={{ width: '100%', padding: '8px', background: '#fff', border: '1.5px solid #111', borderRadius: '999px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>ดาวน์โหลด QR Code</button>
              </div>
            </div>

            <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '12px', marginTop: '12px', textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, marginBottom: '4px' }}>วิธีชำระเงินง่ายๆ</div>
              <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#555', lineHeight: 1.5 }}>
                <li>เปิดแอปธนาคาร แล้วเลือกสแกน QR</li>
                <li>ตรวจสอบยอดเงินให้ตรง แล้วกดชำระ</li>
                <li>ยืนยันการชำระเงิน</li>
              </ol>
            </div>

            <button style={{ marginTop: '12px', background: 'transparent', border: 'none', color: '#28629a', textDecoration: 'underline', fontSize: '12px', cursor: 'pointer', padding: '4px' }} onClick={() => { setShowPaymentQR(false); goTo(5); }}>จำลองการชำระเงินสำเร็จ</button>
          </div>
        </section>
      </div>}
    </div>
  );
}
