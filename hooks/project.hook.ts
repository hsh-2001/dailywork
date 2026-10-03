"use client";

import projectService from "@/services/project.service";
import {
  ICreateProjectRequest,
  IUpdateProjectRequest,
} from "@/shares/dtos/project/createRequest";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useProjects = () =>
  useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.getProjects(),
  });

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateProjectRequest) => projectService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IUpdateProjectRequest }) =>
      projectService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
};
