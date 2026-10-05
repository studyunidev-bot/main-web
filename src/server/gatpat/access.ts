import "server-only";
import { getAppSession } from "@/server/auth-options";
import { gatpatPrisma } from "@/server/gatpat/prisma";

export const GATPATA_SITE_ID = "a0000000-0000-4000-8000-000000000001";
export const GATPATA_SITE_KEY = "gatpat-a";

export const GATPATA_ROLES = ["CHECKIN", "STAFF", "VIEWER", "ADMIN", "SUPERADMIN"] as const;
export type GatpatRole = (typeof GATPATA_ROLES)[number];

export class GatpatAccessError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403,
  ) {
    super(message);
  }
}

export async function requireGatpatPrincipal(allowedRoles: readonly string[] = GATPATA_ROLES) {
  const session = await getAppSession();
  const userId = session?.user?.id;
  if (!userId) throw new GatpatAccessError("กรุณาเข้าสู่ระบบ", 401);

  const membership = await gatpatPrisma.siteMembership.findFirst({
    where: {
      userId,
      isActive: true,
      role: { in: [...allowedRoles] as never[] },
      site: { key: GATPATA_SITE_KEY, isActive: true },
      user: { isActive: true, deletedAt: null },
    },
    select: { id: true, siteId: true, role: true, userId: true },
  });

  if (!membership) throw new GatpatAccessError("ไม่มีสิทธิ์ใช้งานเว็บ A", 403);
  return membership;
}

export function gatpatApiError(error: unknown) {
  if (error instanceof GatpatAccessError) {
    return Response.json({ message: error.message }, { status: error.status });
  }
  console.error("Web A API error", error);
  return Response.json({ message: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
}
