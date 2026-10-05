import "@/css/style.css";

import { Prompt } from 'next/font/google'
import { ToastContainer } from 'react-toastify';
import SessionProvider from "@/components/session-provider";

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Providers } from "@/components/providers";
import NextTopLoader from "nextjs-toploader";
import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import { requireAdminSession } from "@/server/auth-options";
import { ThemeProvider } from "@wrksz/themes/next";

const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-prompt',
});

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
    try {
      await requireAdminSession();
    } catch {
      redirect("/auth/sign-in?callbackUrl=/admins");
    }

    return (
        <div lang="th" className={`${prompt.variable} ${prompt.className}`}>
                <ToastContainer autoClose={2000} theme="colored" />
                <ThemeProvider defaultTheme="light" attribute="class">
                    <SessionProvider>
                        <Providers>
                            <NextTopLoader color="#5750F1" showSpinner={false} />
                            <div className="flex min-h-screen">
                                <Sidebar />
                                <div className="w-full min-w-0 bg-gray-2 dark:bg-[#020d1a]">
                                    <Header />
                                    <main className="isolate mx-auto w-full max-w-screen-2xl overflow-auto p-4 md:p-6 2xl:p-10">
                                        {children}
                                    </main>
                                </div>
                            </div>
                        </Providers>
                    </SessionProvider>
                </ThemeProvider>
        </div>
    )
}
