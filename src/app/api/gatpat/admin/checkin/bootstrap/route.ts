import { NextResponse } from "next/server";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const principal = await requireGatpatPrincipal(["CHECKIN", "STAFF", "ADMIN", "SUPERADMIN"]);
    const [sessions, locations, settings] = await Promise.all([
      gatpatPrisma.checkInSession.findMany({
        where: { siteId: principal.siteId, createdById: principal.userId, isActive: true },
        include: { examLocation: { select: { id: true, name: true, province: true } } },
        orderBy: { startedAt: "desc" },
      }),
      gatpatPrisma.examLocation.findMany({ where: { siteId: principal.siteId, active: true }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true, province: true } }),
      gatpatPrisma.systemSetting.findUnique({ where: { siteId_key: { siteId: principal.siteId, key: "GENERAL" } }, select: { isCheckInOpen: true } }),
    ]);
    const sessionsWithRecent = await Promise.all(sessions.map(async (session) => {
      const [checkedInCount, recentCheckIns] = await Promise.all([
        gatpatPrisma.checkIn.count({ where: { siteId: principal.siteId, sessionId: session.id, status: "SUCCESS" } }),
        gatpatPrisma.checkIn.findMany({ where: { siteId: principal.siteId, sessionId: session.id, status: "SUCCESS" }, orderBy: { scannedAt: "desc" }, take: 10, include: { enrollment: { include: { student: { select: { firstNameTh: true, lastNameTh: true, nationalId: true } } } } } }),
      ]);
      return { ...session, checkedInCount, recentCheckIns: recentCheckIns.map((checkIn) => ({ id: checkIn.id, scannedAt: checkIn.scannedAt, barcode: checkIn.barcode, studentName: `${checkIn.enrollment.student.firstNameTh} ${checkIn.enrollment.student.lastNameTh}`.trim(), nationalId: checkIn.enrollment.student.nationalId })) };
    }));
    return NextResponse.json({ sessions: sessionsWithRecent, locations, isCheckInOpen: settings?.isCheckInOpen !== false });
  } catch (error) {
    return gatpatApiError(error);
  }
}
