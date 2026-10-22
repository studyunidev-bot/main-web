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
  flow: CatalogFlow;
  status: CatalogStatus;
  subjects: CatalogSubject[];
  sets: CatalogSet[];
};

export const catalogStorageKey = "webb-admin-mock:exam-catalog-v2";
const legacyStorageKey = "webb-admin-demo:exam-catalog";
const tgatParts = [
  "TGAT1 การสื่อสารภาษาอังกฤษ",
  "TGAT2 การคิดอย่างมีเหตุผล",
  "TGAT3 สมรรถนะการทำงาน",
];

const tpatSubjects = [
  ["TPAT1", "ความถนัดแพทย์"],
  ["TPAT2", "ความถนัดศิลปกรรมศาสตร์"],
  ["TPAT3", "ความถนัดด้านวิทยาศาสตร์ เทคโนโลยี และวิศวกรรมศาสตร์"],
  ["TPAT4", "ความถนัดทางสถาปัตยกรรมศาสตร์"],
  ["TPAT5", "ความถนัดครุศาสตร์-ศึกษาศาสตร์"],
];

const alevelSubjects = [
  "คณิตศาสตร์ประยุกต์ 1", "คณิตศาสตร์ประยุกต์ 2", "วิทยาศาสตร์ประยุกต์", "ฟิสิกส์", "เคมี", "ชีววิทยา",
  "สังคมศึกษา", "ภาษาไทย", "ภาษาอังกฤษ", "ภาษาฝรั่งเศส", "ภาษาเยอรมัน", "ภาษาญี่ปุ่น", "ภาษาเกาหลี",
  "ภาษาจีน", "ภาษาบาลี", "ภาษาสเปน",
];

const netsatSubjects = [
  "ความฉลาดรู้ทั่วไปด้านภาษา: ภาษาไทย",
  "ความฉลาดรู้ทั่วไปด้านภาษา: ภาษาอังกฤษ",
  "ความฉลาดรู้ทั่วไปด้านคณิตศาสตร์",
  "ความฉลาดรู้เฉพาะด้าน: วิทยาศาสตร์และเทคโนโลยี",
  "ความฉลาดรู้เฉพาะด้าน: ฟิสิกส์",
  "ความฉลาดรู้เฉพาะด้าน: เคมี",
  "ความฉลาดรู้เฉพาะด้าน: ชีววิทยา",
];

const tpat1SampleParts = [
  "TPAT1 · วิเคราะห์ข้อมูลและเงื่อนไข",
  "TPAT1 · เชื่อมโยงเหตุผล",
  "TPAT1 · ประยุกต์ใช้ความรู้",
];
const alevelSampleParts = [
  "A-Level คณิตศาสตร์ประยุกต์ 1 · จำนวนและพีชคณิต",
  "A-Level คณิตศาสตร์ประยุกต์ 1 · การวัดและเรขาคณิต",
  "A-Level คณิตศาสตร์ประยุกต์ 1 · สถิติและความน่าจะเป็น",
];
const netsatSampleParts = [
  "NETSAT ภาษาไทย · การอ่านจับใจความ",
  "NETSAT ภาษาไทย · การใช้ภาษา",
  "NETSAT ภาษาไทย · การคิดวิเคราะห์",
];

function samplePartSettings(
  familyCode: string,
  parts: string[],
): Record<string, CatalogPartSettings> {
  return Object.fromEntries(parts.map((part, index) => {
    const partNumber = String(index + 1).padStart(2, "0");
    const filePrefix = `${familyCode}-A-part-${partNumber}`;
    return [part, {
      questionCount: 20,
      durationMinutes: 20,
      choiceCount: 4,
      scoreMaximum: 20,
      examFileName: `${filePrefix}-exam.pdf`,
      answerFileName: `${filePrefix}-answer-key.pdf`,
      contentStatus: "Draft",
      answers: Array.from({ length: 20 }, (_, questionIndex) => ({
        value: ["B", "A", "D", "C"][((questionIndex + index) % 4)],
        score: 1,
      })),
    }];
  }));
}

