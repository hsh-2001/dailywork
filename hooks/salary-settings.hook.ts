"use client";

import salarySettingsService from "@/services/salary-settings.service";
import type {
  SalarySettings,
  SalarySettingsListResponse,
} from "@/shares/dtos/salary-settings/salarySettings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const salarySettingsQueryKey = ["salary-settings"];

export const useSalarySettings = () =>
  useQuery({
    queryKey: salarySettingsQueryKey,
    queryFn: () => salarySettingsService.get(),
  });

export const useSaveSalarySettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: SalarySettings) => salarySettingsService.save(settings),
    onSuccess: (response) => {
      queryClient.setQueryData<SalarySettingsListResponse>(
        salarySettingsQueryKey,
        (current) => ({
          data: [
            ...(current?.data ?? []).filter(
              (setting) => setting.currency !== response.data.currency,
            ),
            response.data,
          ],
        }),
      );
    },
  });
};
