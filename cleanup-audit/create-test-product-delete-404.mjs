/**
 * Local-only gate test: create published product → expect 200 → delete → expect 404.
 * Does not touch production. Cleans up after itself.
 *
 * Usage (with next start already on BASE):
 *   node --env-file=.env cleanup-audit/create-test-product-delete-404.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = process.env.GATE_BASE_URL || "http://127.0.0.1:3010";
const SLUG = "qa-cms-product-delete-404";
const TITLE = "[TEST] Product Delete 404";

async function httpStatus(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  return res.status;
}

async function ensureClean() {
  const existing = await prisma.product.findUnique({ where: { slug: SLUG } });
  if (existing) {
    await prisma.product.delete({ where: { id: existing.id } });
  }
}

async function createPublished() {
  const product = await prisma.product.create({
    data: {
      slug: SLUG,
      status: "PUBLISHED",
      featured: false,
      translations: {
        create: [
          {
            locale: "th",
            name: TITLE,
            excerpt: "Local gate test product — delete after verify",
            description: "<p>Local gate test product</p>",
            metaTitle: TITLE,
            metaDescription: "Local gate test — not for production",
          },
        ],
      },
      variants: {
        create: [
          {
            sku: `QA-DEL-${Date.now()}`,
            color: "Default",
            size: "One",
            price: 100,
            stock: 1,
            prices: {
              create: [{ locale: "th", currency: "thb", price: 100 }],
            },
          },
        ],
      },
    },
  });
  return product;
}

async function main() {
  console.log("BASE", BASE);
  await ensureClean();

  const missingBefore = await httpStatus(`/th/product/${SLUG}`);
  console.log("missing_before", missingBefore);

  const created = await createPublished();
  console.log("created", created.id, created.slug);

  const published = await httpStatus(`/th/product/${SLUG}`);
  console.log("published", published);

  // Draft/unpublish via status (normal system behavior)
  await prisma.product.update({
    where: { id: created.id },
    data: { status: "DRAFT" },
  });
  const draft = await httpStatus(`/th/product/${SLUG}`);
  console.log("draft", draft);

  // Re-publish then hard delete (same as admin deleteProductAction DB effect)
  await prisma.product.update({
    where: { id: created.id },
    data: { status: "PUBLISHED" },
  });
  const republished = await httpStatus(`/th/product/${SLUG}`);
  console.log("republished", republished);

  await prisma.product.delete({ where: { id: created.id } });
  const afterDelete = await httpStatus(`/th/product/${SLUG}`);
  console.log("after_delete", afterDelete);

  const ok =
    missingBefore === 404 &&
    published === 200 &&
    draft === 404 &&
    republished === 200 &&
    afterDelete === 404;

  console.log(
    JSON.stringify(
      {
        ok,
        missingBefore,
        published,
        draft,
        republished,
        afterDelete,
      },
      null,
      2,
    ),
  );

  if (!ok) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await ensureClean().catch(() => {});
    await prisma.$disconnect();
  });
