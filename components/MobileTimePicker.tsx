"use client";

import { useMemo, useState } from "react";
import { Input } from "antd";
import { Picker } from "antd-mobile";
import dayjs, { Dayjs } from "dayjs";
import { Clock } from "lucide-react";

interface MobileTimePickerProps {
  value?: Dayjs | null;
  onChange?: (value: Dayjs | null) => void;
  placeholder?: string;
  title?: string;
  /** Minute wheel step. 5 is quick to scroll; the current value's minute is always kept. */
  minuteStep?: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function MobileTimePicker({
  value,
  onChange,
  placeholder = "Select time",
  title,
  minuteStep = 5,
}: MobileTimePickerProps) {
  const [visible, setVisible] = useState(false);

  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, i) => ({ label: pad(i), value: pad(i) })),
    []
  );

  const minutes = useMemo(() => {
    const set = new Set<number>();
    for (let m = 0; m < 60; m += minuteStep) set.add(m);
    // Editing a record saved with e.g. 08:07 must still show 07 on the wheel
    if (value) set.add(dayjs(value).minute());
    return [...set]
      .sort((a, b) => a - b)
      .map((m) => ({ label: pad(m), value: pad(m) }));
  }, [minuteStep, value]);

  const pickerValue = value
    ? [pad(dayjs(value).hour()), pad(dayjs(value).minute())]
    : ["09", "00"];

  return (
    <>
      <Input
        readOnly
        size="large"
        placeholder={placeholder}
        value={value ? dayjs(value).format("HH:mm") : ""}
        suffix={<Clock size={16} className="text-gray-400" />}
        onClick={() => setVisible(true)}
        className="cursor-pointer"
      />
      <Picker
        title={title}
        columns={[hours, minutes]}
        visible={visible}
        value={pickerValue}
        onClose={() => setVisible(false)}
        onConfirm={(v) => {
          const [h, m] = v.map(Number);
          onChange?.(dayjs().hour(h).minute(m).second(0).millisecond(0));
        }}
      />
    </>
  );
}