"use client";

import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import { useSession } from "next-auth/react";
import { WebBAdminRoleSelector } from "@/components/webb/WebBAdminAccess";

export function Header({ demoSite }: { demoSite?: "webb" }) {
  const { toggleSidebar } = useSidebarContext();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-1.5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10">
      <div className="flex items-center gap-3">
        <button
          id="webb-sidebar-toggle-btn"
          type="button"
          onClick={toggleSidebar}
          className="inline-flex items-center justify-center rounded-lg border border-stroke p-1.5 text-dark-6 transition-colors hover:bg-gray-2 hover:text-dark dark:border-stroke-dark dark:bg-[#020D1A] dark:text-dark-6 dark:hover:bg-[#FFFFFF1A]"
          title="เปิด/ปิดเมนูด้านข้าง"
          aria-label="Toggle Sidebar"
        >
          <MenuIcon />
        </button>
        {demoSite === "webb" ? (
          <p className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Web B · ผู้ดูแลระบบ
          </p>
        ) : session?.user.role_id ? (
          <p>
            {session?.user.role_id === 1
              ? "เจ้าของระบบ"
              : session?.user.role_id === 2
                ? "พนักงาน"
                : ""}
          </p>
        ) : (
          ""
        )}
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 min-[375px]:gap-4">
        <ThemeToggleSwitch />

        <div className="shrink-0">
          {demoSite === "webb" ? (
            <div className="flex items-center gap-2">
              <WebBAdminRoleSelector />
              <button
                type="button"
                onClick={() => {
                  window.localStorage.removeItem("webb-admin-demo-auth");
                  window.location.assign("/webb");
                }}
                className="rounded-lg border border-stroke px-3 py-2 text-xs font-semibold text-dark-6 hover:bg-gray-2"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <UserInfo />
          )}
        </div>
      </div>
    </header>
  );
}
