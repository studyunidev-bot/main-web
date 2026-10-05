import { NextResponse } from "next/server";
import { z } from "zod";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { GATPATA_SITE_ID } from "@/server/gatpat/access";
import {
  consumePortalRateLimit,
  normalizeStudentIdentifier,
  portalIsOpen,
  setPortalSessionCookie,
} from "@/server/gatpat/portal-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ identifier: z.string().trim().min(4).max(32) });

export async function POST(request: Request) {
  if (!(await portalIsOpen())) {
    return NextResponse.json({ message: "ขณะนี้ระบบค้นหาปิดให้บริการ" }, { status: 403 });
  }

  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "กรุณากรอกรหัสผู้สมัครหรือเลขประจำตัวให้ถูกต้อง" }, { status: 400 });
  }

  const identifier = normalizeStudentIdentifier(parsed.identifier);
  if (!/^[\p{L}\p{N}-]+$/u.test(identifier)) {
    return NextResponse.json({ message: "รูปแบบรหัสไม่ถูกต้อง" }, { status: 400 });
  }
  if (!(await consumePortalRateLimit(request, identifier))) {
    return NextResponse.json({ message: "ค้นหาถี่เกินไป กรุณารอสักครู่แล้วลองใหม่" }, { status: 429 });
  }

  const student = await gatpatPrisma.student.findFirst({
    where: { siteId: GATPATA_SITE_ID, nationalId: { equals: identifier, mode: "insensitive" }, deletedAt: null },
    select: {
      id: true,
      nationalId: true,
      prefix: true,
      firstNameTh: true,
      lastNameTh: true,
      firstNameEn: true,
      lastNameEn: true,
      enrollments: {
        where: { siteId: GATPATA_SITE_ID, deletedAt: null },
        orderBy: [{ academicYear: "desc" }, { examRound: "asc" }],
        select: {
          id: true,
          academicYear: true,
          examRound: true,
          importedExamRoundLabel: true,
          status: true,
          sourceType: true,
          barcode: true,
          examLocation: { select: { name: true, province: true, address: true, eventDate: true } },
          registeredAt: true,
          registrationStartAt: true,
          createdAt: true,
          forfeitRequest: { select: { status: true, submittedAt: true } },
        },
      },
    },
  });

  if (!student) return NextResponse.json({ message: "ไม่พบข้อมูล" }, { status: 404 });

  const result = NextResponse.json({
    student: {
      id: student.id,
      name: `${student.prefix ?? ""}${student.firstNameTh} ${student.lastNameTh}`.trim(),
      firstName: student.firstNameTh,
      lastName: student.lastNameTh,
      firstNameEn: student.firstNameEn ?? "",
      lastNameEn: student.lastNameEn ?? "",
      maskedIdentifier: `•••••••••${student.nationalId.slice(-4)}`,
    },
    applications: student.enrollments.map((enrollment) => ({
      id: enrollment.id,
      eventName: enrollment.sourceType === "ONSITE_EXCEL" ? "กิจกรรมติวเก็งข้อสอบ" : "กิจกรรมสอบจำลองเสมือนจริง",
      academicYear: enrollment.academicYear,
      examRound: enrollment.importedExamRoundLabel || `รอบ${enrollment.examRound === "MORNING" ? "เช้า" : "บ่าย"}`,
      status: enrollment.status,
      sourceType: enrollment.sourceType,
      eventDate: (enrollment.examLocation?.eventDate ?? enrollment.registrationStartAt ?? enrollment.registeredAt ?? enrollment.createdAt).toISOString(),
      barcode: enrollment.barcode,
      location: enrollment.examLocation?.name ?? "ยังไม่ระบุสนามสอบ",
      province: enrollment.examLocation?.province ?? "",
      address: enrollment.examLocation?.address ?? "",
      forfeitRequest: enrollment.forfeitRequest
        ? { status: enrollment.forfeitRequest.status, submittedAt: enrollment.forfeitRequest.submittedAt }
        : null,
    })),
  });
  return setPortalSessionCookie(result, student.id);
}
