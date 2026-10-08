"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { FaFacebookF, FaInstagram, FaLine, FaTiktok, FaYoutube } from "react-icons/fa6";
import { DEMO_AUTH_KEY, defaultSocialSettings, readDemoAccount, readSocialSettings, type SocialSettings } from "./demo-store";

const mainLinks = [
  { label: "ทำไมต้องสอบกับเรา", href: "/webb#why" },
  { label: "วิชาที่เปิดสอบ", href: "/webb#subjects" },
  { label: "คู่มือการสอบ", href: "/webb#guide" },
  { label: "ขั้นตอนการสมัคร", href: "/webb#steps" },
];

export function WebBBrand() {
  return (
    <Link
      className="wb-brand"
      href="/webb"
      aria-label="เรียนต่อมหาลัย TCAS Mock Exam หน้าแรก"
    >
      <span className="wb-brand-symbol" aria-hidden="true">
        <span className="wb-brand-person wb-brand-yellow">
          <i />
          <b />
        </span>
        <span className="wb-brand-person wb-brand-orange">
          <i />
          <b />
        </span>
        <span className="wb-brand-person wb-brand-blue">
          <i />
          <b />
        </span>
      </span>
      <span className="wb-brand-copy">
        <strong>เรียนต่อมหาลัย</strong>
        <small>TCAS MOCK EXAM</small>
      </span>
    </Link>
  );
}

