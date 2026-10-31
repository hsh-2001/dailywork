export type SalaryCurrency = "USD" | "KHR";

export interface SalarySettings {
  monthlySalary: number;
  currency: SalaryCurrency;
  taxRate: number;
}
