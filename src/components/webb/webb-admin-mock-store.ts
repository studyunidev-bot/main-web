import {
  safeRead,
  safeWrite,
  type DemoPurchase,
  type DemoRankingResult,
} from "./demo-store";

export const WEBB_ADMIN_MOCK_PREFIX = "webb-admin-mock:";
export const WEBB_ADMIN_MOCK_UPDATED = "webb-admin-mock-updated";
export const WEBB_ADMIN_MOCK_PURCHASES_KEY = `${WEBB_ADMIN_MOCK_PREFIX}purchases`;
export const WEBB_ADMIN_MOCK_RANKINGS_KEY = `${WEBB_ADMIN_MOCK_PREFIX}rankings`;

const mockPurchases: DemoPurchase[] = [
  {
    ref: "DO-2570-0001",
    orderRef: "DO-2570-0001",
    productId: "tgat-full",
    examSet: "A",
    amount: 197,
    baseAmount: 179,
    payment: "PromptPay QR",
    purchasedAt: "2026-07-14 18:20",
    receipt: "ใบเสร็จจำลอง DO-2570-0001",
    profileSnapshot: { username: "sss", citizenId: "", firstName: "สมชาย", lastName: "ศิริกุล", phone: "", email: "somchai@example.com", province: "ขอนแก่น", school: "โรงเรียนตัวอย่างวิทยา", education: "ม.6" },
    examStatus: "submitted",
    attempts: 1,
    paymentStatus: "paid",
  },
  {
    ref: "DO-2570-0002",
    orderRef: "DO-2570-0002",
    productId: "tgat-full",
    examSet: "A",
    amount: 197,
    baseAmount: 179,
    payment: "PromptPay QR",
    purchasedAt: "2026-10-04 12:50",
    receipt: "ใบเสร็จจำลอง DO-2570-0002",
    profileSnapshot: { username: "nicha", citizenId: "", firstName: "ณิชา", lastName: "วัฒนกุล", phone: "", email: "nicha.w@example.test", province: "เชียงใหม่", school: "โรงเรียนเตรียมศึกษา", education: "ม.6" },
    examStatus: "submitted",
    attempts: 1,
    paymentStatus: "paid",
  },
  {
    ref: "DO-2570-0003",
    orderRef: "DO-2570-0003",
    productId: "tgat-full",
    examSet: "A",
    amount: 197,
    baseAmount: 179,
    payment: "PromptPay QR",
    purchasedAt: "2026-10-03 09:45",
    receipt: "ใบเสร็จจำลอง DO-2570-0003",
    profileSnapshot: { username: "thanakorn", citizenId: "", firstName: "ธนกร", lastName: "พิพัฒน์กุล", phone: "", email: "thanakorn@example.test", province: "ขอนแก่น", school: "โรงเรียนหอพระ", education: "ม.5" },
    examStatus: "submitted",
    attempts: 1,
    paymentStatus: "paid",
  },
  {
    ref: "DO-2570-0004",
    orderRef: "DO-2570-0004",
    productId: "tgat-full",
    examSet: "A",
    amount: 197,
    baseAmount: 179,
    payment: "PromptPay QR",
    purchasedAt: "2026-10-02 14:30",
    receipt: "ใบเสร็จจำลอง DO-2570-0004",
    profileSnapshot: { username: "pimchanok", citizenId: "", firstName: "พิมพ์ชนก", lastName: "สุขใจ", phone: "", email: "pimchanok@example.test", province: "เชียงใหม่", school: "โรงเรียนยุพราชวิทยาลัย", education: "ม.6" },
    examStatus: "submitted",
    attempts: 1,
    paymentStatus: "paid",
  },
  {
    ref: "DO-2570-0007",
    orderRef: "DO-2570-0007",
    productId: "tgat-full",
    examSet: "A",
    amount: 197,
    baseAmount: 179,
    payment: "PromptPay QR",
    purchasedAt: "2026-10-06 10:15",
    receipt: "ใบเสร็จจำลอง DO-2570-0007",
    profileSnapshot: { username: "varisara", citizenId: "", firstName: "วริศรา", lastName: "รุ่งเรือง", phone: "", email: "varisara@example.test", province: "เชียงใหม่", school: "โรงเรียนยุพราชวิทยาลัย", education: "ม.6" },
    examStatus: "interrupted",
    attempts: 1,
    paymentStatus: "paid",
  },
];

export function adminMockKey(key: string) {
  return `${WEBB_ADMIN_MOCK_PREFIX}${key}`;
}

export function readAdminMockPurchases() {
  return safeRead<DemoPurchase[]>(WEBB_ADMIN_MOCK_PURCHASES_KEY, mockPurchases).map(
    (purchase) => ({ ...purchase, payment: "PromptPay QR" }),
  );
}

export function writeAdminMockPurchases(purchases: DemoPurchase[]) {
  safeWrite(WEBB_ADMIN_MOCK_PURCHASES_KEY, purchases);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(WEBB_ADMIN_MOCK_UPDATED));
}

export function readAdminMockRankings() {
  return safeRead<DemoRankingResult[]>(WEBB_ADMIN_MOCK_RANKINGS_KEY, []);
}

export function writeAdminMockRankings(rankings: DemoRankingResult[]) {
  safeWrite(WEBB_ADMIN_MOCK_RANKINGS_KEY, rankings);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(WEBB_ADMIN_MOCK_UPDATED));
}
