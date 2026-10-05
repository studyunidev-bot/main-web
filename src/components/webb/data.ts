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
];

export const WEBB_MOCK_IMAGE = "/images/webb/students-demo.png";
export const WEBB_DEMO_LABEL = "DO · ข้อมูลจำลองเพื่อสาธิตระบบ";

export function getProduct(id?: string | null) {
  return WEBB_PRODUCTS.find((product) => product.id === id) ?? WEBB_PRODUCTS[4];
}

export function formatBaht(value: number) {
  return (
    new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(value) +
    " บาท"
  );
}
