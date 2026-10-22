import { WEBB_PRODUCTS, formatThaiDateTime } from "./data";

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
  examSet?: string;
  amount: number;
  baseAmount: number;
  payment: string;
  purchasedAt: string;
  purchasedAtIso?: string;
  receipt: string;
  profileSnapshot: Omit<DemoStudentProfile, "password">;
  examStatus: "available" | "in-progress" | "submitted" | "interrupted";
  attempts: number;
  orderRef?: string;
  paymentStatus?: "paid" | "refunded";
};

export type DemoOrderStatus = "รอชำระ" | "สำเร็จ" | "หมดอายุ" | "ยกเลิก" | "ไม่สำเร็จ" | "คืนเงินแล้ว";
export type DemoOrderItem = { productId: string; examSet?: string; baseAmount: number; amount: number };
export type DemoOrder = {
  ref: string;
  profileSnapshot: Omit<DemoStudentProfile, "password">;
  items: DemoOrderItem[];
  amount: number;
  method: string;
  status: DemoOrderStatus;
  createdAt: string;
  expiresAt: number;
  paidAt?: string;
};

export type DemoProductSettings = {
  id: string;
  price: number;
  payPrice: number;
  status: "เปิดขาย" | "ปิดขาย";
  version: string;
  trial: boolean;
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
  examSet?: string;
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
export const DEMO_ORDERS_KEY = "webb-demo-orders";
export const DEMO_SALES_OPEN_KEY = "webb-demo-sales-open";

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
  tpat1: ["tpat1"],
  tpat2: ["tpat2"],
  tpat3: ["tpat3"],
  tpat4: ["tpat4"],
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
  if (!legacy?.email) {
    // The seeded sss/sss login has no separately saved profile. Resolve it to
    // the same demo identity used by the student area and purchase flow.
    if (safeRead<boolean>(DEMO_AUTH_KEY, false)) {
      return {
        username: "sss",
        password: "sss",
        citizenId: "1-6799-12345-34-1",
        firstName: "สมชาย",
        lastName: "ศิริกุล",
        phone: "082-2193-291",
        email: "somchai@example.com",
        province: "ขอนแก่น",
        school: "โรงเรียนตัวอย่างวิทยา",
        education: "มัธยมศึกษาปีที่ 6",
      };
    }
    return null;
  }
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

export function isPurchaseEntitled(purchase: DemoPurchase) {
  return purchase.paymentStatus !== "refunded";
}

export function readDemoOrders() {
  return safeRead<DemoOrder[]>(DEMO_ORDERS_KEY, []);
}

export function createDemoOrder(order: DemoOrder) {
  const current = readDemoOrders();
  const existing = current.find((item) => item.ref === order.ref);
  if (existing) return existing;
  safeWrite(DEMO_ORDERS_KEY, [order, ...current]);
  const events = safeRead<{ id: string; order: string; type: string; status: string; received: string }[]>("webb-admin-demo:webhooks", []);
  safeWrite("webb-admin-demo:webhooks", [{ id: `EVT-${String(Date.now()).slice(-6)}`, order: order.ref, type: "payment.pending", status: "รอดำเนินการ", received: formatThaiDateTime() }, ...events]);
  appendDemoAuditLog("ผู้เรียน Demo", "สร้างคำสั่งซื้อ", `${order.ref} · ${order.amount} บาท`);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("webb-demo-orders-updated"));
  return order;
}

