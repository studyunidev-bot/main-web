import WebBExam from "@/components/webb/WebBExam";
import { getProduct } from "@/components/webb/data";
export const metadata = { title: "ห้องสอบจำลอง · Web B" };
export default async function ExamPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; type?: string }>;
}) {
  const { product, type } = await searchParams;
  return (
    <WebBExam
      product={getProduct(product)}
      examType={type === "trial" ? "trial" : "purchased"}
    />
  );
}
