import "@/css/public.css";
import "@/css/webb-home.css";
import type { ReactNode } from "react";
import { Sarabun } from "next/font/google";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
});

export default function WebBDemoLayout({ children }: { children: ReactNode }) {
  return (
    <div lang="th" className={`webb-demo ${sarabun.className}`}>
      {children}
    </div>
  );
}
