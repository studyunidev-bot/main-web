import Image from "next/image";
import { WEBB_MOCK_IMAGE } from "./data";

/** Shared editable image placeholder for all Web B visual sections. */
export function WebBImage({
  className = "",
  alt = "ภาพตัวอย่าง Web B",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <Image
      src={WEBB_MOCK_IMAGE}
      alt={alt}
      width={1200}
      height={800}
      className={className}
      priority
    />
  );
}
