"use client";

import DeleteNoteDialog from "@/components/notes/DeleteNoteDialog";
import NoteCard from "@/components/notes/NoteCard";
import NoteSearch from "@/components/notes/NoteSearch";
import {
  useDeleteNote,
  useNotes,
  useSetNotePinned,
  useSetNoteStatus,
} from "@/hooks/note.hook";
import type { INoteResponse } from "@/shares/dtos/note/note";
import { Alert, Button, Skeleton } from "antd";
import { Plus, StickyNote } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function NotesPage() {
  const router = useRouter();
  const notesQuery = useNotes();
  const setPinned = useSetNotePinned();
  const setStatus = useSetNoteStatus();
  const deleteNote = useDeleteNote();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [noteToDelete, setNoteToDelete] = useState<INoteResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const notes = useMemo(
    () => (notesQuery.data?.data ?? []) as INoteResponse[],
    [notesQuery.data?.data],
  );
  const activeCount = notes.filter((note) => note.status === "ACTIVE").length;
  const completedCount = notes.length - activeCount;
  const filteredNotes = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return [...notes]
      .filter(
        (note) =>
          (statusFilter === "ALL" || note.status === statusFilter) &&
          (!query || note.title.toLocaleLowerCase().includes(query) || note.content.toLocaleLowerCase().includes(query)),
      )
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [notes, search, statusFilter]);
  const pinnedNotes = filteredNotes.filter((note) => note.pinned);
  const otherNotes = filteredNotes.filter((note) => !note.pinned);

  const openCreate = () => router.push("/notes/new");

  const handleTogglePin = async (note: INoteResponse) => {
    setActionError(null);
    try {
      await setPinned.mutateAsync({ id: note.id, pinned: !note.pinned });
    } catch {
      setActionError("Unable to update the pinned state. Please try again.");
    }
  };

  const handleToggleStatus = async (note: INoteResponse) => {
    setActionError(null);
    try {
      await setStatus.mutateAsync({ id: note.id, status: note.status === "COMPLETED" ? "ACTIVE" : "COMPLETED" });
    } catch {
      setActionError("Unable to update note status. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;
    setDeleteError(null);
    try {
      await deleteNote.mutateAsync(noteToDelete.id);
      setNoteToDelete(null);
    } catch {
      setDeleteError("Unable to delete this note. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
        <header className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Your workspace</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Notes</h1>
              <p className="mt-2 max-w-md text-sm text-slate-500">Keep plans, ideas, and checklists together. Mark finished notes complete to clear overdue reminders.</p>
            </div>
            <Button type="primary" size="middle" icon={<Plus size={16} />} onClick={openCreate} className="!h-10 shrink-0 !rounded-lg !px-4 font-medium shadow-sm">New note</Button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:max-w-md sm:grid-cols-3">
            {[
              { label: "All notes", value: notes.length, color: "text-slate-950" },
              { label: "Active", value: activeCount, color: "text-slate-800" },
              { label: "Completed", value: completedCount, color: "text-slate-600" },
            ].map((stat) => <div key={stat.label} className="rounded-xl border border-white/90 bg-white/80 px-3.5 py-2.5 shadow-sm"><p className={`text-xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p><p className="mt-0.5 text-[11px] font-medium text-slate-500">{stat.label}</p></div>)}
          </div>
        </header>

        <div className="mb-5 max-w-2xl">
          <NoteSearch value={search} onChange={setSearch} />
        </div>

        <nav aria-label="Filter notes by status" className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 sm:w-fit">
          {([
            ["ALL", "All notes", notes.length], ["ACTIVE", "Active", activeCount], ["COMPLETED", "Completed", completedCount],
          ] as const).map(([status, label, count]) => <button key={status} type="button" aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)} className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${statusFilter === status ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
            {label}<span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${statusFilter === status ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>{count}</span>
          </button>)}
        </nav>

        {notesQuery.isError && (
          <Alert
            className="mb-4"
            type="error"
            showIcon
            message="Unable to load notes."
            action={
              <Button size="small" onClick={() => notesQuery.refetch()}>
                Try Again
              </Button>
            }
          />
        )}
        {actionError && (
          <Alert
            className="mb-4"
            type="error"
            showIcon
            message={actionError}
            closable
            onClose={() => setActionError(null)}
          />
        )}

        {notesQuery.isLoading ? (
          <section aria-label="Loading notes" className="space-y-2">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <Skeleton active title={{ width: "35%" }} paragraph={{ rows: 1 }} />
              </div>
            ))}
          </section>
        ) : notesQuery.isError ? null : filteredNotes.length > 0 ? (
          <div className="space-y-5">
            {[
              ...(pinnedNotes.length ? [{ title: "Pinned", notes: pinnedNotes }] : []),
              ...(otherNotes.length ? [{ title: search.trim() ? "Search results" : "All notes", notes: otherNotes }] : []),
            ].map((group) => (
              <section key={group.title} aria-label={group.title}>
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{group.title}<span className="ml-2 font-normal tracking-normal">{group.notes.length}</span></h2>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {group.notes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onOpen={(selected) => router.push(`/notes/${selected.id}`)}
                      onEdit={(selected) => router.push(`/notes/${selected.id}/edit`)}
                      onTogglePin={handleTogglePin}
                      onToggleStatus={handleToggleStatus}
                      onDelete={(selectedNote) => {
                        setDeleteError(null);
                        setNoteToDelete(selectedNote);
                      }}
                      isPinning={(setPinned.isPending && setPinned.variables?.id === note.id) || (setStatus.isPending && setStatus.variables?.id === note.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : search.trim() || statusFilter !== "ALL" ? (
          <div className="rounded-lg border border-slate-200 bg-white px-5 py-10 text-center">
            <h2 className="text-sm font-semibold text-slate-900">No matching notes.</h2>
            <p className="mt-1 text-sm text-slate-500">Try another status or search term.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white px-5 py-10 text-center">
            <span className="mx-auto flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <StickyNote size={19} aria-hidden="true" />
            </span>
            <h2 className="mt-3 text-sm font-semibold text-slate-900">No notes yet.</h2>
            <p className="mt-1 text-sm text-slate-500">Create your first note.</p>
            <Button type="primary" size="small" icon={<Plus size={15} />} onClick={openCreate} className="mt-4">
              New Note
            </Button>
          </div>
        )}
      </div>

      <DeleteNoteDialog
        note={noteToDelete}
        isDeleting={deleteNote.isPending}
        error={deleteError}
        onCancel={() => {
          if (deleteNote.isPending) return;
          setNoteToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
      />
    </main>
  );
}
