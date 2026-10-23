export type TutorSubject = {
  id: string;
  title: string;
  tutor: string;
  image: string;
  bullets: string[];
  education?: string;
  experience?: string;
};

export const defaultTgatSubjects: TutorSubject[] = [
  {
    id: "tgat1",
    title: "TGAT 1 การสื่อสารภาษาอังกฤษ",
    tutor: "ติวเตอร์แมว",
    image: "/images/user/user-01.png",
    education: "ครุศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย",
    experience: "ประสบการณ์ 5 ปี",
    bullets: ["ติว TGAT ภาษาอังกฤษ", "เทคนิคทำข้อสอบ", "นักเรียนกว่า 300 คน"],
  },
  {
    id: "tgat2",
    title: "TGAT 2 การคิดอย่างมีเหตุผล",
    tutor: "ติวเตอร์แมว",
    image: "/images/user/user-02.png",
    education: "ครุศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย",
    experience: "ประสบการณ์ 5 ปี",
    bullets: ["ติวการคิดเชิงเหตุผล", "วิเคราะห์โจทย์อย่างเป็นระบบ", "นักเรียนกว่า 300 คน"],
  },
  {
    id: "tgat3",
    title: "TGAT 3 สมรรถนะการทำงาน",
    tutor: "ติวเตอร์แมว",
    image: "/images/user/user-03.png",
    education: "ครุศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย",
    experience: "ประสบการณ์ 5 ปี",
    bullets: ["ติวสมรรถนะการทำงาน", "วิเคราะห์สถานการณ์", "นักเรียนกว่า 300 คน"],
  },
];

export const defaultALevelSubjects: TutorSubject[] = [
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

export function getTutorsForCategory(kind: string): TutorSubject[] {
  const defaults = kind === "a-level" ? defaultALevelSubjects : defaultTgatSubjects;
  if (typeof window === "undefined") {
    return defaults;
  }
  try {
    const raw = window.localStorage.getItem(`webb-subject-tutors:${kind}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validSaved = parsed.filter(
          (item): item is TutorSubject => item && typeof item.id === "string",
        );
        const merged = validSaved.map((saved) => {
          const fallback = defaults.find((item) => item.id === saved.id);
          if (!fallback) return saved;
          return {
            ...fallback,
            ...saved,
            education: saved.education?.trim() || fallback.education,
            experience: saved.experience?.trim() || fallback.experience,
            bullets: fallback.bullets.map((value, index) => saved.bullets?.[index]?.trim() || value),
          };
        });
        return merged.length ? merged : defaults;
      }
    }
  } catch {
    // fallback
  }
  return defaults;
}

export function saveTutorsForCategory(kind: string, tutors: TutorSubject[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`webb-subject-tutors:${kind}`, JSON.stringify(tutors));
  window.dispatchEvent(new Event("webb-tutors-updated"));
}
