import { randomBytes, scryptSync } from "node:crypto";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env", override: false });

const email = process.env.GATPATA_DEMO_EMAIL?.trim().toLowerCase();
const password = process.env.GATPATA_DEMO_PASSWORD;
const connectionString = process.env.DATABASE_URL;
const siteKey = "gatpat-a";

if (!email || !password || !connectionString) {
  throw new Error(
    "Set GATPATA_DEMO_EMAIL, GATPATA_DEMO_PASSWORD and DATABASE_URL in .env.local before running this script.",
  );
}
if (password.length < 16)
  throw new Error("GATPATA_DEMO_PASSWORD must contain at least 16 characters.");

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
const pool = new Pool({ connectionString, max: 2 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  await prisma.$transaction(async (tx) => {
    const site = await tx.site.findUnique({
      where: { key: siteKey },
      select: { id: true },
    });
    if (!site)
      throw new Error(
        "Web A site is missing. Provision Web A before creating its demo login.",
      );
    const existing = await tx.user.findUnique({
      where: { email },
      include: { memberships: { where: { siteId: site.id } } },
    });
    if (existing) {
      if (
        existing.memberships.some((membership) => membership.role !== "VIEWER")
      ) {
        throw new Error(
          "A user with this demo email already exists with a non-viewer role; no changes were made.",
        );
      }
      if (existing.memberships.length)
        throw new Error(
          "The Web A demo account already exists; no password or account changes were made.",
        );
      throw new Error(
        "This email is already assigned to another account; choose a new demo email.",
      );
    }
    await tx.user.create({
      data: {
        email,
        password: `${salt}:${hash}`,
        fullName: "Web A Demo",
        role: "VIEWER",
        isActive: true,
        memberships: {
          create: { siteId: site.id, role: "VIEWER", isActive: true },
        },
      },
    });
  });
  process.stdout.write("Created a read-only Web A demo user (VIEWER).\n");
} finally {
  await prisma.$disconnect();
  await pool.end();
}
