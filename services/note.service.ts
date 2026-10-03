import api from "@/services/api";
import type { INoteRequest } from "@/shares/dtos/note/note";

const getNotes = async () => {
  const response = await api.get("/note");
  return response.data;
};

const getNote = async (id: number) => {
  const response = await api.get(`/note/${id}`);
  return response.data;
};

const createNote = async (data: INoteRequest) => {
  const response = await api.post("/note", data);
  return response.data;
};

const updateNote = async ({ id, data }: { id: number; data: INoteRequest }) => {
  const response = await api.put(`/note/${id}`, data);
  return response.data;
};

const setPinned = async ({ id, pinned }: { id: number; pinned: boolean }) => {
  const response = await api.patch(`/note/${id}/pin`, { pinned });
  return response.data;
};

const deleteNote = async (id: number) => {
  const response = await api.delete(`/note/${id}`);
  return response.data;
};

const noteService = { getNotes, getNote, createNote, updateNote, setPinned, deleteNote };

export default noteService;
