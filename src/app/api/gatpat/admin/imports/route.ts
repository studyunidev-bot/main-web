import { NextResponse } from "next/server";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const principal = await requireGatpatPrincipal(["STAFF", "ADMIN", "SUPERADMIN"]);
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get("page") || 1) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(params.get("pageSize") || 20) || 20));
    const where = { siteId: principal.siteId };
    const [items, total] = await Promise.all([
      gatpatPrisma.importFile.findMany({ where, orderBy: { uploadedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, originalName: true, sourceType: true, academicYear: true, uploadedAt: true, rowCount: true, successCount: true, failedCount: true, rolledBackAt: true } }),
      gatpatPrisma.importFile.count({ where }),
    ]);
    const details = await Promise.all(items.map(async (item) => ({
      ...item,
      changeCount: await gatpatPrisma.importMutation.count({ where: { siteId: principal.siteId, importFileId: item.id } }),
    })));
    return NextResponse.json({ items: details, meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
  } catch (error) {
    return gatpatApiError(error);
  }
}
