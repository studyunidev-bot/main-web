"use client";

import Link from "next/link";
import { PublicShell } from "./PublicShell";

const parts: Record<string, { title: string; name: string; score: number }> = {
  tgat1: { title: "TGAT1", name: "การสื่อสารภาษาอังกฤษ", score: 78 },
  tgat2: { title: "TGAT2", name: "การคิดอย่างมีเหตุผล", score: 84 },
  tgat3: { title: "TGAT3", name: "สมรรถนะการทำงาน", score: 86 },
};
const questions = [
  ["การสื่อความหมาย", "4 / 5", "ดีมาก"],
  ["การคิดวิเคราะห์", "7 / 10", "ควรทบทวน"],
  ["การประยุกต์ใช้", "8 / 10", "ดี"],
  ["การอ่านและตีความ", "9 / 10", "ดีมาก"],
  ["การสรุปข้อมูล", "6 / 8", "ดี"],
];

export default function WebBResultDetail({ part }: { part: string }) {
  const result = parts[part.toLowerCase()] ?? parts.tgat1;
  return (
    <PublicShell>
      <main className="webb-inner-page">
        <div className="webb-container">
          <header className="webb-page-head">
            <div>
              <span className="webb-kicker">RESULT ANALYSIS · DEMO</span>
              <h1>ผลสอบรายพาร์ท</h1>
              <p>ดูคะแนนและทักษะที่ควรทบทวน</p>
            </div>
            <Link href="/webb/results">กลับหน้าผลสอบ</Link>
          </header>
          <div className="webb-detail-grid">
            <section className="webb-card webb-detail-score">
              <span className="webb-kicker">{result.title} · รอบฝึกที่ 1</span>
              <h2>{result.name}</h2>
              <div className="webb-detail-score-number">
                {result.score}
                <small>/100</small>
              </div>
              <div className="webb-detail-progress">
                <span style={{ width: `${result.score}%` }} />
              </div>
              <p>คะแนนนี้เป็นข้อมูลตัวอย่างเพื่อสาธิตหน้ารายงาน</p>
              <Link
                className="webb-button webb-button-primary"
                href="/webb/solutions"
              >
                ดูเฉลยพาร์ทนี้
              </Link>
            </section>
            <section className="webb-card">
              <div className="webb-card-heading">
                <div>
                  <h2>ภาพรวมทักษะ</h2>
                  <p>คะแนนตัวอย่างแยกตามหัวข้อ</p>
                </div>
                <span className="webb-detail-badge">
                  {result.score >= 80 ? "ทำได้ดี" : "ฝึกต่อ"}
                </span>
              </div>
              <div className="webb-skill-list">
                {questions.map(([skill, score, hint], index) => (
                  <div key={skill}>
                    <div>
                      <b>{skill}</b>
                      <span>{hint}</span>
                    </div>
                    <strong>{score}</strong>
                    <i>
                      <em
                        style={{ width: `${[83, 70, 80, 90, 75][index]}%` }}
                      />
                    </i>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <section className="webb-card webb-detail-table">
            <div className="webb-card-heading">
              <div>
                <h2>สรุปผลรายหัวข้อ</h2>
                <p>ข้อมูลตัวอย่าง · {result.title}</p>
              </div>
              <button
                className="webb-button webb-button-outline"
                onClick={() => window.print()}
              >
                พิมพ์ / บันทึก PDF
              </button>
            </div>
            <div className="webb-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>หัวข้อ</th>
                    <th>จำนวนข้อ</th>
                    <th>ตอบถูก</th>
                    <th>ผลประเมิน</th>
                    <th>แนวทาง</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map(([skill, score, hint], index) => (
                    <tr key={skill}>
                      <td>{skill}</td>
                      <td>{[5, 10, 10, 10, 8][index]}</td>
                      <td>{score}</td>
                      <td>
                        <span
                          className={
                            hint === "ควรทบทวน"
                              ? "webb-result-badge weak"
                              : "webb-result-badge"
                          }
                        >
                          {hint}
                        </span>
                      </td>
                      <td>
                        <Link href="/webb/solutions">ดูเฉลย →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </PublicShell>
  );
}
