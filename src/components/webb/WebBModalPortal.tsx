"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export default function WebBModalPortal({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [enabled]);

  if (!enabled) return <>{children}</>;
  if (!mounted || typeof document === "undefined") return null;

  return createPortal(children, document.body);
}
