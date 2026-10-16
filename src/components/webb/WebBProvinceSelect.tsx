"use client";

import Select from "react-select";
import { useState } from "react";

type ProvinceOption = { value: string; label: string };

export const WEBB_PROVINCES: ProvinceOption[] = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี",
].map((province) => ({ value: province, label: province }));

export const WEBB_SELECT_STYLES = {
  control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    minHeight: 44,
    borderColor: state.isFocused ? "#d8ac00" : "#dedede",
    borderRadius: 11,
    boxShadow: state.isFocused ? "0 0 0 3px #ffce0029" : "none",
    fontFamily: "inherit",
    cursor: "text",
    "&:hover": { borderColor: state.isFocused ? "#d8ac00" : "#c8c8c8" },
  }),
  valueContainer: (base: Record<string, unknown>) => ({ ...base, padding: "0 12px" }),
  input: (base: Record<string, unknown>) => ({ ...base, margin: 0, padding: 0 }),
  indicatorSeparator: () => ({ display: "none" }),
  menu: (base: Record<string, unknown>) => ({ ...base, zIndex: 30, fontFamily: "inherit" }),
  option: (base: Record<string, unknown>, state: { isFocused: boolean; isSelected: boolean }) => ({
    ...base,
    color: "#171717",
    backgroundColor: state.isSelected ? "#ffed99" : state.isFocused ? "#fff8dd" : "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
  }),
};

export default function WebBProvinceSelect({
  value,
  defaultValue,
  onChange,
  name = "province",
  inputId = "webb-province",
  required = false,
}: {
  value?: string;
  defaultValue?: string;
  onChange?: (province: string) => void;
  name?: string;
  inputId?: string;
  required?: boolean;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const currentValue = value ?? internalValue;
  return (
    <Select<ProvinceOption, false>
      inputId={inputId}
      instanceId={inputId}
      name={name}
      className="wb-province-select"
      classNamePrefix="wb-province"
      options={WEBB_PROVINCES}
      value={WEBB_PROVINCES.find((province) => province.value === currentValue) || null}
      onChange={(option) => {
        const nextValue = option?.value || "";
        setInternalValue(nextValue);
        onChange?.(nextValue);
      }}
      placeholder="พิมพ์ค้นหาจังหวัด..."
      noOptionsMessage={() => "ไม่พบจังหวัด"}
      isSearchable
      isClearable={false}
      required={required}
      styles={WEBB_SELECT_STYLES as never}
    />
  );
}
