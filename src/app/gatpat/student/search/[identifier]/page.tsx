import { gatpatPrisma } from "@/server/gatpat/prisma";
import { GATPATA_SITE_ID } from "@/server/gatpat/access";
import { portalIsOpen } from "@/server/gatpat/portal-security";
import StudentSearchClient from "../StudentSearchClient";

export const dynamic = "force-dynamic";

export default async function StudentSearchByIdentifierPage({ params }: { params: Promise<{ identifier: string }> }) {
  const [{ identifier }, setting, isUserPortalOpen] = await Promise.all([
    params,
    gatpatPrisma.systemSetting.findUnique({ where: { siteId_key: { siteId: GATPATA_SITE_ID, key: "GENERAL" } }, select: { studentSearchHeroBannerUrl: true, lineLink: true, announcement: true } }),
    portalIsOpen(),
  ]);

  return <StudentSearchClient initialIdentifier={identifier} settings={{
    isUserPortalOpen,
    studentSearchHeroBannerUrl: setting?.studentSearchHeroBannerUrl ?? "",
    lineOALink: setting?.lineLink ?? "",
    announcement: setting?.announcement ?? "",
  }} />;
}
