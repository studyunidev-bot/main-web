import { NextResponse } from "next/server";
import { z } from "zod";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

export const dynamic = "force-dynamic";

const schema = z.object({
  googleDriveLink: z.string().max(2000).optional(),
  facebookPageLink: z.string().max(2000).optional(),
  lineOALink: z.string().max(2000).optional(),
  isUserPortalOpen: z.boolean().optional(),
  isCheckInOpen: z.boolean().optional(),
  announcement: z.string().max(5000).nullable().optional(),
  userPortalOpensAt: z.string().datetime({ offset: true }).nullable().optional(),
  userPortalClosesAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export async function GET() {
  try {
    const principal = await requireGatpatPrincipal(["STAFF", "ADMIN", "SUPERADMIN"]);
    const settings = await gatpatPrisma.systemSetting.findUnique({ where: { siteId_key: { siteId: principal.siteId, key: "GENERAL" } } });
    return NextResponse.json(settings);
  } catch (error) {
    return gatpatApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const principal = await requireGatpatPrincipal(["STAFF", "ADMIN", "SUPERADMIN"]);
    const body = schema.parse(await request.json());
    const ownsSchedule = Object.hasOwn(body, "userPortalOpensAt") || Object.hasOwn(body, "userPortalClosesAt");
    if (ownsSchedule && principal.role !== "SUPERADMIN") {
      return NextResponse.json({ message: "เฉพาะ SUPERADMIN เท่านั้นที่เปลี่ยนเวลาเปิด-ปิด portal ได้" }, { status: 403 });
    }

    const current = await gatpatPrisma.systemSetting.findUnique({ where: { siteId_key: { siteId: principal.siteId, key: "GENERAL" } } });
    const opensAt = Object.hasOwn(body, "userPortalOpensAt") ? body.userPortalOpensAt : current?.userPortalOpensAt?.toISOString() ?? null;
    const closesAt = Object.hasOwn(body, "userPortalClosesAt") ? body.userPortalClosesAt : current?.userPortalClosesAt?.toISOString() ?? null;
    if (opensAt && closesAt && new Date(opensAt).getTime() >= new Date(closesAt).getTime()) {
      return NextResponse.json({ message: "เวลาเปิด portal ต้องอยู่ก่อนเวลาปิด" }, { status: 400 });
    }

    const updated = await gatpatPrisma.systemSetting.upsert({
      where: { siteId_key: { siteId: principal.siteId, key: "GENERAL" } },
      create: {
        siteId: principal.siteId,
        key: "GENERAL",
        googleDriveLink: body.googleDriveLink?.trim() || null,
        facebookLink: body.facebookPageLink?.trim() || null,
        lineLink: body.lineOALink?.trim() || null,
        isUserPortalOpen: body.isUserPortalOpen,
        isCheckInOpen: body.isCheckInOpen,
        announcement: body.announcement?.trim() || null,
        userPortalOpensAt: body.userPortalOpensAt ? new Date(body.userPortalOpensAt) : null,
        userPortalClosesAt: body.userPortalClosesAt ? new Date(body.userPortalClosesAt) : null,
        updatedById: principal.userId,
      },
      update: {
        googleDriveLink: body.googleDriveLink === undefined ? undefined : body.googleDriveLink.trim() || null,
        facebookLink: body.facebookPageLink === undefined ? undefined : body.facebookPageLink.trim() || null,
        lineLink: body.lineOALink === undefined ? undefined : body.lineOALink.trim() || null,
        isUserPortalOpen: body.isUserPortalOpen,
        isCheckInOpen: body.isCheckInOpen,
        announcement: body.announcement === undefined ? undefined : body.announcement?.trim() || null,
        userPortalOpensAt: body.userPortalOpensAt === undefined ? undefined : body.userPortalOpensAt ? new Date(body.userPortalOpensAt) : null,
        userPortalClosesAt: body.userPortalClosesAt === undefined ? undefined : body.userPortalClosesAt ? new Date(body.userPortalClosesAt) : null,
        updatedById: principal.userId,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return gatpatApiError(error);
  }
}
