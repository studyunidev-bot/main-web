import WebBFlow from "@/components/webb/WebBFlow";
export const metadata = { title: "กติกาการสอบ · Web B" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    product?: string;
    set?: string;
    ref?: string;
    type?: string;
    back?: string;
  }>;
}) {
  const { product, set, ref, type, back } = await searchParams;
  return (
    <WebBFlow
      mode="rules"
      productId={product}
      examSet={set || "A"}
      purchaseRef={ref}
      examType={type === "trial" ? "trial" : "purchased"}
      returnTo={back === "home" || back === "exam" ? back : "overview"}
    />
  );
}
