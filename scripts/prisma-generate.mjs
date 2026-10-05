import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const prismaCli = resolve("node_modules/prisma/build/index.js");

// Production-only installs may omit Prisma CLI. Vercel's build install includes
// devDependencies, so generate the client there before Next.js type-checks.
if (!existsSync(prismaCli)) {
  console.log("Skipping Prisma Client generation: Prisma CLI is not installed.");
  process.exit(0);
}

const env = {
  ...process.env,
  // Prisma 7's config requires a datasource URL even for client generation.
  // A local placeholder is enough; generation does not connect to the database.
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://user:password@localhost:5432/prisma_generate_only",
};

const result = spawnSync(process.execPath, [prismaCli, "generate"], {
  env,
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
