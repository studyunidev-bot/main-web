"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PublicFooter, PublicShell } from "./PublicShell";

type SubjectKind = "tgat" | "a-level";
type TutorSubject = { id: string; title: string; tutor: string; image: string; bullets: string[] };

const tgatSubjects: TutorSubject[] = [
  { id: "tgat1", title: "TGAT 1 การสื่อสารภาษาอังกฤษ", tutor: "ติวเตอร์แมว", image: "/images/user/user-01.png", bullets: ["ติว TGAT ภาษาอังกฤษ", "เทคนิคทำข้อสอบ", "นักเรียนกว่า 300 คน"] },
  { id: "tgat2", title: "TGAT 2 การคิดอย่างมีเหตุผล", tutor: "ติวเตอร์แมว", image: "/images/user/user-02.png", bullets: ["ติว TGAT ภาษาอังกฤษ", "เทคนิคทำข้อสอบ", "นักเรียนกว่า 300 คน"] },
  { id: "tgat3", title: "TGAT 3 สมรรถนะการทำงาน", tutor: "ติวเตอร์แมว", image: "/images/user/user-03.png", bullets: ["ติว TGAT ภาษาอังกฤษ", "เทคนิคทำข้อสอบ", "นักเรียนกว่า 300 คน"] },
];

const aLevelSubjects: TutorSubject[] = [
  { id: "math-1", title: "คณิตศาสตร์ประยุกต์ 1", tutor: "ติวเตอร์แมว", image: "/images/user/user-01.png", bullets: ["ติวเข้ามหาวิทยาลัย", "เทคนิคทำข้อสอบ", "นักเรียนกว่า 300 คน"] },
  { id: "math-2", title: "คณิตศาสตร์ประยุกต์ 2", tutor: "ติวเตอร์แมว", image: "/images/user/user-02.png", bullets: ["ติวเข้ามหาวิทยาลัย", "เทคนิคทำข้อสอบ", "นักเรียนกว่า 300 คน"] },
  { id: "science", title: "วิทยาศาสตร์ประยุกต์", tutor: "ติวเตอร์แมว", image: "/images/user/user-03.png", bullets: ["ติวสอบ TGAT/TPAT", "เทคนิคทำข้อสอบ", "นักเรียนกว่า 300 คน"] },
  { id: "physics", title: "ฟิสิกส์", tutor: "ติวเตอร์แมว", image: "/images/user/user-04.png", bullets: ["เขียนโจทย์คำนวณ", "เทคนิคทำข้อสอบ", "นักเรียนกว่า 300 คน"] },
  { id: "chemistry", title: "เคมี", tutor: "ติวเตอร์แมว", image: "/images/user/user-05.png", bullets: ["ติวเข้าคณะเเพทย์", "เทคนิคทำข้อสอบ", "นักเรียนกว่า 350 คน"] },
  { id: "biology", title: "ชีววิทยา", tutor: "ติวเตอร์แมว", image: "/images/user/user-06.png", bullets: ["เขียนเจาะเนื้อหาชีวะ", "เทคนิคทำข้อสอบ", "นักเรียนกว่า 300 คน"] },
  { id: "social", title: "สังคมศึกษา", tutor: "ติวเตอร์แมว", image: "/images/user/user-07.png", bullets: ["ติวสอบเข้ามหาวิทยาลัย", "เทคนิคทำข้อสอบ", "นักเรียนกว่า 250 คน"] },
  { id: "thai", title: "ภาษาไทย", tutor: "ติวเตอร์แมว", image: "/images/user/user-08.png", bullets: ["เขียนเจาะการจับใจความ", "เทคนิคทำข้อสอบ", "นักเรียนกว่า 400 คน"] },
  { id: "english", title: "ภาษาอังกฤษ", tutor: "ติวเตอร์แมว", image: "/images/user/user-09.png", bullets: ["ติว TGAT ภาษาอังกฤษ", "เทคนิคทำข้อสอบ", "นักเรียนกว่า 500 คน"] },
];

