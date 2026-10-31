import api from "./api";
import type { SalarySettings } from "@/shares/dtos/salary-settings/salarySettings";

type SalarySettingsResponse = { data: SalarySettings };

const get = async (): Promise<SalarySettingsResponse> => {
  const response = await api.get<SalarySettingsResponse>("/salary-settings");
  return response.data;
};

const save = async (settings: SalarySettings): Promise<SalarySettingsResponse> => {
  const response = await api.put<SalarySettingsResponse>("/salary-settings", settings);
  return response.data;
};

const salarySettingsService = { get, save };

export default salarySettingsService;
