"use client";

import { useState } from "react";
import { Alert, App, Button, InputNumber, Space } from "antd";
import {
  useBonusCalculationSettings,
  useSaveBonusCalculationSettings,
} from "@/hooks/bonus-calculation-settings.hook";
import type { BonusCalculationSettings } from "@/shares/dtos/bonus-calculation-settings/bonusCalculationSettings";

export default function BonusCalculationSettingsClient() {
  const settingsQuery = useBonusCalculationSettings();

  if (settingsQuery.isLoading) {
    return (
      <p className="px-4 py-6 text-sm text-slate-500 sm:px-5">
        Loading calculation settings…
      </p>
    );
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <div className="p-4 sm:p-5">
        <Alert
          type="error"
          showIcon
          message={
            settingsQuery.isError
              ? "Unable to load calculation settings."
              : "Calculation settings were not returned."
          }
          action={
            <Button size="small" onClick={() => settingsQuery.refetch()}>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  return <SettingsForm settings={settingsQuery.data.data} />;
}

function SettingsForm({ settings }: { settings: BonusCalculationSettings }) {
  const { notification } = App.useApp();
  const saveSettings = useSaveBonusCalculationSettings();
  const [workingDaysPerMonth, setWorkingDaysPerMonth] = useState(settings.workingDaysPerMonth);
  const [hoursPerWorkday, setHoursPerWorkday] = useState(settings.hoursPerWorkday);
  const [weekdayMultiplier, setWeekdayMultiplier] = useState(settings.weekdayMultiplier);
  const [normalHolidayMultiplier, setNormalHolidayMultiplier] = useState(settings.normalHolidayMultiplier);
  const [weekendMultiplier, setWeekendMultiplier] = useState(settings.weekendMultiplier);
  const [specialDayMultiplier, setSpecialDayMultiplier] = useState(settings.specialDayMultiplier);

  const handleSave = () => {
    saveSettings.mutate({
      workingDaysPerMonth,
      hoursPerWorkday,
      weekdayMultiplier,
      normalHolidayMultiplier,
      weekendMultiplier,
      specialDayMultiplier,
      khrPerUsd: settings.khrPerUsd,
    }, {
      onSuccess: () => {
        notification.success({ title: "Bonus calculation settings saved." });
      },
      onError: () => {
        notification.error({ title: "Unable to save bonus calculation settings." });
      },
    });
  };

  return (
    <div className="space-y-5 px-4 py-4 sm:px-5">
      <div className="grid gap-4 sm:max-w-xl">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Workdays per month</span>
          <Space.Compact block>
            <InputNumber
              aria-label="Default workdays per month"
              min={1}
              max={31}
              precision={0}
              value={workingDaysPerMonth}
              onChange={(value) => setWorkingDaysPerMonth(value ?? 1)}
              className="min-w-0 flex-1"
            />
            <span className="flex items-center border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
              days
            </span>
          </Space.Compact>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Hours per workday</span>
          <Space.Compact block>
            <InputNumber
              aria-label="Default hours per workday"
              min={1}
              max={24}
              step={0.5}
              precision={2}
              value={hoursPerWorkday}
              onChange={(value) => setHoursPerWorkday(value ?? 1)}
              className="min-w-0 flex-1"
            />
            <span className="flex items-center border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
              hrs
            </span>
          </Space.Compact>
        </label>

        <MultiplierField
          label="Weekday"
          value={weekdayMultiplier}
          onChange={setWeekdayMultiplier}
        />
        <MultiplierField
          label="Normal holiday"
          value={normalHolidayMultiplier}
          onChange={setNormalHolidayMultiplier}
        />
        <MultiplierField
          label="Weekend multiplier"
          value={weekendMultiplier}
          onChange={setWeekendMultiplier}
        />
        <MultiplierField
          label="Special day"
          value={specialDayMultiplier}
          onChange={setSpecialDayMultiplier}
        />
      </div>
      <p className="text-xs leading-5 text-slate-500">
        Add “normal holiday” or “special day” to a work log remark to apply that rate.
        Special day takes priority if both phrases are present.
      </p>

      <Button
        type="primary"
        onClick={handleSave}
        loading={saveSettings.isPending}
        disabled={saveSettings.isPending}
      >
        Save defaults
      </Button>
    </div>
  );
}

function MultiplierField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <Space.Compact block>
        <InputNumber
          aria-label={`Default ${label.toLowerCase()} multiplier`}
          min={0}
          max={10}
          step={0.25}
          precision={2}
          value={value}
          onChange={(next) => onChange(next ?? 0)}
          className="min-w-0 flex-1"
        />
        <span className="flex items-center border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
          ×
        </span>
      </Space.Compact>
    </label>
  );
}
