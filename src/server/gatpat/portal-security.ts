import "server-only";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { gatpatPrisma } from "@/server/gatpat/prisma";
import { GATPATA_SITE_ID } from "@/server/gatpat/access";

const COOKIE_NAME = "gatpat_portal_session";
const PORTAL_SESSION_SECONDS = 15 * 60;

function secret() {
  const value = process.env.PORTAL_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!value) throw new Error("A portal session secret must be configured.");
  return value;
}

export function normalizeStudentIdentifier(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, "").toUpperCase();
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issuePortalSession(studentId: string) {
  const payload = Buffer.from(JSON.stringify({ studentId, exp: Math.floor(Date.now() / 1000) + PORTAL_SESSION_SECONDS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export async function getPortalStudentId() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof decoded.studentId !== "string" || decoded.exp <= Math.floor(Date.now() / 1000)) return null;
    return decoded.studentId as string;
  } catch {
    return null;
  }
}

export function setPortalSessionCookie(response: Response, studentId: string) {
  const token = issuePortalSession(studentId);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/api/gatpat/portal; HttpOnly; SameSite=Strict; Max-Age=${PORTAL_SESSION_SECONDS}${secure}`,
  );
  return response;
}

export async function consumePortalRateLimit(request: Request, identifier: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const remote = request.headers.get("x-real-ip")?.trim() || forwardedFor || "unknown";
  const hash = (value: string) => createHash("sha256").update(`${secret()}|${value}`).digest("hex");
  const buckets = [
    { key: `ip:${hash(remote)}`, limit: 30, seconds: 60 },
    { key: `student:${hash(identifier)}`, limit: 8, seconds: 600 },
  ];

  for (const bucket of buckets) {
    const rows = await gatpatPrisma.$queryRaw<Array<{ hits: number }>>`
      INSERT INTO "RateLimitBucket" ("id", "siteId", "bucketKey", "hits", "windowEndsAt")
      VALUES (${randomUUID()}, ${GATPATA_SITE_ID}, ${bucket.key}, 1,
        CURRENT_TIMESTAMP + (${bucket.seconds} * INTERVAL '1 second'))
      ON CONFLICT ("siteId", "bucketKey")
      DO UPDATE SET
        "hits" = CASE WHEN "RateLimitBucket"."windowEndsAt" <= CURRENT_TIMESTAMP
          THEN 1 ELSE "RateLimitBucket"."hits" + 1 END,
        "windowEndsAt" = CASE WHEN "RateLimitBucket"."windowEndsAt" <= CURRENT_TIMESTAMP
          THEN CURRENT_TIMESTAMP + (${bucket.seconds} * INTERVAL '1 second')
          ELSE "RateLimitBucket"."windowEndsAt" END
      RETURNING "hits"
    `;
    if (rows[0]?.hits > bucket.limit) return false;
  }

  return true;
}

export async function portalIsOpen() {
  const settings = await gatpatPrisma.systemSetting.findUnique({
    where: { siteId_key: { siteId: GATPATA_SITE_ID, key: "GENERAL" } },
  });
  const now = Date.now();
  return Boolean(
    settings?.isUserPortalOpen !== false &&
      (!settings?.userPortalOpensAt || settings.userPortalOpensAt.getTime() <= now) &&
      (!settings?.userPortalClosesAt || settings.userPortalClosesAt.getTime() > now),
  );
}

export const portalCookieName = COOKIE_NAME;
