/**
 * One-off local cleanup: confirmed demo/test shop rows only.
 * Product spider-man-backpack (asdasdas) + its orders/customer/carts.
 * Does not touch posts, portfolios, services, company, admin, analytics.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_SLUG = "spider-man-backpack";

async function main() {
  const product = await prisma.product.findUnique({
    where: { slug: DEMO_SLUG },
    include: { translations: true, variants: true },
  });

  if (!product) {
    console.log("No demo product found; nothing to delete.");
    return;
  }

  const names = product.translations.map((t) => `${t.locale}:${t.metaTitle || t.name}`);
  console.log("Deleting demo product", product.id, product.slug, names);

  await prisma.cartItem.deleteMany({ where: { productId: product.id } });
  await prisma.wishlistItem.deleteMany({ where: { productId: product.id } });
  await prisma.orderItem.deleteMany({ where: { productId: product.id } });

  const emptyOrders = await prisma.order.findMany({
    where: { items: { none: {} } },
    select: { id: true, email: true, orderNumber: true },
  });
  console.log("Deleting empty test orders", emptyOrders);
  await prisma.order.deleteMany({ where: { id: { in: emptyOrders.map((o) => o.id) } } });

  const testCustomers = await prisma.customer.findMany({
    where: { email: "naiiwolf00@gmail.com", orders: { none: {} } },
  });
  console.log("Deleting test customers", testCustomers.map((c) => ({ id: c.id, name: c.name, email: c.email })));
  await prisma.customer.deleteMany({ where: { id: { in: testCustomers.map((c) => c.id) } } });

  await prisma.cart.deleteMany({ where: { items: { none: {} } } });
  await prisma.wishlist.deleteMany({ where: { items: { none: {} } } });

  await prisma.product.delete({ where: { id: product.id } });
  console.log("Demo product tree deleted.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
