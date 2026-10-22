import type { ComponentPropsWithRef } from "react";
import { twMerge } from "tailwind-merge";

type WebBAdminTextareaProps = ComponentPropsWithRef<"textarea">;

export default function WebBAdminTextarea({
  className,
  ...props
}: WebBAdminTextareaProps) {
  return (
    <textarea
      {...props}
      className={twMerge(
        [
          className,
          "min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
        ]
          .filter(Boolean)
          .join(" "),
      )}
    />
  );
}
