import Link from "next/link";
import { formatBaht, WEBB_PRODUCTS, type ExamProduct } from "./data";
import { WebBImage } from "./WebBImage";

function ProductCard({
  product,
  featured,
}: {
  product: ExamProduct;
  featured: boolean;
}) {
  return (
    <article className={`webb-product-card ${featured ? "is-featured" : ""}`}>
      <div
        className="webb-product-top"
        style={{
          background: `linear-gradient(120deg, ${product.color}, #211c52)`,
        }}
      >
        <span>{product.name}</span>
        <div className="webb-product-art">
          <WebBImage
            className="webb-cover-image"
            alt="ภาพ Mockup สำหรับชุดฝึกสอบ"
          />
        </div>
      </div>
      <div className="webb-product-body">
        <span className="webb-product-label">ชุดฝึกสอบ TGAT</span>
        <h3>{product.name}</h3>
        <p>{product.parts}</p>
        <div className="webb-product-bottom">
          <b>เริ่ม {formatBaht(product.price)}</b>
          <Link
            href={`/webb/checkout?product=${product.id}`}
            aria-label={`เลือกซื้อ ${product.name}`}
          >
            เลือกชุด 
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function WebBProductCatalog() {
  return (
    <div className="webb-product-grid">
      {WEBB_PRODUCTS.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          featured={index === 4}
        />
      ))}
    </div>
  );
}
