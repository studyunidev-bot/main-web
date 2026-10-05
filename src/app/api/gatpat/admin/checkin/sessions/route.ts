import { NextResponse } from "next/server";
import { ExamRound } from "@prisma/client";
import { z } from "zod";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

const schema = z.object({ name: z.string().trim().max(100).optional(), examRound: z.nativeEnum(ExamRound), examLocationId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const principal = await requireGatpatPrincipal(["STAFF", "ADMIN", "SUPERADMIN"]);
    const body = schema.parse(await request.json());
    const location = await gatpatPrisma.examLocation.findFirst({ where: { id: body.examLocationId, siteId: principal.siteId, active: true }, select: { id: true } });
    if (!location) return NextResponse.json({ message: "ไม่พบสนามสอบที่เปิดใช้งาน" }, { status: 400 });
    const academicYear = new Date().getFullYear() + 543;
    const name = body.name || `Session ${academicYear} ${body.examRound}`;
    const [, session] = await gatpatPrisma.$transaction([
      gatpatPrisma.checkInSession.updateMany({
        where: { siteId: principal.siteId, createdById: principal.userId, isActive: true },
        data: { isActive: false, endedAt: new Date() },
      }),
      gatpatPrisma.checkInSession.create({
        data: { siteId: principal.siteId, name, academicYear, examRound: body.examRound, examLocationId: location.id, createdById: principal.userId },
        include: { examLocation: { select: { id: true, name: true, province: true } } },
      }),
    ]);
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return gatpatApiError(error);
  }
}