export default function WebBSubjectDetails({ kind }: { kind: SubjectKind }) {
  const isALevel = kind === "a-level";
  const subjects = isALevel ? aLevelSubjects : tgatSubjects;
  const [examSet, setExamSet] = useState(isALevel ? "B" : "A");
  const [selected, setSelected] = useState<string[]>(isALevel ? ["math-2"] : []);
  const selectedSubjects = subjects.filter((subject) => selected.includes(subject.id));
  const subjectLabel = isALevel ? "A-Level ความรู้เชิงวิชาการ" : "TGAT ความถนัดทั่วไป";
  const description = isALevel
    ? "A-Level คือการสอบวัดความรู้เชิงวิชาการ เพื่อใช้ยื่นเข้าศึกษาต่อในระดับมหาวิทยาลัย ครอบคลุมวิชาหลักที่ผู้เรียนเลือกได้ตามคณะเป้าหมาย"
    : "TGAT ย่อมาจาก Thai General Aptitude Test หรือการสอบวัดสมรรถนะความถนัดทั่วไป เป็นข้อสอบกลางในระบบ TCAS ที่ใช้ประเมินทักษะการคิดวิเคราะห์และการประยุกต์ใช้ความรู้ในชีวิตประจำวัน แทนการท่องจำเนื้อหา";

  function toggleSubject(subjectId: string) {
    setSelected((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId],
    );
  }

  const registerHref = `/webb/register?subject=${kind}&set=${examSet}${selected.length ? `&items=${selected.join(",")}` : ""}`;

  return (
    <PublicShell>
      <main className="wb-subject-detail-page">
        <div className="wb-subject-detail-container">
          <Link className="wb-subject-back" href="/webb#subjects">ย้อนกลับ</Link>
          <section className="wb-subject-detail-hero">
            <span>ชุดใหม่ล่าสุด</span>
            <h1>{subjectLabel}</h1>
            <p>{description}</p>
          </section>

          <div className="wb-exam-set-switcher" aria-label="เลือกชุดข้อสอบ">
            {(["A", "B", "C", "D"] as const).map((set) => (
              <button
                key={set}
                type="button"
                className={examSet === set ? "is-active" : ""}
                onClick={() => setExamSet(set)}
              >
                ข้อสอบชุด {set}
              </button>
            ))}
          </div>
          <label className="wb-exam-set-mobile">
            เลือกชุดข้อสอบ
            <select value={examSet} onChange={(event) => setExamSet(event.target.value)}>
              {["A", "B", "C", "D"].map((set) => <option key={set} value={set}>ชุดข้อสอบ {set}</option>)}
            </select>
          </label>

          <section className="wb-tutor-panel">
            <header>
              <h2>รายวิชา &amp; ผู้สอน</h2>
              <span>ข้อสอบชุด {examSet}</span>
            </header>
            <div className={`wb-tutor-grid${isALevel ? " is-a-level" : ""}`}>
              {subjects.map((subject) => {
                const checked = selected.includes(subject.id);
                return (
                  <article
                    className={`wb-tutor-card${isALevel ? " is-a-level" : ""}${checked ? " is-selected" : ""}`}
                    key={subject.id}
                  >
                    {isALevel && (
                      <input
                        type="checkbox"
                        aria-label={`เลือก ${subject.title}`}
                        checked={checked}
                        onChange={() => toggleSubject(subject.id)}
                      />
                    )}
                    <Image src={subject.image} alt="ภาพ Mockup ผู้สอน" width={48} height={48} />
                    <div className="wb-tutor-info">
                      <h3>{subject.title}</h3>
                      <p>{subject.tutor}</p>
                      <span>♧ ครุศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย</span>
                      <span>▤ ประสบการณ์ 5 ปี</span>
                      <ul>{subject.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                    </div>
                    {isALevel && <b className="wb-tutor-price">179 บาท</b>}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="wb-subject-purchase-bar">
            <div><span>ราคา</span><strong>{isALevel ? selected.length * 179 : 179} บาท</strong></div>
            <Link
              className="wb-pill-button wb-pill-yellow"
              href={registerHref}
              aria-disabled={isALevel && selected.length === 0}
              onClick={(event) => {
                if (isALevel && selected.length === 0) event.preventDefault();
              }}
            >
              สมัครสอบ 
            </Link>
          </section>
        </div>
      </main>
      <PublicFooter />
    </PublicShell>
  );
}
