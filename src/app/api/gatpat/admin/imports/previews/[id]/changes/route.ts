import { NextResponse } from "next/server";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const principal = await requireGatpatPrincipal(["STAFF", "ADMIN", "SUPERADMIN"]);
    const { id } = await context.params;
    const preview = await gatpatPrisma.importPreview.findFirst({ where: { id, siteId: principal.siteId }, select: { id: true, createdById: true, status: true, expiresAt: true } });
    if (!preview || (preview.createdById !== principal.userId && principal.role !== "SUPERADMIN")) return NextResponse.json({ message: "ไม่พบ Preview" }, { status: 404 });
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get("page") || 1) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(params.get("pageSize") || 20) || 20));
    const where = { siteId: principal.siteId, previewId: id };
    const [items, total] = await Promise.all([
      gatpatPrisma.importMutation.findMany({ where, orderBy: [{ sequence: "asc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize }),
      gatpatPrisma.importMutation.count({ where }),
    ]);
    return NextResponse.json({ preview, items, meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
  } catch (error) {
    return gatpatApiError(error);
  }
}
