import "server-only";
import type { AuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { gatpatPrisma } from "@/server/gatpat/prisma";

const scrypt = promisify(scryptCallback);

async function verifyPassword(password: string, storedHash: string) {
  const [salt, hash, extra] = storedHash.split(":");
  if (salt && hash && !extra && /^[a-f0-9]{128}$/i.test(hash)) {
    const expected = Buffer.from(hash, "hex");
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
  try {
    return await compare(password, storedHash);
  } catch {
    return false;
  }
}

function roleId(role: string) {
  if (role === "SUPERADMIN" || role === "ADMIN") return 1;
  if (role === "VIEWER") return 3;
  return 2;
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Staff account",
      credentials: {
        email: { label: "อีเมล", type: "email" },
        password: { label: "รหัสผ่าน", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await gatpatPrisma.user.findFirst({
          where: {
            email,
            isActive: true,
            deletedAt: null,
            memberships: { some: { isActive: true, site: { key: "gatpat-a", isActive: true } } },
          },
          include: {
            memberships: {
              where: { isActive: true, site: { key: "gatpat-a", isActive: true } },
              take: 1,
              select: { role: true, site: { select: { key: true } } },
            },
          },
        });

        if (!user?.memberships[0] || !(await verifyPassword(password, user.password))) return null;
        const role = user.memberships[0].role;
        if (role === "USER") return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName ?? user.email,
          role,
          role_id: roleId(role),
          siteKey: user.memberships[0].site.key,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.role_id = user.role_id;
        token.siteKey = user.siteKey;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.role = String(token.role ?? "USER");
        session.user.role_id = Number(token.role_id ?? 0);
        session.user.siteKey = String(token.siteKey ?? "");
      }
      return session;
    },
  },
  pages: { signIn: "/auth/sign-in" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
};

export async function getAppSession() {
  return getServerSession(authOptions);
}

export async function requireAdminSession() {
  const session = await getAppSession();
  if (!session?.user?.id || !["STAFF", "CHECKIN", "VIEWER", "ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireSuperAdminSession() {
  const session = await getAppSession();
  if (!session?.user?.id || session.user.role !== "SUPERADMIN") throw new Error("FORBIDDEN");
  return session;
}
