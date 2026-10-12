import Link from "next/link";
import { PublicShell } from "@/components/webb/PublicShell";

export const metadata = { title: "แผนผังเว็บไซต์ · Study Unith" };

const pageGroups = [
  {
    title: "เว็บไซต์และชุดสอบ",
    links: [
      ["หน้าแรก", "/webb"],
      ["ชุดข้อสอบ", "/webb/products"],
      ["รายละเอียดวิชา TGAT", "/webb/tgat"],
      ["รายละเอียดวิชา A-Level", "/webb/a-level"],
      ["กติกาการสอบ", "/webb/rules"],
    ],
  },
  {
    title: "บัญชีและผลสอบ",
    links: [
      ["สมัครสมาชิก", "/webb/register"],
      ["เข้าสู่ระบบ", "/webb/login"],
      ["บัญชีผู้เรียน", "/webb/student"],
      ["ข้อมูลส่วนตัว", "/webb/profile"],
      ["ผลสอบ", "/webb/results"],
      ["เฉลยข้อสอบ", "/webb/solutions"],
      ["อันดับคะแนน", "/webb/ranking"],
    ],
  },
  {
    title: "ข้อมูลและนโยบาย",
    links: [
      ["นโยบายการใช้คุกกี้", "/webb/policies/cookies"],
      ["นโยบายความเป็นส่วนตัว", "/webb/policies/privacy"],
      ["ข้อตกลงและเงื่อนไขการใช้บริการ", "/webb/policies/terms"],
      ["ติดต่อเรา", "/webb#footer"],
    ],
  },
];

export default function SitemapPage() {
  return (
    <PublicShell>
      <main className="webb-inner-page wb-policy-page">
        <div className="wb-container">
          <header className="webb-page-head">
            <div>
              <span className="webb-kicker">STUDY UNITH · SITE MAP</span>
              <h1>แผนผังเว็บไซต์</h1>
              <p>เลือกไปยังหน้าต่าง ๆ ของเว็บไซต์ได้จากรายการด้านล่าง</p>
            </div>
            <Link href="/webb">กลับหน้าแรก</Link>
          </header>
          <div className="wb-policy-index">
            {pageGroups.map((group) => (
              <section className="webb-card" key={group.title}>
                <h2>{group.title}</h2>
                <ul>
                  {group.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
