import "server-only";
import { randomUUID } from "node:crypto";
import { copyFile, mkdir, stat, unlink, writeFile } from "node:fs/promises";
import { basename, extname, join, relative } from "node:path";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { gatpatApiError, GATPATA_SITE_ID, requireGatpatPrincipal } from "@/server/gatpat/access";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { ImportsService } from "@/server/gatpat/imports.service";
import type { ImportMutationCapture } from "@/server/gatpat/scoped-prisma";

const maxFileSize = Math.max(8, Number(process.env.IMPORT_UPLOAD_MAX_FILE_MB ?? 64)) * 1024 * 1024;
const acceptedExtensions = new Set([".xlsx", ".csv"]);
const dataRoot = process.env.GATPATA_IMPORT_DIR || join(process.cwd(), ".data", "gatpat-imports");
const stagingRoot = join(dataRoot, "staging");
const archiveRoot = join(dataRoot, "archive");

type FieldName = "locations" | "onsite" | "simulated";
type Manifest = { field: FieldName; filename: string; originalname: string }[];

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value, (_key, nested) => typeof nested === "bigint" ? nested.toString() : nested)) as Prisma.InputJsonValue;
}

function summarizeChanges(rows: ImportMutationCapture["rows"]) {
  const counts: Record<string, number> = {};
  for (const row of rows) counts[`${row.modelName}:${row.action}`] = (counts[`${row.modelName}:${row.action}`] ?? 0) + 1;
  return { total: rows.length, counts };
}

function toImportRequest(
  year: number,
  onsiteRound: string,
  simulatedRound: string,
  examDate: string | undefined,
  uploadedById: string,
  files: Record<FieldName, Array<{ path: string; filename: string; originalname: string }> | undefined>,
) {
  return { academicYear: year, onsiteRound, simulatedRound, examDate, uploadedById, files };
}

