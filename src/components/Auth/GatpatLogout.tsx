"use client";

import { signOut } from "next-auth/react";

export default function GatpatLogout() {
  return <button className="ml-auto text-sm text-slate-600 underline" onClick={() => void signOut({ callbackUrl: "/" })}>ออกจากระบบ</button>;
}
