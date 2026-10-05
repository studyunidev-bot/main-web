import { NextResponse } from "next/server";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const principal = await requireGatpatPrincipal(["ADMIN", "SUPERADMIN"]);
    const { id } = await context.params;
    const student = await gatpatPrisma.student.findFirst({ where: { id, siteId: principal.siteId, deletedAt: null }, select: { id: true } });
    if (!student) return NextResponse.json({ message: "ไม่พบข้อมูลนักเรียน" }, { status: 404 });
    const now = new Date();
    await gatpatPrisma.$transaction([
      gatpatPrisma.enrollment.updateMany({ where: { siteId: principal.siteId, studentId: id, deletedAt: null }, data: { deletedAt: now } }),
      gatpatPrisma.student.update({ where: { id }, data: { deletedAt: now } }),
    ]);
    return NextResponse.json({ success: true, message: "ซ่อนข้อมูลนักเรียนแล้ว โดยเก็บประวัติและความสัมพันธ์เดิมไว้" });
  } catch (error) {
    return gatpatApiError(error);
  }
}
