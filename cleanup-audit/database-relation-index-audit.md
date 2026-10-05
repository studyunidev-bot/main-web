# Relation / Index / Unique Audit

Live DB vs `prisma/schema.prisma`. No guessed indexes added.

## Relations

All FK relations in schema exist in MySQL. Cascades:

| Child | Parent | onDelete | Assessment |
| --- | --- | --- | --- |
| PostTranslation | Post | Cascade | Correct |
| PortfolioTranslation | Portfolio | Cascade | Correct |
| Product* children | Product / Category / Variant | Cascade or SetNull as coded | Correct |
| CartItem | Cart / Product / Variant | Cascade | Correct (deleting product wipes carts) |
| OrderItem.product/variant | Product / Variant | SetNull | Correct (order history survives) |
| Order.customer | Customer | SetNull | Correct |
| PaymentNotification.order | Order | SetNull | Correct |
| CustomerPasswordResetToken | Customer | Cascade | Correct |

No orphan relation tables. No extra join tables beyond `ProductCategoryLink`.

Missing FK (intentional current architecture, not dropped this round):

- `Post.category` string ↔ `BlogCategory.name` (no `categoryId`)
- `AdminUser.roleId` int flag, no Role model

Unsafe cascade: none found that would delete orders when a product is removed (OrderItem uses SetNull). Carts do cascade — acceptable for guest carts.

## Indexes

Schema indexes match live DB. Extra live indexes are MySQL-generated FK indexes (`CartItem_productId_fkey`, etc.). Prisma diff from schema → DB wants to create those names; they already exist. **Do not add indexes.**

Useful existing indexes: `slug` unique on Post/Portfolio/Service/Product/ProductCategory; `published+createdAt` on Post; `status+createdAt` on Product and Order.

No duplicate named indexes.

## Unique constraints / duplicate data

Checked on `db_tbm_local`:

- Post.slug, Portfolio.slug, Product.slug, Service.slug, ProductCategory.slug: no duplicates
- AdminUser.username/email unique
- Customer.email unique (1 row, test)
- Locale uniqueness on translation tables: `@@unique([parentId, locale])` present

BlogCategory.slug unique holds; one slug is Thai text `ตัวอย่างเว็บไซต์` (data quality, not a constraint failure).

ProductVariant.sku unique holds.
