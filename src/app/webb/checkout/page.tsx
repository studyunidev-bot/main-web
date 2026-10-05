import WebBCheckout from "@/components/webb/WebBCheckout";
import { getProduct } from "@/components/webb/data";
export const metadata = { title: "ชำระเงินจำลอง · Web B" };
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product } = await searchParams;
  return <WebBCheckout product={getProduct(product)} />;
}
