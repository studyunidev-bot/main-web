import { WEBB_PRODUCTS } from "./data";

export type DemoStudentProfile = {
  username: string;
  password?: string;
  citizenId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  province: string;
  school: string;
  education: string;
};

export type DemoPurchase = {
  ref: string;
  productId: string;
  amount: number;
  baseAmount: number;
  payment: string;
  purchasedAt: string;
  purchasedAtIso?: string;
  receipt: string;
  profileSnapshot: Omit<DemoStudentProfile, "password">;
  examStatus: "available" | "in-progress" | "submitted" | "interrupted";
  attempts: number;
};

export type DemoEmail = {
  id: string;
  to: string;
  subject: string;
  preview: string;
  sentAt: string;
};

export type DemoRankingResult = {
  username: string;
  email: string;
  student: string;
  grade: string;
  province: string;
  productId: string;
  version: string;
  score: number;
  submittedAt: number;
};

export type SocialSettings = {
  lineId: string;
  lineUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  supportEmail: string;
};

export const DEMO_ACCOUNT_KEY = "webb-demo-account";
export const DEMO_PURCHASES_KEY = "webb-demo-purchases";
export const DEMO_EMAILS_KEY = "webb-demo-emails";
export const DEMO_SOCIALS_KEY = "webb-demo-socials";
export const DEMO_PROFILE_KEY = "webb-demo-profile";
export const DEMO_AUTH_KEY = "webb-demo-student-auth";
export const DEMO_RANKINGS_KEY = "webb-demo-ranking-results";

export const defaultSocialSettings: SocialSettings = {
  lineId: "@เรียนต่อมหาลัย",
  lineUrl: "https://line.me/",
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  youtubeUrl: "",
  supportEmail: "support@studyunith.com",
};

const productParts: Record<string, string[]> = {
  tgat1: ["tgat1"],
  tgat2: ["tgat2"],
  tgat3: ["tgat3"],
  tgat23: ["tgat2", "tgat3"],
  "tgat-full": ["tgat1", "tgat2", "tgat3"],
};

export function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function safeWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Demo state remains usable in memory if browser storage is unavailable.
  }
}

export function readDemoAccount(): DemoStudentProfile | null {
  const saved = safeRead<DemoStudentProfile | null>(DEMO_ACCOUNT_KEY, null);
  if (saved) return saved;
  const legacy = safeRead<Partial<DemoStudentProfile> | null>(DEMO_PROFILE_KEY, null);
  if (!legacy?.email) return null;
  return {
    username: legacy.username || "sss",
    password: legacy.password || "sss",
    citizenId: legacy.citizenId || "",
    firstName: legacy.firstName || "สมชาย",
    lastName: legacy.lastName || "ศิริกุล",
    phone: legacy.phone || "08X-XXX-XXXX",
    email: legacy.email,
    province: legacy.province || "ขอนแก่น",
    school: legacy.school || "โรงเรียนตัวอย่างวิทยา",
    education: legacy.education || "มัธยมศึกษาปีที่ 6",
  };
}

export function readDemoPurchases() {
  return safeRead<DemoPurchase[]>(DEMO_PURCHASES_KEY, []);
}

export function purchaseBelongsToCurrentAccount(purchase: DemoPurchase) {
  const account = readDemoAccount();
  return !!account && purchase.profileSnapshot.username.toLowerCase() === account.username.toLowerCase();
}

export function readCurrentDemoPurchases() {
  return readDemoPurchases().filter(purchaseBelongsToCurrentAccount);
}

export function currentPurchaseForProduct(productId: string) {
  return [...readDemoPurchases()].reverse().find((purchase) => purchase.productId === productId && purchaseBelongsToCurrentAccount(purchase)) || null;
}

export function purchasedComponents(purchases: DemoPurchase[]) {
  return new Set(purchases.flatMap((purchase) => productParts[purchase.productId] || [purchase.productId]));
}

export function productIsOwnedOrOverlapping(productId: string, purchases: DemoPurchase[]) {
  const owned = purchasedComponents(purchases);
  return (productParts[productId] || [productId]).some((part) => owned.has(part));
}

export function productComponents(productIdOrName: string) {
  const normalized = productIdOrName.trim().toLowerCase();
  const product = WEBB_PRODUCTS.find((item) => item.id.toLowerCase() === normalized || item.name.toLowerCase() === normalized || normalized.startsWith(`${item.name.toLowerCase()} ·`) || normalized.startsWith(`${item.id.toLowerCase()} ·`));
  const id = product?.id || normalized;
  return new Set(productParts[id] || [id]);
}

export function productsOverlap(left: string, right: string) {
  const leftParts = productComponents(left);
  return [...productComponents(right)].some((part) => leftParts.has(part));
}

export function examResultStorageKey(productId: string, examType: "purchased" | "trial", username?: string) {
  if (examType === "trial") return `webb-demo-result:${productId}:trial`;
  const account = readDemoAccount();
  const identity = username || account?.username || account?.email || "guest";
  return `webb-demo-result:${productId}:purchased:${encodeURIComponent(identity.toLowerCase())}`;
}

