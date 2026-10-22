import WebBExamCatalog from "@/components/webb/WebBExamCatalog";

export default async function WebBExamCatalogSetPage({
  params,
}: {
  params: Promise<{ familyId: string; setId: string }>;
}) {
  const { familyId, setId } = await params;
  return <WebBExamCatalog focusFamilyId={familyId} focusSetId={setId} />;
}
