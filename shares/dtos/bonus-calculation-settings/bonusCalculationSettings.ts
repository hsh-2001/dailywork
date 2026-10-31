export interface BonusCalculationSettings {
  workingDaysPerMonth: number;
  hoursPerWorkday: number;
  weekdayMultiplier: number;
  normalHolidayMultiplier: number;
  weekendMultiplier: number;
  specialDayMultiplier: number;
  khrPerUsd: number;
}