export function examAnswersStorageKey(productId: string, examType: "purchased" | "trial", username?: string) {
  if (examType === "trial") return `webb-demo-answers:${productId}:trial`;
  const account = readDemoAccount();
  const identity = username || account?.username || account?.email || "guest";
  return `webb-demo-answers:${productId}:purchased:${encodeURIComponent(identity.toLowerCase())}`;
}

export function productAvailability() {
  const rows = safeRead<{ id: string; status?: string }[]>("webb-admin-demo:products", []);
  if (!rows.length) return new Map(WEBB_PRODUCTS.map((product) => [product.id, true]));
  return new Map(WEBB_PRODUCTS.map((product) => [
    product.id,
    rows.find((row) => row.id === product.id)?.status !== "ปิดขาย",
  ]));
}

export function addDemoEmail(to: string, subject: string, preview: string) {
  const emails = safeRead<DemoEmail[]>(DEMO_EMAILS_KEY, []);
  const sentAt = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  const email = { id: `MAIL-${Date.now()}`, to, subject, preview, sentAt };
  safeWrite(DEMO_EMAILS_KEY, [email, ...emails]);
  return email;
}

export function setPurchaseExamStatus(productId: string, examStatus: DemoPurchase["examStatus"], incrementAttempt = false, purchaseRef?: string) {
  const purchases = readDemoPurchases();
  const account = readDemoAccount();
  let reverseIndex = -1;
  if (purchaseRef) {
    reverseIndex = purchases.findIndex((purchase) => purchase.ref === purchaseRef && (!account || purchase.profileSnapshot.username.toLowerCase() === account.username.toLowerCase()));
  } else {
    for (let index = purchases.length - 1; index >= 0; index -= 1) {
      const purchase = purchases[index];
      if (purchase.productId === productId && (!account || purchase.profileSnapshot.username.toLowerCase() === account.username.toLowerCase())) {
        reverseIndex = index;
        break;
      }
    }
  }
  if (reverseIndex < 0) return purchases;
  const next = purchases.map((purchase, index) => index === reverseIndex
    ? { ...purchase, examStatus, attempts: purchase.attempts + (incrementAttempt ? 1 : 0) }
    : purchase);
  safeWrite(DEMO_PURCHASES_KEY, next);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("webb-demo-purchases-updated"));
  return next;
}

export function updateAdminAttempt(productId: string, status: string, score = "—") {
  if (typeof window === "undefined") return;
  const product = WEBB_PRODUCTS.find((item) => item.id === productId);
  if (!product) return;
  const key = "webb-admin-demo:attempts";
  const attempts = safeRead<{ id: string; student: string; username?: string; product: string; status: string; score: string }[]>(key, []);
  const account = readDemoAccount();
  const student = account ? `${account.firstName} ${account.lastName}`.trim() : "ผู้เรียน Demo";
  const active = [...attempts].reverse().find((attempt) => attempt.status === "กำลังสอบ" && (attempt.username?.toLowerCase() === account?.username.toLowerCase() || (!attempt.username && attempt.student === student)) && productComponents(attempt.product).size === productComponents(productId).size && productsOverlap(attempt.product, productId));
  if (active) {
    safeWrite(key, attempts.map((attempt) => attempt.id === active.id ? { ...attempt, status, score } : attempt));
  } else if (status === "กำลังสอบ") {
    safeWrite(key, [{ id: `ATT-${String(Date.now()).slice(-6)}`, student, username: account?.username, product: product.name, started: new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }), status, score }, ...attempts]);
  }
}

export function recordDemoRankingResult(productId: string, score: number) {
  const account = readDemoAccount();
  const purchase = currentPurchaseForProduct(productId);
  if (!account || !purchase) return;
  const products = safeRead<{ id: string; version?: string }[]>("webb-admin-demo:products", []);
  const version = products.find((item) => item.id === productId)?.version || "TGAT-2026";
  const results = safeRead<DemoRankingResult[]>(DEMO_RANKINGS_KEY, []);
  const result: DemoRankingResult = {
    username: account.username,
    email: account.email,
    student: `${account.firstName} ${account.lastName}`.trim(),
    grade: account.education,
    province: account.province,
    productId,
    version,
    score: Math.max(0, Math.min(100, score)),
    submittedAt: Date.now(),
  };
  const next = results.filter((row) => !(row.username.toLowerCase() === result.username.toLowerCase() && row.productId === productId && row.version === version));
  safeWrite(DEMO_RANKINGS_KEY, [result, ...next]);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("webb-demo-ranking-updated"));
}

export function readSocialSettings() {
  return { ...defaultSocialSettings, ...safeRead<Partial<SocialSettings>>(DEMO_SOCIALS_KEY, {}) };
}

export function writeSocialSettings(settings: SocialSettings) {
  safeWrite(DEMO_SOCIALS_KEY, settings);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("webb-demo-social-updated"));
}
