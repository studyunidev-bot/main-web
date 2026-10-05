import { NextResponse } from "next/server";
import { ForfeitRequestStatus, EnrollmentStatus } from "@prisma/client";
import { z } from "zod";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

const schema = z.object({ status: z.nativeEnum(ForfeitRequestStatus) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const principal = await requireGatpatPrincipal(["STAFF", "ADMIN", "SUPERADMIN"]);
    const { status } = schema.parse(await request.json());
    const { id } = await context.params;
    const existing = await gatpatPrisma.forfeitRequest.findFirst({ where: { id, siteId: principal.siteId }, select: { id: true, enrollmentId: true } });
    if (!existing) return NextResponse.json({ message: "ไม่พบคำขอสละสิทธิ์" }, { status: 404 });
    const now = new Date();
    await gatpatPrisma.$transaction(async (tx) => {
      await tx.forfeitRequest.update({ where: { id: existing.id }, data: { status, processedById: principal.userId, processedAt: status === ForfeitRequestStatus.COMPLETED ? now : undefined } });
      if (status === ForfeitRequestStatus.COMPLETED) {
        await tx.enrollment.updateMany({ where: { id: existing.enrollmentId, siteId: principal.siteId }, data: { status: EnrollmentStatus.CANCELLED } });
      }
    });
    return NextResponse.json({ success: true, id, status });
  } catch (error) {
    return gatpatApiError(error);
  }
}
