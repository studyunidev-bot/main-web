import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { GATPATA_SITE_ID, gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const principal = await requireGatpatPrincipal(["STAFF", "ADMIN", "SUPERADMIN"]);
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get("page") || 1) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(params.get("pageSize") || 20) || 20));
    const yearText = params.get("academicYear");
    const academicYear = yearText && /^\d{4}$/.test(yearText) ? Number(yearText) : undefined;
    const q = params.get("q")?.trim();
    const source = params.get("source");
    const pendingLocationOnly = params.get("pendingLocationOnly") === "true";
    const sourceTypes = source === "ONSITE"
      ? ["ONSITE_EXCEL"]
      : source === "SIMULATED"
        ? ["SIMULATED_EXCEL"]
        : source === "BOTH"
          ? ["ONSITE_EXCEL", "SIMULATED_EXCEL"]
          : undefined;
    const baseEnrollmentWhere: Prisma.EnrollmentWhereInput = {
      siteId: principal.siteId,
      deletedAt: null,
      ...(academicYear ? { academicYear } : {}),
    };

    const enrollmentWhere: Prisma.EnrollmentWhereInput = {
      ...baseEnrollmentWhere,
      ...(sourceTypes ? { sourceType: { in: sourceTypes as Prisma.EnumEnrollmentSourceTypeFilter["in"] } } : {}),
      ...(pendingLocationOnly ? { examLocationId: null, notes: { contains: "pendingLocationCode:" } } : {}),
    };
    const where: Prisma.StudentWhereInput = {
      siteId: principal.siteId,
      deletedAt: null,
      ...(source === "BOTH" ? { AND: [
        { enrollments: { some: { ...baseEnrollmentWhere, sourceType: "ONSITE_EXCEL" } } },
        { enrollments: { some: { ...baseEnrollmentWhere, sourceType: "SIMULATED_EXCEL" } } },
      ], ...(pendingLocationOnly ? { enrollments: { some: { ...baseEnrollmentWhere, examLocationId: null, notes: { contains: "pendingLocationCode:" } } } } : {}) } : { enrollments: { some: enrollmentWhere } }),
      ...(q ? { OR: [
        { nationalId: { contains: q, mode: "insensitive" } },
        { firstNameTh: { contains: q, mode: "insensitive" } },
        { lastNameTh: { contains: q, mode: "insensitive" } },
        { firstNameEn: { contains: q, mode: "insensitive" } },
        { lastNameEn: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { schoolName: { contains: q, mode: "insensitive" } },
      ] } : {}),
    };
    const [items, total, totalStudents, onsiteCount, simulatedCount, bothCount, pendingLocationCount] = await Promise.all([
      gatpatPrisma.student.findMany({
        where,
        include: {
          enrollments: {
            where: enrollmentWhere,
            include: { examLocation: true },
            orderBy: [{ academicYear: "desc" }, { updatedAt: "desc" }],
          },
        },
        orderBy: [{ updatedAt: "desc" }, { lastNameTh: "asc" }, { firstNameTh: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      gatpatPrisma.student.count({ where }),
      gatpatPrisma.student.count({ where: { siteId: principal.siteId, deletedAt: null, enrollments: { some: { siteId: principal.siteId, deletedAt: null, ...(academicYear ? { academicYear } : {}) } } } }),
      gatpatPrisma.student.count({ where: { siteId: principal.siteId, deletedAt: null, enrollments: { some: { ...baseEnrollmentWhere, sourceType: "ONSITE_EXCEL" } } } }),
      gatpatPrisma.student.count({ where: { siteId: principal.siteId, deletedAt: null, enrollments: { some: { ...baseEnrollmentWhere, sourceType: "SIMULATED_EXCEL" } } } }),
      gatpatPrisma.student.count({ where: { siteId: principal.siteId, deletedAt: null, AND: [
        { enrollments: { some: { ...baseEnrollmentWhere, sourceType: "ONSITE_EXCEL" } } },
        { enrollments: { some: { ...baseEnrollmentWhere, sourceType: "SIMULATED_EXCEL" } } },
      ] } }),
      gatpatPrisma.student.count({ where: { siteId: principal.siteId, deletedAt: null, enrollments: { some: { ...baseEnrollmentWhere, examLocationId: null, notes: { contains: "pendingLocationCode:" } } } } }),
    ]);

    return NextResponse.json({
      items: items.map((student) => ({
        id: student.id,
        nationalId: student.nationalId,
        prefix: student.prefix,
        firstNameTh: student.firstNameTh,
        lastNameTh: student.lastNameTh,
        firstNameEn: student.firstNameEn,
        lastNameEn: student.lastNameEn,
        email: student.email,
        phone: student.phone,
        schoolName: student.schoolName,
        province: student.province,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        enrollmentCount: student.enrollments.length,
        enrollments: student.enrollments.map((item) => ({
          id: item.id,
          academicYear: item.academicYear,
          examRound: item.examRound,
          status: item.status,
          sourceType: item.sourceType,
          barcode: item.barcode,
          location: item.examLocation?.name ?? "",
        })),
      })),
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
      summary: { totalStudents, onsiteCount, simulatedCount, bothCount, pendingLocationCount },
    });
  } catch (error) {
    return gatpatApiError(error);
  }
}
