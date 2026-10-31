"use client";

import { useState } from "react";
import { Alert, Button, InputNumber, Select, Space } from "antd";
import {
  useSalarySettings,
  useSaveSalarySettings,
} from "@/hooks/salary-settings.hook";
import type {
  SalaryCurrency,
  SalarySettings,
} from "@/shares/dtos/salary-settings/salarySettings";

const currencyOptions = [
  { value: "USD", label: "USD" },
  { value: "KHR", label: "KHR" },
];

export default function SalarySettingsClient() {
  const settingsQuery = useSalarySettings();

  if (settingsQuery.isLoading) {
    return <p className="px-4 py-6 text-sm text-slate-500 sm:px-5">Loading salary settings…</p>;
  }

  if (settingsQuery.isError) {
    return (
      <div className="p-4 sm:p-5">
        <Alert
          type="error"
          showIcon
          message="Unable to load salary settings."
          action={<Button size="small" onClick={() => settingsQuery.refetch()}>Try again</Button>}
        />
      </div>
    );
  }

  if (!settingsQuery.data) {
    return (
      <div className="p-4 sm:p-5">
        <Alert
          type="error"
          showIcon
          message="Salary settings were not returned."
          action={<Button size="small" onClick={() => settingsQuery.refetch()}>Try again</Button>}
        />
      </div>
    );
  }

  return <SalarySettingsForm settings={settingsQuery.data.data} />;
}

function SalarySettingsForm({ settings }: { settings: SalarySettings }) {
  const saveSettings = useSaveSalarySettings();
  const [monthlySalary, setMonthlySalary] = useState(settings.monthlySalary);
  const [currency, setCurrency] = useState<SalaryCurrency>(settings.currency);
  const [taxRate, setTaxRate] = useState(settings.taxRate);

  const handleSave = () => {
    saveSettings.mutate({ monthlySalary, currency, taxRate });
  };

  return (
    <div className="space-y-5 px-4 py-4 sm:px-5">
      {saveSettings.isError && (
        <Alert
          type="error"
          showIcon
          message="Unable to save salary settings. Please try again."
          closable
          onClose={() => saveSettings.reset()}
        />
      )}
      {saveSettings.isSuccess && (
        <Alert
          type="success"
          showIcon
          message="Salary settings saved."
          closable
          onClose={() => saveSettings.reset()}
        />
      )}

      <div className="grid gap-4 sm:max-w-xl">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Monthly salary</span>
          <Space.Compact block>
            <InputNumber
              aria-label="Default monthly salary"
              min={0}
              max={999999999999.99}
              step={100}
              precision={2}
              value={monthlySalary}
              onChange={(value) => setMonthlySalary(value ?? 0)}
              className="min-w-0 flex-1"
            />
            <Select
              aria-label="Salary currency"
              value={currency}
              onChange={(value: SalaryCurrency) => setCurrency(value)}
              className="w-[82px]"
              options={currencyOptions}
            />
          </Space.Compact>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Overtime tax rate</span>
          <Space.Compact block>
            <InputNumber
              aria-label="Default overtime tax rate"
              min={0}
              max={100}
              step={0.5}
              precision={2}
              value={taxRate}
              onChange={(value) => setTaxRate(value ?? 0)}
              className="min-w-0 flex-1"
            />
            <span className="flex items-center border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
              %
            </span>
          </Space.Compact>
          <span className="block text-xs leading-5 text-slate-500">
            Applied to estimated overtime pay in the bonus calculator.
          </span>
        </label>
      </div>

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
