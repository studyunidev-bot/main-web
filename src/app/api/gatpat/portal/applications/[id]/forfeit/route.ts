import { NextResponse } from "next/server";
import { z } from "zod";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { GATPATA_SITE_ID } from "@/server/gatpat/access";
import { getPortalStudentId, portalIsOpen } from "@/server/gatpat/portal-security";

export const runtime = "nodejs";

const schema = z.object({
  reason: z.string().trim().min(3).max(2000),
  fullName: z.string().trim().min(2).max(200),
  address: z.string().trim().min(5).max(1000),
  phone: z.string().trim().min(8).max(30),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await portalIsOpen())) return NextResponse.json({ message: "ขณะนี้ระบบปิดให้บริการ" }, { status: 403 });
  const studentId = await getPortalStudentId();
  if (!studentId) return NextResponse.json({ message: "กรุณาค้นหาข้อมูลก่อนส่งคำขอ" }, { status: 401 });
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "กรุณากรอกข้อมูลให้ครบและถูกต้อง" }, { status: 400 });
  }
  const { id } = await context.params;
  const enrollment = await gatpatPrisma.enrollment.findFirst({
    where: { id, studentId, siteId: GATPATA_SITE_ID, deletedAt: null, status: { in: ["REGISTERED", "PAID"] } },
    select: { id: true },
  });
  if (!enrollment) return NextResponse.json({ message: "ไม่พบใบสมัครที่สามารถสละสิทธิ์ได้" }, { status: 404 });

  try {
    await gatpatPrisma.forfeitRequest.create({
      data: { siteId: GATPATA_SITE_ID, enrollmentId: enrollment.id, ...body },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ message: "ใบสมัครนี้มีคำขอสละสิทธิ์แล้ว" }, { status: 409 });
    }
    throw error;
  }
  return NextResponse.json({ success: true, message: "ส่งคำขอสละสิทธิ์เรียบร้อยแล้ว" }, { status: 201 });
}
