"use client";

import NoteContent from "@/components/notes/NoteContent";
import { useNote, useSetNotePinned, useSetNoteStatus, useUpdateNote } from "@/hooks/note.hook";
import { Alert, Button, Skeleton } from "antd";
import { ArrowLeft, Pin, Pencil, CalendarClock, Check, Circle } from "lucide-react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

export default function NoteDetailPage({ noteId }: { noteId: number }) {
  const router = useRouter();
  const noteQuery = useNote(noteId);
  const setPinned = useSetNotePinned();
  const updateNote = useUpdateNote();
  const setStatus = useSetNoteStatus();
  const note = noteQuery.data?.data;

  const handleTaskToggle = async (lineIndex: number, completed: boolean) => {
    if (!note) return;
    const lines = note.content.split(/\r?\n/);
    const line = lines[lineIndex];
    if (line === undefined) return;
    lines[lineIndex] = line.replace(/^(\s*[-*+]\s+)\[([ xX])\]/, `$1[${completed ? "x" : " "}]`);
    try {
      await updateNote.mutateAsync({
        id: note.id,
        data: { title: note.title, content: lines.join("\n"), deadline: note.deadline },
      });
    } catch {
      // The mutation error is shown below, and the persisted note remains unchanged.
    }
  };

  if (noteQuery.isLoading) {
    return <main className="mx-auto max-w-3xl px-4 py-5"><Skeleton active title paragraph={{ rows: 7 }} /></main>;
  }

  if (noteQuery.isError || !note) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-5">
        <Alert type="error" showIcon message="Unable to load this note." action={<Button onClick={() => router.push("/notes")}>Back to notes</Button>} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-5 sm:py-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <Button type="text" icon={<ArrowLeft size={16} />} onClick={() => router.push("/notes")} className="!w-fit !pl-0 !text-slate-500 hover:!text-slate-900">
            All notes
          </Button>
          <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:flex sm:items-center">
            <Button
              type="text"
              icon={<Pin size={15} className={note.pinned ? "fill-current" : ""} />}
              loading={setPinned.isPending}
              onClick={() => setPinned.mutate({ id: note.id, pinned: !note.pinned })}
              aria-label={note.pinned ? "Unpin note" : "Pin note"}
              title={note.pinned ? "Unpin note" : "Pin note"}
              className={`!min-w-0 !px-2 sm:!px-3 ${note.pinned ? "!text-slate-700" : "!text-slate-500"}`}
            >
              <span className="hidden min-[420px]:inline">{note.pinned ? "Pinned" : "Pin"}</span>
            </Button>
            <Button
              icon={note.status === "COMPLETED" ? <Circle size={15} /> : <Check size={15} />}
              loading={setStatus.isPending}
              onClick={() => setStatus.mutate({ id: note.id, status: note.status === "COMPLETED" ? "ACTIVE" : "COMPLETED" })}
              aria-label={note.status === "COMPLETED" ? "Mark note active" : "Mark note complete"}
              title={note.status === "COMPLETED" ? "Mark active" : "Complete"}
              className="!min-w-0 !px-2 sm:!px-3"
            >
              <span className="hidden min-[420px]:inline">{note.status === "COMPLETED" ? "Mark active" : "Complete"}</span>
            </Button>
            <Button type="primary" icon={<Pencil size={15} />} onClick={() => router.push(`/notes/${note.id}/edit`)} aria-label="Edit note" title="Edit note" className="!min-w-0 !rounded-lg !px-2 sm:!px-3">
              <span className="hidden min-[420px]:inline">Edit</span>
            </Button>
          </div>
        </div>

        {setPinned.isError && <Alert className="mb-3" type="error" showIcon message="Unable to update pin. Please try again." />}
        {setStatus.isError && <Alert className="mb-3" type="error" showIcon message="Unable to update note status. Please try again." />}
        {updateNote.isError && <Alert className="mb-3" type="error" showIcon message="Unable to update checklist item. Please try again." />}

        <article className="rounded-xl border border-slate-200/80 bg-white px-5 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:px-8 sm:py-7">
          <header className="mb-6 border-b border-slate-100 pb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Note</p>
            <h1 className="break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{note.title}</h1>
            <p className="mt-2 text-xs text-slate-400">Updated {dayjs(note.updatedAt).format("MMMM D, YYYY [at] h:mm A")}</p>
            {note.status === "COMPLETED" && <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700"><Check size={15} aria-hidden="true" />Completed</p>}
            {note.deadline && <p className={`mt-3 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium ${note.status !== "COMPLETED" && dayjs(note.deadline).isBefore(dayjs(), "day") ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"}`}>
              <CalendarClock size={15} aria-hidden="true" />
              <time dateTime={note.deadline}>{note.status !== "COMPLETED" && dayjs(note.deadline).isBefore(dayjs(), "day") ? "Overdue · " : "Due "}{dayjs(note.deadline).format("MMMM D, YYYY")}</time>
            </p>}
          </header>
          <div className="min-h-40 break-words text-[15px] leading-7 text-slate-700 [&_a]:text-slate-700 [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:font-mono [&_h1]:my-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h3]:my-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 [&_ol]:my-3 [&_ol]:list-inside [&_ol]:list-decimal [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-4 [&_ul]:my-3 [&_ul]:list-inside [&_ul]:list-disc">
            <NoteContent content={note.content} onTaskToggle={handleTaskToggle} tasksDisabled={updateNote.isPending} />
          </div>
        </article>
      </div>
    </main>
  );
}
