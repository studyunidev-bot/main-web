import "@/css/public.css";
import Link from "next/link";

export default function SystemsLandingPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#fbf8f1] px-5 py-12 text-[#1e1b4b] sm:px-8 sm:py-16">
      <div aria-hidden="true" className="absolute -right-40 -top-44 -z-10 h-[34rem] w-[34rem] rounded-full bg-[#f3dfae]/55 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-52 -left-40 -z-10 h-[34rem] w-[34rem] rounded-full bg-[#e6e9f8]/70 blur-3xl" />
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1e1b4b] text-lg font-black text-[#f5d17a] shadow-lg">SU</span><div><p className="text-xs font-bold tracking-[0.22em] text-[#a47b19]">STUDY UNITH</p><p className="text-sm text-slate-500">ระบบบริการและการสอบ</p></div></div>
          <Link href="/th" className="hidden text-sm font-semibold text-slate-600 underline decoration-[#d4a017]/50 underline-offset-4 hover:text-[#1e1b4b] sm:inline">เว็บไซต์หลัก</Link>
        </header>

        <section className="mx-auto mt-16 max-w-3xl text-center sm:mt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#d4a017]/30 bg-white/70 px-4 py-2 text-xs font-bold tracking-wide text-[#8b6714] shadow-sm"><span className="h-2 w-2 rounded-full bg-emerald-500" /> STUDY UNITH · DIGITAL SERVICES</span>
          <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">เลือกบริการที่ต้องการใช้งาน</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">เลือกใช้งานระบบปัจจุบัน หรือชมต้นแบบระบบสมัครสอบใหม่</p>
        </section>

        <section aria-label="เลือกระบบ" className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2 md:gap-7">
          <Link href="/gatpat/student/search" className="group relative overflow-hidden rounded-[1.75rem] border border-[#d4a017]/30 bg-white/90 p-7 shadow-[0_24px_70px_-38px_rgba(30,27,75,.42)] transition duration-300 hover:-translate-y-1 hover:border-[#d4a017] hover:shadow-[0_30px_80px_-38px_rgba(30,27,75,.48)] sm:p-9">
            <div aria-hidden="true" className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#fff2cf] transition-transform duration-500 group-hover:scale-125" />
            <div className="relative"><div className="flex items-center justify-between"><span className="rounded-full bg-[#fff3d5] px-3 py-1.5 text-xs font-bold tracking-wider text-[#8b6714]">WEB A · ระบบปัจจุบัน</span><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1e1b4b] text-[#f5d17a]">A</span></div>
              <h2 className="mt-8 text-2xl font-extrabold sm:text-3xl">ระบบสมัครสอบ GAT/PAT</h2><p className="mt-3 max-w-md leading-7 text-slate-600">ค้นหาข้อมูลผู้สมัคร ดูรายละเอียดการสอบ ตรวจสอบคะแนน และส่งคำขอสละสิทธิ์</p>
              <span className="btn-gold mt-8 inline-flex items-center gap-3 rounded-xl px-5 py-3 font-bold shadow-md transition group-hover:gap-4">เข้าสู่เว็บ A <span aria-hidden="true">→</span></span>
            </div>
          </Link>

          <Link href="/webb" className="group relative overflow-hidden rounded-[1.75rem] border border-indigo-200 bg-white/90 p-7 shadow-[0_24px_70px_-38px_rgba(30,27,75,.42)] transition duration-300 hover:-translate-y-1 hover:border-indigo-400 hover:shadow-[0_30px_80px_-38px_rgba(30,27,75,.48)] sm:p-9">
            <div aria-hidden="true" className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-indigo-100/80 transition-transform duration-500 group-hover:scale-125" />
            <div className="relative"><div className="flex items-center justify-between"><span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold tracking-wider text-indigo-700">WEB B · DEMO MOCKUP</span><span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-700 text-lg font-bold text-white">B</span></div>
              <h2 className="mt-8 text-2xl font-extrabold text-slate-800 sm:text-3xl">ต้นแบบระบบรับสมัครใหม่</h2><p className="mt-3 max-w-md leading-7 text-slate-600">ทดลองดูขั้นตอนสมัคร ตรวจสอบสถานะ และหน้าจัดการสำหรับเจ้าหน้าที่ ด้วยข้อมูลตัวอย่าง</p>
              <span className="mt-8 inline-flex items-center gap-3 rounded-xl bg-indigo-700 px-5 py-3 font-bold text-white shadow-md transition group-hover:gap-4">เปิดต้นแบบเว็บ B <span aria-hidden="true">→</span></span>
            </div>
          </Link>
        </section>
        <footer className="mt-16 text-center text-xs text-slate-400">© {new Date().getFullYear()} Study Unith · ระบบบริการกลาง</footer>
      </div>
    </main>
  );
}
