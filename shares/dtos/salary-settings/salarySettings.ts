export type SalaryCurrency = "USD" | "KHR";

export interface SalarySettings {
  monthlySalary: number;
  currency: SalaryCurrency;
  taxRate: number;
}

export interface SalarySettingsListResponse {
  data: SalarySettings[];
}

export interface SalarySettingResponse {
  data: SalarySettings;
}
