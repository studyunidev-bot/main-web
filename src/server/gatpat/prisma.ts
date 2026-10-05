import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  gatpatPrisma?: PrismaClient;
  gatpatPool?: Pool;
};

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for Web A.");

  const pool = new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT ?? 30_000),
  });
  globalForPrisma.gatpatPool = pool;
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

function getClient() {
  const client = globalForPrisma.gatpatPrisma ?? createClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.gatpatPrisma = client;
  return client;
}

// Keep importing Web A server modules safe during builds that only deploy WebB.
// The database connection is created only when a handler actually uses Prisma.
export const gatpatPrisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
