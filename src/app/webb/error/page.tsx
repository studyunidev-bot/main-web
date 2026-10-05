import WebBFlow from "@/components/webb/WebBFlow";
export const metadata = { title: "หมดเวลาสอบ · Web B" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product } = await searchParams;
  return <WebBFlow mode="error" productId={product} />;
}
