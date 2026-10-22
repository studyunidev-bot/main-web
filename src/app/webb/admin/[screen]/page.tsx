import { notFound } from "next/navigation";
import WebBAdminDemo from "@/components/webb/WebBAdminDemo";
import WebBExamCatalog from "@/components/webb/WebBExamCatalog";

const screens = new Set([
  "orders",
  "students",
  "products",
  "trial-exams",
  "real-exams",
  "exam-management",
  "exam-catalog",
  "content",
  "payments",
  "entitlements",
  "attempts",
  "results",
  "solutions",
  "finance",
  "admins",
  "audit",
  "settings",
]);

export default async function WebBAdminScreenPage({
  params,
  searchParams,
}: {
  params: Promise<{ screen: string }>;
  searchParams: Promise<{ tab?: string; product?: string; family?: string }>;
}) {
  const { screen } = await params;
  if (!screens.has(screen)) notFound();
  if (screen === "exam-catalog") return <WebBExamCatalog />;
  const { tab, product, family } = await searchParams;
  if (screen === "exam-management") {
    const initialTab = ["overview", "content", "offers", "access", "activity", "results"].includes(tab || "")
      ? tab as "overview" | "content" | "offers" | "access" | "activity" | "results"
      : "overview";
    return <WebBExamCatalog focusFamilyId="tgat" focusSetId="tgat-a" initialTab={initialTab} initialProductId={product} />;
  }
  return <WebBAdminDemo activeScreen={screen} initialExamTab={tab} initialProductId={product} initialFamilyId={family} />;
}
