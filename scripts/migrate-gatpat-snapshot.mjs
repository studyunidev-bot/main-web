import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const { Pool } = pg;
const projectDir = path.dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, "");
const sourceEnvFile = path.resolve(projectDir, "../demo-app-register-gat-pat-api/.env");
const sourceEnv = dotenv.parse(readFileSync(sourceEnvFile));
const sourceUrlText = sourceEnv.DATABASE_URL;

if (!sourceUrlText) throw new Error("Legacy DATABASE_URL is missing from the API .env file.");

const sourceUrl = new URL(sourceUrlText);
const targetName = "studyunith_gatpat_a_next";
const targetUrl = new URL(sourceUrlText);
targetUrl.pathname = `/${targetName}`;
const targetId = "a0000000-0000-4000-8000-000000000001";
const tables = [
  "User",
  "Student",
  "ImportFile",
  "ExamLocation",
  "Enrollment",
  "Score",
  "ForfeitRequest",
  "CheckInSession",
  "CheckIn",
  "SystemSetting",
];
const tenantTables = new Set(["Student", "ImportFile", "ExamLocation", "Enrollment", "SystemSetting"]);
const quoteIdent = (value) => `"${String(value).replaceAll('"', '""')}"`;
const adminUrl = new URL(sourceUrlText);
adminUrl.pathname = "/postgres";
const admin = new Pool({ connectionString: adminUrl.toString(), max: 1 });
const legacy = new Pool({ connectionString: sourceUrl.toString(), max: 4 });
let targetCreated = false;
let target;

async function copyTable(source, destination, table) {
  const columnInfo = await source.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  );
  const jsonColumns = new Set(
    columnInfo.rows
      .filter((column) => column.data_type === "json" || column.data_type === "jsonb")
      .map((column) => column.column_name),
  );
  const sourceResult = await source.query(`SELECT * FROM ${quoteIdent(table)}`);
  const rows = sourceResult.rows;
  if (!rows.length) return 0;

  const columns = [...Object.keys(rows[0]), ...(tenantTables.has(table) ? ["siteId"] : [])];
  const columnSql = columns.map(quoteIdent).join(", ");
  const valuesPerRow = columns.length;
  const batchSize = Math.max(1, Math.floor(60000 / valuesPerRow));

  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const values = [];
    const tuples = batch.map((row, rowIndex) => {
      const tuple = columns.map((column) => {
        const value = column === "siteId" ? targetId : row[column];
        values.push(value != null && jsonColumns.has(column) ? JSON.stringify(value) : value);
        return `$${values.length}`;
      });
      return `(${tuple.join(", ")})`;
    });
    await destination.query(
      `INSERT INTO ${quoteIdent(table)} (${columnSql}) VALUES ${tuples.join(", ")}`,
      values,
    );
  }
  return rows.length;
}

try {
  const existing = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [targetName]);
  if (existing.rowCount) {
    throw new Error(`Target database ${targetName} already exists; refusing to overwrite it.`);
  }
  await admin.query(`CREATE DATABASE ${quoteIdent(targetName)}`);
  targetCreated = true;
  target = new Pool({ connectionString: targetUrl.toString(), max: 4 });

  const initialMigration = readFileSync(
    path.join(projectDir, "prisma/migrations/202610050001_init/migration.sql"),
    "utf8",
  );
  await target.query(initialMigration);
  await target.query(
    `INSERT INTO "Site" ("id", "key", "name") VALUES ($1, 'gatpat-a', 'เว็บ A - ระบบสมัครสอบ GAT/PAT')`,
    [targetId],
  );

  const counts = {};
  await target.query("BEGIN");
  try {
    for (const table of tables) {
      try {
        counts[table] = await copyTable(legacy, target, table);
      } catch (error) {
        throw new Error(`Failed while copying table ${table}: ${error instanceof Error ? error.message : "unknown database error"}`);
      }
    }
    await target.query(
      `INSERT INTO "SiteMembership" ("id", "siteId", "userId", "role")
       SELECT $1 || '-' || md5("id"), $1, "id", "role" FROM "User"`,
      [targetId],
    );
    for (const table of ["Enrollment", "ImportFile", "CheckInSession"]) {
      const result = await target.query(
        `UPDATE ${quoteIdent(table)} SET "academicYear" = "academicYear" + 543
         WHERE "academicYear" IS NOT NULL AND "academicYear" < 2400`,
      );
      counts[`${table}_academicYear_converted`] = result.rowCount ?? 0;
    }
    await target.query("COMMIT");
  } catch (error) {
    await target.query("ROLLBACK");
    throw error;
  }

  const cli = path.join(projectDir, "node_modules/.bin/prisma");
  const cliEnv = { ...process.env, DATABASE_URL: targetUrl.toString() };
  execFileSync(cli, ["migrate", "resolve", "--applied", "202610050001_init"], {
    cwd: projectDir,
    env: cliEnv,
    stdio: "ignore",
  });
  execFileSync(cli, ["migrate", "deploy"], {
    cwd: projectDir,
    env: cliEnv,
    stdio: "ignore",
  });

  const envLocal = path.join(projectDir, ".env.local");
  if (existsSync(envLocal)) {
    throw new Error("Snapshot was migrated, but .env.local already exists; DATABASE_URL was not written.");
  }
  writeFileSync(envLocal, `DATABASE_URL=${targetUrl.toString()}\n`, { mode: 0o600, flag: "wx" });
  console.log(JSON.stringify({ targetDatabase: targetName, site: "gatpat-a", copiedRecordCounts: counts }, null, 2));
} catch (error) {
  if (target) await target.end().catch(() => {});
  if (targetCreated) {
    await admin.query(`DROP DATABASE IF EXISTS ${quoteIdent(targetName)}`).catch(() => {});
  }
  console.error(error instanceof Error ? error.message : "Snapshot migration failed.");
  process.exitCode = 1;
} finally {
  if (target) await target.end().catch(() => {});
  await legacy.end().catch(() => {});
  await admin.end().catch(() => {});
}
