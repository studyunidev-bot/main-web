"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AdminSelect from "@/components/ui/AdminSelect";

export const WebBAdminRoleContext = createContext("Super Admin");
const WebBAdminRoleSetterContext = createContext<(role: string) => void>(() => {});

export function WebBAdminRoleSelector() {
  const role = useContext(WebBAdminRoleContext);
  const setRole = useContext(WebBAdminRoleSetterContext);
  const roleLabels: Record<string, string> = {
    "Super Admin": "ผู้ดูแลระบบสูงสุด",
    Content: "ฝ่ายเนื้อหา",
    Support: "ฝ่ายสนับสนุน",
    Finance: "ฝ่ายการเงิน",
  };
  return (
    <label className="flex shrink-0 items-center gap-2 rounded-lg border border-stroke px-2.5 py-1.5 text-xs text-dark-6 dark:border-stroke-dark dark:text-dark-6">
      <span className="hidden sm:inline">จำลองบทบาท</span>
      <AdminSelect
        ariaLabel="จำลองบทบาทผู้ดูแล"
        value={role}
        options={Object.entries(roleLabels).map(([value, label]) => ({ value, label }))}
        onChange={(nextRole) => {
          setRole(nextRole);
          localStorage.setItem("webb-admin-demo-role", nextRole);
          window.dispatchEvent(new Event("webb-admin-demo-role-updated"));
          toast.info(`เปลี่ยนบทบาทผู้ดูแลเป็น ${roleLabels[nextRole] || nextRole}`);
        }}
        className="min-w-32 font-semibold"
      />
    </label>
  );
}

export default function WebBAdminAccess({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [role, setRole] = useState("Super Admin");
  useEffect(() => {
    setRole(localStorage.getItem("webb-admin-demo-role") || "Super Admin");
    if (localStorage.getItem("webb-admin-demo-auth") === "true") {
      setAllowed(true);
      return;
    }
    router.replace("/auth/sign-in?callbackUrl=%2Fwebb%2Fadmin%2Fdashboard");
  }, [router]);
  if (!allowed)
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-500">
        กำลังตรวจสอบบัญชี…
      </div>
    );
  return (
    <WebBAdminRoleContext.Provider value={role}>
      <WebBAdminRoleSetterContext.Provider value={setRole}>
        {children}
      </WebBAdminRoleSetterContext.Provider>
    </WebBAdminRoleContext.Provider>
  );
}
