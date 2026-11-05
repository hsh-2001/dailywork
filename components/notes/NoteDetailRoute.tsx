"use client";

import NoteDetailPage from "@/components/notes/NoteDetailPage";
import { useSearchParams } from "next/navigation";

export default function NoteDetailRoute() {
  const searchParams = useSearchParams();
  const noteId = Number(searchParams.get("id"));

  return <NoteDetailPage noteId={Number.isSafeInteger(noteId) && noteId > 0 ? noteId : -1} />;
}
