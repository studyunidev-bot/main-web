import WebBExam from "@/components/webb/WebBExam";
import { getProduct } from "@/components/webb/data";
export const metadata = { title: "ห้องสอบจำลอง · Web B" };
export default async function ExamPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; set?: string; ref?: string; type?: string }>;
}) {
  const { product, set, ref, type } = await searchParams;
  return (
    <WebBExam
      product={getProduct(product)}
      examSet={set || "A"}
      purchaseRef={ref}
      examType={type === "trial" ? "trial" : "purchased"}
    />
  );
}
