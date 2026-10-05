import { clsx, type ClassValue } from "clsx"
import Swal from "sweetalert2";
import { twMerge } from "tailwind-merge"
import { signOut } from "next-auth/react";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const AlertConfirm = async (title: string, message: string, btnText: string = "ลบ"): Promise<boolean> => {
  return Swal.fire({
    title: title || "",
    text: message || "",
    showCancelButton: true,
    confirmButtonText: btnText ,
    confirmButtonColor: "red",
    cancelButtonText: "ยกเลิก",
    icon: "warning"
  }).then((result) => {
    if (result.isConfirmed) {
      return true
    } else {
      return false
    }

  });

}

export const AlertConfirmInputText = async (): Promise<string | null> => {
  const { value, isConfirmed } = await Swal.fire({
    title: 'หมายเหตุสำหรับยกเลิกบิล',
    input: 'text',
    inputPlaceholder: 'กรอกหมายเหตุ',
    showCancelButton: true,
    confirmButtonText: "บันทึก",
    cancelButtonText: "ยกเลิก",
    inputValidator: (value) => {
      if (!value) {
        return 'กรุณากรอกหมายเหตุ';
      }
      return null; // ✅ ผ่าน
    },
  });
  if (isConfirmed && value) {
    return value;
  } else {
    return null;
  }
}


export const handleLogout = async (_refreshToken?: number | string) => {
  await signOut({ callbackUrl: "/auth/sign-in" });
};

export const formatNumber = (value: number | string): string => {
  if (!value) return "0.00";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}




export const loadImageBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject();

      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = reject;
  });
};


export const convertNumberToThaiWords = (number: number): string => {
  const thaiNumbers = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const thaiPositions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  let result = ""
  let numberString = number.toString()
  // let isBaht = true

  const decimalPart = numberString.split(".")[1]
  numberString = numberString.split(".")[0]

  for (let i = 0; i < numberString.length; i++) {
    const digit = parseInt(numberString.charAt(numberString.length - i - 1), 10)
    if (digit !== 0) {
      if (i === 1 && digit === 1) {
        result = "สิบ" + result
      } else if (i === 1 && digit === 2) {
        result = "ยี่สิบ" + result
      } else if (i !== 0 || digit !== 1) {
        result = thaiNumbers[digit] + thaiPositions[i] + result
      }
    }
  }

  result += "บาท"

  if (decimalPart && decimalPart !== "00") {
    result += " " + convertNumberToThaiWords(parseInt(decimalPart)) + "สตางค์"

  } else {
    result += "ถ้วน"
  }


  return result

};
