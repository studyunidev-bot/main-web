import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { gatpatApiError, requireGatpatPrincipal } from "@/server/gatpat/access";

const scrypt = promisify(scryptCallback);
const createSchema = z.object({
  email: z.string().trim().email().max(254),
  fullName: z.string().trim().min(2).max(200),
  password: z.string().min(8).max(128),
  role: z.nativeEnum(Role).refine((role) => role !== Role.USER),
});

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function GET() {
  try {
    const principal = await requireGatpatPrincipal(["ADMIN", "SUPERADMIN"]);
    const rows = await gatpatPrisma.siteMembership.findMany({
      where: { siteId: principal.siteId, user: { deletedAt: null } },
      include: { user: { select: { id: true, email: true, fullName: true, isActive: true, createdAt: true, updatedAt: true } } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(rows.map((row) => ({ ...row.user, role: row.role, isActive: row.isActive && row.user.isActive, membershipId: row.id })));
  } catch (error) {
    return gatpatApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const principal = await requireGatpatPrincipal(["ADMIN", "SUPERADMIN"]);
    const body = createSchema.parse(await request.json());
    if (principal.role === "ADMIN" && body.role === Role.SUPERADMIN) {
      return NextResponse.json({ message: "เฉพาะ SUPERADMIN เท่านั้นที่สร้าง SUPERADMIN ได้" }, { status: 403 });
    }
    const email = body.email.toLowerCase();
    const existing = await gatpatPrisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return NextResponse.json({ message: "อีเมลนี้มีบัญชีแล้ว" }, { status: 409 });
    const created = await gatpatPrisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, fullName: body.fullName, password: await hashPassword(body.password), role: body.role } });
      await tx.siteMembership.create({ data: { siteId: principal.siteId, userId: user.id, role: body.role } });
      return { id: user.id, email: user.email, fullName: user.fullName, isActive: user.isActive, role: body.role, createdAt: user.createdAt };
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return gatpatApiError(error);
  }
}
