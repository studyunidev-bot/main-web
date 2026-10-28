export type CatalogFlow = "set-first" | "subject-first";
export type CatalogStatus = "open" | "draft";

export type CatalogOffer = {
  id: string;
  productId?: string;
  name: string;
  price: number;
  payPrice?: number;
  status: CatalogStatus;
  parts: string[];
};

export type CatalogPartSettings = {
  questionCount?: number;
  durationMinutes?: number;
  choiceCount?: number;
  scoreMaximum?: number;
  examFileName?: string;
  answerFileName?: string;
  contentStatus?: "Draft" | "รอตรวจ" | "เผยแพร่";
  answers?: { value: string; score: number }[];
};

export type CatalogSet = {
  id: string;
  name: string;
  parts: string[];
  offers: CatalogOffer[];
  partSettings?: Record<string, CatalogPartSettings>;
  route?: string;
};

export type CatalogSubject = {
  id: string;
  name: string;
  sets: CatalogSet[];
};

export type CatalogFamily = {
  id: string;
  name: string;
  description: string;
  homeSubtitle: string;
  homeActive: boolean;
  homeCoverImage?: string;
  detailDescription: string;
  flow: CatalogFlow;
  status: CatalogStatus;
  subjects: CatalogSubject[];
  sets: CatalogSet[];
};

export const catalogStorageKey = "webb-admin-mock:exam-catalog-v2";

const tgatParts = [
  "TGAT1 การสื่อสารภาษาอังกฤษ",
  "TGAT2 การคิดอย่างมีเหตุผล",
  "TGAT3 สมรรถนะการทำงาน",
];

type HardcodedPartSpec = {
  name: string;
  questionCount: number;
  durationMinutes: number;
  choiceCount: number;
  scoreMaximum: number;
};

const tgatPartSettings: Record<string, CatalogPartSettings> = {
  [tgatParts[0]]: {
    questionCount: 60,
    durationMinutes: 60,
    choiceCount: 4,
    scoreMaximum: 100,
    examFileName: "tgat1-set-04-exam.pdf",
    answerFileName: "tgat1-set-04-answer-key.pdf",
    contentStatus: "Draft",
    answers: Array.from({ length: 60 }, (_, i) => ({
      value: ["B", "A", "D", "C"][i % 4],
      score: 100 / 60,
    })),
  },
  [tgatParts[1]]: {
    questionCount: 80,
    durationMinutes: 60,
    choiceCount: 5,
    scoreMaximum: 100,
    examFileName: "tgat2-set-04-exam.pdf",
    answerFileName: "tgat2-set-04-answer-key.pdf",
    contentStatus: "Draft",
    answers: Array.from({ length: 80 }, (_, i) => ({
      value: ["A", "C", "B", "E", "D"][i % 5],
      score: 1.25,
    })),
  },
  [tgatParts[2]]: {
    questionCount: 60,
    durationMinutes: 60,
    choiceCount: 4,
    scoreMaximum: 100,
    examFileName: "tgat3-set-04-exam.pdf",
    answerFileName: "tgat3-set-04-answer-key.pdf",
    contentStatus: "Draft",
    answers: Array.from({ length: 60 }, (_, i) => ({
      value: ["C", "B", "A", "D"][i % 4],
      score: 100 / 60,
    })),
  },
};

