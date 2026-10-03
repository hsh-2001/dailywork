import NoteEditorPage from "@/components/notes/NoteEditorPage";

export default async function EditNotePage({ params }: PageProps<"/notes/[id]/edit">) {
  const { id } = await params;
  const noteId = Number(id);
  return <NoteEditorPage noteId={Number.isSafeInteger(noteId) && noteId > 0 ? noteId : -1} />;
}