export function PublicFooter() {
  const [social, setSocial] = useState<SocialSettings>(defaultSocialSettings);
  useEffect(() => {
    setSocial(readSocialSettings());
    const refresh = () => setSocial(readSocialSettings());
    window.addEventListener("storage", refresh);
    window.addEventListener("webb-demo-social-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("webb-demo-social-updated", refresh);
    };
  }, []);
  const footerSocials = [
    { label: "LINE", href: social.lineUrl, icon: <FaLine /> },
    { label: "Facebook", href: social.facebookUrl, icon: <FaFacebookF /> },
    { label: "Instagram", href: social.instagramUrl, icon: <FaInstagram /> },
    { label: "TikTok", href: social.tiktokUrl, icon: <FaTiktok /> },
    { label: "YouTube", href: social.youtubeUrl, icon: <FaYoutube /> },
  ].filter((item) => item.href);
  return (
    <footer className="wb-footer " id="footer ">
      <div className="wb-container ">
        <div className="wb-footer-grid ">
          <div className="wb-footer-company">
            <WebBBrand />
            <p>
              <b>Corporate Head Office:</b> 3787 Jerry Dove Drive, Florence,
              <br className="wb-desktop-only" /> South Carolina, 29501, United
              States.
            </p>
          </div>
          <div className="wb-footer-column">
            <h2>เกี่ยวกับเรา</h2>
            {mainLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="wb-footer-column">
            <h2>ติดต่อเรา</h2>
            <p>
              <b>Phone:</b> 02-235-2451 ต่อ 2308
              <br />
              <small>(จันทร์ - อังคารเท่านั้น)</small>
            </p>
            <p>
              <b>Line:</b> {social.lineId || "ตั้งค่า LINE ในระบบหลังบ้าน"}
              <br />
              <small>(จันทร์ - อังคารเท่านั้น)</small>
            </p>
          </div>
          <div className="wb-footer-column">
            <h2>ช่องทางติดตาม</h2>
            <div className="wb-social" aria-label="ช่องทางติดตาม">
              {footerSocials.map((item) => <a key={item.label} href={item.href} aria-label={item.label} target="_blank" rel="noreferrer">{item.icon}</a>)}
            </div>
          </div>
        </div>
        <div className="wb-footer-bottom">
          © 2569 บริษัท เรียนต่อมหาลัย จำกัด
        </div>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [studentLoggedIn, setStudentLoggedIn] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [accountLabel, setAccountLabel] = useState("บัญชีผู้เรียน");
  const [helpOpen, setHelpOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const socialWidgetRef = useRef<HTMLDivElement>(null);
  const [social, setSocial] = useState<SocialSettings>(defaultSocialSettings);
  const socialLinks = useMemo(() => [
    { label: "LINE", href: social.lineUrl, handle: social.lineId, icon: <FaLine /> },
    { label: "Facebook", href: social.facebookUrl, handle: "", icon: <span>f</span> },
    { label: "Instagram", href: social.instagramUrl, handle: "", icon: <FaInstagram /> },
    { label: "TikTok", href: social.tiktokUrl, handle: "", icon: <FaTiktok /> },
    { label: "YouTube", href: social.youtubeUrl, handle: "", icon: <FaYoutube /> },
  ].filter((item) => item.href), [social]);
  useEffect(() => {
    const syncLogin = () => {
      const account = readDemoAccount();
      setStudentLoggedIn(window.localStorage.getItem(DEMO_AUTH_KEY) === "true");
      setRegistered(!!account);
      setAccountLabel(account ? [account.firstName, account.lastName].filter(Boolean).join(" ") || account.username : "sss");
    };
    syncLogin();
    window.addEventListener("storage", syncLogin);
    window.addEventListener("webb-demo-auth-updated", syncLogin);
    return () => {
      window.removeEventListener("storage", syncLogin);
      window.removeEventListener("webb-demo-auth-updated", syncLogin);
    };
  }, []);
  useEffect(() => {
    const refresh = () => setSocial(readSocialSettings());
    window.addEventListener("storage", refresh);
    window.addEventListener("webb-demo-social-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("webb-demo-social-updated", refresh);
    };
  }, []);
  useEffect(() => {
    if (!menuOpen && !helpOpen && !socialOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); setHelpOpen(false); setSocialOpen(false); }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen, helpOpen, socialOpen]);
  useEffect(() => {
    if (!socialOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!socialWidgetRef.current?.contains(event.target as Node)) setSocialOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [socialOpen]);

  function SignupAction({ mobile = false }: { mobile?: boolean }) {
    const href = studentLoggedIn ? "/webb/products" : registered ? "/webb/login" : "/webb/register";
    return <Link className="wb-pill-button wb-pill-yellow" href={href} onClick={() => mobile && setMenuOpen(false)}>เลือกซื้อข้อสอบ</Link>;
  }

  function AccountAction({ mobile = false }: { mobile?: boolean }) {
    if (!studentLoggedIn) return null;
    return (
      <Link
        className={`wb-account-chip${mobile ? " is-mobile" : ""}`}
        href="/webb/student?view=overview"
        onClick={() => mobile && setMenuOpen(false)}
        aria-label={`บัญชี ${accountLabel} · ไปหน้าหลักผู้เรียน`}
      >
        <span className="wb-account-avatar" aria-hidden="true">{accountLabel.slice(0, 1).toUpperCase()}</span>
        <span className="wb-account-copy"><b>{accountLabel}</b><small>บัญชีผู้เรียน</small></span>
      </Link>
    );
  }

  return (
    <div className="webb-site wb-shell">
      <header className="wb-header">
        <div className="wb-container wb-header-inner">
          <WebBBrand />
          <nav className="wb-desktop-nav" aria-label="เมนูหลัก">
            {mainLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="wb-header-actions">
            {studentLoggedIn ? (
              <>
                <Link className="wb-pill-button wb-pill-outline" href="/webb/status">
                  รายการที่ซื้อแล้ว
                </Link>
              </>
            ) : null}
            <SignupAction />
            <AccountAction />
          </div>
          <button
            className="wb-menu-toggle"
            type="button"
            aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={menuOpen}
            aria-controls="wb-mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <span className="wb-menu-close">×</span>
            ) : (
              <span className="wb-hamburger">
                <i />
                <i />
                <i />
              </span>
            )}
          </button>
        </div>
        <div className={`wb-mobile-menu${menuOpen ? " is-open" : ""}`}>
          <button
            className="wb-mobile-backdrop"
            type="button"
            aria-label="ปิดเมนู"
            tabIndex={menuOpen ? 0 : -1}
            onClick={() => setMenuOpen(false)}
          />
          <nav
            className="wb-mobile-drawer"
            id="wb-mobile-menu"
            aria-label="เมนูมือถือ"
            aria-hidden={!menuOpen}
            inert={!menuOpen}
          >
            <div className="wb-mobile-drawer-inner">
              <button
                className="wb-mobile-drawer-close"
                type="button"
                aria-label="ปิดเมนู"
                onClick={() => setMenuOpen(false)}
              >
                ×
              </button>
              <div className="wb-mobile-links">
                {mainLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="wb-mobile-actions">
                {studentLoggedIn ? (
                  <>
                    <AccountAction mobile />
                    <Link className="wb-pill-button wb-pill-outline" href="/webb/status" onClick={() => setMenuOpen(false)}>
                      รายการที่ซื้อแล้ว
                    </Link>
                  </>
                ) : null}
                <SignupAction mobile />
                <button className="wb-header-help" type="button" onClick={() => { setMenuOpen(false); setHelpOpen(true); }}>ขอความช่วยเหลือ</button>
              </div>
            </div>
          </nav>
        </div>
      </header>
      {children}
      <PublicFooter />
      {pathname === "/webb" && socialLinks.length > 0 && <div className={`wb-social-widget${socialOpen ? " is-open" : ""}`} ref={socialWidgetRef}>
        <div className="wb-social-float-menu" id="wb-social-float-menu" role="group" aria-label="ช่องทางติดตาม" hidden={!socialOpen}>
          {socialLinks.map((item, index) => <a key={item.label} href={item.href} aria-label={`ติดตามทาง ${item.label}${item.handle ? ` ${item.handle}` : ""}`} title={item.label} target="_blank" rel="noreferrer" onClick={() => setSocialOpen(false)} style={{ "--social-delay": `${index * 45}ms` } as CSSProperties & Record<"--social-delay", string>}>
            <span>{item.label}{item.handle && <small>{item.handle}</small>}</span><i>{item.icon}</i>
          </a>)}
        </div>
        <button className="wb-social-float" type="button" aria-label={socialOpen ? "ปิดช่องทาง Social" : "เปิดช่องทาง Social"} aria-expanded={socialOpen} aria-controls="wb-social-float-menu" onClick={() => setSocialOpen((open) => !open)}>
          <span className="wb-social-float-symbol" aria-hidden="true">◎</span><span>ติดตามเรา</span><b aria-hidden="true">{socialOpen ? "×" : "+"}</b>
        </button>
      </div>}
      {helpOpen && <div className="wb-contact-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setHelpOpen(false); }}>
        <section className="wb-contact-dialog" role="dialog" aria-modal="true" aria-labelledby="wb-contact-title">
          <button type="button" className="wb-contact-close" aria-label="ปิด" onClick={() => setHelpOpen(false)}>×</button>
          <span className="webb-kicker">STUDY UNITH · SUPPORT</span>
          <h2 id="wb-contact-title">เราพร้อมช่วยเหลือ</h2>
          <p>ติดต่อทีมงานผ่านช่องทางด้านล่าง</p>
          <div className="wb-contact-links">{socialLinks.map((item) => <a href={item.href} target="_blank" rel="noreferrer" key={item.label}><i>{item.icon}</i><span><b>{item.label}</b>{item.handle && <small>{item.handle}</small>}</span><strong>↗</strong></a>)}
            {social.supportEmail && <a href={`mailto:${social.supportEmail}`}><i>✉</i><span><b>อีเมลช่วยเหลือ</b><small>{social.supportEmail}</small></span><strong>↗</strong></a>}
          </div>
          {socialLinks.length === 0 && !social.supportEmail && <p className="wb-contact-empty">ยังไม่มีช่องทางติดต่อ กรุณาตรวจสอบอีกครั้งภายหลัง</p>}
        </section>
      </div>}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
}) {
  return (
    <div className="webb-section-title">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {detail && <p>{detail}</p>}
    </div>
  );
}
