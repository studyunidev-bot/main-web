import { NextResponse } from "next/server";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { GATPATA_SITE_ID } from "@/server/gatpat/access";
import { portalIsOpen } from "@/server/gatpat/portal-security";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await gatpatPrisma.systemSetting.findUnique({
    where: { siteId_key: { siteId: GATPATA_SITE_ID, key: "GENERAL" } },
    select: {
      googleDriveLink: true,
      facebookLink: true,
      lineLink: true,
      studentSearchHeroBannerUrl: true,
      announcement: true,
      userPortalOpensAt: true,
      userPortalClosesAt: true,
    },
  });
  const isUserPortalOpen = await portalIsOpen();
  return NextResponse.json({
    isUserPortalOpen,
    googleDriveLink: settings?.googleDriveLink ?? "",
    facebookPageLink: settings?.facebookLink ?? "",
    lineOALink: settings?.lineLink ?? "",
    studentSearchHeroBannerUrl: settings?.studentSearchHeroBannerUrl ?? "",
    announcement: settings?.announcement ?? "",
    opensAt: settings?.userPortalOpensAt?.toISOString() ?? null,
    closesAt: settings?.userPortalClosesAt?.toISOString() ?? null,
    timezone: "Asia/Bangkok",
  });
}
