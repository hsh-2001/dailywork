import api from "./api";
import type {
  SalarySettingResponse,
  SalarySettings,
  SalarySettingsListResponse,
} from "@/shares/dtos/salary-settings/salarySettings";

const get = async (): Promise<SalarySettingsListResponse> => {
  const response = await api.get<SalarySettingsListResponse>("/salary-settings");
  return response.data;
};

const save = async (settings: SalarySettings): Promise<SalarySettingResponse> => {
  const response = await api.put<SalarySettingResponse>("/salary-settings", settings);
  return response.data;
};

const salarySettingsService = { get, save };

export default salarySettingsService;
