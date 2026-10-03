"use client";

import DeleteNoteDialog from "@/components/notes/DeleteNoteDialog";
import NoteCard from "@/components/notes/NoteCard";
import NoteSearch from "@/components/notes/NoteSearch";
import {
  useDeleteNote,
  useNotes,
  useSetNotePinned,
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
  const deleteNote = useDeleteNote();

  const [search, setSearch] = useState("");
  const [noteToDelete, setNoteToDelete] = useState<INoteResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const notes = (notesQuery.data?.data ?? []) as INoteResponse[];
  const filteredNotes = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return [...notes]
      .filter(
        (note) =>
          !query ||
          note.title.toLocaleLowerCase().includes(query) ||
          note.content.toLocaleLowerCase().includes(query),
      )
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [notes, search]);
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
        <header className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Your workspace</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Notes
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Capture ideas and keep important details close.
            </p>
          </div>
          <Button
            type="primary"
            size="middle"
            icon={<Plus size={16} />}
            onClick={openCreate}
            className="!h-10 shrink-0 !rounded-lg !px-4 font-medium shadow-sm"
          >
            New note
          </Button>
        </header>

        <div className="mb-5 max-w-2xl">
          <NoteSearch value={search} onChange={setSearch} />
        </div>

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
                <div className="space-y-1.5">
                  {group.notes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onOpen={(selected) => router.push(`/notes/${selected.id}`)}
                      onEdit={(selected) => router.push(`/notes/${selected.id}/edit`)}
                      onTogglePin={handleTogglePin}
                      onDelete={(selectedNote) => {
                        setDeleteError(null);
                        setNoteToDelete(selectedNote);
                      }}
                      isPinning={setPinned.isPending && setPinned.variables?.id === note.id}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : search.trim() ? (
          <div className="rounded-lg border border-slate-200 bg-white px-5 py-10 text-center">
            <h2 className="text-sm font-semibold text-slate-900">No notes found.</h2>
            <p className="mt-1 text-sm text-slate-500">Try a different search.</p>
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
