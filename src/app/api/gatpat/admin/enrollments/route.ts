import { NextResponse } from "next/server";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const principal = await requireGatpatPrincipal(["STAFF", "ADMIN", "SUPERADMIN"]);
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get("page") || 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") || 25) || 25));
    const q = params.get("q")?.trim();
    const where = {
      siteId: principal.siteId,
      deletedAt: null,
      ...(params.get("academicYear") ? { academicYear: Number(params.get("academicYear")) } : {}),
      ...(params.get("status") ? { status: params.get("status") as "DRAFT" | "REGISTERED" | "PAID" | "CANCELLED" } : {}),
      ...(q ? { OR: [
        { barcode: { contains: q } },
        { student: { nationalId: { contains: q } } },
        { student: { firstNameTh: { contains: q, mode: "insensitive" as const } } },
        { student: { lastNameTh: { contains: q, mode: "insensitive" as const } } },
      ] } : {}),
    };
    const [items, total] = await Promise.all([gatpatPrisma.enrollment.findMany({
      where,
      include: { student: true, examLocation: true },
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }), gatpatPrisma.enrollment.count({ where })]);
    return NextResponse.json({ items: items.map((item) => ({
      id: item.id,
      academicYear: item.academicYear,
      examRound: item.importedExamRoundLabel || item.examRound,
      status: item.status,
      barcode: item.barcode,
      eventName: item.sourceType === "ONSITE_EXCEL" ? "ติวเก็งข้อสอบ (ON-SITE)" : "สอบจำลองเสมือนจริง",
      nationalId: item.student.nationalId,
      studentName: `${item.student.firstNameTh} ${item.student.lastNameTh}`.trim(),
      location: item.examLocation?.name ?? "",
      province: item.examLocation?.province ?? "",
      updatedAt: item.updatedAt,
    })), meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
  } catch (error) {
    return gatpatApiError(error);
  }
}
