import "@/css/public.css";
import type { ReactNode } from "react";
import { Sarabun } from "next/font/google";

const sarabun = Sarabun({ subsets: ["thai", "latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-sarabun" });

export default function GatpatLayout({ children }: { children: ReactNode }) {
  return <div className={`gatpat-public ${sarabun.className}`}>{children}</div>;
}