export function setDemoOrderStatus(ref: string, status: DemoOrderStatus, actor = "ผู้เรียน Demo") {
  const orders = readDemoOrders();
  const order = orders.find((item) => item.ref === ref);
  if (!order) return null;
  if (order.status !== "รอชำระ") {
    if (order.status === status) return order;
    if (!(order.status === "สำเร็จ" && status === "คืนเงินแล้ว")) return null;
  }
  if (status === "สำเร็จ" && order.expiresAt <= Date.now()) {
    setDemoOrderStatus(ref, "หมดอายุ", "ระบบ Demo");
    return null;
  }
  const nextOrder = { ...order, status, ...(status === "สำเร็จ" ? { paidAt: formatThaiDateTime() } : {}) };
  safeWrite(DEMO_ORDERS_KEY, orders.map((item) => item.ref === ref ? nextOrder : item));
  appendDemoAuditLog(actor, `เปลี่ยนสถานะคำสั่งซื้อเป็น${status}`, ref);
  const eventTypes: Record<DemoOrderStatus, string> = {
    "รอชำระ": "payment.pending",
    "สำเร็จ": "payment.succeeded",
    "หมดอายุ": "payment.expired",
    "ยกเลิก": "payment.cancelled",
    "ไม่สำเร็จ": "payment.failed",
    "คืนเงินแล้ว": "payment.refunded",
  };
  const events = safeRead<{ id: string; order: string; type: string; status: string; received: string }[]>("webb-admin-demo:webhooks", []);
  safeWrite("webb-admin-demo:webhooks", [{
    id: `EVT-${String(Date.now()).slice(-6)}`,
    order: ref,
    type: eventTypes[status],
    status: "ประมวลผลแล้ว",
    received: formatThaiDateTime(),
  }, ...events]);
  if (status === "สำเร็จ") {
    const purchases = readDemoPurchases();
    const created = order.items.map((item, index): DemoPurchase => ({
      ref: `${ref}-${item.productId}-${item.examSet || index + 1}`,
      orderRef: ref,
      productId: item.productId,
      examSet: item.examSet,
      amount: item.amount,
      baseAmount: item.baseAmount,
      payment: order.method,
      purchasedAt: nextOrder.paidAt!,
      purchasedAtIso: new Date().toISOString(),
      receipt: `RC-${ref}-${index + 1}`,
      profileSnapshot: order.profileSnapshot,
      examStatus: "available",
      attempts: 0,
      paymentStatus: "paid",
    }));
    safeWrite(DEMO_PURCHASES_KEY, [...purchases.filter((purchase) => purchase.orderRef !== ref), ...created]);
    addDemoEmail(order.profileSnapshot.email, `ชำระเงินสำเร็จ ${ref}`, `รับชำระเงิน ${order.amount} บาท · เปิดสิทธิ์สอบ ${created.length} รายการ (อีเมลนี้เป็นการจำลอง)`);
  } else if (status === "คืนเงินแล้ว") {
    safeWrite(DEMO_PURCHASES_KEY, readDemoPurchases().map((purchase) => purchase.orderRef === ref || purchase.ref === ref ? { ...purchase, paymentStatus: "refunded" } : purchase));
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("webb-demo-orders-updated"));
    window.dispatchEvent(new Event("webb-demo-purchases-updated"));
  }
  return nextOrder;
}

export function isDemoSalesOpen() {
  return safeRead<boolean>(DEMO_SALES_OPEN_KEY, true);
}

export function resetWebBDemoData() {
  if (typeof window === "undefined") return;
  const keys = Object.keys(window.localStorage).filter((key) => key.startsWith("webb-admin-demo:") || key.startsWith("webb-demo-") || key.startsWith("webb-registration") || key.startsWith("webb-intended-") || key.startsWith("webb-exam-"));
  keys.forEach((key) => window.localStorage.removeItem(key));
  window.localStorage.removeItem("webb-admin-demo-role");
  ["webb-demo-auth-updated", "webb-demo-orders-updated", "webb-demo-purchases-updated", "webb-demo-products-updated", "webb-admin-demo-updated"].forEach((event) => window.dispatchEvent(new Event(event)));
}

export function appendDemoAuditLog(actor: string, action: string, target: string) {
  if (typeof window === "undefined") return;
  const key = "webb-admin-demo:logs";
  const logs = safeRead<{ time: string; actor: string; action: string; target: string }[]>(key, []);
  safeWrite(key, [{ time: formatThaiDateTime(), actor, action, target }, ...logs]);
  window.dispatchEvent(new Event("webb-admin-demo-updated"));
}

export function setDemoSalesOpen(open: boolean) {
  safeWrite(DEMO_SALES_OPEN_KEY, open);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("webb-demo-products-updated"));
}

export function purchaseBelongsToCurrentAccount(purchase: DemoPurchase) {
  const account = readDemoAccount();
  if (!account) return false;
  if (purchase.profileSnapshot.username.toLowerCase() === account.username.toLowerCase()) return true;

  // Older anonymous demo checkouts used this fallback username before the
  // seeded sss identity was resolved consistently.
  const isSeedDemoAccount = account.username === "sss" && account.email === "somchai@example.com";
  return isSeedDemoAccount && purchase.profileSnapshot.username.toLowerCase() === "somchai";
}

export function readCurrentDemoPurchases() {
  return readDemoPurchases().filter((purchase) => isPurchaseEntitled(purchase) && purchaseBelongsToCurrentAccount(purchase));
}

export function currentPurchaseForProduct(productId: string) {
  const existing = [...readDemoPurchases()].reverse().find((purchase) => isPurchaseEntitled(purchase) && purchase.productId === productId && purchaseBelongsToCurrentAccount(purchase));
  if (existing) return existing;

  return null;
}

export function currentPurchaseForExam(productId: string, examSet?: string) {
  if (examSet) {
    const match = [...readDemoPurchases()].reverse().find((purchase) =>
      isPurchaseEntitled(purchase) && purchase.productId === productId && purchase.examSet === examSet && purchaseBelongsToCurrentAccount(purchase),
    );
    if (match) return match;
    const legacyMatch = [...readDemoPurchases()].reverse().find((purchase) =>
      isPurchaseEntitled(purchase) && purchase.productId === productId && !purchase.examSet && purchaseBelongsToCurrentAccount(purchase),
    );
    if (legacyMatch) return legacyMatch;
    const mockEntitlement = currentPurchaseForProduct(productId);
    return mockEntitlement && !mockEntitlement.examSet ? mockEntitlement : null;
  }
  return currentPurchaseForProduct(productId);
}

