"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { WebBBrand } from "./PublicShell";

export default function WebBAccount() {
  const [notice, setNotice] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (
      String(form.get("identifier") ?? "").trim() !== "sss" ||
      String(form.get("password") ?? "") !== "sss"
    ) {
      setLoginError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    window.localStorage.setItem("webb-demo-student-auth", "true");
    window.location.assign("/webb/student");
  }

  return (
    <div className="webb-site wb-shell wb-auth-page">
      <header className="wb-auth-header">
        <WebBBrand />
        <nav className="wb-auth-header-actions" aria-label="เมนูบัญชี">
          <Link href="/webb">กลับสู่หน้าหลัก</Link>
          <Link className="wb-pill-button wb-pill-yellow" href="/webb/register">
            สมัครสอบ
          </Link>
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
            <p className="wb-auth-subtitle">ใช้เบอร์มือถือหรือเลขบัตรประชาชน</p>
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
                    />
                    <button
                      type="button"
                      className="wb-auth-password-toggle"
                      aria-label={
                        passwordVisible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"
                      }
                      aria-pressed={passwordVisible}
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
                onClick={() =>
                  setNotice(
                    "หากต้องการรีเซ็ตรหัสผ่าน กรุณาติดต่อทีมงานผ่าน LINE @เรียนต่อมหาลัย",
                  )
                }
              >
                ลืมรหัสผ่าน?
              </button>
              <button type="submit" className="wb-auth-submit">
                เข้าสู่ระบบ
              </button>
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
