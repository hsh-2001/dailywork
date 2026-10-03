"use client";

import noteService from "@/services/note.service";
import type { INoteRequest } from "@/shares/dtos/note/note";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const NOTES_QUERY_KEY = ["notes"] as const;

export const useNotes = () =>
  useQuery({
    queryKey: NOTES_QUERY_KEY,
    queryFn: () => noteService.getNotes(),
  });

export const useNote = (id: number) =>
  useQuery({
    queryKey: [...NOTES_QUERY_KEY, id],
    queryFn: () => noteService.getNote(id),
    enabled: Number.isSafeInteger(id) && id > 0,
  });

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: INoteRequest) => noteService.createNote(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY }),
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: number; data: INoteRequest }) =>
      noteService.updateNote(variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY }),
  });
};

export const useSetNotePinned = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: number; pinned: boolean }) =>
      noteService.setPinned(variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY }),
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => noteService.deleteNote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY }),
  });
};