export async function createGatpatImportPreview(request: Request) {
  const stagedPaths: string[] = [];
  let keepFiles = false;
  try {
    const principal = await requireGatpatPrincipal(["STAFF", "ADMIN", "SUPERADMIN"]);
    const form = await request.formData();
    const year = Number(form.get("academicYear"));
    if (!Number.isInteger(year) || year < 2500 || year > 2800) return NextResponse.json({ message: "เลือกปีการศึกษาเป็น พ.ศ. (เช่น 2569)" }, { status: 400 });

    const previewId = randomUUID();
    const manifest: Manifest = [];
    const files: Record<FieldName, Array<{ path: string; filename: string; originalname: string }> | undefined> = { locations: undefined, onsite: undefined, simulated: undefined };
    await mkdir(stagingRoot, { recursive: true, mode: 0o700 });

    for (const field of ["locations", "onsite", "simulated"] as const) {
      const entry = form.get(field);
      if (!(entry instanceof File) || entry.size === 0) continue;
      const extension = extname(entry.name).toLowerCase();
      if (!acceptedExtensions.has(extension)) return NextResponse.json({ message: `ไฟล์ ${field} ต้องเป็น .xlsx หรือ .csv` }, { status: 400 });
      if (entry.size > maxFileSize) return NextResponse.json({ message: `ไฟล์ ${field} มีขนาดเกินกำหนด` }, { status: 413 });
      const filename = `${previewId}-${field}${extension}`;
      const filepath = join(stagingRoot, filename);
      await writeFile(filepath, Buffer.from(await entry.arrayBuffer()), { mode: 0o600, flag: "wx" });
      stagedPaths.push(filepath);
      const originalname = basename(entry.name).slice(0, 180);
      manifest.push({ field, filename, originalname });
      files[field] = [{ path: filepath, filename, originalname }];
    }
    if (!manifest.length) return NextResponse.json({ message: "เลือกไฟล์นำเข้าอย่างน้อยหนึ่งไฟล์" }, { status: 400 });

    const input = toImportRequest(
      year,
      String(form.get("onsiteRound") ?? "MORNING"),
      String(form.get("simulatedRound") ?? "AFTERNOON"),
      String(form.get("examDate") ?? "") || undefined,
      principal.userId,
      files,
    );
    const capture: ImportMutationCapture = { rows: [] };
    const service = new ImportsService();
    const preview = await service.previewExcelFiles(input, true, capture);
    if (!preview.result) throw new Error("Preview did not produce a result");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await gatpatPrisma.$transaction(async (tx) => {
      await tx.importPreview.create({
        data: {
          id: previewId,
          siteId: principal.siteId,
          createdById: principal.userId,
          academicYear: year,
          fileManifest: { files: manifest, onsiteRound: input.onsiteRound, simulatedRound: input.simulatedRound, examDate: input.examDate ?? null } as unknown as Prisma.InputJsonValue,
          result: preview.result as unknown as Prisma.InputJsonValue,
          expiresAt,
          status: "READY",
        },
      });
      const rows = capture.rows.map((row, sequence) => ({
        siteId: principal.siteId,
        previewId,
        sequence,
        modelName: row.modelName,
        recordId: row.recordId,
        action: row.action,
        ...(row.beforeData == null ? {} : { beforeData: jsonValue(row.beforeData) }),
        ...(row.afterData == null ? {} : { afterData: jsonValue(row.afterData) }),
      }));
      for (let offset = 0; offset < rows.length; offset += 250) {
        await tx.importMutation.createMany({ data: rows.slice(offset, offset + 250) });
      }
    });
    keepFiles = true;
    return NextResponse.json({ previewId, expiresAt, result: preview.result, changes: summarizeChanges(capture.rows) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "BadRequestException") return NextResponse.json({ message: error.message }, { status: 400 });
    return gatpatApiError(error);
  } finally {
    if (!keepFiles) await Promise.all(stagedPaths.map((filepath) => unlink(filepath).catch(() => undefined)));
  }
}

export async function applyGatpatImportPreview(request: Request) {
  const previewIdHolder = { id: "" };
  try {
    const principal = await requireGatpatPrincipal(["STAFF", "ADMIN", "SUPERADMIN"]);
    const body = await request.json().catch(() => null);
    const previewId = typeof body?.previewId === "string" ? body.previewId : "";
    if (!/^[0-9a-f-]{36}$/i.test(previewId)) return NextResponse.json({ message: "รหัส Preview ไม่ถูกต้อง" }, { status: 400 });
    previewIdHolder.id = previewId;
    const preview = await gatpatPrisma.importPreview.findFirst({
      where: { id: previewId, siteId: principal.siteId, createdById: principal.userId, status: "READY" },
    });
    if (!preview) return NextResponse.json({ message: "ไม่พบ Preview ที่ยังใช้งานได้" }, { status: 404 });
    if (preview.expiresAt <= new Date()) {
      await gatpatPrisma.importPreview.update({ where: { id: preview.id }, data: { status: "EXPIRED" } });
      return NextResponse.json({ message: "Preview หมดอายุแล้ว กรุณาตรวจสอบไฟล์ใหม่" }, { status: 410 });
    }

    const claimed = await gatpatPrisma.importPreview.updateMany({ where: { id: preview.id, siteId: principal.siteId, status: "READY" }, data: { status: "APPLYING" } });
    if (!claimed.count) return NextResponse.json({ message: "Preview นี้กำลังถูกดำเนินการหรือถูกใช้แล้ว" }, { status: 409 });

    const manifestData = preview.fileManifest as unknown as { files: Manifest; onsiteRound?: string; simulatedRound?: string; examDate?: string | null };
    const manifest = manifestData.files;
    const files: Record<FieldName, Array<{ path: string; filename: string; originalname: string }> | undefined> = { locations: undefined, onsite: undefined, simulated: undefined };
    for (const item of manifest) {
      if (!/^[0-9a-f-]{36}-(locations|onsite|simulated)\.(xlsx|csv)$/i.test(item.filename) || !["locations", "onsite", "simulated"].includes(item.field)) {
        throw new Error("Stored import manifest is invalid");
      }
      const filepath = join(stagingRoot, item.filename);
      await stat(filepath);
      files[item.field] = [{ path: filepath, filename: item.filename, originalname: item.originalname }];
    }
    const input = toImportRequest(
      preview.academicYear,
      String(manifestData.onsiteRound ?? "MORNING"),
      String(manifestData.simulatedRound ?? "AFTERNOON"),
      manifestData.examDate ?? undefined,
      principal.userId,
      files,
    );
    const result = await new ImportsService().importExcelFiles(input, true);

    await mkdir(archiveRoot, { recursive: true, mode: 0o700 });
    const summaries: Array<[FieldName, any]> = [["locations", result.locations], ["onsite", result.onsite], ["simulated", result.simulated]];
    for (const [field, summary] of summaries) {
      if (!summary?.fileId || !files[field]?.[0]) continue;
      const source = files[field]![0];
      const destinationDir = join(archiveRoot, summary.fileId);
      await mkdir(destinationDir, { recursive: true, mode: 0o700 });
      const archivedName = `${randomUUID()}${extname(source.filename)}`;
      const archivedPath = join(destinationDir, archivedName);
      await copyFile(source.path, archivedPath);
      await gatpatPrisma.importFile.updateMany({ where: { id: summary.fileId, siteId: principal.siteId }, data: { fileName: relative(dataRoot, archivedPath) } });
    }
    await gatpatPrisma.importPreview.update({ where: { id: preview.id }, data: { status: "APPLIED", appliedAt: new Date() } });
    await Promise.all(manifest.map((file) => unlink(join(stagingRoot, file.filename)).catch(() => undefined)));
    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error) {
    if (previewIdHolder.id) {
      await gatpatPrisma.importPreview.updateMany({ where: { id: previewIdHolder.id, status: "APPLYING" }, data: { status: "FAILED" } }).catch(() => undefined);
    }
    if (error instanceof Error && error.name === "BadRequestException") return NextResponse.json({ message: error.message }, { status: 400 });
    return gatpatApiError(error);
  }
}
