import api from "./api";
import type { BonusCalculationSettings } from "@/shares/dtos/bonus-calculation-settings/bonusCalculationSettings";

type BonusCalculationSettingsResponse = { data: BonusCalculationSettings };

const get = async (): Promise<BonusCalculationSettingsResponse> => {
  const response = await api.get<BonusCalculationSettingsResponse>(
    "/bonus-calculation-settings",
  );
  return response.data;
};

const save = async (
  settings: BonusCalculationSettings,
): Promise<BonusCalculationSettingsResponse> => {
  const response = await api.put<BonusCalculationSettingsResponse>(
    "/bonus-calculation-settings",
    settings,
  );
  return response.data;
};

const bonusCalculationSettingsService = { get, save };

export default bonusCalculationSettingsService;
