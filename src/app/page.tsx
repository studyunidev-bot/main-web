import "@/css/public.css";
import "@/css/landing.css";
import Link from "next/link";
import WebBRootSessionGuard from "@/components/webb/WebBRootSessionGuard";

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ServiceIcon({ type }: { type: "exam" | "practice" }) {
  return type === "exam" ? (
    <svg aria-hidden="true" viewBox="0 0 48 48" fill="none">
      <rect x="10" y="6" width="28" height="36" rx="7" fill="currentColor" opacity=".12" />
      <path d="M18 17h12M18 24h12M18 31h5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="m27 32 3 3 6-7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 48 48" fill="none">
      <path d="M24 7 28.2 19.8 41 24l-12.8 4.2L24 41l-4.2-12.8L7 24l12.8-4.2L24 7Z" fill="currentColor" opacity=".14" />
      <path d="m24 11 3.3 9.7L37 24l-9.7 3.3L24 37l-3.3-9.7L11 24l9.7-3.3L24 11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function StudyUnithMark() {
  return (
    <span className="launch-brand-mark" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M5 12.5c6.9-3 13.2-2.5 19 1.5v26c-5.8-4-12.1-4.5-19-1.5v-26Z" fill="#f7bf2e" />
        <path d="M43 12.5c-6.9-3-13.2-2.5-19 1.5v26c5.8-4 12.1-4.5 19-1.5v-26Z" fill="#2676d2" />
        <path d="M24 14v26" stroke="#fff" strokeWidth="2" />
        <path d="M11 19c3.3-.7 6.3-.3 9 1.1M11 25c3.3-.7 6.3-.3 9 1.1M37 19c-3.3-.7-6.3-.3-9 1.1M37 25c-3.3-.7-6.3-.3-9 1.1" stroke="#fff" strokeOpacity=".75" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function SystemsLandingPage() {
  return (
    <WebBRootSessionGuard>
      <main className="launch-page">
        <div className="launch-wrap">
          <header className="launch-header">
            <Link className="launch-brand" href="/" aria-label="Study Unith หน้าหลัก">
              {/* <StudyUnithMark /> */}
              <span><b>Study Unith</b><small>ระบบบริการกลาง</small></span>
            </Link>
            <span className="launch-tagline"><i /> สำหรับการเรียนรู้ที่ดีขึ้น</span>
          </header>

          <section className="launch-intro" aria-labelledby="launch-title">
            <h1 id="launch-title">เลือกบริการ<br /><em>ที่ต้องการ</em></h1>
            <span className="launch-underline" aria-hidden="true" />
            <p>กดเลือกเพื่อเข้าสู่ระบบได้ทันที</p>
          </section>

          

          <section className="launch-services" aria-label="บริการของ Study Unith">
            <div className="launch-card-grid">
              <Link href="/gatpat/student/search" className="launch-service-card launch-card-a">
                <div className="launch-card-topline"><span className="launch-card-label"><i /> ระบบปัจจุบัน</span><span className="launch-card-code">A</span></div>
                <div className="launch-card-main">
                  <div className="launch-card-icon"><ServiceIcon type="exam" /></div>
                  <div className="launch-card-content">
                    <h2>ระบบสมัครสอบ GAT/PAT</h2>
                    <p>ค้นหาข้อมูลผู้สมัคร ดูรายละเอียดการสอบ<br className="launch-desktop-break" /> และตรวจสอบคะแนน</p>
                  </div>
                </div>
                <span className="launch-card-action">เข้าสู่ระบบ <ArrowIcon /></span>
              </Link>

              <Link href="/webb" className="launch-service-card launch-card-b">
                <div className="launch-card-topline"><span className="launch-card-label"><i /> ทดลองใช้งาน</span><span className="launch-card-code">B</span></div>
                <div className="launch-card-main">
                  <div className="launch-card-icon"><ServiceIcon type="practice" /></div>
                  <div className="launch-card-content">
                    <h2>ระบบสอบ TCAS Mock Exam</h2>
                    <p>ฝึกทำข้อสอบ ดูคะแนน และทดลองระบบรับสมัคร<br className="launch-desktop-break" /> รูปแบบใหม่</p>
                  </div>
                </div>
                <span className="launch-card-action">เข้าสู่ระบบ <ArrowIcon /></span>
              </Link>
            </div>
          </section>

          <footer className="launch-footer">
            <span>© {new Date().getFullYear()} Study Unith</span>
            <span className="launch-footer-dot" />
            <span>ระบบบริการกลาง</span>
            <span className="launch-footer-accent" aria-hidden="true"><i /><b /></span>
          </footer>
        </div>
      </main>
    </WebBRootSessionGuard>
  );
}
