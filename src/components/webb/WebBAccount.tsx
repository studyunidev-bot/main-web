"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { WebBBrand } from "./PublicShell";
import { DEMO_AUTH_KEY, readDemoAccount } from "./demo-store";

export default function WebBAccount() {
  const [notice, setNotice] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const routeByAuth = () => {
      if (window.localStorage.getItem(DEMO_AUTH_KEY) === "true") {
        window.location.replace("/webb/student?view=overview");
        return;
      }
      setAuthChecked(true);
    };
    routeByAuth();
    window.addEventListener("pageshow", routeByAuth);
    window.addEventListener("popstate", routeByAuth);
    window.addEventListener("storage", routeByAuth);
    window.addEventListener("webb-demo-auth-updated", routeByAuth);
    return () => {
      window.removeEventListener("pageshow", routeByAuth);
      window.removeEventListener("popstate", routeByAuth);
      window.removeEventListener("storage", routeByAuth);
      window.removeEventListener("webb-demo-auth-updated", routeByAuth);
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loggingIn) return;
    setLoggingIn(true);
    setLoginError("");
    const form = new FormData(event.currentTarget);
    const username = String(form.get("identifier") ?? "").trim();
    const password = String(form.get("password") ?? "");
    // The demo auth check is synchronous; keep the loading state visible to the user.
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    const account = readDemoAccount();
    const matchesSavedAccount = account && username === account.username && password === account.password;
    const isSeedDemoAccount = username === "sss" && password === "sss";
    if (!matchesSavedAccount && !isSeedDemoAccount) {
      setLoginError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      setLoggingIn(false);
      return;
    }
    window.localStorage.setItem(DEMO_AUTH_KEY, "true");
    window.dispatchEvent(new Event("webb-demo-auth-updated"));
    window.location.replace("/webb/student?view=overview");
  }

  if (!authChecked) return <main className="wb-auth-page" aria-busy="true" />;

  return (
    <div className="webb-site wb-shell wb-auth-page">
      <header className="wb-auth-header">
        <WebBBrand />
        <nav className="wb-auth-header-actions" aria-label="เมนูบัญชี">
          <Link href="/webb">กลับสู่หน้าหลัก</Link>
          <Link className="wb-pill-button wb-pill-yellow" href="/webb/register">สมัครสอบ</Link>
        </nav>
        <Link
          className="wb-auth-mobile-close"
          href="/webb"
          aria-label="กลับหน้าหลัก"
        >
          ×
        </Link>
      </header>
      <main className="wb-auth-main">
        <section className="wb-auth-art" aria-label="เตรียมพร้อมสอบได้มั่นใจ">
          <Image
            src="/images/webb/login-left.png"
            width={595}
            height={776}
            className="wb-auth-image"
            alt="เตรียมพร้อมสอบได้มั่นใจ สู่อนาคตที่ใช่"
            priority
          />
        </section>
        <section className="wb-auth-form-wrap">
          <div className="wb-auth-card">
            <div className="wb-auth-form-brand">
              <WebBBrand />
            </div>
            <h2>ยินดีต้อนรับเข้าสู่ห้องสอบ</h2>
            <p className="wb-auth-subtitle">เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน</p>
            <form onSubmit={submit}>
              <div className="wb-auth-fields">
                <label>
                  ชื่อผู้ใช้
                  <input
                    name="identifier"
                    autoComplete="username"
                    defaultValue="sss"
                    placeholder="ชื่อผู้ใช้"
                    required
                    disabled={loggingIn}
                  />
                </label>
                <label>
                  รหัสผ่าน
                  <span className="wb-auth-password">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      defaultValue="sss"
                      placeholder="รหัสผ่าน"
                      required
                      disabled={loggingIn}
                    />
                    <button
                      type="button"
                      className="wb-auth-password-toggle"
                      aria-label={
                        passwordVisible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"
                      }
                      aria-pressed={passwordVisible}
                      disabled={loggingIn}
                      onClick={() => setPasswordVisible((visible) => !visible)}
                    >
                      {passwordVisible ? "ซ่อน" : "แสดง"}
                    </button>
                  </span>
                </label>
              </div>
              <button
                type="button"
                className="wb-auth-forgot"
                disabled={loggingIn}
                onClick={() =>
                  setNotice(
                    "หากต้องการรีเซ็ตรหัสผ่าน กรุณาติดต่อทีมงานผ่าน LINE @เรียนต่อมหาลัย",
                  )
                }
              >
                ลืมรหัสผ่าน?
              </button>
              <button type="submit" className="wb-auth-submit" disabled={loggingIn} aria-busy={loggingIn}>
                {loggingIn ? <><span className="wb-auth-spinner" aria-hidden="true" />กำลังเข้าสู่ระบบ…</> : "เข้าสู่ระบบ"}
              </button>
              <p className="wb-auth-demo-hint">บัญชีทดสอบ Demo: <b>sss</b> / <b>sss</b></p>
              {loginError && (
                <p className="wb-auth-notice" role="alert">
                  {loginError}
                </p>
              )}
              {notice && (
                <p className="wb-auth-notice" role="status">
                  {notice}
                </p>
              )}
              <p className="wb-auth-switch">
                ยังไม่มีบัญชีผู้ใช้งาน?{" "}
                <Link href="/webb/register">สมัครสอบ</Link>
              </p>
            </form>
          </div>
        </section>
      </main>
      <footer className="wb-auth-footer">
        © 2569 บริษัท เรียนต่อมหาลัย จำกัด
      </footer>
    </div>
  );
}
