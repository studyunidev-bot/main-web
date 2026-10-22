"use client";

import { Logo } from "@/components/logo";
import { cn, handleLogout } from "@/lib/utils";
import { LogOutIcon } from "@/components/Layouts/header/user-info/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { NAV_DATA } from "./data";
import { ArrowLeftIcon, ChevronUp } from "./icons";
import { MenuItem, MenuItemList } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";
import { DotIcon } from "@/assets/icons";
import { useSession } from "next-auth/react";
import { WebBAdminRoleContext } from "@/components/webb/WebBAdminAccess";
import { GoDot, GoDotFill } from "react-icons/go";
import {
  LuChartNoAxesCombined,
  LuClipboardCheck,
  LuLayoutDashboard,
  LuScrollText,
  LuSettings,
  LuShoppingCart,
  LuUsersRound,
} from "react-icons/lu";

export function Sidebar({ demoSite }: { demoSite?: "webb" }) {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const activeDemoRole = useContext(WebBAdminRoleContext);
  const [demoRolePermissions, setDemoRolePermissions] = useState<Record<string, Record<string, { view?: boolean }>>>({});

  const { data: session, status } = useSession();

  useEffect(() => {
    if (demoSite !== "webb") return;
    const refresh = () => {
      try {
        const saved = localStorage.getItem("webb-admin-demo:role-permissions");
        setDemoRolePermissions(saved ? JSON.parse(saved) : {});
      } catch {
        setDemoRolePermissions({});
      }
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("webb-admin-demo-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("webb-admin-demo-updated", refresh);
    };
  }, [demoSite]);

  useEffect(() => {
    const section =
      demoSite === "webb" ? "ระบบรับสมัคร Web B" : "ระบบสมัครสอบ Web A";
    if (
      pathname.startsWith("/gatpat/admin/") ||
      pathname.startsWith("/webb/admin/")
    ) {
      setExpandedItems((current) =>
        current.includes(section) ? current : [...current, section],
      );
    }
  }, [pathname, demoSite]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));

    // Uncomment the following line to enable multiple expanded items
    // setExpandedItems((prev) =>
    //   prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    // );
  };

  // const firstRender = useRef(true);

  // useEffect(() => {
  //   if (status !== "authenticated") return;

  //   if (!firstRender.current) return; // อัปเดตแค่ครั้งแรก
  //   firstRender.current = false;

  //   const userRole = Number(session?.user?.role_id);
  //   alert(userRole) // ได้ 2 แต่ เห็นของ ADMIN
  //   NAV_DATA.forEach((section) => {
  //     if (!section.roles.includes(userRole)) return;
  //     section.items.forEach((item) => {
  //       if (!expandedItems.includes(item.title)) {
  //         toggleExpanded(item.title);
  //       }
  //     });
  //   });
  // }, [pathname, session, status]);

  if (status !== "authenticated" && demoSite !== "webb") return null;

  const demoNav = [
    {
      label: "ข้อมูลพื้นฐาน",
      roles: [1],
      items: [
        {
          title: "ภาพรวม",
          icon: LuLayoutDashboard,
          url: "/webb/admin/dashboard",
          roles: ["DEMO"],
          items: [],
        },
        {
          title: "สมาชิก / ผู้เข้าสอบ",
          icon: LuUsersRound,
          url: "/webb/admin/students",
          roles: ["DEMO"],
          items: [],
        },
        {
          title: "Audit Log",
          icon: LuScrollText,
          url: "/webb/admin/audit",
          roles: ["DEMO"],
          items: [],
        },
        {
          title: "ตั้งค่าระบบ / ผู้ดูแล",
          icon: LuSettings,
          url: "/webb/admin/settings",
          roles: ["DEMO"],
          items: [],
        },
      ],
    },
    {
      label: "ข้อสอบ",
      roles: [1],
      items: [
        {
          title: "คลังและจัดการข้อสอบ",
          icon: LuClipboardCheck,
          url: "/webb/admin/exam-catalog",
          roles: ["DEMO"],
          items: [],
        },
      ],
    },
    {
      label: "การเงิน",
      roles: [1],
      items: [
        {
          title: "คำสั่งซื้อและชำระเงิน",
          icon: LuShoppingCart,
          url: "/webb/admin/orders",
          roles: ["DEMO"],
          items: [],
        },
        {
          title: "รายงานการเงิน",
          icon: LuChartNoAxesCombined,
          url: "/webb/admin/finance",
          roles: ["DEMO"],
          items: [],
        },
      ],
    },
  ];
  const userRole = demoSite === "webb" ? 1 : Number(session?.user?.role_id);
  const isLinkActive = (url: string) => {
    if (demoSite === "webb") {
      const baseUrl = url.split("#")[0];
      return (
        pathname === baseUrl ||
        (baseUrl === "/webb/admin/exam-catalog" &&
          pathname.startsWith(`${baseUrl}/`))
      );
    }
    return pathname.startsWith(url);
  };
  const canViewDemoMenu = (url: string) => {
    if (activeDemoRole === "Super Admin") return true;
    if (url.endsWith("/audit") || url.endsWith("/settings")) return false;
    if (url.endsWith("/exam-catalog")) {
      return ["exams", "students", "results"].some((resource) =>
        demoRolePermissions[activeDemoRole]?.[resource]?.view ??
        ({ Content: ["exams", "results"], Support: ["students"], Finance: [] }[activeDemoRole] || []).includes(resource),
      );
    }
    const resource = url.endsWith("/dashboard")
      ? "overview"
      : url.endsWith("/students") || url.endsWith("/entitlements") || url.endsWith("/approvals") || url.endsWith("/attempts")
        ? "students"
        : url.endsWith("/trial-exams") || url.endsWith("/real-exams") || url.endsWith("/products") || url.endsWith("/content") || url.endsWith("/solutions")
          ? "exams"
          : url.endsWith("/orders") || url.endsWith("/payments") || url.endsWith("/finance")
            ? "finance"
            : url.endsWith("/results")
              ? "results"
            : null;
    if (!resource) return false;
    const savedView = demoRolePermissions[activeDemoRole]?.[resource]?.view;
    if (savedView !== undefined) return savedView;
    const defaults: Record<string, string[]> = {
      Content: ["overview", "exams", "results"],
      Support: ["overview", "students"],
      Finance: ["overview", "finance"],
    };
    return defaults[activeDemoRole]?.includes(resource) ?? false;
  };

  // กรองเมนูตาม role
  const filteredNav = (demoSite === "webb" ? demoNav : NAV_DATA)
    .filter((section) => section.roles.includes(userRole))
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          !item.roles ||
          item.roles.includes(
            demoSite === "webb" ? "DEMO" : String(session?.user?.role ?? ""),
        ) && (demoSite !== "webb" || canViewDemoMenu(item.url || "")),
      ),
    }))
    .filter((section) => section.items.length > 0);

  // ใน UseEffect อย่าลบ *******************************************
  // NAV_DATA.some((section) => {
  //   return section.items.some((item) => {
  //     return item.items.some((subItem) => {
  //       // if (subItem.url === pathname) {
  //       //   if (!expandedItems.includes(item.title)) {
  //       //     toggleExpanded(item.title);
  //       //   }

  //       //   // Break the loop
  //       //   return true;
  //       // }
  //     });
  //   });
  // });

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "max-w-[270px] shrink-0 overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-300 ease-linear dark:border-gray-800 dark:bg-gray-dark",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isOpen ? "w-full" : "w-0",
        )}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex h-full flex-col py-6 pl-[25px] pr-[7px]">
          <div className="relative pr-4.5">
            <Link
              href={demoSite === "webb" ? "/webb" : "/"}
              onClick={() => isMobile && toggleSidebar()}
              className="px-0 py-2.5 min-[850px]:py-0 text-lg text-dark-2 dark:text-dark-8"
            >
              {demoSite === "webb"
                ? "ระบบจัดการ Web B"
                : "ระบบจัดการหลังบ้าน"}
            </Link>

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
              >
                <span className="sr-only">Close Menu</span>

                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-5">
            {filteredNav.map((section) => (
              <div key={section.label} className="mb-6">
                <h2 className="mb-2 text-sm font-medium text-dark-6 dark:text-dark-5">
                  {section.label}
                </h2>

                <nav role="navigation" aria-label={section.label}>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.title}>
                        {item.items.length ? (
                          <div>
                            <MenuItem
                              isActive={item.items.some(({ url }) =>
                                isLinkActive(url),
                              )}
                              onClick={() => toggleExpanded(item.title)}
                            >
                              <item.icon
                                className="size-6 shrink-0"
                                aria-hidden="true"
                              />

                              <span>{item.title} </span>

                              <ChevronUp
                                className={cn(
                                  "ml-auto rotate-180 transition-transform duration-200",
                                  expandedItems.includes(item.title) &&
                                    "rotate-0",
                                )}
                                aria-hidden="true"
                              />
                            </MenuItem>

                            {expandedItems.includes(item.title) && (
                              <ul
                                className="ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2"
                                role="menu"
                              >
                                {item.items.map((subItem) => (
                                  <li key={subItem.title} role="none">
                                    <MenuItemList
                                      as="link"
                                      href={subItem.url}
                                      // isActive={pathname === subItem.url}
                                      isActive={isLinkActive(subItem.url)}
                                      className="flex items-center gap-1"
                                    >
                                      {isLinkActive(subItem.url) ? (
                                        <GoDotFill className="text-primary" />
                                      ) : (
                                        <GoDot />
                                      )}
                                      <span>{subItem.title}</span>
                                    </MenuItemList>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          (() => {
                            const href = "url" in item ? item.url + "" : "/";
                            // item.title.toLowerCase().split(" ").join("-");

                            return (
                              <MenuItem
                                className="flex items-center gap-3 py-2.5"
                                as="link"
                                href={href}
                                isActive={
                                  href === "/admins" || href === "/"
                                    ? pathname === href
                                    : isLinkActive(href)
                                }
                              >
                                <item.icon
                                  className="size-6 shrink-0"
                                  aria-hidden="true"
                                />

                                <span>{item.title} </span>
                              </MenuItem>
                            );
                          })()
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}

            {/* Mobile-only menu items: ตั้งค่าบัญชีตัวเอง & ออกจากระบบ */}
            {isMobile && (
              <div className="mb-6 border-t border-gray-200 pt-6 dark:border-gray-800">
                <h2 className="mb-2 text-sm font-medium text-dark-6 dark:text-dark-5">
                  บัญชีผู้ใช้งาน
                </h2>
                <nav role="navigation" aria-label="บัญชีผู้ใช้งาน">
                  <ul className="space-y-2">
                    <li>
                      <MenuItem
                        as="button"
                        onClick={async () => {
                          toggleSidebar();
                          await handleLogout(session?.refreshToken ?? "");
                        }}
                        isActive={false}
                        className="flex items-center gap-3 py-2.5 w-full text-left"
                      >
                        <LogOutIcon
                          className="size-6 shrink-0"
                          aria-hidden="true"
                        />
                        <span>ออกจากระบบ</span>
                      </MenuItem>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
