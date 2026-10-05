import type { Metadata } from "next";
import SigninWithPassword from "@/components/Auth/SigninWithPassword";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl =
    params.callbackUrl?.startsWith("/gatpat/") ||
    params.callbackUrl?.startsWith("/webb/admin/")
      ? params.callbackUrl
      : "/gatpat/admin/dashboard";
  return <SigninWithPassword callbackUrl={callbackUrl} />;
}
