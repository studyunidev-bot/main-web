import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const mime: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  if (!/^banner-\d+-\d+\.(jpe?g|png|webp)$/.test(name)) return new NextResponse(null, { status: 404 });
  const root = process.env.GATPATA_UPLOAD_DIR || join(process.cwd(), ".data", "uploads", "gatpat", "banners");
  try {
    const bytes = await readFile(join(root, "legacy", name));
    return new NextResponse(new Uint8Array(bytes), { headers: { "content-type": mime[extname(name)], "x-content-type-options": "nosniff", "cache-control": "public, max-age=86400" } });
  } catch { return new NextResponse(null, { status: 404 }); }
}
