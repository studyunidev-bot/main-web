"use client";

import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import { useSession } from "next-auth/react";

export function Header({ demoSite }: { demoSite?: "webb" }) {
  const { toggleSidebar } = useSidebarContext();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-1.5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10">
      <button
        onClick={toggleSidebar}
        className="rounded-lg border px-1.5 py-1 dark:border-stroke-dark dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A] lg:hidden"
      >
        <MenuIcon />
        <span className="sr-only">Toggle Sidebar</span>
      </button>
      {demoSite === "webb" ? (
        <p className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Web B · Demo
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

      <div className="flex flex-1 items-center justify-end gap-2 min-[375px]:gap-4">
        <ThemeToggleSwitch />

        <div className="shrink-0">
          {demoSite === "webb" ? (
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem("webb-admin-demo-auth");
                window.location.assign("/webb");
              }}
              className="rounded-lg border border-stroke px-3 py-2 text-xs font-semibold text-dark-6 hover:bg-gray-2"
            >
              ออกจาก Demo Admin
            </button>
          ) : (
            <UserInfo />
          )}
        </div>
      </div>
    </header>
  );
}
