import { NextResponse } from "next/server";
import { EnrollmentStatus } from "@prisma/client";
import { z } from "zod";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

const schema = z.object({ status: z.nativeEnum(EnrollmentStatus) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const principal = await requireGatpatPrincipal(["STAFF", "ADMIN", "SUPERADMIN"]);
    const body = schema.parse(await request.json());
    const { id } = await context.params;
    const result = await gatpatPrisma.enrollment.updateMany({
      where: { id, siteId: principal.siteId, deletedAt: null },
      data: { status: body.status },
    });
    if (!result.count) return NextResponse.json({ message: "ไม่พบใบสมัคร" }, { status: 404 });
    return NextResponse.json({ success: true, id, status: body.status });
  } catch (error) {
    return gatpatApiError(error);
  }
}