export function currentPurchaseForRef(ref?: string) {
  if (!ref) return null;
  return readDemoPurchases().find((purchase) => isPurchaseEntitled(purchase) && purchase.ref === ref && purchaseBelongsToCurrentAccount(purchase)) || null;
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

export function examResultStorageKey(productId: string, examType: "purchased" | "trial", username?: string, examSet?: string) {
  if (examType === "trial") return `webb-demo-result:${productId}:trial${examSet ? `:${examSet}` : ""}`;
  const account = readDemoAccount();
  const identity = username || account?.username || account?.email || "guest";
  return `webb-demo-result:${productId}:purchased:${encodeURIComponent(identity.toLowerCase())}${examSet ? `:${examSet}` : ""}`;
}

export function examAnswersStorageKey(productId: string, examType: "purchased" | "trial", username?: string, examSet?: string) {
  if (examType === "trial") return `webb-demo-answers:${productId}:trial${examSet ? `:${examSet}` : ""}`;
  const account = readDemoAccount();
  const identity = username || account?.username || account?.email || "guest";
  return `webb-demo-answers:${productId}:purchased:${encodeURIComponent(identity.toLowerCase())}${examSet ? `:${examSet}` : ""}`;
}

export function productAvailability() {
  const rows = readProductSettings();
  return new Map(WEBB_PRODUCTS.map((product) => [
    product.id,
    rows.find((row) => row.id === product.id)?.status !== "ปิดขาย",
  ]));
}

export function readProductSettings(): DemoProductSettings[] {
  const saved = safeRead<Partial<DemoProductSettings>[]>("webb-admin-demo:products", []);
  return WEBB_PRODUCTS.map((product, index) => {
    const row = saved.find((item) => item.id === product.id);
    return {
      id: product.id,
      price: typeof row?.price === "number" && Number.isFinite(row.price) ? row.price : product.id === "tgat-full" ? 179 : product.price,
      payPrice: typeof row?.payPrice === "number" && Number.isFinite(row.payPrice) ? row.payPrice : product.id === "tgat-full" ? 179 : product.price,
      status: row?.status === "ปิดขาย" ? "ปิดขาย" : "เปิดขาย",
      version: row?.version || `TGAT-2026.${index + 1}`,
      trial: Boolean(row?.trial),
    };
  });
}

export function getProductPrice(productId: string) {
  return readProductSettings().find((product) => product.id === productId)?.price
    ?? (productId === "tgat-full" ? 179 : WEBB_PRODUCTS.find((product) => product.id === productId)?.price)
    ?? 0;
}

export function isDemoStudentSuspended(username: string, email: string) {
  const students = safeRead<{ username?: string; email?: string; status?: string }[]>("webb-admin-demo:students", []);
  return students.some((student) => student.status === "ระงับ" && (
    (!!student.username && student.username.toLowerCase() === username.toLowerCase()) ||
    (!!student.email && student.email.toLowerCase() === email.toLowerCase())
  ));
}

export function addDemoEmail(to: string, subject: string, preview: string) {
  const emails = safeRead<DemoEmail[]>(DEMO_EMAILS_KEY, []);
  const sentAt = formatThaiDateTime();
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
  if (reverseIndex < 0 || !isPurchaseEntitled(purchases[reverseIndex])) return purchases;
  const next = purchases.map((purchase, index) => index === reverseIndex
    ? { ...purchase, examStatus, attempts: purchase.attempts + (incrementAttempt ? 1 : 0) }
    : purchase);
  safeWrite(DEMO_PURCHASES_KEY, next);
  appendDemoAuditLog("ผู้เรียน Demo", `เปลี่ยนสถานะสิทธิ์สอบเป็น ${examStatus}`, purchaseRef || productId);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("webb-demo-purchases-updated"));
  return next;
}

