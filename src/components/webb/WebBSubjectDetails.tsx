"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LuArrowLeft, LuArrowRight, LuAward, LuGraduationCap } from "react-icons/lu";
import { PublicShell } from "./PublicShell";
import { DEMO_AUTH_KEY } from "./demo-store";

import {
  type TutorSubject,
  defaultTgatSubjects,
  defaultALevelSubjects,
  getTutorsForCategory,
} from "./webb-tutors";

type SubjectKind = "tgat" | "a-level";

export default function WebBSubjectDetails({ kind }: { kind: SubjectKind }) {
  const isALevel = kind === "a-level";
  const defaultList = isALevel ? defaultALevelSubjects : defaultTgatSubjects;
  const [tutorList, setTutorList] = useState<TutorSubject[]>(defaultList);
  const [examSet, setExamSet] = useState(isALevel ? "B" : "A");
  const [selected, setSelected] = useState<string[]>(isALevel ? ["math-2"] : []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const selectedSubjects = tutorList.filter((subject) => selected.includes(subject.id));
  const subjectLabel = isALevel ? "A-Level ความรู้เชิงวิชาการ" : "TGAT ความถนัดทั่วไป";
  const description = isALevel
    ? "A-Level คือการสอบวัดความรู้เชิงวิชาการ เพื่อใช้ยื่นเข้าศึกษาต่อในระดับมหาวิทยาลัย ครอบคลุมวิชาหลักที่ผู้เรียนเลือกได้ตามคณะเป้าหมาย"
    : "TGAT ย่อมาจาก Thai General Aptitude Test หรือการสอบวัดสมรรถนะความถนัดทั่วไป เป็นข้อสอบกลางในระบบ TCAS ที่ใช้ประเมินทักษะการคิดวิเคราะห์และการประยุกต์ใช้ความรู้ในชีวิตประจำวัน แทนการท่องจำเนื้อหา";

  useEffect(() => {
    const loadTutors = () => {
      setTutorList(getTutorsForCategory(kind));
    };
    loadTutors();
    window.addEventListener("webb-tutors-updated", loadTutors);
    window.addEventListener("storage", loadTutors);
    return () => {
      window.removeEventListener("webb-tutors-updated", loadTutors);
      window.removeEventListener("storage", loadTutors);
    };
  }, [kind, isALevel]);

  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(window.localStorage.getItem(DEMO_AUTH_KEY) === "true");
    };
    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("webb-demo-auth-updated", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("webb-demo-auth-updated", syncAuth);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const setParam = params.get("set")?.toUpperCase();
      if (setParam && setParam !== "A") {
        params.set("set", "A");
        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
      }
    }
  }, []);

  function handleSetChange(newSet: string) {
    if (newSet !== "A") return;
    setExamSet(newSet);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("set", newSet);
      window.history.replaceState(null, "", url.toString());
    }
  }

  function toggleSubject(subjectId: string) {
    setSelected((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId],
    );
  }

  const purchaseHref = isLoggedIn
    ? `/webb/products?subject=${kind}&set=${examSet}${selected.length ? `&items=${selected.join(",")}` : ""}`
    : `/webb/register?subject=${kind}&set=${examSet}${selected.length ? `&items=${selected.join(",")}` : ""}`;

  function handlePurchaseClick(event: React.MouseEvent) {
    if (isALevel && selected.length === 0) {
      event.preventDefault();
      return;
    }
    try {
      localStorage.setItem(
        "webb-intended-subject",
        JSON.stringify({
          subject: kind,
          set: examSet,
          items: selected,
        })
      );
    } catch {
      /* ignore */
    }
  }

  return (
    <PublicShell>
      <main className="wb-subject-detail-page">
        <div className="wb-subject-detail-container">
          <Link className="wb-subject-back" href="/webb#subjects">
            <LuArrowLeft aria-hidden="true" />
            <span>ย้อนกลับ</span>
          </Link>
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
                disabled={set !== "A"}
                title={set !== "A" ? "ยังไม่มีไฟล์ข้อสอบชุดนี้" : undefined}
                onClick={() => handleSetChange(set)}
              >
                ข้อสอบชุด {set}
              </button>
            ))}
          </div>
          <label className="wb-exam-set-mobile">
            เลือกชุดข้อสอบ
            <select value={examSet} onChange={(event) => handleSetChange(event.target.value)}>
              {["A", "B", "C", "D"].map((set) => (
                <option key={set} value={set} disabled={set !== "A"}>
                  ชุดข้อสอบ {set}
                </option>
              ))}
            </select>
          </label>

          <section className="wb-tutor-panel">
            <header>
              <h2>รายวิชา &amp; ผู้ออกข้อสอบ</h2>
              <span>ข้อสอบชุด {examSet}</span>
            </header>
            <div className={`wb-tutor-grid${isALevel ? " is-a-level" : ""}`}>
              {tutorList.map((subject) => {
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
                    <Image src={subject.image} alt={subject.tutor} width={48} height={48} />
                    <div className="wb-tutor-info">
                      <h3>{subject.title}</h3>
                      <p>{subject.tutor}</p>
                      <span className="wb-tutor-meta">
                        <LuGraduationCap aria-hidden="true" />
                        <span>{subject.education || "ครุศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย"}</span>
                      </span>
                      <span className="wb-tutor-meta">
                        <LuAward aria-hidden="true" />
                        <span>{subject.experience || "ประสบการณ์ 5 ปี"}</span>
                      </span>
                      <ul className="wb-tutor-bullets">
                        {subject.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                    {isALevel && <b className="wb-tutor-price">179 บาท</b>}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="wb-subject-purchase-bar">
            <div>
              <span>ราคา</span>
              <strong>{isALevel ? selected.length * 179 : 179} บาท</strong>
            </div>
            <Link
              className="wb-pill-button wb-pill-yellow wb-subject-buy-btn"
              href={purchaseHref}
              aria-disabled={isALevel && selected.length === 0}
              onClick={handlePurchaseClick}
            >
              <span>สมัครสอบ</span>
              <LuArrowRight aria-hidden="true" />
            </Link>
          </section>
        </div>
      </main>
    </PublicShell>
  );
}

