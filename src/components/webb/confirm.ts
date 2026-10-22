import Swal from "sweetalert2";

export async function confirmWebBAction({
  title,
  text,
  confirmText = "ยืนยัน",
  danger = true,
}: {
  title: string;
  text: string;
  confirmText?: string;
  danger?: boolean;
}) {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    reverseButtons: true,
    focusCancel: true,
    confirmButtonText: confirmText,
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: danger ? "#dc2626" : "#ffcc00",
    cancelButtonColor: "#f1f5f9",
    customClass: {
      popup: "wb-confirm-popup",
      title: "wb-confirm-title",
      htmlContainer: "wb-confirm-copy",
      confirmButton: danger ? "wb-confirm-danger" : "wb-confirm-primary",
      cancelButton: "wb-confirm-cancel",
    },
    buttonsStyling: false,
  });
  return result.isConfirmed;
}

export async function inputWebBValue({
  title,
  value = "",
  placeholder = "",
  input = "text",
  options,
}: {
  title: string;
  value?: string;
  placeholder?: string;
  input?: "text" | "email" | "number" | "select";
  options?: Record<string, string>;
}) {
  const result = await Swal.fire({
    title,
    input,
    inputValue: value,
    inputPlaceholder: placeholder,
    inputOptions: options,
    showCancelButton: true,
    reverseButtons: true,
    focusCancel: true,
    confirmButtonText: "บันทึก",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#ffcc00",
    cancelButtonColor: "#f1f5f9",
    customClass: {
      popup: "wb-confirm-popup",
      title: "wb-confirm-title",
      input: "wb-confirm-input",
      confirmButton: "wb-confirm-primary",
      cancelButton: "wb-confirm-cancel",
    },
    buttonsStyling: false,
    inputValidator: (resultValue) => {
      const value = String(resultValue || "").trim();
      if (!value) return "กรุณากรอกข้อมูล";
      if (input === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "กรุณากรอกอีเมลให้ถูกต้อง";
      if (input === "number" && (!Number.isFinite(Number(value)) || Number(value) < 0)) return "กรุณากรอกตัวเลขตั้งแต่ 0 ขึ้นไป";
      return undefined;
    },
  });
  return result.isConfirmed ? String(result.value || "").trim() : null;
}
