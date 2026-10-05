import { NextResponse } from "next/server";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

const delegates: Record<string, string> = { student: "student", enrollment: "enrollment", score: "score", examLocation: "examLocation" };

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const principal = await requireGatpatPrincipal(["ADMIN", "SUPERADMIN"]);
    const { id } = await context.params;
    const file = await gatpatPrisma.importFile.findFirst({ where: { id, siteId: principal.siteId }, select: { id: true, rolledBackAt: true } });
    if (!file) return NextResponse.json({ message: "ไม่พบประวัติการนำเข้า" }, { status: 404 });
    if (file.rolledBackAt) return NextResponse.json({ message: "รายการนี้ย้อนกลับแล้ว" }, { status: 409 });
    const rows = await gatpatPrisma.importMutation.findMany({ where: { siteId: principal.siteId, importFileId: id }, orderBy: { sequence: "desc" } });
    if (!rows.length) return NextResponse.json({ message: "ไม่มี change journal จึงย้อนกลับอย่างปลอดภัยไม่ได้" }, { status: 409 });

    await gatpatPrisma.$transaction(async (tx) => {
      const latest = new Map<string, any>();
      for (const row of [...rows].reverse()) {
        const model = delegates[row.modelName];
        if (!model) throw new Error(`Unsupported rollback model: ${row.modelName}`);
        const snapshots = row.action === "BULK_UPDATE" ? (row.afterData as any[] ?? []) : row.recordId ? [{ ...(row.afterData as object ?? {}), id: row.recordId }] : [];
        for (const snapshot of snapshots) latest.set(`${model}:${snapshot.id}`, { model, snapshot });
      }
      for (const [key, value] of latest) {
        const current = await (tx as any)[value.model].findFirst({ where: { id: value.snapshot.id, siteId: principal.siteId }, select: { id: true, updatedAt: true } });
        const expected = value.snapshot.updatedAt ? new Date(value.snapshot.updatedAt).getTime() : null;
        if (!current || expected === null || current.updatedAt.getTime() !== expected) throw new Error(`IMPORT_ROLLBACK_CONFLICT:${key}`);
      }
      for (const row of rows) {
        const model = delegates[row.modelName];
        const delegate = (tx as any)[model];
        if (row.action === "CREATE") {
          if (row.recordId) await delegate.deleteMany({ where: { id: row.recordId, siteId: principal.siteId } });
        } else if (row.action === "UPDATE" && row.recordId && row.beforeData) {
          const { id: _id, siteId: _site, createdAt: _created, updatedAt: _updated, ...data } = row.beforeData as any;
          await delegate.updateMany({ where: { id: row.recordId, siteId: principal.siteId }, data });
        } else if (row.action === "BULK_UPDATE") {
          for (const before of [...((row.beforeData as any[]) ?? [])].reverse()) {
            const { id: recordId, siteId: _site, createdAt: _created, updatedAt: _updated, ...data } = before;
            await delegate.updateMany({ where: { id: recordId, siteId: principal.siteId }, data });
          }
        }
      }
      await tx.importFile.updateMany({ where: { id, siteId: principal.siteId }, data: { rolledBackAt: new Date(), rolledBackById: principal.userId } });
    }, { maxWait: 10_000, timeout: 120_000 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("IMPORT_ROLLBACK_CONFLICT:")) return NextResponse.json({ message: "ข้อมูลบางรายการถูกแก้ไขหลัง import จึงยกเลิกการย้อนกลับเพื่อป้องกันการทับข้อมูลปัจจุบัน" }, { status: 409 });
    return gatpatApiError(error);
  }
}
