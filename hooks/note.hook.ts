"use client";

import noteService from "@/services/note.service";
import type { INoteRequest, INoteResponse } from "@/shares/dtos/note/note";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const NOTES_QUERY_KEY = ["notes"] as const;

type NotesResult = { data: INoteResponse[] };
type NoteResult = { data: INoteResponse };

const updateCachedNote = (
  queryClient: ReturnType<typeof useQueryClient>,
  id: number,
  update: (note: INoteResponse) => INoteResponse,
) => {
  queryClient.setQueryData<NotesResult>(NOTES_QUERY_KEY, (current) =>
    current ? { ...current, data: current.data.map((note) => note.id === id ? update(note) : note) } : current,
  );
  queryClient.setQueryData<NoteResult>([...NOTES_QUERY_KEY, id], (current) =>
    current ? { ...current, data: update(current.data) } : current,
  );
};

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
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY });
      const previousList = queryClient.getQueryData<NotesResult>(NOTES_QUERY_KEY);
      const previousNote = queryClient.getQueryData<NoteResult>([...NOTES_QUERY_KEY, id]);
      updateCachedNote(queryClient, id, (note) => ({ ...note, ...data }));
      return { previousList, previousNote, id };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(NOTES_QUERY_KEY, context.previousList);
      queryClient.setQueryData([...NOTES_QUERY_KEY, context.id], context.previousNote);
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...NOTES_QUERY_KEY, id] });
    },
  });
};

export const useSetNotePinned = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: number; pinned: boolean }) =>
      noteService.setPinned(variables),
    onMutate: async ({ id, pinned }) => {
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY });
      const previousList = queryClient.getQueryData<NotesResult>(NOTES_QUERY_KEY);
      const previousNote = queryClient.getQueryData<NoteResult>([...NOTES_QUERY_KEY, id]);
      updateCachedNote(queryClient, id, (note) => ({ ...note, pinned }));
      return { previousList, previousNote, id };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(NOTES_QUERY_KEY, context.previousList);
      queryClient.setQueryData([...NOTES_QUERY_KEY, context.id], context.previousNote);
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...NOTES_QUERY_KEY, id] });
    },
  });
};

export const useSetNoteStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: number; status: "ACTIVE" | "COMPLETED" }) =>
      noteService.setStatus(variables),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY });
      const previousList = queryClient.getQueryData<NotesResult>(NOTES_QUERY_KEY);
      const previousNote = queryClient.getQueryData<NoteResult>([...NOTES_QUERY_KEY, id]);
      updateCachedNote(queryClient, id, (note) => ({ ...note, status }));
      return { previousList, previousNote, id };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(NOTES_QUERY_KEY, context.previousList);
      queryClient.setQueryData([...NOTES_QUERY_KEY, context.id], context.previousNote);
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...NOTES_QUERY_KEY, id] });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => noteService.deleteNote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY }),
  });
};
