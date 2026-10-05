"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { WEBB_PRODUCTS, WEBB_DEMO_LABEL, formatBaht } from "./data";

const rows = [
  {
    ref: "DO-2570-0001",
    student: "ศิรศักดิ์ ผู้เรียน Demo",
    product: "Full TGAT",
    base: 250,
    charged: 275,
    fee: 8.25,
    method: "QR",
    day: "2026-10-05",
    status: "สำเร็จ",
  },
  {
    ref: "DO-2570-0002",
    student: "กมลชนก ตัวอย่าง",
    product: "TGAT1",
    base: 100,
    charged: 110,
    fee: 3.3,
    method: "บัตรเครดิต",
    day: "2026-10-04",
    status: "สำเร็จ",
  },
  {
    ref: "DO-2570-0003",
    student: "ธนกร สาธิต",
    product: "TGAT2 + TGAT3",
    base: 180,
    charged: 198,
    fee: 5.94,
    method: "QR",
    day: "2026-10-03",
    status: "สำเร็จ",
  },
  {
    ref: "DO-2570-0004",
    student: "นภัส Demo",
    product: "TGAT3",
    base: 100,
    charged: 110,
    fee: 3.3,
    method: "บัตรเครดิต",
    day: "2026-09-29",
    status: "รอชำระ",
  },
];
const money = (n: number) =>
  `${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;

export default function WebBAdmin() {
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("2026-10-01");
  const [to, setTo] = useState("2026-10-31");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(true);
  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.day >= from &&
          row.day <= to &&
          `${row.ref} ${row.student} ${row.product}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [from, to, query],
  );
  const summary = filtered
    .filter((r) => r.status === "สำเร็จ")
    .reduce(
      (a, r) => ({
        base: a.base + r.base,
        charged: a.charged + r.charged,
        fee: a.fee + r.fee,
        net: a.net + r.charged - r.fee,
      }),
      { base: 0, charged: 0, fee: 0, net: 0 },
    );
  function exportRows() {
    const csv = [
      "เลขคำสั่งซื้อ,ผู้เรียน,สินค้า,ราคาฐาน,ยอดเรียกเก็บ,ค่าธรรมเนียมจำลอง,ยอดรับสุทธิ,สถานะ",
      ...filtered.map((r) =>
        [
          r.ref,
          r.student,
          r.product,
          r.base,
          r.charged,
          r.fee,
          (r.charged - r.fee).toFixed(2),
          r.status,
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "web-b-demo-finance.csv";
    a.click();
    URL.revokeObjectURL(url);
    setMessage("ดาวน์โหลดรายงานตัวอย่างแล้ว");
  }
  const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  return (
    <div className="space-y-6 text-slate-900">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-bold text-amber-900">
        {WEBB_DEMO_LABEL} · ไม่มีการเรียก Payso หรือบันทึกฐานข้อมูล
      </div>
      {message && (
        <div
          role="status"
          className="fixed right-5 top-20 z-40 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl"
        >
          {message}
          <button onClick={() => setMessage("")} className="ml-3">
            ปิด
          </button>
        </div>
      )}
      <section id="overview" className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.18em] text-amber-700">
              STUDY UNITH · WEB B
            </span>
            <h1 className="mt-1 text-2xl font-extrabold">
              ภาพรวมแพลตฟอร์มฝึกสอบ
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              ข้อมูลตัวอย่าง ณ 5 ตุลาคม 2569
            </p>
          </div>
          <Link
            href="/webb"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"
          >
            ดูหน้าเว็บผู้เรียน ↗
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["คำสั่งซื้อสำเร็จ", "3", "ข้อมูล Demo"],
            ["ยอดขายฐาน", money(530), "ก่อนค่าธรรมเนียม"],
            ["ค่าธรรมเนียมจำลอง", money(17.49), "ตัวอย่าง 3%"],
            ["ยอดรับสุทธิ", money(565.51), "หลังหักค่าธรรมเนียม"],
          ].map(([label, value, hint]) => (
            <article className={`${card} !p-5`} key={label}>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-3 text-2xl font-extrabold">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{hint}</p>
            </article>
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
          <article className={card}>
            <h2 className="font-bold">ยอดรับสุทธิรายวัน</h2>
            <p className="mt-1 text-xs text-slate-500">
              ตัวอย่างภาพรวมการขายและค่าธรรมเนียม
            </p>
            <div className="mt-6 flex h-44 items-end gap-3 border-b border-l border-slate-100 px-4">
              {[38, 58, 44, 83, 67, 96, 61, 75, 51, 88, 70, 100].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-amber-300 transition hover:bg-indigo-500"
                  style={{ height: `${h}%` }}
                  title={`${h}%`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-400">
              <span>1 ต.ค.</span>
              <span>10 ต.ค.</span>
              <span>20 ต.ค.</span>
              <span>31 ต.ค.</span>
            </div>
          </article>
          <article className={card}>
            <h2 className="font-bold">ชุดฝึกสอบที่เปิดขาย</h2>
            <p className="mt-1 text-xs text-slate-500">
              5 รายการตามขอบเขต Web B
            </p>
            <div className="mt-4 space-y-3">
              {WEBB_PRODUCTS.map((p) => (
                <div
                  className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm"
                  key={p.id}
                >
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-slate-500">{formatBaht(p.price)}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
      <section id="orders" className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">คำสั่งซื้อ</h2>
            <p className="mt-1 text-sm text-slate-500">
              ค้นหาและกรองข้อมูลคำสั่งซื้อจำลอง
            </p>
          </div>
          <button
            onClick={exportRows}
            className="rounded-xl bg-[#211d4f] px-4 py-2.5 text-sm font-semibold text-white"
          >
            ส่งออก CSV
          </button>
        </div>
        <article className={`${card} mt-4`}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อผู้เรียน เลขที่ หรือชุดสอบ"
            className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  {[
                    "เลขคำสั่งซื้อ",
                    "ผู้เรียน / สินค้า",
                    "ยอดชำระ",
                    "ช่องทาง",
                    "สถานะ",
                  ].map((h) => (
                    <th className="p-3" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr className="border-b border-slate-100" key={r.ref}>
                    <td className="p-3 font-mono text-xs">{r.ref}</td>
                    <td className="p-3">
                      <b>{r.student}</b>
                      <small className="mt-1 block text-slate-500">
                        {r.product}
                      </small>
                    </td>
                    <td className="p-3 font-semibold">
                      {formatBaht(r.charged)}
                    </td>
                    <td className="p-3">{r.method}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
      <section id="products" className="scroll-mt-24">
        <h2 className="text-xl font-bold">ชุดฝึกสอบและราคา</h2>
        <p className="mt-1 text-sm text-slate-500">
          ราคาและจำนวนครั้งเป็นข้อมูลสำหรับ Demo
        </p>
        <article className={`${card} mt-4 overflow-x-auto`}>
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                {["สินค้า", "พาร์ท", "ราคาจำลอง", "สิทธิ์สอบ"].map((x) => (
                  <th className="border-b p-3" key={x}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEBB_PRODUCTS.map((p) => (
                <tr className="border-b border-slate-100" key={p.id}>
                  <td className="p-3 font-bold">{p.name}</td>
                  <td className="p-3">{p.parts}</td>
                  <td className="p-3">{formatBaht(p.price)}</td>
                  <td className="p-3">1 ครั้ง</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
      <section id="finance" className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">รายงานการเงิน</h2>
            <p className="mt-1 text-sm text-slate-500">
              คำนวณตามวันที่เริ่มต้นและสิ้นสุด · ใช้ค่าธรรมเนียมสมมติ 3%
              เพื่อสาธิต
            </p>
          </div>
          <button
            onClick={exportRows}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold"
          >
            ดาวน์โหลด CSV
          </button>
        </div>
        <article className={`${card} mt-4`}>
          <div className="mb-5 flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-xs font-semibold text-slate-500">
              ตั้งแต่
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm text-slate-800"
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-500">
              ถึงวันที่
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm text-slate-800"
              />
            </label>
            <button
              onClick={() => {
                setFrom("2026-10-01");
                setTo("2026-10-31");
              }}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              เดือนนี้
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["ราคาสินค้ารวม", money(summary.base)],
              ["ยอดเรียกเก็บ", money(summary.charged)],
              ["ส่วนเพิ่มจากผู้เรียน", money(summary.charged - summary.base)],
              ["ค่าธรรมเนียม Payso (Demo)", money(summary.fee)],
              [
                "ยอดรับสุทธิ / กำไรขั้นต้น Demo",
                money(summary.net - summary.base),
              ],
            ].map(([l, v]) => (
              <div className="rounded-xl bg-slate-50 p-4" key={l}>
                <span className="text-xs text-slate-500">{l}</span>
                <b className="mt-2 block text-lg">{v}</b>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            ตัวเลขค่าธรรมเนียม 3% เป็นอัตราจำลองเท่านั้น
            กำไรนี้หักเฉพาะค่าธรรมเนียมการชำระเงิน ยังไม่หักต้นทุนอื่น เช่น
            เนื้อหา ภาษี และค่าใช้จ่ายระบบ
          </p>
        </article>
      </section>
      <section id="settings" className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">ตั้งค่าระบบ Demo</h2>
            <p className="mt-1 text-sm text-slate-500">
              ปรับสถานะจำลองสำหรับการนำเสนอ
            </p>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold"
          >
            {open ? "ปิดรับชุดใหม่" : "เปิดรับชุดใหม่"}
          </button>
        </div>
        <article className={`${card} mt-4`}>
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <b>การเปิดใช้งานคอร์ส</b>
              <p className="mt-1 text-sm text-slate-500">
                {open ? "เปิดขายชุดฝึกสอบตัวอย่าง" : "ปิดการขายชั่วคราว"}
              </p>
            </div>
            <span
              className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${open ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
            >
              {open ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-slate-500">
              เริ่มเปิดรับ
              <input
                type="datetime-local"
                defaultValue="2026-10-01T09:00"
                className="rounded-lg border px-3 py-2 text-sm text-slate-800"
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-500">
              ปิดรับ
              <input
                type="datetime-local"
                defaultValue="2026-12-31T23:59"
                className="rounded-lg border px-3 py-2 text-sm text-slate-800"
              />
            </label>
          </div>
          <button
            onClick={() => setMessage("บันทึกการตั้งค่าในหน้าจอ Demo แล้ว")}
            className="mt-4 rounded-xl bg-[#211d4f] px-4 py-2.5 text-sm font-semibold text-white"
          >
            บันทึก Demo
          </button>
        </article>
      </section>
    </div>
  );
}
