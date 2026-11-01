import NoteDetailPage from "@/components/notes/NoteDetailPage";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: "__pages_placeholder" }];
}

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const noteId = Number(id);
  return <NoteDetailPage noteId={Number.isSafeInteger(noteId) && noteId > 0 ? noteId : -1} />;
}
