import type { ComponentPropsWithRef } from "react";
import { twMerge } from "tailwind-merge";

type WebBAdminInputProps = ComponentPropsWithRef<"input">;

export default function WebBAdminInput({
  className,
  type = "text",
  ...props
}: WebBAdminInputProps) {
  const hasExplicitWidth = className?.split(/\s+/).some((token) => token.startsWith("w-"));
  const controlClass =
    type === "checkbox" || type === "radio"
      ? "size-4 shrink-0 rounded border-slate-300 accent-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50"
      : "min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

  return (
    <input
      {...props}
      type={type}
      className={twMerge(
        [
          className,
          controlClass,
          type !== "checkbox" && type !== "radio" && !hasExplicitWidth
            ? "w-full"
            : "",
        ]
          .filter(Boolean)
          .join(" "),
      )}
    />
  );
}