export function updateAdminAttempt(productId: string, status: string, score = "—", examSet = "A") {
  if (typeof window === "undefined") return;
  const product = WEBB_PRODUCTS.find((item) => item.id === productId);
  if (!product) return;
  const key = "webb-admin-demo:attempts";
  const attempts = safeRead<{ id: string; student: string; username?: string; product: string; status: string; score: string; events?: { time: string; action: string; detail: string }[] }[]>(key, []);
  const account = readDemoAccount();
  const student = account ? `${account.firstName} ${account.lastName}`.trim() : "ผู้เรียน Demo";
  const event = { time: formatThaiDateTime(), action: status === "กำลังสอบ" ? "เริ่มสอบ" : status === "ส่งแล้ว" ? "ส่งข้อสอบ" : status, detail: "ชุด " + examSet + (score !== "—" ? " · คะแนน " + score : "") };
  const active = [...attempts].reverse().find((attempt) => attempt.status === "กำลังสอบ" && (attempt.username?.toLowerCase() === account?.username.toLowerCase() || (!attempt.username && attempt.student === student)) && productComponents(attempt.product).size === productComponents(productId).size && productsOverlap(attempt.product, productId) && (attempt.product.includes("ชุด " + examSet) || (examSet === "A" && !attempt.product.includes("ชุด "))));
  if (active) {
    safeWrite(key, attempts.map((attempt) => attempt.id === active.id ? { ...attempt, status, score, product: product.name + " · ชุด " + examSet, events: [...(attempt.events || []), event] } : attempt));
  } else if (status === "กำลังสอบ") {
    safeWrite(key, [{ id: "ATT-" + String(Date.now()).slice(-6), student, username: account?.username, product: product.name + " · ชุด " + examSet, started: event.time, status, score, events: [event] }, ...attempts]);
  }
  appendDemoAuditLog(student, `ข้อสอบ ${status}`, `${product.name} · ${score}`);
}

export function readDemoRankings() {
  return safeRead<DemoRankingResult[]>(DEMO_RANKINGS_KEY, []);
}

export function recordDemoRankingResult(productId: string, score: number, examSet = "A") {
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
    examSet,
  };
  const next = results.filter((row) => !(row.username.toLowerCase() === result.username.toLowerCase() && row.productId === productId && row.version === version && (row.examSet || "A") === examSet));
  safeWrite(DEMO_RANKINGS_KEY, [result, ...next]);
  appendDemoAuditLog(result.student, "เผยแพร่คะแนนเข้า Ranking Demo", `${WEBB_PRODUCTS.find((item) => item.id === productId)?.name || productId} · ${result.score}/100`);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("webb-demo-ranking-updated"));
}

export function calculateDemoScore(answers: Record<number, string | string[]>, productId = "tgat1", examSet = "A") {
  const defaultAnswerKey = ["A", "C", "B", "D", "A"];
  const setAnswerKey = safeRead<string[] | null>(`webb-admin-demo:answer-key:${productId}:${encodeURIComponent(examSet)}`, null);
  const legacyAnswerKey = safeRead<string[] | null>(`webb-admin-demo:answer-key:${productId}`, null);
  const answerKey = setAnswerKey || (examSet === "A" ? legacyAnswerKey || (productId === "tgat1" ? safeRead("webb-admin-demo:answer-key", defaultAnswerKey) : defaultAnswerKey) : defaultAnswerKey);
  if (!answerKey.length) return 0;
  const correct = answerKey.reduce((total, expected, index) => {
    const answer = answers[index];
    const choices = Array.isArray(answer) ? answer : answer === undefined ? [] : [answer];
    const actual = choices
      .map(Number)
      .filter(Number.isInteger)
      .map((choice) => String.fromCharCode(65 + choice))
      .sort()
      .join(",");
    const expectedPattern = expected
      .split(/[,+\s]+/)
      .filter(Boolean)
      .map((choice) => choice.toUpperCase())
      .sort()
      .join(",");
    return total + (actual === expectedPattern ? 1 : 0);
  }, 0);
  return Math.round((correct / answerKey.length) * 1000) / 10;
}

export function areDemoResultsPublished() {
  return safeRead<boolean>("webb-admin-demo:published-results", true);
}

export function isDemoSolutionPublished(productId: string) {
  const saved = safeRead<{ product: string; active: boolean }[] | null>("webb-admin-demo:solutions", null);
  if (!saved) return true;
  const product = WEBB_PRODUCTS.find((item) => item.id === productId);
  const aliases = [productId.toLowerCase(), product?.name.toLowerCase() || ""];
  if (productId === "tgat-full") aliases.push("tgat");
  const related = saved.filter((item) => item.product.toLowerCase().includes("ทุกชุด") || aliases.some((alias) => alias && item.product.toLowerCase().includes(alias)));
  return related.length === 0 || related.some((item) => item.active);
}

export function isDemoContentPublished(productId: string) {
  const rows = safeRead<{ id: string; contentStatus?: string }[]>("webb-admin-demo:products", []);
  const product = rows.find((row) => row.id === productId);
  return !product || !product.contentStatus || product.contentStatus === "เผยแพร่";
}

export function readSocialSettings() {
  return { ...defaultSocialSettings, ...safeRead<Partial<SocialSettings>>(DEMO_SOCIALS_KEY, {}) };
}

export function writeSocialSettings(settings: SocialSettings) {
  safeWrite(DEMO_SOCIALS_KEY, settings);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("webb-demo-social-updated"));
}
