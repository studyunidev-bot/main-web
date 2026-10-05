import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { NextResponse } from "next/server";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

export const runtime = "nodejs";

const formats = {
  "image/jpeg": { ext: ".jpg", allowed: [".jpg", ".jpeg"], matches: (bytes: Buffer) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { ext: ".png", allowed: [".png"], matches: (bytes: Buffer) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  "image/webp": { ext: ".webp", allowed: [".webp"], matches: (bytes: Buffer) => bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" },
};

export async function POST(request: Request) {
  try {
    const principal = await requireGatpatPrincipal(["STAFF", "ADMIN", "SUPERADMIN"]);
    const form = await request.formData();
    const target = form.get("target");
    const file = form.get("banner");
    if (target !== "student-search" && target !== "student-exam") return NextResponse.json({ message: "target ไม่ถูกต้อง" }, { status: 400 });
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ message: "กรุณาเลือกไฟล์ภาพ" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ message: "ไฟล์ภาพต้องไม่เกิน 5 MB" }, { status: 413 });
    const format = formats[file.type as keyof typeof formats];
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!format || !format.matches(bytes) || !format.allowed.includes(extname(file.name).toLowerCase())) {
      return NextResponse.json({ message: "รองรับเฉพาะไฟล์ JPEG, PNG หรือ WEBP ที่ชนิดไฟล์ตรงกับเนื้อหา" }, { status: 415 });
    }
    const filename = `${randomUUID()}${format.ext}`;
    const root = process.env.GATPATA_UPLOAD_DIR || join(process.cwd(), ".data", "uploads", "gatpat", "banners");
    await mkdir(root, { recursive: true, mode: 0o750 });
    await writeFile(join(root, filename), bytes, { flag: "wx", mode: 0o640 });
    const url = `/api/gatpat/assets/${filename}`;
    await gatpatPrisma.systemSetting.upsert({
      where: { siteId_key: { siteId: principal.siteId, key: "GENERAL" } },
      create: { siteId: principal.siteId, key: "GENERAL", [target === "student-search" ? "studentSearchHeroBannerUrl" : "studentExamHeroBannerUrl"]: url, updatedById: principal.userId },
      update: { [target === "student-search" ? "studentSearchHeroBannerUrl" : "studentExamHeroBannerUrl"]: url, updatedById: principal.userId },
    });
    return NextResponse.json({ success: true, url }, { status: 201 });
  } catch (error) {
    return gatpatApiError(error);
  }
}
