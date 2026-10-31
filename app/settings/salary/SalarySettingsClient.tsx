"use client";

import { useState } from "react";
import { Alert, App, Button, InputNumber, Space } from "antd";
import {
  useSalarySettings,
  useSaveSalarySettings,
} from "@/hooks/salary-settings.hook";
import {
  useBonusCalculationSettings,
  useSaveBonusCalculationSettings,
} from "@/hooks/bonus-calculation-settings.hook";
import type { SalarySettings } from "@/shares/dtos/salary-settings/salarySettings";

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

  const usdSettings = settingsQuery.data.data.find(
    (item) => item.currency === "USD",
  ) ?? { monthlySalary: 0, currency: "USD" as const, taxRate: 0 };

  return (
    <div className="divide-y divide-slate-100">
      <SalarySettingsForm settings={usdSettings} />
      <ExchangeRateSettingsForm />
    </div>
  );
}

function SalarySettingsForm({ settings }: { settings: SalarySettings }) {
  const { notification } = App.useApp();
  const saveSettings = useSaveSalarySettings();
  const [monthlySalary, setMonthlySalary] = useState(settings.monthlySalary);
  const [taxRate, setTaxRate] = useState(settings.taxRate);

  const handleSave = () => {
    saveSettings.mutate({
      monthlySalary,
      currency: "USD",
      taxRate,
    }, {
      onSuccess: () => {
        notification.success({ title: "USD salary settings saved." });
      },
      onError: () => {
        notification.error({ title: "Unable to save USD salary settings." });
      },
    });
  };

  return (
    <div className="space-y-5 px-4 py-4 sm:px-5">
      <h2 className="text-sm font-semibold text-slate-900">
        USD salary and tax
      </h2>

      <div className="grid gap-4 sm:max-w-xl">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Base salary (USD)
          </span>
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

function ExchangeRateSettingsForm() {
  const { notification } = App.useApp();
  const settingsQuery = useBonusCalculationSettings();
  const saveSettings = useSaveBonusCalculationSettings();
  const [khrPerUsd, setKhrPerUsd] = useState<number | null>(null);
  const settings = settingsQuery.data?.data;
  const exchangeRate = khrPerUsd ?? settings?.khrPerUsd ?? 4000;

  if (settingsQuery.isLoading) {
    return (
      <p className="px-4 py-6 text-sm text-slate-500 sm:px-5">
        Loading exchange rate…
      </p>
    );
  }

  if (settingsQuery.isError || !settings) {
    return (
      <div className="p-4 sm:p-5">
        <Alert
          type="error"
          showIcon
          message={
            settingsQuery.isError
              ? "Unable to load exchange rate."
              : "Exchange rate was not returned."
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

  return (
    <div className="space-y-5 px-4 py-4 sm:px-5">
      <h2 className="text-sm font-semibold text-slate-900">Exchange rate</h2>
      <div className="grid gap-4 sm:max-w-xl">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            KHR per 1 USD
          </span>
          <Space.Compact block>
            <InputNumber
              aria-label="KHR per USD exchange rate"
              min={0.0001}
              max={99999999.9999}
              step={1}
              precision={4}
              value={exchangeRate}
              onChange={(value) => setKhrPerUsd(value ?? 0)}
              className="min-w-0 flex-1"
            />
            <span className="flex items-center border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
              KHR / USD
            </span>
          </Space.Compact>
          <span className="block text-xs leading-5 text-slate-500">
            Used to convert the current salary when changing currency in the bonus calculator.
          </span>
        </label>
      </div>
      <Button
        type="primary"
        onClick={() =>
          saveSettings.mutate(
            { ...settings, khrPerUsd: exchangeRate },
            {
              onSuccess: () => {
                setKhrPerUsd(null);
                notification.success({ title: "Exchange rate saved." });
              },
              onError: () => {
                notification.error({ title: "Unable to save exchange rate." });
              },
            },
          )
        }
        loading={saveSettings.isPending}
        disabled={saveSettings.isPending}
      >
        Save exchange rate
      </Button>
    </div>
  );
}