const tpatSubjectSpecs: {
  id: string;
  code: string;
  name: string;
  price: number;
  parts: HardcodedPartSpec[];
}[] = [
  {
    id: "tpat1",
    code: "TPAT1",
    name: "TPAT1 ความถนัดแพทย์ (กสพท)",
    price: 249,
    parts: [
      { name: "TPAT1.1 เชาวน์ปัญญา (วิเคราะห์ข้อมูลและเงื่อนไข)", questionCount: 45, durationMinutes: 75, choiceCount: 4, scoreMaximum: 100 },
      { name: "TPAT1.2 จริยธรรมทางการแพทย์", questionCount: 60, durationMinutes: 60, choiceCount: 4, scoreMaximum: 100 },
      { name: "TPAT1.3 ความคิดเชื่อมโยง", questionCount: 20, durationMinutes: 60, choiceCount: 4, scoreMaximum: 100 },
    ],
  },
  {
    id: "tpat2",
    code: "TPAT2",
    name: "TPAT2 ความถนัดศิลปกรรมศาสตร์",
    price: 179,
    parts: [
      { name: "TPAT2.1 ทัศนศิลป์", questionCount: 50, durationMinutes: 60, choiceCount: 4, scoreMaximum: 33.33 },
      { name: "TPAT2.2 ดนตรี", questionCount: 50, durationMinutes: 60, choiceCount: 4, scoreMaximum: 33.33 },
      { name: "TPAT2.3 นาฏศิลป์", questionCount: 50, durationMinutes: 60, choiceCount: 4, scoreMaximum: 33.34 },
    ],
  },
  {
    id: "tpat3",
    code: "TPAT3",
    name: "TPAT3 ความถนัดด้านวิทยาศาสตร์ เทคโนโลยี และวิศวกรรมศาสตร์",
    price: 179,
    parts: [
      { name: "TPAT3.1 การทดสอบความถนัดเชิงตัวเลขและมิติสัมพันธ์", questionCount: 30, durationMinutes: 60, choiceCount: 5, scoreMaximum: 40 },
      { name: "TPAT3.2 ความคิดเชิงวิทยาศาสตร์และเทคโนโลยี", questionCount: 40, durationMinutes: 90, choiceCount: 5, scoreMaximum: 60 },
    ],
  },
  {
    id: "tpat4",
    code: "TPAT4",
    name: "TPAT4 ความถนัดทางสถาปัตยกรรมศาสตร์",
    price: 179,
    parts: [
      { name: "TPAT4.1 ความรู้ทั่วไปและการรับรู้เชิงพื้นที่", questionCount: 40, durationMinutes: 90, choiceCount: 4, scoreMaximum: 50 },
      { name: "TPAT4.2 การออกแบบและการคิดสร้างสรรค์", questionCount: 30, durationMinutes: 90, choiceCount: 4, scoreMaximum: 50 },
    ],
  },
  {
    id: "tpat5",
    code: "TPAT5",
    name: "TPAT5 ความถนัดครุศาสตร์-ศึกษาศาสตร์",
    price: 179,
    parts: [
      { name: "TPAT5.1 ความรู้ทั่วไปในบริบทความเป็นครู", questionCount: 50, durationMinutes: 60, choiceCount: 4, scoreMaximum: 50 },
      { name: "TPAT5.2 สมรรถนะและจิตวิญญาณความเป็นครู", questionCount: 50, durationMinutes: 60, choiceCount: 4, scoreMaximum: 50 },
    ],
  },
];

const alevelSubjectSpecs: { id: string; name: string; questionCount: number; choiceCount: number }[] = [
  { id: "alevel-1", name: "คณิตศาสตร์ประยุกต์ 1", questionCount: 30, choiceCount: 5 },
  { id: "alevel-2", name: "คณิตศาสตร์ประยุกต์ 2", questionCount: 30, choiceCount: 5 },
  { id: "alevel-3", name: "วิทยาศาสตร์ประยุกต์", questionCount: 30, choiceCount: 5 },
  { id: "alevel-4", name: "ฟิสิกส์", questionCount: 30, choiceCount: 5 },
  { id: "alevel-5", name: "เคมี", questionCount: 45, choiceCount: 5 },
  { id: "alevel-6", name: "ชีววิทยา", questionCount: 40, choiceCount: 5 },
  { id: "alevel-7", name: "สังคมศึกษา", questionCount: 50, choiceCount: 5 },
  { id: "alevel-8", name: "ภาษาไทย", questionCount: 50, choiceCount: 5 },
  { id: "alevel-9", name: "ภาษาอังกฤษ", questionCount: 80, choiceCount: 4 },
  { id: "alevel-10", name: "ภาษาฝรั่งเศส", questionCount: 50, choiceCount: 4 },
  { id: "alevel-11", name: "ภาษาเยอรมัน", questionCount: 50, choiceCount: 4 },
  { id: "alevel-12", name: "ภาษาญี่ปุ่น", questionCount: 50, choiceCount: 4 },
  { id: "alevel-13", name: "ภาษาเกาหลี", questionCount: 50, choiceCount: 4 },
  { id: "alevel-14", name: "ภาษาจีน", questionCount: 50, choiceCount: 4 },
  { id: "alevel-15", name: "ภาษาบาลี", questionCount: 50, choiceCount: 4 },
  { id: "alevel-16", name: "ภาษาสเปน", questionCount: 50, choiceCount: 4 },
];

