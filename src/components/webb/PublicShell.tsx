"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { FaInstagram, FaLine, FaTiktok, FaYoutube } from "react-icons/fa6";

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
              <b>Line:</b> @เรียนต่อมหาลัย
              <br />
              <small>(จันทร์ - อังคารเท่านั้น)</small>
            </p>
          </div>
          <div className="wb-footer-column">
            <h2>ช่องทางติดตาม</h2>
            <div className="wb-social" aria-label="ไอคอนช่องทางติดตามตัวอย่าง">
              <FaLine />
              <FaInstagram />
              <FaTiktok />
              <FaYoutube />
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [studentLoggedIn, setStudentLoggedIn] = useState(false);
  useEffect(() => {
    setStudentLoggedIn(
      window.localStorage.getItem("webb-demo-student-auth") === "true",
    );
    const syncLogin = () =>
      setStudentLoggedIn(
        window.localStorage.getItem("webb-demo-student-auth") === "true",
      );
    window.addEventListener("storage", syncLogin);
    return () => window.removeEventListener("storage", syncLogin);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);
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
              <Link
                className="wb-pill-button wb-pill-outline"
                href="/webb/student"
              >
                สมชาย · บัญชีนักเรียน
              </Link>
            ) : (
              <>
                <Link
                  className="wb-pill-button wb-pill-outline"
                  href="/webb/login"
                >
                  เข้าห้องสอบ
                </Link>
                <Link
                  className="wb-pill-button wb-pill-yellow"
                  href="/webb/register"
                >
                  สมัครสอบ
                </Link>
              </>
            )}
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
                  <Link
                    className="wb-pill-button wb-pill-outline"
                    href="/webb/student"
                    onClick={() => setMenuOpen(false)}
                  >
                    กลับสู่หน้าผู้เข้าสอบ · เข้าสู่ระบบแล้ว
                  </Link>
                ) : (
                  <>
                    <Link
                      className="wb-pill-button wb-pill-outline"
                      href="/webb/login"
                      onClick={() => setMenuOpen(false)}
                    >
                      เข้าห้องสอบ
                    </Link>
                    <Link
                      className="wb-pill-button wb-pill-yellow"
                      href="/webb/register"
                      onClick={() => setMenuOpen(false)}
                    >
                      สมัครสอบ
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        </div>
      </header>
      {children}
      <PublicFooter />
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
