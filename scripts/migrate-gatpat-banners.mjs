import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, mkdir, readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const source = resolve(process.cwd(), "../demo-app-register-gat-pat-api/.tmp/public/settings-banners");
const targetRoot = process.env.GATPATA_UPLOAD_DIR || join(process.cwd(), ".data", "uploads", "gatpat", "banners");
const target = join(targetRoot, "legacy");
const names = (await readdir(source)).filter((name) => /^banner-\d+-\d+\.(jpe?g|png|webp)$/.test(name));
await mkdir(target, { recursive: true, mode: 0o750 });

let copied = 0;
for (const name of names) {
  const sourceFile = join(source, name);
  const targetFile = join(target, name);
  try {
    await copyFile(sourceFile, targetFile, constants.COPYFILE_EXCL);
    copied++;
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const [oldBytes, newBytes] = await Promise.all([readFile(sourceFile), readFile(targetFile)]);
    const checksum = (bytes) => createHash("sha256").update(bytes).digest("hex");
    if (checksum(oldBytes) !== checksum(newBytes)) throw new Error(`Existing migrated banner differs: ${name}`);
  }
}
console.log(`Legacy banners available in target: ${names.length}; newly copied: ${copied}`);
