import { NextResponse } from "next/server";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { Role } from "@prisma/client";
import { z } from "zod";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

const scrypt = promisify(scryptCallback);
const schema = z.object({
  email: z.string().trim().email().max(254).optional(),
  fullName: z.string().trim().min(2).max(200).nullable().optional(),
  password: z.string().min(8).max(128).optional(),
  role: z.nativeEnum(Role).refine((role) => role !== Role.USER).optional(),
  isActive: z.boolean().optional(),
});

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const principal = await requireGatpatPrincipal(["ADMIN", "SUPERADMIN"]);
    const body = schema.parse(await request.json());
    const { id } = await context.params;
    const membership = await gatpatPrisma.siteMembership.findFirst({ where: { userId: id, siteId: principal.siteId }, include: { user: true } });
    if (!membership || membership.user.deletedAt) return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });
    if (principal.userId === id && (body.isActive === false || body.role !== undefined)) return NextResponse.json({ message: "ไม่สามารถปิดบัญชีหรือเปลี่ยน role ของตัวเองได้" }, { status: 403 });
    if (principal.role === "ADMIN" && (membership.role === Role.SUPERADMIN || body.role === Role.SUPERADMIN)) return NextResponse.json({ message: "ไม่มีสิทธิ์จัดการ SUPERADMIN" }, { status: 403 });
    if (membership.role === Role.SUPERADMIN && (body.isActive === false || body.role !== undefined)) {
      const activeSuperadmins = await gatpatPrisma.siteMembership.count({ where: { siteId: principal.siteId, isActive: true, role: Role.SUPERADMIN, user: { isActive: true, deletedAt: null } } });
      if (activeSuperadmins <= 1) return NextResponse.json({ message: "ต้องมี SUPERADMIN ที่ใช้งานได้อย่างน้อยหนึ่งบัญชี" }, { status: 409 });
    }
    const email = body.email?.toLowerCase();
    if (email && email !== membership.user.email) {
      const duplicate = await gatpatPrisma.user.findUnique({ where: { email }, select: { id: true } });
      if (duplicate) return NextResponse.json({ message: "อีเมลนี้มีบัญชีแล้ว" }, { status: 409 });
    }
    const updated = await gatpatPrisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          email,
          fullName: body.fullName === undefined ? undefined : body.fullName,
          password: body.password ? await hashPassword(body.password) : undefined,
        },
        select: { id: true, email: true, fullName: true, isActive: true, updatedAt: true },
      });
      if (body.role !== undefined || body.isActive !== undefined) {
        await tx.siteMembership.update({ where: { id: membership.id }, data: { role: body.role, isActive: body.isActive } });
      }
      return { ...user, role: body.role ?? membership.role, isActive: body.isActive ?? membership.isActive };
    });
    return NextResponse.json(updated);
  } catch (error) {
    return gatpatApiError(error);
  }
}
