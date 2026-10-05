"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type UserRow = { id: string; email: string; fullName: string | null; role: string; isActive: boolean; createdAt: string };

export default function GatpatUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [form, setForm] = useState({ email: "", fullName: "", password: "", role: "STAFF" });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/gatpat/admin/users", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || "โหลดผู้ใช้ไม่สำเร็จ");
    setUsers(body);
  }, []);
  useEffect(() => { void load().catch((error) => setNotice(error.message)); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/gatpat/admin/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const body = await response.json(); if (!response.ok) throw new Error(body.message || "สร้างบัญชีไม่สำเร็จ");
      setForm({ email: "", fullName: "", password: "", role: "STAFF" }); setNotice("สร้างบัญชีและผูกกับเว็บ A แล้ว"); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "สร้างบัญชีไม่สำเร็จ"); }
    finally { setBusy(false); }
  }

  async function toggle(user: UserRow) {
    setBusy(true); setNotice("");
    try {
      const response = await fetch(`/api/gatpat/admin/users/${encodeURIComponent(user.id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isActive: !user.isActive }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.message || "เปลี่ยนสถานะไม่สำเร็จ");
      await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "เปลี่ยนสถานะไม่สำเร็จ"); }
    finally { setBusy(false); }
  }

  return <>
    <p className="text-sm font-medium text-primary">ระบบสมัครสอบ · เว็บ A</p><h1 className="mt-1 text-2xl font-bold text-dark dark:text-white">ผู้ใช้งานและสิทธิ์</h1><p className="mt-1 text-sm text-dark-6">Role เป็นสิทธิ์สมาชิกของ Web A แยกจากเว็บไซต์อื่น</p>
    <form onSubmit={create} className="mt-5 grid gap-3 rounded-xl border border-stroke bg-white p-5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark sm:grid-cols-2">
      <h2 className="text-lg font-semibold sm:col-span-2">สร้างบัญชีเจ้าหน้าที่</h2>
      <input className="rounded border p-3" type="email" placeholder="อีเมล" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
      <input className="rounded border p-3" placeholder="ชื่อ-นามสกุล" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
      <input className="rounded border p-3" type="password" minLength={8} placeholder="รหัสผ่านอย่างน้อย 8 ตัว" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
      <select className="rounded border p-3" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{["STAFF", "CHECKIN", "VIEWER", "ADMIN", "SUPERADMIN"].map((role) => <option key={role}>{role}</option>)}</select>
      <button disabled={busy} className="justify-self-start rounded-lg bg-primary px-5 py-3 font-semibold text-white sm:col-span-2">สร้างผู้ใช้</button>
    </form>
    <div className="mt-6 overflow-x-auto rounded-xl border border-stroke bg-white shadow-1 dark:border-stroke-dark dark:bg-gray-dark"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-gray-2 text-dark-6 dark:bg-dark-2"><tr><th className="p-3">ชื่อ</th><th className="p-3">อีเมล</th><th className="p-3">Role เว็บ A</th><th className="p-3">สถานะ</th><th className="p-3"></th></tr></thead><tbody>{users.map((user) => <tr className="border-t border-stroke dark:border-stroke-dark" key={user.id}><td className="p-3 text-dark dark:text-white">{user.fullName}</td><td className="p-3">{user.email}</td><td className="p-3">{user.role}</td><td className="p-3">{user.isActive ? "ใช้งาน" : "ปิด"}</td><td className="p-3"><button disabled={busy} onClick={() => toggle(user)} className="rounded-lg border border-stroke px-3 py-2">{user.isActive ? "ปิดบัญชีเว็บ A" : "เปิดบัญชีเว็บ A"}</button></td></tr>)}</tbody></table></div>
    {notice && <p role="status" className="mt-4 rounded border bg-white p-4">{notice}</p>}
  </>;
}
