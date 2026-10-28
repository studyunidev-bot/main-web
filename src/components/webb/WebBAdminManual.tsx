import Link from "next/link";
import { LuArrowLeft, LuCheck, LuInfo, LuLink, LuListChecks, LuScale, LuTarget } from "react-icons/lu";

const scoringTypes = [
  {
    id: "single",
    number: "01",
    title: "คำตอบเดี่ยว",
    icon: LuTarget,
    summary: "ผู้สอบเลือกได้ 1 ตัวเลือก",
    rule: "ถ้าตรงกับเฉลย ได้คะแนนเต็มตาม maxScore ของข้อนั้น ถ้าไม่ตรงหรือไม่ตอบ ได้ 0 คะแนน",
    example: "ตั้งคะแนนเต็มไว้ 1 คะแนน · ตอบถูกได้ 1 · ตอบผิดหรือเว้นว่างได้ 0",
  },
  {
    id: "weighted",
    number: "02",
    title: "คะแนนลดหลั่น",
    icon: LuScale,
    summary: "แต่ละตัวเลือกมีคะแนนที่กำหนดแยกกัน",
    rule: "ระบบให้คะแนนตามค่าของตัวเลือกที่ผู้สอบเลือก เช่น 0.25, 0.50, 0.75 หรือ 1.00 คะแนน",
    example: "ถ้าเลือกตัวเลือกที่ตั้งไว้ 0.75 คะแนน จะได้ 0.75 คะแนน แม้คะแนนเต็มของข้อจะเป็น 1 คะแนน",
  },
  {
    id: "multiple",
    number: "03",
    title: "เลือกหลายคำตอบ",
    icon: LuListChecks,
    summary: "เลือกได้ตั้งแต่ 1 ตัวเลือก และคิดคะแนนทั้งการเลือกกับการเว้น",
    rule: "ระบบแบ่งคะแนนเต็มของข้อนั้นเป็น 4 ส่วนเท่ากัน แต่ละสถานะที่ตรงเฉลยได้คะแนนหนึ่งส่วน การเลือกผิดหรือเว้นตัวเลือกที่ถูกได้ 0 และเว้นว่างทั้งข้อได้ 0",
    example: "คะแนนเต็ม 1 คะแนน เฉลย 1 และ 3: แต่ละสถานะมีค่า 0.25 · เลือกเฉพาะ 3 ได้ 0.75 · เลือกครบ 4 ข้อได้ 0.50",
  },
  {
    id: "linked",
    number: "04",
    title: "คำตอบสัมพันธ์กัน",
    icon: LuLink,
    summary: "เลือกคำตอบหนึ่งคู่ให้กับคำถามที่ต่อเนื่องกัน",
    rule: "เทียบคำตอบของทั้งสองข้อกับคู่ที่ตั้งไว้ คู่ที่ตรงได้คะแนนตามที่กำหนด คู่ที่ไม่ตรงได้ 0 คะแนน คู่คำตอบที่ถูกหลายแบบเป็นทางเลือกของข้อเดียวกัน ไม่บวกคะแนนทุกคู่รวมกัน",
    example: "ข้อ 141 → 142 มีคู่ที่ยอมรับ 2 → 3 และ 4 → 4 ผู้สอบเลือกได้เพียงหนึ่งคู่ และได้คะแนนของคู่นั้นครั้งเดียว",
  },
];

export default function WebBAdminManual() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 text-slate-900">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <Link href="/webb/admin/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <LuArrowLeft aria-hidden="true" /> กลับภาพรวม
        </Link>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-amber-700">STUDY UNITH · ADMIN GUIDE</p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">คู่มือการให้คะแนน</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          ดูหลักการให้คะแนน TGAT3 แยกตามรูปแบบคำตอบ เพื่อใช้ตั้งเฉลยและตรวจคะแนนให้ตรงกัน
        </p>
        <nav className="mt-5 flex flex-wrap gap-2" aria-label="สารบัญคู่มือ TGAT3">
          {[
            ["#tgat", "TGAT"],
            ["#tgat3", "TGAT 3"],
            ...scoringTypes.map((item) => [`#${item.id}`, item.title]),
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-full border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-amber-400 hover:bg-amber-50">
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section id="tgat" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <span className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">หมวดข้อสอบ</span>
        <h2 className="mt-1 text-xl font-extrabold">TGAT</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          คู่มือนี้อธิบายเกณฑ์ของ <b>TGAT 3 สมรรถนะการทำงาน</b> ซึ่งมีคำตอบหลายรูปแบบ แต่คะแนนสุดท้ายของพาร์ทปรับสัดส่วนจากคะแนนเต็มรวมเป็น 100 คะแนน
        </p>
      </section>

      <section id="tgat3" className="scroll-mt-6 space-y-4">
        <div className="rounded-2xl bg-[#211d4f] p-5 text-white sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-amber-300">TGAT → TGAT 3</p>
          <h2 className="mt-1 text-2xl font-extrabold">สมรรถนะการทำงาน</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
            แต่ละข้อคิดคะแนนดิบตามรูปแบบที่ตั้งไว้ จากนั้นรวมคะแนนดิบที่ได้และคะแนนดิบเต็ม แล้วแปลงผลรวมเป็นคะแนนเต็ม 100
          </p>
          <div className="mt-4 rounded-xl bg-white/10 p-4 text-center text-sm font-bold sm:text-base">
            คะแนน TGAT3 = คะแนนดิบที่ได้ ÷ คะแนนดิบเต็มรวม × 100
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {scoringTypes.map((item) => {
            const Icon = item.icon;
            return (
              <article id={item.id} key={item.id} className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-[#211d4f]">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-amber-700">รูปแบบ {item.number}</p>
                    <h3 className="text-lg font-extrabold">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{item.summary}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <b className="text-xs text-slate-500">เกณฑ์การให้คะแนน</b>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{item.rule}</p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                    <b className="inline-flex items-center gap-1.5 text-xs text-amber-800"><LuCheck aria-hidden="true" /> ตัวอย่าง</b>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{item.example}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          <LuInfo aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p><b>จำไว้:</b> คู่คำตอบที่ยอมรับหลายคู่เป็นตัวเลือกที่ถูกของคู่ข้อเดียวกัน ไม่ใช่คะแนนที่นำมาบวกเพิ่ม ส่วนข้อเลือกหลายคำตอบจะได้คะแนนย่อยตามจำนวนสถานะที่ตรงเฉลย และไม่ตอบเลยได้ 0 คะแนน</p>
        </aside>
      </section>
    </div>
  );
}
