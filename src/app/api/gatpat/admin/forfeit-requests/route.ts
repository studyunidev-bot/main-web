import { NextResponse } from "next/server";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const principal = await requireGatpatPrincipal(["STAFF", "ADMIN", "SUPERADMIN"]);
    const rows = await gatpatPrisma.forfeitRequest.findMany({
      where: { siteId: principal.siteId },
      include: { enrollment: { include: { student: true, examLocation: true } } },
      orderBy: { submittedAt: "desc" },
    });
    return NextResponse.json(rows.map((row) => ({
      id: row.id,
      enrollmentId: row.enrollmentId,
      status: row.status,
      reason: row.reason,
      fullName: row.fullName,
      address: row.address,
      phone: row.phone,
      submittedAt: row.submittedAt,
      processedAt: row.processedAt,
      academicYear: row.enrollment.academicYear,
      examRound: row.enrollment.examRound,
      barcode: row.enrollment.barcode,
      sourceType: row.enrollment.sourceType,
      nationalId: row.enrollment.student.nationalId,
      studentName: `${row.enrollment.student.firstNameTh} ${row.enrollment.student.lastNameTh}`.trim(),
      location: row.enrollment.examLocation?.name ?? "",
      province: row.enrollment.examLocation?.province ?? "",
    })));
  } catch (error) {
    return gatpatApiError(error);
  }
}
