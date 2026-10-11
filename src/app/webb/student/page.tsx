import WebBStudentArea from "@/components/webb/WebBStudentArea";
export const metadata = { title: "ภาพรวมผู้เรียน · Web B" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; part?: string }>;
}) {
  const { view, part } = await searchParams;
  const validModes = [
    "student",
    "overview",
    "profile",
    "personal",
    "solutions",
    "results",
    "ranking",
    "exam",
    "detail",
    "subresults",
  ];
  const mode =
    view && validModes.includes(view)
      ? (view as any)
      : "student";
  return <WebBStudentArea mode={mode} initialPart={part} />;
}
