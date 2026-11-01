import NoteEditorPage from "@/components/notes/NoteEditorPage";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: "__pages_placeholder" }];
}

export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const noteId = Number(id);
  return <NoteEditorPage noteId={Number.isSafeInteger(noteId) && noteId > 0 ? noteId : -1} />;
}
