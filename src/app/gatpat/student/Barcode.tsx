"use client";

import { useEffect, useRef } from "react";

export default function Barcode({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    let active = true;
    import("jsbarcode").then(({ default: render }) => {
      if (active && ref.current && value) render(ref.current, value, { format: "CODE128", width: 2, height: 100, displayValue: true, margin: 10, lineColor: "#000", background: "#fff" });
    }).catch(() => undefined);
    return () => { active = false; };
  }, [value]);
  return <div className="flex flex-col items-center gap-4"><svg ref={ref} aria-label={`บาร์โค้ด ${value}`} role="img" /></div>;
}
