import Image from "next/image";
import { WEBB_MOCK_IMAGE } from "./data";

/** Shared editable image placeholder for all Web B visual sections. */
export function WebBImage({
  className = "",
  alt = "ภาพตัวอย่าง Web B",
  src = WEBB_MOCK_IMAGE,
}: {
  className?: string;
  alt?: string;
  src?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={800}
      unoptimized={src.startsWith("data:")}
      className={className}
      priority
    />
  );
}