const netsatSubjectSpecs: { id: string; name: string }[] = [
  { id: "netsat-1", name: "ความฉลาดรู้ทั่วไปด้านภาษา: ภาษาไทย" },
  { id: "netsat-2", name: "ความฉลาดรู้ทั่วไปด้านภาษา: ภาษาอังกฤษ" },
  { id: "netsat-3", name: "ความฉลาดรู้ทั่วไปด้านคณิตศาสตร์" },
  { id: "netsat-4", name: "ความฉลาดรู้เฉพาะด้าน: วิทยาศาสตร์และเทคโนโลยี" },
  { id: "netsat-5", name: "ความฉลาดรู้เฉพาะด้าน: ฟิสิกส์" },
  { id: "netsat-6", name: "ความฉลาดรู้เฉพาะด้าน: เคมี" },
  { id: "netsat-7", name: "ความฉลาดรู้เฉพาะด้าน: ชีววิทยา" },
];

function buildPartSettingsFromSpecs(
  filePrefix: string,
  parts: HardcodedPartSpec[],
): Record<string, CatalogPartSettings> {
  return Object.fromEntries(
    parts.map((partSpec, index) => {
      const partNum = String(index + 1).padStart(2, "0");
      const partPoints = +(partSpec.scoreMaximum / partSpec.questionCount).toFixed(2);
      return [
        partSpec.name,
        {
          questionCount: partSpec.questionCount,
          durationMinutes: partSpec.durationMinutes,
          choiceCount: partSpec.choiceCount,
          scoreMaximum: partSpec.scoreMaximum,
          examFileName: `${filePrefix}-part-${partNum}-exam.pdf`,
          answerFileName: `${filePrefix}-part-${partNum}-key.pdf`,
          contentStatus: "Draft" as const,
          answers: Array.from({ length: partSpec.questionCount }, (_, qIdx) => ({
            value: ["A", "B", "C", "D", "E"][qIdx % partSpec.choiceCount],
            score: partPoints,
          })),
        },
      ];
    }),
  );
}

function mergeSeedSubject(seed: CatalogSubject, saved: CatalogSubject): CatalogSubject {
  const sets = seed.sets.map((seedSet) => {
    const savedSet = saved.sets.find((set) => set.id === seedSet.id);
    if (!savedSet) return seedSet;
    const offers = seedSet.offers.map((seedOffer) => {
      const savedOffer = savedSet.offers.find((offer) => offer.id === seedOffer.id);
      return {
        ...seedOffer,
        ...savedOffer,
        parts: savedOffer?.parts?.length ? savedOffer.parts : seedOffer.parts,
      };
    });
    const partSettings = { ...seedSet.partSettings };
    for (const [part, settings] of Object.entries(savedSet.partSettings || {})) {
      partSettings[part] = { ...partSettings[part], ...settings };
    }
    return {
      ...seedSet,
      ...savedSet,
      parts: savedSet.parts?.length ? savedSet.parts : seedSet.parts,
      partSettings,
      offers: [
        ...offers,
        ...savedSet.offers.filter((offer) => !seedSet.offers.some((seedOffer) => seedOffer.id === offer.id)),
      ],
    };
  });
  return {
    ...seed,
    ...saved,
    sets: [...sets, ...saved.sets.filter((set) => !seed.sets.some((seedSet) => seedSet.id === set.id))],
  };
}

