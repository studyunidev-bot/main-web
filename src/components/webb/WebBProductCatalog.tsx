"use client";

import { PublicShell } from "./PublicShell";
import WebBSubjectPurchaseFlow from "./WebBSubjectPurchaseFlow";

export default function WebBProductCatalog() {
  return (
    <PublicShell>
      <main className="wb-inner-page wb-products-purchase-page" style={{ minHeight: "80vh", background: "#fcfcfd" }}>
        <div className="webb-container wb-products-purchase-container" style={{ padding: "20px 16px" }}>
          <WebBSubjectPurchaseFlow isExistingUser={true} />
        </div>
      </main>
    </PublicShell>
  );
}

