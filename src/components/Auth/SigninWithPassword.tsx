"use client";

import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type SigninWithPasswordProps = {
  callbackUrl?: string;
};

export default function SigninWithPassword({
  callbackUrl = "/gatpat/admin/dashboard",
}: SigninWithPasswordProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // Demo Web A
  // =========================
  const webADemoEmail = "demo-web-a@studyunith.local";
  const webADemoPassword = "1l6uQsNWBgp1oXkAsMXTLbI1";

  // =========================
  // Demo Web B
  // =========================
  const webBDemoEmail = "demo-web-b@studyunith.local";
  const webBDemoPassword = "WebB-Demo-2570";
  const adminDemoUsername = "aaa";
  const adminDemoPassword = "aaa";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const loginEmail =
        normalizedEmail === adminDemoUsername
          ? "aaa@studyunith.local"
          : normalizedEmail;

      // Route the shared admin demo account into Web B only when the request
      // originated from the Web B admin area. Web A keeps its existing login.
      if (
        normalizedEmail === adminDemoUsername &&
        password === adminDemoPassword &&
        callbackUrl.startsWith("/webb/admin/")
      ) {
        window.localStorage.setItem("webb-admin-demo-auth", "true");
        router.push(callbackUrl);
        return;
      }

      // =========================
      // Web B Demo
      // =========================
      if (normalizedEmail === webBDemoEmail && password === webBDemoPassword) {
        window.localStorage.setItem("webb-admin-demo-auth", "true");
        router.push("/webb/admin/dashboard");
        return;
      }

      // =========================
      // Web A / NextAuth Login
      // =========================
      const result = await Promise.race([
        signIn("credentials", {
          email: loginEmail,
          password,
          redirect: false,
          callbackUrl,
        }),

        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error("LOGIN_TIMEOUT")), 15_000),
        ),
      ]);

      if (!result?.ok) {
        setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        return;
      }

      // =========================
      // Get Session
      // =========================
      const session = await Promise.race([
        getSession(),

        new Promise<null>((resolve) =>
          window.setTimeout(() => resolve(null), 5_000),
        ),
      ]);

      const role = session?.user?.role;

      // =========================
      // Redirect ตาม Role
      // =========================
      const destination =
        role === "CHECKIN" || role === "STAFF"
          ? "/gatpat/admin/checkin"
          : callbackUrl.startsWith("/gatpat/")
            ? callbackUrl
            : "/gatpat/admin/dashboard";

      router.push(destination);
      router.refresh();
    } catch {
      setError("เชื่อมต่อระบบเข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-3xl border border-stroke bg-white p-6 shadow-2 md:p-8"
      >
        {/* =========================
            Header
        ========================== */}
        <div>
          <h1 className="text-2xl font-bold text-dark">เข้าสู่ระบบหลังบ้าน</h1>

          <p className="mt-1 text-sm text-dark-6">
            เลือกใช้บัญชีสาธิตสำหรับ Web A หรือ Web B
          </p>
        </div>

        {/* =========================
            Demo Web A
        ========================== */}
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <h2 className="font-semibold text-dark">บัญชีสาธิตสำหรับเว็บ A</h2>

          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-dark-6">อีเมล Demo</dt>

              <dd className="break-all font-mono font-semibold text-dark">
                {webADemoEmail}
              </dd>
            </div>

            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-dark-6">รหัสผ่าน Demo</dt>

              <dd className="break-all font-mono font-semibold text-dark">
                {webADemoPassword}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={() => {
              setEmail(webADemoEmail);
              setPassword(webADemoPassword);
              setError("");
            }}
            className="mt-4 w-full rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
          >
            ใช้บัญชี Demo เว็บ A
          </button>
        </section>

        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <h2 className="font-semibold text-dark">บัญชีแอดมินสาธิต</h2>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-dark-6">ชื่อผู้ใช้</dt>
              <dd className="font-mono font-semibold text-dark">aaa</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-dark-6">รหัสผ่าน</dt>
              <dd className="font-mono font-semibold text-dark">aaa</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => {
              setEmail(adminDemoUsername);
              setPassword(adminDemoPassword);
              setError("");
            }}
            className="mt-4 w-full rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
          >
            ใช้บัญชีแอดมินสาธิต
          </button>
        </section>

        {/* =========================
            Demo Web B
        ========================== */}
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <h2 className="font-semibold text-dark">บัญชีสาธิตสำหรับเว็บ B</h2>

          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-dark-6">อีเมล Demo</dt>

              <dd className="break-all font-mono font-semibold text-dark">
                {webBDemoEmail}
              </dd>
            </div>

            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-dark-6">รหัสผ่าน Demo</dt>

              <dd className="break-all font-mono font-semibold text-dark">
                {webBDemoPassword}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={() => {
              setEmail(webBDemoEmail);
              setPassword(webBDemoPassword);
              setError("");
            }}
            className="mt-4 w-full rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
          >
            ใช้บัญชี Demo เว็บ B
          </button>
        </section>

        {/* =========================
            Email
        ========================== */}
        <label className="grid gap-2 text-sm font-medium text-dark">
          อีเมลหรือชื่อผู้ใช้
          <input
            type="text"
            autoComplete="username"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            disabled={loading}
            required
            className="rounded-xl border border-stroke p-3 outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        {/* =========================
            Password
        ========================== */}
        <label className="grid gap-2 text-sm font-medium text-dark">
          รหัสผ่าน
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            disabled={loading}
            required
            className="rounded-xl border border-stroke p-3 outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        {/* =========================
            Error
        ========================== */}
        {error && (
          <p role="alert" className="rounded-xl bg-red/5 p-3 text-sm text-red">
            {error}
          </p>
        )}

        {/* =========================
            Submit
        ========================== */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary p-3 font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
        </button>

        {/* =========================
            Back
        ========================== */}
        <a
          href="/"
          className="block text-center text-sm text-dark-6 transition hover:text-primary"
        >
          กลับไปหน้าเลือกระบบ
        </a>
      </form>
    </main>
  );
}
