import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Prompt } from "next/font/google";
import "@/css/public.css";

const prompt = Prompt({ subsets: ["thai", "latin"], weight: ["400", "700"] });

export const metadata: Metadata = { title: "หน้าหลัก" };

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className={prompt.className}>{children}</div>;
}
