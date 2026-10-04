"use client";

import NoteContent from "@/components/notes/NoteContent";
import { useNote, useSetNotePinned } from "@/hooks/note.hook";
import { Alert, Button, Skeleton } from "antd";
import { ArrowLeft, Pin, Pencil, CalendarClock } from "lucide-react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

export default function NoteDetailPage({ noteId }: { noteId: number }) {
  const router = useRouter();
  const noteQuery = useNote(noteId);
  const setPinned = useSetNotePinned();
  const note = noteQuery.data?.data;

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
        <div className="mb-3 flex items-center justify-between gap-3">
          <Button type="text" icon={<ArrowLeft size={16} />} onClick={() => router.push("/notes")} className="!pl-0 !text-slate-500 hover:!text-slate-900">
            All notes
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="text"
              icon={<Pin size={15} className={note.pinned ? "fill-current" : ""} />}
              loading={setPinned.isPending}
              onClick={() => setPinned.mutate({ id: note.id, pinned: !note.pinned })}
              className={note.pinned ? "!text-blue-700" : "!text-slate-500"}
            >
              {note.pinned ? "Pinned" : "Pin"}
            </Button>
            <Button type="primary" icon={<Pencil size={15} />} onClick={() => router.push(`/notes/${note.id}/edit`)} className="!rounded-lg">
              Edit
            </Button>
          </div>
        </div>

        {setPinned.isError && <Alert className="mb-3" type="error" showIcon message="Unable to update pin. Please try again." />}

        <article className="rounded-xl border border-slate-200/80 bg-white px-5 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:px-8 sm:py-7">
          <header className="mb-6 border-b border-slate-100 pb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Note</p>
            <h1 className="break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{note.title}</h1>
            <p className="mt-2 text-xs text-slate-400">Updated {dayjs(note.updatedAt).format("MMMM D, YYYY [at] h:mm A")}</p>
            {note.deadline && <p className={`mt-3 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium ${dayjs(note.deadline).isBefore(dayjs(), "day") ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
              <CalendarClock size={15} aria-hidden="true" />
              <time dateTime={note.deadline}>{dayjs(note.deadline).isBefore(dayjs(), "day") ? "Overdue · " : "Due "}{dayjs(note.deadline).format("MMMM D, YYYY")}</time>
            </p>}
          </header>
          <div className="min-h-40 break-words text-[15px] leading-7 text-slate-700 [&_a]:text-blue-700 [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:font-mono [&_h1]:my-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h3]:my-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 [&_ol]:my-3 [&_ol]:list-inside [&_ol]:list-decimal [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-4 [&_ul]:my-3 [&_ul]:list-inside [&_ul]:list-disc">
            <NoteContent content={note.content} />
          </div>
        </article>
      </div>
    </main>
  );
}
