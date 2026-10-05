import * as Icons from "../icons";

export const NAV_DATA: Array<{
  label: string;
  roles: number[];
    items: Array<{
      title: string;
      icon: typeof Icons.HomeIcon;
      url?: string;
      roles?: string[];
    items: Array<{ title: string; url: string }>;
  }>;
}> = [
  {
    label: "ระบบสมัครสอบ Web A",
    roles: [1, 2, 3],
    items: [
      {
        title: "ภาพรวม",
        icon: Icons.FourCircle,
        url: "/gatpat/admin/dashboard",
        roles: ["VIEWER", "STAFF", "ADMIN", "SUPERADMIN"],
        items: [],
      },
      {
        title: "นักเรียน",
        icon: Icons.FourCircle,
        url: "/gatpat/admin/students",
        roles: ["STAFF", "ADMIN", "SUPERADMIN"],
        items: [],
      },
      {
        title: "ใบสมัครและสถานะ",
        icon: Icons.Table,
        url: "/gatpat/admin/enrollments",
        roles: ["STAFF", "ADMIN", "SUPERADMIN"],
        items: [],
      },
      {
        title: "นำเข้าข้อมูล Excel",
        icon: Icons.FourCircle,
        url: "/gatpat/admin/imports",
        roles: ["STAFF", "ADMIN", "SUPERADMIN"],
        items: [],
      },
      {
        title: "คำขอสละสิทธิ์",
        icon: Icons.FourCircle,
        url: "/gatpat/admin/forfeit-requests",
        roles: ["STAFF", "ADMIN", "SUPERADMIN"],
        items: [],
      },
      {
        title: "Check-in",
        icon: Icons.FourCircle,
        url: "/gatpat/admin/checkin",
        roles: ["CHECKIN", "STAFF", "ADMIN", "SUPERADMIN"],
        items: [],
      },
      {
        title: "ตั้งค่าระบบ",
        icon: Icons.FourCircle,
        url: "/gatpat/admin/settings",
        roles: ["STAFF", "ADMIN", "SUPERADMIN"],
        items: [],
      },
      {
        title: "ผู้ใช้งาน Web A",
        icon: Icons.FourCircle,
        url: "/gatpat/admin/users",
        roles: ["ADMIN", "SUPERADMIN"],
        items: [],
      },
      {
        title: "คู่มือการใช้งาน",
        icon: Icons.Calendar,
        url: "/gatpat/admin/manual",
        roles: ["CHECKIN", "VIEWER", "STAFF", "ADMIN", "SUPERADMIN"],
        items: [],
      },
    ],
  },
];
