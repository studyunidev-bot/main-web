"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DEMO_AUTH_KEY } from "./demo-store";

export default function WebBRootSessionGuard({ children }: { children: ReactNode }) {
  const [canShowRoot, setCanShowRoot] = useState(false);

  useEffect(() => {
    const routeByAuth = () => {
      if (localStorage.getItem(DEMO_AUTH_KEY) === "true") {
        window.location.replace("/webb/student?view=overview");
        return;
      }
      setCanShowRoot(true);
    };

    routeByAuth();
    window.addEventListener("storage", routeByAuth);
    window.addEventListener("webb-demo-auth-updated", routeByAuth);
    window.addEventListener("pageshow", routeByAuth);
    window.addEventListener("popstate", routeByAuth);
    return () => {
      window.removeEventListener("storage", routeByAuth);
      window.removeEventListener("webb-demo-auth-updated", routeByAuth);
      window.removeEventListener("pageshow", routeByAuth);
      window.removeEventListener("popstate", routeByAuth);
    };
  }, []);

  if (!canShowRoot) return null;
  return children;
}
