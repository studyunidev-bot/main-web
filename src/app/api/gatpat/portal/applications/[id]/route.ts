import { NextResponse } from "next/server";
import { EnrollmentStatus } from "@prisma/client";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { GATPATA_SITE_ID } from "@/server/gatpat/access";
import { getPortalStudentId, portalIsOpen } from "@/server/gatpat/portal-security";

export const dynamic = "force-dynamic";

function atMinutes(day: Date, minutes: number) {
  const value = new Date(day);
  value.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return value;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await portalIsOpen())) return NextResponse.json({ message: "ขณะนี้ระบบค้นหาปิดให้บริการ" }, { status: 403 });
  const studentId = await getPortalStudentId();
  if (!studentId) return NextResponse.json({ message: "กรุณาค้นหาข้อมูลเพื่อยืนยันรายการก่อน" }, { status: 401 });
  const { id } = await context.params;

  const enrollment = await gatpatPrisma.enrollment.findFirst({
    where: { id, siteId: GATPATA_SITE_ID, studentId, deletedAt: null },
    include: {
      student: { select: { id: true, prefix: true, firstNameTh: true, lastNameTh: true, nationalId: true } },
      examLocation: true,
      score: true,
      forfeitRequest: { select: { id: true, status: true, submittedAt: true } },
    },
  });
  if (!enrollment) return NextResponse.json({ message: "ไม่พบข้อมูล" }, { status: 404 });

  const scoreWhere = {
    siteId: GATPATA_SITE_ID,
    academicYear: enrollment.academicYear,
    examRound: enrollment.examRound,
    sourceType: enrollment.sourceType,
    deletedAt: null,
    status: { in: [EnrollmentStatus.REGISTERED, EnrollmentStatus.PAID] },
    score: { isNot: null },
  };
  const [overallCount, locationCount, settings] = await Promise.all([
    gatpatPrisma.enrollment.count({ where: scoreWhere }),
    gatpatPrisma.enrollment.count({
      where: {
        ...scoreWhere,
        ...(enrollment.examLocation?.province
          ? { examLocation: { is: { province: enrollment.examLocation.province } } }
          : enrollment.examLocationId
            ? { examLocationId: enrollment.examLocationId }
            : { id: enrollment.id }),
      },
    }),
    gatpatPrisma.systemSetting.findUnique({
      where: { siteId_key: { siteId: GATPATA_SITE_ID, key: "GENERAL" } },
      select: { googleDriveLink: true, facebookLink: true, lineLink: true, studentExamHeroBannerUrl: true },
    }),
  ]);

  const sourceIsOnsite = enrollment.sourceType === "ONSITE_EXCEL";
  const eventDate = enrollment.examLocation?.eventDate ?? enrollment.registrationStartAt ?? enrollment.registeredAt ?? enrollment.createdAt;
  const startAt = enrollment.examLocation?.eventDate && enrollment.examLocation.eventStartMinutes != null
    ? atMinutes(enrollment.examLocation.eventDate, enrollment.examLocation.eventStartMinutes)
    : enrollment.registrationStartAt;
  const endAt = enrollment.examLocation?.eventDate && enrollment.examLocation.eventEndMinutes != null
    ? atMinutes(enrollment.examLocation.eventDate, enrollment.examLocation.eventEndMinutes)
    : enrollment.registrationEndAt;
  const timeLabel = startAt && endAt
    ? `${startAt.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", hour12: false })}-${endAt.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", hour12: false })} น.`
    : `${enrollment.examRound === "MORNING" ? "09:00-12:00" : "13:00-16:00"} น.`;

  const scoreRows = enrollment.score
    ? [
        ["TGAT ความถนัดทั่วไป", enrollment.score.tgat, enrollment.score.rankingOverall, enrollment.score.rankingLocation],
        ["TGAT 1 การสื่อสารภาษาอังกฤษ", enrollment.score.tgat1, enrollment.score.rankingOverallTgat1 ?? enrollment.score.rankingOverall, enrollment.score.rankingLocationTgat1 ?? enrollment.score.rankingLocation],
        ["TGAT 2 การคิดอย่างมีเหตุผล", enrollment.score.tgat2, enrollment.score.rankingOverallTgat2 ?? enrollment.score.rankingOverall, enrollment.score.rankingLocationTgat2 ?? enrollment.score.rankingLocation],
        ["TGAT 3 สมรรถนะการทำงาน", enrollment.score.tgat3, enrollment.score.rankingOverallTgat3 ?? enrollment.score.rankingOverall, enrollment.score.rankingLocationTgat3 ?? enrollment.score.rankingLocation],
      ].filter((row) => row[1] != null).map((row, index) => ({
        id: `${enrollment.score!.id}-${index}`,
        examName: row[0],
        studentScore: Number(row[1]),
        rankNationwide: row[2] ?? null,
        rankInVenue: row[3] ?? null,
        totalNationwide: overallCount,
        totalInVenue: locationCount,
        province: enrollment.examLocation?.province ?? "",
      }))
    : [];

  return NextResponse.json({
    student: {
      id: enrollment.student.id,
      name: `${enrollment.student.prefix ?? ""}${enrollment.student.firstNameTh} ${enrollment.student.lastNameTh}`.trim(),
      maskedIdentifier: `•••••••••${enrollment.student.nationalId.slice(-4)}`,
    },
    application: {
      id: enrollment.id,
      academicYear: enrollment.academicYear,
      examRound: enrollment.importedExamRoundLabel || `รอบ${enrollment.examRound === "MORNING" ? "เช้า" : "บ่าย"}`,
      status: enrollment.status,
      sourceType: enrollment.sourceType,
      barcode: enrollment.barcode,
      location: enrollment.examLocation?.name ?? "ยังไม่ระบุสนามสอบ",
      province: enrollment.examLocation?.province ?? "",
      address: enrollment.examLocation?.address ?? "",
      dressCode: "ชุดนักเรียน ชุดพละ หรือชุดสุภาพ",
      eventDate: eventDate.toISOString(),
      time: timeLabel,
      forfeitRequest: enrollment.forfeitRequest,
    },
    scores: scoreRows,
    schedule: sourceIsOnsite
      ? [
          { id: 1, time: "08.00 น. เป็นต้นไป", activity: "ลงทะเบียนเข้าร่วมกิจกรรม" },
          { id: 2, time: "09.00-12.00 น.", activity: "ติวเข้มวิชาการ TGAT1 การสื่อสารภาษาอังกฤษ" },
          { id: 3, time: "12.00-13.00 น.", activity: "พักรับประทานอาหาร" },
          { id: 4, time: "13.00-14.30 น.", activity: "ติวเข้มวิชาการ TGAT2 การคิดอย่างมีเหตุผล" },
          { id: 5, time: "14.30-16.00 น.", activity: "ติวเข้มวิชาการ TGAT3 สมรรถนะการทำงาน" },
        ]
      : [{ id: 1, time: timeLabel, activity: "เข้าห้องสอบ" }],
    settings: {
      googleDriveLink: settings?.googleDriveLink ?? "",
      facebookPageLink: settings?.facebookLink ?? "",
      lineOALink: settings?.lineLink ?? "",
      studentExamHeroBannerUrl: settings?.studentExamHeroBannerUrl ?? "",
    },
    scorePopulation: "จำนวนผู้สมัครที่ active และมีคะแนนในระบบ ณ เวลาที่เปิดดู",
  });
}
