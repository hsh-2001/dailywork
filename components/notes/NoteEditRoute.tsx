"use client";

import NoteEditorPage from "@/components/notes/NoteEditorPage";
import { useSearchParams } from "next/navigation";

export default function NoteEditRoute() {
  const searchParams = useSearchParams();
  const noteId = Number(searchParams.get("id"));

  return <NoteEditorPage noteId={Number.isSafeInteger(noteId) && noteId > 0 ? noteId : -1} />;
}
