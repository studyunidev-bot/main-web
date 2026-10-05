"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export default function WebBAdminAccess({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("webb-admin-demo-auth") === "true") {
      setAllowed(true);
      return;
    }
    router.replace("/auth/sign-in?callbackUrl=%2Fwebb%2Fadmin%2Fdashboard");
  }, [router]);
  if (!allowed)
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-500">
        กำลังตรวจสอบบัญชี Demo…
      </div>
    );
  return children;
}
