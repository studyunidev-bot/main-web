"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Settings = {
  googleDriveLink: string | null;
  facebookLink: string | null;
  lineLink: string | null;
  studentSearchHeroBannerUrl: string | null;
  studentExamHeroBannerUrl: string | null;
  isUserPortalOpen: boolean;
  isCheckInOpen: boolean;
  announcement: string | null;
  userPortalOpensAt: string | null;
  userPortalClosesAt: string | null;
};

function localBangkok(value: string | null | undefined) {
  if (!value) return "";
  const fields = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));
  return fields.replace(" ", "T");
}

const empty: Settings = { googleDriveLink: "", facebookLink: "", lineLink: "", studentSearchHeroBannerUrl: "", studentExamHeroBannerUrl: "", isUserPortalOpen: true, isCheckInOpen: true, announcement: "", userPortalOpensAt: null, userPortalClosesAt: null };

export default function GatpatSettingsPage() {
  const { data: session } = useSession();
  const canChangeSchedule = session?.user.role === "SUPERADMIN";
  const [settings, setSettings] = useState<Settings>(empty);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/gatpat/admin/settings", { cache: "no-store" }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "โหลดการตั้งค่าไม่สำเร็จ");
      setSettings({ ...empty, ...body });
    }).catch((error) => setNotice(error.message));
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) { setSettings((current) => ({ ...current, [key]: value })); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    const toIso = (value: string | null) => value ? new Date(`${value}+07:00`).toISOString() : null;
    try {
      const response = await fetch("/api/gatpat/admin/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({
        googleDriveLink: settings.googleDriveLink ?? "", facebookPageLink: settings.facebookLink ?? "", lineOALink: settings.lineLink ?? "",
        isUserPortalOpen: settings.isUserPortalOpen, isCheckInOpen: settings.isCheckInOpen, announcement: settings.announcement,
        userPortalOpensAt: toIso(settings.userPortalOpensAt), userPortalClosesAt: toIso(settings.userPortalClosesAt),
      }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "บันทึกไม่สำเร็จ");
      setSettings({ ...settings, ...body }); setNotice("บันทึกการตั้งค่าแล้ว");
    } catch (error) { setNotice(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ"); }
    finally { setBusy(false); }
  }

  async function uploadBanner(target: "student-search" | "student-exam", file?: File) {
    if (!file) return;
    setBusy(true); setNotice("");
    try {
      const form = new FormData(); form.set("target", target); form.set("banner", file);
      const response = await fetch("/api/gatpat/admin/settings/banner", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "อัปโหลดไม่สำเร็จ");
      update(target === "student-search" ? "studentSearchHeroBannerUrl" : "studentExamHeroBannerUrl", body.url);
      setNotice("อัปโหลดแบนเนอร์แล้ว");
    } catch (error) { setNotice(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ"); }
    finally { setBusy(false); }
  }

  return <>
   <p className="text-sm font-medium text-primary">ระบบสมัครสอบ · เว็บ A · Asia/Bangkok</p><h1 className="mt-1 text-2xl font-bold text-dark dark:text-white">ตั้งค่าระบบ</h1>
    <form onSubmit={save} className="mt-5 grid gap-5">
      <section className="grid gap-4 rounded-xl border border-stroke bg-white p-5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark sm:grid-cols-2">
        <label className="flex items-center gap-3"><input type="checkbox" checked={settings.isUserPortalOpen} onChange={(event) => update("isUserPortalOpen", event.target.checked)} />เปิด portal (ปิดเองได้)</label>
        <label className="flex items-center gap-3"><input type="checkbox" checked={settings.isCheckInOpen} onChange={(event) => update("isCheckInOpen", event.target.checked)} />เปิดระบบ check-in</label>
        <label className="grid gap-2 text-sm">เวลาเริ่มเปิด portal<input disabled={!canChangeSchedule} className="rounded border p-3 disabled:cursor-not-allowed disabled:bg-gray-2 disabled:text-gray-5" type="datetime-local" value={localBangkok(settings.userPortalOpensAt)} onChange={(event) => update("userPortalOpensAt", event.target.value || null)} /></label>
        <label className="grid gap-2 text-sm">เวลาปิด portal<input disabled={!canChangeSchedule} className="rounded border p-3 disabled:cursor-not-allowed disabled:bg-gray-2 disabled:text-gray-5" type="datetime-local" value={localBangkok(settings.userPortalClosesAt)} onChange={(event) => update("userPortalClosesAt", event.target.value || null)} /></label>
        <label className="grid gap-2 text-sm sm:col-span-2">ประกาศ<textarea className="rounded border p-3" rows={3} value={settings.announcement ?? ""} onChange={(event) => update("announcement", event.target.value)} /></label>
      </section>
      <section className="grid gap-4 rounded-xl border border-stroke bg-white p-5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark">
        <label className="grid gap-2 text-sm">Google Drive<input className="rounded border p-3" value={settings.googleDriveLink ?? ""} onChange={(event) => update("googleDriveLink", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">Facebook<input className="rounded border p-3" value={settings.facebookLink ?? ""} onChange={(event) => update("facebookLink", event.target.value)} /></label>
        <label className="grid gap-2 text-sm">LINE OA<input className="rounded border p-3" value={settings.lineLink ?? ""} onChange={(event) => update("lineLink", event.target.value)} /></label>
      </section>
      <section className="grid gap-5 rounded-xl border border-stroke bg-white p-5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark sm:grid-cols-2">
        {([["student-search", "แบนเนอร์หน้าค้นหา", settings.studentSearchHeroBannerUrl], ["student-exam", "แบนเนอร์หน้ารายละเอียด", settings.studentExamHeroBannerUrl]] as const).map(([target, label, url]) => <div key={target} className="grid gap-2 text-sm">
          <span>{label}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadBanner(target, event.target.files?.[0])} />
          {url && <img src={url} alt={label} className="max-h-40 rounded border object-contain object-left" />}
        </div>)}
      </section>
      <button disabled={busy} className="justify-self-start rounded-lg bg-primary px-6 py-3 font-semibold text-white disabled:opacity-50">บันทึกการตั้งค่า</button>
    </form>
    {notice && <p role="status" className="mt-4 rounded border bg-white p-4">{notice}</p>}
    <p className="mt-4 text-xs text-slate-500">{canChangeSchedule ? "คุณมีสิทธิ์จัดตาราง portal" : "การแก้ไขเวลาเปิด-ปิดสงวนไว้สำหรับ SUPERADMIN"}; เวลาในหน้าจอใช้ Asia/Bangkok</p>
  </>;
}