function draftSubject(
  id: string,
  name: string,
  parts: string[] = [],
): CatalogSubject {
  const setId = `${id}-a`;
  return {
    id,
    name,
    sets: [{
      id: setId,
      name: "A",
      parts,
      ...(parts.length ? { partSettings: samplePartSettings(id, parts) } : {}),
      offers: [{
        ...exampleOffer(`${setId}-basic`, parts.length ? "แพ็กเกตครบทุกพาร์ท" : "แพ็กเกตมาตรฐาน", parts.length ? 249 : 179),
        parts,
      }],
    }],
  };
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
        parts: savedOffer?.parts.length ? savedOffer.parts : seedOffer.parts,
      };
    });
    const partSettings = { ...seedSet.partSettings };
    for (const [part, settings] of Object.entries(savedSet.partSettings || {})) {
      partSettings[part] = { ...partSettings[part], ...settings };
    }
    return {
      ...seedSet,
      ...savedSet,
      parts: savedSet.parts.length ? savedSet.parts : seedSet.parts,
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
    description: "Client เปิดซื้อและสอบเมื่อชุดพร้อม · เปิดใช้เฉพาะชุด A แบบ Full TGAT รวม TGAT1–3",
    flow: "set-first",
    status: "open",
    subjects: [],
    sets: [
      {
        id: "tgat-a",
        name: "A",
        parts: tgatParts,
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
        offers: [exampleOffer(`tgat-${name.toLowerCase()}-179`, `ชุด ${name} ตามภาพสมัคร`)],
      })),
    ],
  },
  {
    id: "tpat",
    name: "TPAT",
    description: "Client แสดง TPAT1–5 แต่ปิดบริการ · โครงสร้างหลังบ้านเตรียมไว้สำหรับเปิดบริการในอนาคต ยังไม่มีการซื้อ สิทธิ์ หรือการสอบ",
    flow: "subject-first",
    status: "draft",
    sets: [],
    subjects: tpatSubjects.map(([code, label]): CatalogSubject => ({
      id: code.toLowerCase(),
      name: `${code} ${label}`,
      sets: code === "TPAT1" ? ["A", "B", "C", "D"].map((name): CatalogSet => {
        const parts = name === "A" ? tpat1SampleParts : [];
        return {
          id: `${code.toLowerCase()}-${name.toLowerCase()}`,
          name,
          parts,
          ...(parts.length ? { partSettings: samplePartSettings(`${code}-${name}`, parts) } : {}),
          offers: [{
            ...exampleOffer(
              `${code.toLowerCase()}-${name.toLowerCase()}-basic`,
              parts.length ? "แพ็กเกตครบทุกพาร์ท" : "แพ็กเกตมาตรฐาน",
              parts.length ? 249 : 179,
            ),
            parts,
          }],
        };
      }) : [],
    })),
  },
  {
    id: "alevel",
    name: "A-Level",
    description: "วิชา A-Level ที่แสดงใน Client · บริการยังไม่เปิด จึงไม่มีการซื้อ สิทธิ์ หรือการสอบ",
    flow: "subject-first",
    status: "draft",
    sets: [],
    subjects: alevelSubjects.map((name, index) =>
      draftSubject(
        `alevel-${index + 1}`,
        name,
        index === 0 ? alevelSampleParts : [],
      ),
    ),
  },
  {
    id: "netsat",
    name: "NETSAT",
    description: "วิชา NETSAT ที่แสดงใน Client · บริการยังไม่เปิด จึงไม่มีการซื้อ สิทธิ์ หรือการสอบ",
    flow: "subject-first",
    status: "draft",
    subjects: netsatSubjects.map((name, index) =>
      draftSubject(
        `netsat-${index + 1}`,
        name,
        index === 0 ? netsatSampleParts : [],
      ),
    ),
    sets: [],
  },
];

type LegacyFamily = {
  id: string;
  name: string;
  description?: string;
  status: CatalogStatus;
  parts: string[];
  sets: string[];
};

