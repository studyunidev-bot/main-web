import { redirect } from "next/navigation";
import ApplicationsListClient from "./ApplicationsListClient";

export const dynamic = "force-dynamic";

export default async function StudentApplicationsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id = "" } = await searchParams;
  if (!id.trim()) redirect("/gatpat/student/search");
  return <ApplicationsListClient identifier={id.trim()} />;
}
