"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Application = {
  id: string;
  eventName: string;
  academicYear: number;
  examRound: string;
  sourceType: string;
  status: string;
  eventDate: string;
  location: string;
  province: string;
};
type SearchResult = {
  student: {
    firstName: string;
    lastName: string;
    firstNameEn: string;
    lastNameEn: string;
    maskedIdentifier: string;
  };
  applications: Application[];
};
type PortalSettings = {
  isUserPortalOpen: boolean;
  studentSearchHeroBannerUrl: string;
  lineOALink: string;
  announcement: string;
};

const examTypes = [
  {
    sourceType: "ONSITE_EXCEL",
    label: "ONSITE REVIEW",
    title: "กิจกรรมติวเก็งข้อสอบ",
  },
  {
    sourceType: "SIMULATED_EXCEL",
    label: "SIMULATED EXAM",
    title: "สอบจำลองเสมือนจริง",
  },
] as const;

function ContactNotice({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  if (!href) return null;
  return (
    <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5 text-center">
      {title && <p className="text-sm font-bold text-emerald-800">{title}</p>}
      <p className="mt-2 text-sm font-medium leading-6 text-emerald-900">
        {description}
      </p>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#06c755] px-6 py-3 text-sm font-black text-white shadow-lg transition-all hover:scale-[1.02]"
      >
        ติดต่อเจ้าหน้าที่
      </a>
    </div>
  );
}

export default function StudentSearchClient({
  settings,
  initialIdentifier = "",
}: {
  settings: PortalSettings;
  initialIdentifier?: string;
}) {
  const [nationalId, setNationalId] = useState(initialIdentifier);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const heroBannerUrl =
    settings.studentSearchHeroBannerUrl.trim() ||
    "/images/student-search-baner.jpeg";
  const isPortalClosed = !settings.isUserPortalOpen;

  async function runSearch(rawIdentifier: string) {
    const identifier = rawIdentifier.trim();
    if (!identifier || busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    setSearched(true);
    try {
      const response = await fetch("/api/gatpat/portal/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.message ||
            "ไม่พบข้อมูลนักเรียน กรุณาตรวจสอบรหัสผู้สมัคร/เลขบัตรอีกครั้ง",
        );
      setResult(payload);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "ไม่พบข้อมูลนักเรียน กรุณาตรวจสอบรหัสผู้สมัคร/เลขบัตรอีกครั้ง",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runSearch(nationalId);
  }

  useEffect(() => {
    if (initialIdentifier) void runSearch(initialIdentifier);
    // Only execute when opening a deep link; form submissions call runSearch directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIdentifier]);

  return (
    <div className="min-h-screen bg-[#fcfaf7] pb-20">
      <div className="relative overflow-hidden bg-[#0f172a] pb-28 pt-0 md:pb-32 md:pt-8">
        <div
          className="gatpat-hero-image absolute inset-0 bg-cover bg-no-repeat"
          style={{ backgroundImage: `url("${heroBannerUrl}")` }}
        />
        <div className="relative z-10 mx-auto w-full max-w-none px-0 md:container md:max-w-5xl md:px-4">
          <Link
            href="/auth/sign-in?callbackUrl=%2Fgatpat%2Fadmin%2Fdashboard"
            className="absolute right-4 top-5 rounded-full border border-white/30 bg-black/20 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/15 md:right-8 md:top-6"
          >
            เข้าสู่ระบบเจ้าหน้าที่
          </Link>
          <div className="flex h-96 items-start px-4 md:h-[432px] md:px-0">
            <div className="mt-5 inline-flex rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-white shadow-lg backdrop-blur md:mt-6">
              TCASEXPO
            </div>
          </div>
        </div>
      </div>

      <div className="container relative z-20 mx-auto -mt-16 max-w-2xl px-4 md:-mt-24">
        {isPortalClosed && (
          <div className="mb-6 rounded-[2.5rem] border border-amber-200 bg-amber-50 px-6 py-6 text-center shadow-xl">
            <p className="text-sm font-black uppercase tracking-widest text-amber-700">
              ประกาศจากระบบ
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#1e1b4b]">
              ขณะนี้ระบบ ปิดชั่วคราว
            </h2>
            <p className="mt-3 text-sm font-medium leading-7 text-amber-900">
              {settings.announcement.trim() ||
                "ขณะนี้ระบบปิดให้บริการชั่วคราว หากต้องการความช่วยเหลือกรุณาติดต่อเจ้าหน้าที่ผ่านปุ่มด้านล่าง"}
            </p>
            <div className="mt-5">
              <ContactNotice
                href={settings.lineOALink}
                title=""
                description="ติดต่อเจ้าหน้าที่ผ่าน Line OA เพื่อสอบถามข้อมูลหรือแจ้งปัญหาการใช้งาน"
              />
            </div>
          </div>
        )}

        <div className="premium-light-card rounded-xl p-3 shadow-2xl md:p-12">
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label
                htmlFor="national-id"
                className="mb-2 block text-sm font-medium text-[#374151]"
              >
                ตรวจสอบข้อมูลการสมัคร <span className="text-[#ef4444]">*</span>
              </label>
              <input
                id="national-id"
                value={nationalId}
                onChange={(event) => setNationalId(event.target.value)}
                required
                maxLength={32}
                autoComplete="off"
                placeholder="กรุณากรอกหมายเลขบัตรประจำตัวประชาชนผู้สมัคร"
                className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-3 py-4 text-sm text-[#111827] outline-none transition-colors focus:border-gold focus:ring-4 focus:ring-gold/10 md:text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={isPortalClosed || busy}
              className="bg-gradient-red flex w-full items-center justify-center gap-2 rounded-xl py-2 text-lg font-bold text-white shadow-xl transition-all hover:scale-[1.02] hover:opacity-95 active:scale-95 disabled:opacity-60 md:py-4"
            >
              {busy ? "กำลังค้นหา..." : "ค้นหา"}
            </button>
          </form>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5 text-center font-bold text-red-600"
          >
            <p>⚠️ {error}</p>
            <div className="mt-4">
              <ContactNotice
                href={settings.lineOALink}
                title="กรณีไม่พบข้อมูล กรุณากด “ติดต่อเจ้าหน้าที่”"
                description="หากตรวจสอบรหัสผู้สมัครหรือเลขบัตรแล้วไม่พบข้อมูล สามารถติดต่อเจ้าหน้าที่เพื่อให้ช่วยตรวจสอบได้"
              />
            </div>
          </div>
        )}

        {result && searched && (
          <div className="mt-10 space-y-6 pb-20">
            <div className="premium-light-card rounded-xl p-6 shadow-lg">
              <h2 className="mb-6 text-2xl font-bold text-[#1e1b4b]">
                ข้อมูลผู้สมัคร
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-slate-50/50 p-5">
                  <p className="mb-1 text-sm font-bold uppercase tracking-widest text-gold-dark">
                    ชื่อ-นามสกุล
                  </p>
                  <p className="text-lg font-bold text-slate-800 md:text-xl">
                    {result.student.firstName} {result.student.lastName}
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-400">
                    {result.student.firstNameEn} {result.student.lastNameEn}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-slate-50/50 p-5">
                  <p className="mb-1 text-sm font-bold uppercase tracking-widest text-gold-dark">
                    หมายเลขบัตรประจำตัวประชาชน
                  </p>
                  <p className="font-mono text-lg font-bold text-slate-800 md:text-xl">
                    {nationalId.trim()}
                  </p>
                </div>
              </div>
            </div>
            <div className="premium-light-card rounded-xl p-6 shadow-lg">
              <div className="mb-8 flex items-center gap-3">
                <div className="h-8 w-1.5 rounded-full bg-gold" />
                <h2 className="text-2xl font-bold text-[#1e1b4b]">
                  รายการที่สมัคร
                </h2>
              </div>
              <div className="space-y-5">
                {examTypes.flatMap((category) => {
                  const applications = result.applications.filter(
                    (application) =>
                      application.sourceType === category.sourceType,
                  );
                  if (!applications.length)
                    return [
                      <div
                        key={category.sourceType}
                        className="cursor-not-allowed rounded-3xl border border-gray-100 bg-gray-50/50 p-6 opacity-60 grayscale-[.5]"
                      >
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                          <div>
                            <span className="rounded bg-gray-200 px-2 py-0.5 text-[10px] font-black uppercase text-gray-500">
                              {category.label}
                            </span>
                            <h3 className="mb-2 mt-2 text-xl font-extrabold text-gray-400">
                              {category.title}
                            </h3>
                            <p className="text-sm text-gray-400">
                              ยังไม่มีข้อมูลการสมัครในส่วนนี้
                            </p>
                          </div>
                          <span className="rounded-full border border-gray-200 bg-gray-100 px-4 py-1 text-xs font-bold text-gray-400">
                            ยังไม่ได้สมัคร
                          </span>
                        </div>
                      </div>,
                    ];
                  return applications.map((application) => (
                    <Link
                      key={application.id}
                      href={`/gatpat/student/applications/${application.id}`}
                      className="group relative block overflow-hidden rounded-xl border border-gray-100 p-5 transition-all duration-300 hover:border-gold hover:bg-gold/5"
                    >
                      <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div className="flex-1">
                          <h3 className="mb-2 text-lg font-extrabold text-slate-900 transition-colors group-hover:text-red-expo md:text-xl">
                            {application.eventName}
                          </h3>
                          <p className="font-mono text-xs text-gray-400">
                            APP ID: {application.id}
                          </p>
                          <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                            <p>
                              <span className="font-semibold text-gold-dark">
                                วันจัดกิจกรรม
                              </span>
                              <br />
                              {new Date(
                                application.eventDate,
                              ).toLocaleDateString("th-TH-u-ca-buddhist", {
                                timeZone: "Asia/Bangkok",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <p>
                              <span className="font-semibold text-gold-dark">
                                สถานที่ / จังหวัด
                              </span>
                              <br />
                              {application.location}
                              {application.province
                                ? ` (${application.province})`
                                : ""}
                            </p>
                          </div>
                          {applications.length > 1 && (
                            <p className="mt-2 text-xs text-gray-500">
                              ปีการศึกษา{" "}
                              {application.academicYear.toLocaleString("th-TH")}{" "}
                              · {application.examRound}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700">
                            {application.status === "CANCELLED"
                              ? "ยกเลิกแล้ว"
                              : "ยืนยันสิทธิ์สำเร็จ"}
                          </span>
                          <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e1b4b] px-6 py-2.5 font-bold text-white shadow-md transition-all group-hover:scale-[1.03] group-hover:bg-[#2e2a78] md:w-auto">
                            รายละเอียด <span aria-hidden="true">→</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  ));
                })}
              </div>
              {result.applications.length > 0 && (
                <div className="mt-6 text-center">
                  <Link
                    href={`/gatpat/student/applications?id=${encodeURIComponent(nationalId.trim())}`}
                    className="inline-flex items-center justify-center rounded-xl border border-[#1e1b4b]/15 px-5 py-3 text-sm font-bold text-[#1e1b4b] transition-colors hover:bg-[#1e1b4b]/5"
                  >
                    เปิดหน้ารายการการสมัครทั้งหมด
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