const examplePayPriceByBase: Record<number, number> = { 100: 110, 179: 197, 180: 198, 249: 274 };

const exampleOffer = (id: string, name: string, price = 179, payPrice = examplePayPriceByBase[price] ?? price): CatalogOffer => ({
  id,
  name,
  price,
  payPrice,
  status: "draft",
  parts: [],
});

export const initialCatalog: CatalogFamily[] = [
  {
    id: "tgat",
    name: "TGAT",
    description: "ระบบ TGAT วัดสมรรถนะทั่วไป · ชุด A (เปิดขายและสอบได้), ชุด B–D (ร่างเตรียมพร้อม)",
    homeSubtitle: "ความถนัดทั่วไป",
    homeActive: true,
    detailDescription: "TGAT ย่อมาจาก Thai General Aptitude Test หรือการสอบวัดสมรรถนะความถนัดทั่วไป เป็นข้อสอบกลางในระบบ TCAS ที่ใช้ประเมินทักษะการคิดวิเคราะห์และการประยุกต์ใช้ความรู้ในชีวิตประจำวัน แทนการท่องจำเนื้อหา",
    flow: "set-first",
    status: "open",
    subjects: [],
    sets: [
      {
        id: "tgat-a",
        name: "A",
        parts: tgatParts,
        partSettings: tgatPartSettings,
        offers: [
          { id: "tgat-a-tgat1", productId: "tgat1", name: "TGAT1 · การสื่อสารภาษาอังกฤษ", price: 100, payPrice: 110, status: "draft", parts: [tgatParts[0]] },
          { id: "tgat-a-tgat2", productId: "tgat2", name: "TGAT2 · การคิดอย่างมีเหตุผล", price: 100, payPrice: 110, status: "draft", parts: [tgatParts[1]] },
          { id: "tgat-a-tgat3", productId: "tgat3", name: "TGAT3 · สมรรถนะการทำงาน", price: 100, payPrice: 110, status: "draft", parts: [tgatParts[2]] },
          { id: "tgat-a-tgat23", productId: "tgat23", name: "TGAT2 + TGAT3", price: 180, payPrice: 198, status: "draft", parts: tgatParts.slice(1) },
          { id: "tgat-a-full", productId: "tgat-full", name: "Full TGAT", price: 179, payPrice: 197, status: "open", parts: tgatParts },
        ],
      },
      ...["B", "C", "D"].map((name): CatalogSet => ({
        id: `tgat-${name.toLowerCase()}`,
        name,
        parts: tgatParts,
        partSettings: tgatPartSettings,
        offers: [exampleOffer(`tgat-${name.toLowerCase()}-179`, `ชุด ${name} Full TGAT`)],
      })),
    ],
  },
  {
    id: "tpat",
    name: "TPAT",
    description: "ระบบ TPAT วัดความถนัดวิชาชีพ (TPAT1–5) · ไส้ในและพาร์ทแบ่งตามมาตรฐาน ทปอ.",
    homeSubtitle: "ความถนัดทางวิชาชีพ",
    homeActive: false,
    detailDescription: "TPAT คือการสอบวัดความถนัดทางวิชาชีพ แบ่งตามสาขาที่ผู้เรียนสนใจและใช้ประกอบการสมัครเข้าศึกษาต่อในระบบ TCAS",
    flow: "subject-first",
    status: "draft",
    sets: [],
    subjects: tpatSubjectSpecs.map((spec): CatalogSubject => ({
      id: spec.id,
      name: spec.name,
      sets: (spec.id === "tpat1" ? ["A", "B", "C", "D"] : ["A", "B"]).map((setName): CatalogSet => {
        const setId = `${spec.id}-${setName.toLowerCase()}`;
        const partNames = spec.parts.map((p) => p.name);
        return {
          id: setId,
          name: setName,
          parts: partNames,
          partSettings: buildPartSettingsFromSpecs(`${spec.id}-${setName.toLowerCase()}`, spec.parts),
          offers: [{
            ...exampleOffer(
              `${setId}-basic`,
              `${spec.code} แพ็กเกตชุด ${setName}`,
              spec.price,
            ),
            parts: partNames,
          }],
        };
      }),
    })),
  },
  {
    id: "alevel",
    name: "A-Level",
    description: "ข้อสอบความรู้เชิงวิชาการ A-Level (16 วิชาเดี่ยว ทปอ.) · ข้อสอบฉบับเดียว 90 นาที 100 คะแนน",
    homeSubtitle: "ความรู้เชิงวิชาการ",
    homeActive: true,
    detailDescription: "A-Level คือการสอบวัดความรู้เชิงวิชาการ เพื่อใช้ยื่นเข้าศึกษาต่อในระดับมหาวิทยาลัย ครอบคลุมวิชาหลักที่ผู้เรียนเลือกได้ตามคณะเป้าหมาย",
    flow: "subject-first",
    status: "draft",
    sets: [],
    subjects: alevelSubjectSpecs.map((spec): CatalogSubject => {
      const partSpec: HardcodedPartSpec = {
        name: `A-Level ${spec.name}`,
        questionCount: spec.questionCount,
        durationMinutes: 90,
        choiceCount: spec.choiceCount,
        scoreMaximum: 100,
      };
      return {
        id: spec.id,
        name: `A-Level ${spec.name}`,
        sets: ["A", "B"].map((setName): CatalogSet => {
          const setId = `${spec.id}-${setName.toLowerCase()}`;
          return {
            id: setId,
            name: setName,
            parts: [partSpec.name],
            partSettings: buildPartSettingsFromSpecs(setId, [partSpec]),
            offers: [{
              ...exampleOffer(`${setId}-basic`, `A-Level ${spec.name} ฉบับเดี่ยว (ชุด ${setName})`, 179),
              parts: [partSpec.name],
            }],
          };
        }),
      };
    }),
  },
  {
    id: "netsat",
    name: "NETSAT",
    description: "ข้อสอบวัดความฉลาดรู้ทั่วไปและความฉลาดรู้เฉพาะด้าน (ม.ขอนแก่น 7 วิชา) · ข้อสอบฉบับเดียว 90 นาที 100 คะแนน",
    homeSubtitle: "มหาวิทยาลัยขอนแก่น",
    homeActive: false,
    detailDescription: "NETSAT คือการทดสอบความฉลาดรู้ทั่วไปและความฉลาดรู้เฉพาะด้าน สำหรับผู้สมัครเข้าศึกษาต่อมหาวิทยาลัยขอนแก่น",
    flow: "subject-first",
    status: "draft",
    sets: [],
    subjects: netsatSubjectSpecs.map((spec): CatalogSubject => {
      const partSpec: HardcodedPartSpec = {
        name: spec.name,
        questionCount: 40,
        durationMinutes: 90,
        choiceCount: 4,
        scoreMaximum: 100,
      };
      return {
        id: spec.id,
        name: spec.name,
        sets: ["A", "B"].map((setName): CatalogSet => {
          const setId = `${spec.id}-${setName.toLowerCase()}`;
          return {
            id: setId,
            name: setName,
            parts: [partSpec.name],
            partSettings: buildPartSettingsFromSpecs(setId, [partSpec]),
            offers: [{
              ...exampleOffer(`${setId}-basic`, `${spec.name} ฉบับเดี่ยว (ชุด ${setName})`, 179),
              parts: [partSpec.name],
            }],
          };
        }),
      };
    }),
  },
];

