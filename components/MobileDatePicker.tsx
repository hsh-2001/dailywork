"use client";

import { useMemo, useState } from "react";
import { Input } from "antd";
import { DatePicker } from "antd-mobile";
import dayjs, { Dayjs } from "dayjs";
import { Calendar, X } from "lucide-react";
import { APP_TZ } from "@/utils/datetime"; // also registers the dayjs utc/timezone plugins

interface MobileDatePickerProps {
  value?: Dayjs | null;
  onChange?: (value: Dayjs | null) => void;
  placeholder?: string;
  title?: string;
  allowClear?: boolean;
  /** How far back / forward the wheel goes. Defaults: 5 years back, 1 year ahead. */
  min?: Date;
  max?: Date;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Dayjs -> Date for the wheel, using only year/month/day.
 * Going through toDate() would shift the day whenever the phone's timezone
 * differs from the Dayjs value's timezone.
 */
const toWheelDate = (d: Dayjs) => new Date(d.year(), d.month(), d.date());

/** Date from the wheel -> Dayjs at GMT+7, from year/month/day only. */
const fromWheelDate = (d: Date) =>
  dayjs.tz(
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    APP_TZ
  );

export default function MobileDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  title,
  allowClear = false,
  min,
  max,
}: MobileDatePickerProps) {
  const [visible, setVisible] = useState(false);

  // Stable Date objects: a new Date on every render makes the controlled wheel reset
  const wheelValue = useMemo(
    () => toWheelDate(value ?? dayjs().tz(APP_TZ)),
    [value]
  );
  const minDate = useMemo(
    () => min ?? toWheelDate(dayjs().tz(APP_TZ).subtract(5, "year").startOf("year")),
    [min]
  );
  const maxDate = useMemo(
    () => max ?? toWheelDate(dayjs().tz(APP_TZ).add(1, "year").endOf("year")),
    [max]
  );

  return (
    <>
      <Input
        readOnly
        size="large"
        placeholder={placeholder}
        value={value ? value.format("DD MMM YYYY") : ""}
        suffix={
          <span className="flex items-center gap-1">
            {allowClear && value && (
              <button
                type="button"
                aria-label={`Clear ${title?.toLowerCase() ?? "date"}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onChange?.(null);
                }}
                className="flex size-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
            <Calendar size={16} className="text-gray-400" />
          </span>
        }
        onClick={() => setVisible(true)}
        className="cursor-pointer"
      />
      <DatePicker
        title={title}
        cancelText="Cancel"
        confirmText="Confirm"
        precision="day"
        visible={visible}
        value={wheelValue}
        min={minDate}
        max={maxDate}
        renderLabel={(type, data) =>
          type === "month" ? MONTHS[data - 1] : String(data)
        }
        onClose={() => setVisible(false)}
        onConfirm={(date) => onChange?.(fromWheelDate(date))}
      />
    </>
  );
}