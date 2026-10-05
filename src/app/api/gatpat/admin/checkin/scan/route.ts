import { NextResponse } from "next/server";
import { CheckInStatus, EnrollmentStatus } from "@prisma/client";
import { z } from "zod";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

const schema = z.object({ barcode: z.string().trim().regex(/^\d{8}$/), sessionId: z.string().min(1), deviceId: z.string().max(100).optional() });

export async function POST(request: Request) {
  try {
    const principal = await requireGatpatPrincipal(["CHECKIN", "STAFF", "ADMIN", "SUPERADMIN"]);
    const body = schema.parse(await request.json());
    const settings = await gatpatPrisma.systemSetting.findUnique({ where: { siteId_key: { siteId: principal.siteId, key: "GENERAL" } }, select: { isCheckInOpen: true } });
    if (settings?.isCheckInOpen === false) return NextResponse.json({ message: "ขณะนี้ระบบ check-in ปิดอยู่" }, { status: 403 });

    const session = await gatpatPrisma.checkInSession.findFirst({ where: { id: body.sessionId, siteId: principal.siteId, createdById: principal.userId, isActive: true } });
    if (!session || !session.examLocationId) return NextResponse.json({ message: "ไม่พบ session ที่เปิดและผูกกับสนามสอบ" }, { status: 404 });
    if (session.academicYear !== new Date().getFullYear() + 543) return NextResponse.json({ message: "session ไม่ใช่ปีการศึกษาปัจจุบัน" }, { status: 403 });

    const enrollment = await gatpatPrisma.enrollment.findFirst({
      where: { siteId: principal.siteId, barcode: body.barcode, deletedAt: null },
      include: { student: { select: { firstNameTh: true, lastNameTh: true, nationalId: true } }, examLocation: { select: { name: true, id: true, province: true } } },
    });
    if (!enrollment) return NextResponse.json({ message: "ไม่พบรหัสผู้เข้าสอบ" }, { status: 404 });
    if (enrollment.status !== EnrollmentStatus.REGISTERED && enrollment.status !== EnrollmentStatus.PAID) {
      return NextResponse.json({ message: "ใบสมัครถูกยกเลิกหรือยังไม่พร้อมเข้าสอบ" }, { status: 409 });
    }
    if (enrollment.academicYear !== session.academicYear || enrollment.examRound !== session.examRound || enrollment.examLocationId !== session.examLocationId) {
      return NextResponse.json({ message: "ใบสมัครไม่ตรงกับปี รอบ หรือสนามของ session นี้" }, { status: 409 });
    }
    const existing = await gatpatPrisma.checkIn.findFirst({ where: { siteId: principal.siteId, enrollmentId: enrollment.id, status: CheckInStatus.SUCCESS }, select: { id: true, scannedAt: true } });
    if (existing) return NextResponse.json({ message: "รายการนี้เช็คอินแล้ว", duplicate: true, checkedInAt: existing.scannedAt }, { status: 409 });

    const checkIn = await gatpatPrisma.checkIn.create({
      data: { siteId: principal.siteId, enrollmentId: enrollment.id, sessionId: session.id, barcode: body.barcode, status: CheckInStatus.SUCCESS, deviceId: body.deviceId, scannerUserId: principal.userId },
      select: { id: true, scannedAt: true },
    });
    return NextResponse.json({ success: true, duplicate: false, checkIn, studentName: `${enrollment.student.firstNameTh} ${enrollment.student.lastNameTh}`.trim(), nationalId: enrollment.student.nationalId, location: [enrollment.examLocation?.name, enrollment.examLocation?.province].filter(Boolean).join(" · ") }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ message: "รหัสนี้ถูกเช็คอินไปแล้ว", duplicate: true }, { status: 409 });
    }
    return gatpatApiError(error);
  }
}
