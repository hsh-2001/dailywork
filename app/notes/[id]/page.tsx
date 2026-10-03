import NoteDetailPage from "@/components/notes/NoteDetailPage";

export default async function NotePage({ params }: PageProps<"/notes/[id]">) {
  const { id } = await params;
  const noteId = Number(id);
  return <NoteDetailPage noteId={Number.isSafeInteger(noteId) && noteId > 0 ? noteId : -1} />;
}
