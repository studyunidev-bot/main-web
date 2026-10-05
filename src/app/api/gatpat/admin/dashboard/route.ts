import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const principal = await requireGatpatPrincipal(["VIEWER", "STAFF", "ADMIN", "SUPERADMIN"]);
    const params = new URL(request.url).searchParams;
    const yearValue = Number(params.get("academicYear"));
    const academicYear = Number.isInteger(yearValue) && yearValue >= 2500 ? yearValue : new Date().getFullYear() + 543;
    const fromText = params.get("from");
    const toText = params.get("to");
    const locationId = params.get("locationId") || undefined;
    const sessionId = params.get("sessionId") || undefined;
    const from = fromText ? new Date(fromText) : undefined;
    const to = toText ? new Date(toText) : undefined;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime())) || (from && to && from > to)) {
      return NextResponse.json({ message: "ช่วงวันที่ไม่ถูกต้อง" }, { status: 400 });
    }

    if (locationId && !(await gatpatPrisma.examLocation.findFirst({ where: { id: locationId, siteId: principal.siteId }, select: { id: true } }))) {
      return NextResponse.json({ message: "ไม่พบสนามสอบ" }, { status: 404 });
    }
    if (sessionId && !(await gatpatPrisma.checkInSession.findFirst({ where: { id: sessionId, siteId: principal.siteId }, select: { id: true } }))) {
      return NextResponse.json({ message: "ไม่พบ session" }, { status: 404 });
    }
    const enrollmentScope = { siteId: principal.siteId, academicYear, deletedAt: null, ...(locationId ? { examLocationId: locationId } : {}) };
    const checkInScope: Prisma.CheckInWhereInput = {
      siteId: principal.siteId,
      status: "SUCCESS",
      ...(sessionId ? { sessionId } : {}),
      ...(from || to ? { scannedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      enrollment: { siteId: principal.siteId, academicYear, deletedAt: null, ...(locationId ? { examLocationId: locationId } : {}) },
    };
    const [totalEnrollments, checkedInCount, averageScore, activeSessions, hourlyRows, activeLocations, pendingForfeits] = await Promise.all([
      gatpatPrisma.enrollment.count({ where: enrollmentScope }),
      gatpatPrisma.checkIn.count({ where: checkInScope }),
      gatpatPrisma.score.aggregate({ where: { siteId: principal.siteId, enrollment: { siteId: principal.siteId, academicYear, deletedAt: null, ...(locationId ? { examLocationId: locationId } : {}) } }, _avg: { tgat: true } }),
      gatpatPrisma.checkInSession.findMany({ where: { siteId: principal.siteId, academicYear, isActive: true }, include: { examLocation: { select: { id: true, name: true, province: true } } }, orderBy: { startedAt: "desc" } }),
      gatpatPrisma.$queryRaw<Array<{ locationName: string; hour: Date; total: bigint }>>(Prisma.sql`
        SELECT COALESCE(l."name", 'Unassigned') AS "locationName",
               date_trunc('hour', c."scannedAt") AS "hour", COUNT(*)::bigint AS "total"
        FROM "CheckIn" c
        JOIN "Enrollment" e ON e."id" = c."enrollmentId" AND e."siteId" = c."siteId"
        LEFT JOIN "ExamLocation" l ON l."id" = e."examLocationId"
        WHERE c."siteId" = ${principal.siteId} AND c."status" = 'SUCCESS'
          AND e."academicYear" = ${academicYear} AND e."deletedAt" IS NULL
          ${locationId ? Prisma.sql`AND e."examLocationId" = ${locationId}` : Prisma.empty}
          ${sessionId ? Prisma.sql`AND c."sessionId" = ${sessionId}` : Prisma.empty}
          ${params.get("includeHistory") === "false" ? Prisma.sql`AND 1 = 0` : Prisma.empty}
          ${from ? Prisma.sql`AND c."scannedAt" >= ${from}` : Prisma.empty}
          ${to ? Prisma.sql`AND c."scannedAt" <= ${to}` : Prisma.empty}
        GROUP BY COALESCE(l."name", 'Unassigned'), date_trunc('hour', c."scannedAt")
        ORDER BY "hour" ASC
      `),
      gatpatPrisma.examLocation.count({ where: { siteId: principal.siteId, active: true } }),
      gatpatPrisma.forfeitRequest.count({ where: { siteId: principal.siteId, status: "PENDING", enrollment: { siteId: principal.siteId, academicYear, deletedAt: null } } }),
    ]);
    const venueTotals = new Map<string, number>();
    for (const row of hourlyRows) venueTotals.set(row.locationName, (venueTotals.get(row.locationName) ?? 0) + Number(row.total));
    const topLocations = [...venueTotals].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, total]) => ({ name, total }));

    return NextResponse.json({
      currentAcademicYear: academicYear,
      totalEnrollments,
      checkedInCount,
      notCheckedInCount: Math.max(totalEnrollments - checkedInCount, 0),
      averageTgat: averageScore._avg.tgat,
      activeSessions,
      hourlyCheckIns: hourlyRows.map((row) => ({ locationName: row.locationName, hour: row.hour, total: Number(row.total) })).slice(-24),
      topLocations,
      activeLocationCount: activeLocations,
      pendingForfeits,
    });
  } catch (error) {
    return gatpatApiError(error);
  }
}
