import WebBFlow from "@/components/webb/WebBFlow";
export const metadata = { title: "หมดเวลาสอบ · Web B" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; reason?: string }>;
}) {
  const { product, reason } = await searchParams;
  return <WebBFlow mode="error" productId={product} interrupted={reason === "interrupted"} />;
}