function isCatalogFamily(value: unknown): value is CatalogFamily {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CatalogFamily>;
  const validSet = (set: CatalogSet) => typeof set.id === "string" && typeof set.name === "string" &&
    Array.isArray(set.parts) && set.parts.every((part) => typeof part === "string") &&
    Array.isArray(set.offers) && set.offers.every((offer) =>
      typeof offer.id === "string" && typeof offer.name === "string" &&
      Number.isFinite(offer.price) && (offer.status === "open" || offer.status === "draft") &&
      Array.isArray(offer.parts) && offer.parts.every((part) => typeof part === "string"));
  return typeof item.id === "string" && typeof item.name === "string" &&
    (item.flow === "set-first" || item.flow === "subject-first") &&
    (item.status === "open" || item.status === "draft") &&
    Array.isArray(item.sets) && item.sets.every(validSet) &&
    Array.isArray(item.subjects) && item.subjects.every((subject: CatalogSubject) =>
      typeof subject.id === "string" && typeof subject.name === "string" &&
      Array.isArray(subject.sets) && subject.sets.every(validSet));
}

export function readCatalog(): CatalogFamily[] {
  try {
    const current = localStorage.getItem(catalogStorageKey);
    if (!current) return initialCatalog;
    const parsed: unknown = JSON.parse(current);
    if (!Array.isArray(parsed) || !parsed.every(isCatalogFamily)) return initialCatalog;

    const normalized: CatalogFamily[] = initialCatalog.map((seedFamily) => {
      const savedFamily = parsed.find((f) => f.id === seedFamily.id);
      if (!savedFamily) return seedFamily;

      if (seedFamily.flow === "set-first") {
        return {
          ...seedFamily,
          name: savedFamily.name || seedFamily.name,
          homeSubtitle: savedFamily.homeSubtitle || seedFamily.homeSubtitle,
          homeActive: savedFamily.homeActive ?? seedFamily.homeActive,
          homeCoverImage: savedFamily.homeCoverImage ?? seedFamily.homeCoverImage,
          detailDescription: savedFamily.detailDescription || seedFamily.detailDescription,
          status: savedFamily.status || seedFamily.status,
          sets: seedFamily.sets.map((seedSet) => {
            const savedSet = savedFamily.sets.find((s) => s.id === seedSet.id);
            if (!savedSet) return seedSet;
            const partSettings = { ...seedSet.partSettings };
            for (const [part, settings] of Object.entries(savedSet.partSettings || {})) {
              partSettings[part] = { ...partSettings[part], ...settings };
            }
            return {
              ...seedSet,
              parts: savedSet.parts?.length ? savedSet.parts : seedSet.parts,
              partSettings,
              offers: seedSet.offers.map((seedOffer) => {
                const savedOffer = savedSet.offers.find((o) => o.id === seedOffer.id || o.productId === seedOffer.productId);
                return savedOffer ? { ...seedOffer, ...savedOffer } : seedOffer;
              }),
            };
          }),
        };
      }

      return {
        ...seedFamily,
        name: savedFamily.name || seedFamily.name,
        homeSubtitle: savedFamily.homeSubtitle || seedFamily.homeSubtitle,
        homeActive: savedFamily.homeActive ?? seedFamily.homeActive,
        homeCoverImage: savedFamily.homeCoverImage ?? seedFamily.homeCoverImage,
        detailDescription: savedFamily.detailDescription || seedFamily.detailDescription,
        status: savedFamily.status || seedFamily.status,
        subjects: seedFamily.subjects.map((seedSubject) => {
          const savedSubject = savedFamily.subjects.find((s) => s.id === seedSubject.id || s.name === seedSubject.name);
          if (!savedSubject) return seedSubject;
          return mergeSeedSubject(seedSubject, savedSubject);
        }),
      };
    });

    return normalized;
  } catch {
    return initialCatalog;
  }
}

export function familySets(family: CatalogFamily): CatalogSet[] {
  return family.flow === "set-first" ? family.sets : family.subjects.flatMap((subject) => subject.sets);
}

export function familyCanOpen(family: CatalogFamily): boolean {
  return familySets(family).some((set) => set.offers.some((offer) => offer.status === "open"));
}
