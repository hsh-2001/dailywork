"use client";

import { useState } from "react";
import { Input } from "antd";
import { DatePicker } from "antd-mobile";
import dayjs, { Dayjs } from "dayjs";
import { Calendar } from "lucide-react";

interface MobileDatePickerProps {
  value?: Dayjs | null;
  onChange?: (value: Dayjs | null) => void;
  placeholder?: string;
  title?: string;
  /** How far back / forward the wheel goes. Defaults: 5 years back, 1 year ahead. */
  min?: Date;
  max?: Date;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function MobileDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  title,
  min,
  max,
}: MobileDatePickerProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Input
        readOnly
        size="large"
        placeholder={placeholder}
        value={value ? dayjs(value).format("DD MMM YYYY") : ""}
        suffix={<Calendar size={16} className="text-gray-400" />}
        onClick={() => setVisible(true)}
        className="cursor-pointer"
      />
      <DatePicker
        title={title}
        cancelText="Cancel"
        confirmText="Confirm"
        precision="day"
        visible={visible}
        // Opens on the current value, or today for a new record
        value={value ? dayjs(value).toDate() : new Date()}
        min={min ?? dayjs().subtract(5, "year").startOf("year").toDate()}
        max={max ?? dayjs().add(1, "year").endOf("year").toDate()}
        // English wheel labels (the default locale adds Chinese suffixes)
        renderLabel={(type, data) =>
          type === "month" ? MONTHS[data - 1] : String(data)
        }
        onClose={() => setVisible(false)}
        onConfirm={(date) => onChange?.(dayjs(date))}
      />
    </>
  );
}