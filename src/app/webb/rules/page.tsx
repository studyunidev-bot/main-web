import WebBFlow from "@/components/webb/WebBFlow";
export const metadata = { title: "กติกาการสอบ · Web B" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    product?: string;
    type?: string;
    back?: string;
  }>;
}) {
  const { product, type, back } = await searchParams;
  return (
    <WebBFlow
      mode="rules"
      productId={product}
      examType={type === "trial" ? "trial" : "purchased"}
      returnTo={back === "home" || back === "exam" ? back : "overview"}
    />
  );
}
