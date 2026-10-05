import "@/css/style.css";
import { Prompt } from 'next/font/google';

const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-prompt',
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div lang="th" className={`${prompt.variable} ${prompt.className} min-h-screen bg-slate-50 dark:bg-boxdark-2 dark:text-bodydark`}>
      {children}
    </div>
  );
}