function isLegacyFamily(value: unknown): value is LegacyFamily {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<LegacyFamily>;
  return typeof item.id === "string" && typeof item.name === "string" &&
    (item.status === "open" || item.status === "draft") &&
    Array.isArray(item.parts) && item.parts.every((part) => typeof part === "string") &&
    Array.isArray(item.sets) && item.sets.every((set) => typeof set === "string");
}

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
    if (current) {
      const parsed: unknown = JSON.parse(current);
      if (Array.isArray(parsed) && parsed.every(isCatalogFamily)) {
        const normalized: CatalogFamily[] = parsed.map((family) => {
          if (family.id === "tgat") {
            const seed = initialCatalog.find((item) => item.id === "tgat")!;
            const currentA = family.sets.find((set) => set.id === "tgat-a");
            return {
              ...family,
              description: seed.description,
              sets: [...seed.sets.map((seedSet) => {
                const savedSet = family.sets.find((set) => set.id === seedSet.id);
                if (seedSet.id !== "tgat-a") return savedSet || seedSet;
                const legacyOfferIds = new Set(["tgat-a-179", "tgat-a-1", "tgat-a-23"]);
                return {
                  ...seedSet,
                  ...(savedSet || {}),
                  parts: savedSet?.parts || tgatParts,
                  offers: [...seedSet.offers.map((seedOffer) => {
                    const savedOffer = savedSet?.offers.find((offer) => offer.productId === seedOffer.productId || offer.id === seedOffer.id || (seedOffer.productId === "tgat-full" && offer.name.toLocaleLowerCase() === "full tgat"));
                    return { ...seedOffer, ...savedOffer, id: seedOffer.id, productId: seedOffer.productId, status: savedOffer?.status || seedOffer.status };
                  }), ...(savedSet?.offers || []).filter((offer) => !seedSet.offers.some((seedOffer) => seedOffer.id === offer.id || seedOffer.productId === offer.productId) && !legacyOfferIds.has(offer.id))],
                };
              }), ...family.sets.filter((set) => !seed.sets.some((seedSet) => seedSet.id === set.id))],
            };
          }
          if (family.id === "tpat") {
            const seed = initialCatalog.find((item) => item.id === "tpat")!;
            const subjects = seed.subjects.map((seedSubject) => {
              const savedSubject = family.subjects.find((subject) => subject.id.toLocaleLowerCase() === seedSubject.id);
              if (!savedSubject) return seedSubject;
              const mergedSubject = mergeSeedSubject(seedSubject, savedSubject);
              return {
                ...mergedSubject,
                sets: mergedSubject.sets.map((set) => ({
                  ...set,
                  offers: set.offers.map((offer) => ({ ...offer, status: "draft" as const })),
                })),
              };
            });
            return { ...family, ...seed, status: "draft", subjects: [...subjects, ...family.subjects.filter((subject) => !seed.subjects.some((item) => item.id === subject.id))] };
          }
          if (family.id === "alevel") {
            const seed = initialCatalog.find((item) => item.id === "alevel")!;
            const subjects = seed.subjects.map((seedSubject) => {
              const savedSubject = family.subjects.find((subject) => subject.name === seedSubject.name || subject.id === seedSubject.id);
              if (!savedSubject) return seedSubject;
              const mergedSubject = mergeSeedSubject(seedSubject, savedSubject);
              return {
                ...mergedSubject,
                sets: mergedSubject.sets.map((set) => ({
                  ...set,
                  offers: set.offers.map((offer) => ({ ...offer, status: "draft" as const })),
                })),
              };
            });
            return { ...family, ...seed, status: "draft", subjects: [...subjects, ...family.subjects.filter((subject) => !seed.subjects.some((item) => item.id === subject.id || item.name === subject.name))] };
          }
          if (family.id === "netsat") {
            const seed = initialCatalog.find((item) => item.id === "netsat")!;
            const subjects = seed.subjects.map((seedSubject) => {
              const savedSubject = family.subjects.find((subject) => subject.name === seedSubject.name || subject.id === seedSubject.id);
              if (!savedSubject) return seedSubject;
              const mergedSubject = mergeSeedSubject(seedSubject, savedSubject);
              return {
                ...mergedSubject,
                sets: mergedSubject.sets.map((set) => ({
                  ...set,
                  offers: set.offers.map((offer) => ({ ...offer, status: "draft" as const })),
                })),
              };
            });
            return { ...family, ...seed, status: "draft", subjects: [...subjects, ...family.subjects.filter((subject) => !seed.subjects.some((item) => item.id === subject.id || item.name === subject.name))] };
          }
          return family;
        });
        if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
          try {
            localStorage.setItem(catalogStorageKey, JSON.stringify(normalized));
          } catch {
            // Keep the normalized Sample visible for this session if storage is unavailable.
          }
        }
        return normalized;
      }
    }
    const old = localStorage.getItem(legacyStorageKey);
    if (!old) return initialCatalog;
    const parsed: unknown = JSON.parse(old);
    if (!Array.isArray(parsed)) return initialCatalog;
    const legacy = parsed.filter(isLegacyFamily);
    const seeds = initialCatalog.map((family) => {
      const previous = legacy.find((item) => item.id === family.id);
      if (!previous) return family;
      if (family.id === "alevel") {
        const legacySubjects = previous.parts.length ? previous.parts : previous.sets.length ? ["รายวิชาที่รอกำหนด"] : [];
        return {
          ...family,
          status: previous.status,
          subjects: [...legacySubjects.map((name, index): CatalogSubject => ({
            id: `alevel-legacy-${index}`,
            name,
            sets: previous.sets.map((set, setIndex) => ({
              id: `alevel-legacy-${index}-${setIndex}`,
              name: set,
              parts: [],
              offers: [],
            })),
          })), ...family.subjects.filter((subject) => !legacySubjects.includes(subject.name))],
        };
      }
      return { ...family, status: family.id === "tgat" ? "open" as const : "draft" as const };
    });
    const custom = legacy.filter((item) => !seeds.some((seed) => seed.id === item.id)).map((item): CatalogFamily => ({
      id: item.id,
      name: item.name,
      description: item.description || "ประเภทสอบที่เพิ่มไว้ก่อนปรับโครงสร้าง",
      flow: item.parts.length ? "subject-first" : "set-first",
      status: item.status,
      subjects: item.parts.map((name, index) => ({
        id: `${item.id}-subject-${index}`,
        name,
        sets: item.sets.map((set, setIndex) => ({ id: `${item.id}-${index}-${setIndex}`, name: set, parts: [], offers: [] })),
      })),
      sets: item.parts.length ? [] : item.sets.map((name, index) => ({ id: `${item.id}-set-${index}`, name, parts: [], offers: [] })),
    }));
    return ([...seeds, ...custom] as CatalogFamily[]).map((family) =>
      family.status === "open" && !familyCanOpen(family)
        ? { ...family, status: "draft" }
        : family,
    );
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
