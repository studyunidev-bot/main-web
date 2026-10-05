import { randomBytes, scryptSync } from "node:crypto";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env", override: false });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const databaseUrl = new URL(connectionString);
if (!["localhost", "127.0.0.1", "::1"].includes(databaseUrl.hostname)) {
  throw new Error(
    "Refusing to create a demo superadmin outside a local database.",
  );
}

const email = "aaa@studyunith.local";
const siteKey = "gatpat-a";
const password = "aaa";
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
        `Site ${siteKey} does not exist; no account was created.`,
      );
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing)
      throw new Error(`Account ${email} already exists; no changes were made.`);
    await tx.user.create({
      data: {
        email,
        password: `${salt}:${hash}`,
        fullName: "Demo Admin",
        role: "SUPERADMIN",
        isActive: true,
        memberships: {
          create: { siteId: site.id, role: "SUPERADMIN", isActive: true },
        },
      },
    });
  });
  process.stdout.write("Created local demo admin account aaa / aaa.\n");
} finally {
  await prisma.$disconnect();
  await pool.end();
}
