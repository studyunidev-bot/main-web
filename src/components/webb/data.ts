export type ExamProduct = {
  id: string;
  name: string;
  parts: string;
  description: string;
  price: number;
  color: string;
};

export const WEBB_PRODUCTS: ExamProduct[] = [
  {
    id: "tgat1",
    name: "TGAT1",
    parts: "การสื่อสารภาษาอังกฤษ",
    description: "ฝึกครบทุกทักษะ พร้อมเฉลยละเอียด",
    price: 100,
    color: "#efb934",
  },
  {
    id: "tgat2",
    name: "TGAT2",
    parts: "การคิดอย่างมีเหตุผล",
    description: "ฝึกการคิดเชิงตรรกะและวิเคราะห์",
    price: 100,
    color: "#8154d8",
  },
  {
    id: "tgat3",
    name: "TGAT3",
    parts: "สมรรถนะการทำงาน",
    description: "ประเมินทักษะที่จำเป็นในอนาคต",
    price: 100,
    color: "#4ca9a5",
  },
  {
    id: "tgat23",
    name: "TGAT2 + TGAT3",
    parts: "การคิดอย่างมีเหตุผล + สมรรถนะการทำงาน",
    description: "ฝึกสองพาร์ทในชุดเดียว",
    price: 180,
    color: "#6384c5",
  },
  {
    id: "tgat-full",
    name: "Full TGAT",
    parts: "TGAT1 + TGAT2 + TGAT3",
    description: "ครบทั้งสามพาร์ทในชุดเดียว",
    price: 250,
    color: "#d99a35",
  },
  {
    id: "tpat1",
    name: "TPAT1",
    parts: "ความถนัดแพทย์",
    description: "ฝึกครบทุกมิติ พร้อมเฉลยละเอียด",
    price: 150,
    color: "#3b82f6",
  },
  {
    id: "tpat2",
    name: "TPAT2",
    parts: "ความถนัดศิลป์",
    description: "ฝึกการออกแบบและความคิดสร้างสรรค์",
    price: 150,
    color: "#ec4899",
  },
  {
    id: "tpat3",
    name: "TPAT3",
    parts: "ความถนัดด้านวิทยาศาสตร์ เทคโนโลยี และวิศวกรรมศาสตร์",
    description: "ฝึกความถนัดด้านวิทยาศาสตร์และเทคโนโลยี",
    price: 179,
    color: "#0e7490",
  },
  {
    id: "tpat4",
    name: "TPAT4",
    parts: "ความถนัดทางสถาปัตยกรรมศาสตร์",
    description: "ฝึกความถนัดทางสถาปัตยกรรมศาสตร์",
    price: 179,
    color: "#7c3aed",
  },
];

export const WEBB_MOCK_IMAGE = "/images/webb/students-demo.png";

export function getProduct(id?: string | null) {
  return WEBB_PRODUCTS.find((product) => product.id === id) ?? WEBB_PRODUCTS[4];
}

export function formatBaht(value: number) {
  return (
    new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(value) +
    " บาท"
  );
}

export function formatThaiDateTime(date: Date = new Date()) {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    calendar: "buddhist",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day, 12) : null;
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseWebBDate(value: string | Date) {
  if (value instanceof Date) return value;
  const dateOnly = parseDateInput(value);
  if (dateOnly) return dateOnly;
  const normalized = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?$/);
  if (normalized) return new Date(`${normalized[1]}T${normalized[2]}:${normalized[3] || "00"}+07:00`);
  return new Date(value);
}

export function formatThaiDate(value: string | Date) {
  const date = parseWebBDate(value);
  if (Number.isNaN(date.getTime())) return value instanceof Date ? "—" : value;
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    calendar: "buddhist",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatThaiDateTimeValue(value: string | Date) {
  const date = parseWebBDate(value);
  if (Number.isNaN(date.getTime())) return value instanceof Date ? "—" : value;
  return formatThaiDateTime(date);
}
