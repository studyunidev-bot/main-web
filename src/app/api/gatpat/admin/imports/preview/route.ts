import { createGatpatImportPreview } from "@/server/gatpat/import-route";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  return createGatpatImportPreview(request);
}
