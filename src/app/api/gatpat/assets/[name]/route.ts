import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

const mimeTypes: Record<string, string> = { ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) return new NextResponse(null, { status: 404 });
  try {
    const root = process.env.GATPATA_UPLOAD_DIR || join(process.cwd(), ".data", "uploads", "gatpat", "banners");
    const bytes = await readFile(join(root, name));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "content-type": mimeTypes[name.slice(name.lastIndexOf("."))],
        "x-content-type-options": "nosniff",
        "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
