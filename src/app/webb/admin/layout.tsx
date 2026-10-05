import "@/css/style.css";
import { ToastContainer } from "react-toastify";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import SessionProvider from "@/components/session-provider";
import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import NextTopLoader from "nextjs-toploader";
import { ThemeProvider } from "@wrksz/themes/next";
import WebBAdminAccess from "@/components/webb/WebBAdminAccess";

export const metadata = { title: "ระบบรับสมัคร Web B · Demo Admin" };

export default function WebBAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div lang="th">
      <ToastContainer autoClose={2000} theme="colored" />
      <ThemeProvider defaultTheme="light" attribute="class">
        <SessionProvider>
          <Providers>
            <NextTopLoader color="#5750F1" showSpinner={false} />
            <WebBAdminAccess>
              <div className="flex min-h-screen">
                <Sidebar demoSite="webb" />
                <div className="w-full min-w-0 bg-gray-2 dark:bg-[#020d1a]">
                  <Header demoSite="webb" />
                  <main className="isolate mx-auto w-full max-w-screen-2xl overflow-auto p-4 md:p-6 2xl:p-10">
                    {children}
                  </main>
                </div>
              </div>
            </WebBAdminAccess>
          </Providers>
        </SessionProvider>
      </ThemeProvider>
    </div>
  );
}
