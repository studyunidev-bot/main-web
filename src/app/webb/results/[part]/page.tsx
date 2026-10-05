import WebBResultDetail from "@/components/webb/WebBResultDetail";
export const metadata = { title: "วิเคราะห์ผลสอบรายพาร์ท · Web B" };
export default async function Page({
  params,
}: {
  params: Promise<{ part: string }>;
}) {
  const { part } = await params;
  return <WebBResultDetail part={part} />;
}
