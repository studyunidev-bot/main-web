import WebBRegistrationFlow from "@/components/webb/WebBRegistrationFlow";
export const metadata = { title: "สมัครสอบ · Study Unith" };
export default async function WebBRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step } = await searchParams;
  const initialStep = Number(step) || 1;
  return <WebBRegistrationFlow initialStep={initialStep} />;
}
