"use client";

import bonusCalculationSettingsService from "@/services/bonus-calculation-settings.service";
import type { BonusCalculationSettings } from "@/shares/dtos/bonus-calculation-settings/bonusCalculationSettings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const bonusCalculationSettingsQueryKey = ["bonus-calculation-settings"];

export const useBonusCalculationSettings = () =>
  useQuery({
    queryKey: bonusCalculationSettingsQueryKey,
    queryFn: () => bonusCalculationSettingsService.get(),
  });

export const useSaveBonusCalculationSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: BonusCalculationSettings) =>
      bonusCalculationSettingsService.save(settings),
    onSuccess: (response) => {
      queryClient.setQueryData(bonusCalculationSettingsQueryKey, response);
    },
  });
};
