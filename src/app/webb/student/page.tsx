import WebBStudentArea from "@/components/webb/WebBStudentArea";
export const metadata = { title: "ภาพรวมผู้เรียน · Web B" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  return <WebBStudentArea mode={view === "profile" ? "profile" : "student"} />;
}
