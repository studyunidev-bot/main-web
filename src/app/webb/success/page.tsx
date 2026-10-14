import WebBFlow from "@/components/webb/WebBFlow";
export const metadata = { title: "ส่งคำตอบเรียบร้อย · Web B" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; set?: string; ref?: string; type?: string }>;
}) {
  const { product, set, ref, type } = await searchParams;
  return <WebBFlow mode="success" productId={product} examSet={set} purchaseRef={ref} examType={type === "trial" ? "trial" : "purchased"} />;
}
