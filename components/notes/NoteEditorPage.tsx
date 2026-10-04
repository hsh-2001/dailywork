"use client";

import NoteRichEditor from "@/components/notes/NoteRichEditor";
import { useCreateNote, useNote, useUpdateNote } from "@/hooks/note.hook";
import type { INoteRequest } from "@/shares/dtos/note/note";
import { Alert, Button, DatePicker, Form, Input, Skeleton } from "antd";
import { ArrowLeft, CalendarClock } from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type NoteEditorValues = Omit<INoteRequest, "deadline"> & { deadline?: Dayjs | null };

export default function NoteEditorPage({ noteId }: { noteId: number | null }) {
  const router = useRouter();
  const [form] = Form.useForm<NoteEditorValues>();
  const noteQuery = useNote(noteId ?? 0);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const note = noteQuery.data?.data;
  const isSaving = createNote.isPending || updateNote.isPending;
  const error = createNote.isError || updateNote.isError;

  useEffect(() => {
    if (note) form.setFieldsValue({ title: note.title, content: note.content, deadline: note.deadline ? dayjs(note.deadline) : null });
  }, [form, note]);

  const handleSave = async (values: NoteEditorValues) => {
    const data: INoteRequest = { title: values.title.trim(), content: values.content.trim(), deadline: values.deadline?.format("YYYY-MM-DD") ?? null };
    try {
      if (noteId === null) await createNote.mutateAsync(data);
      else await updateNote.mutateAsync({ id: noteId, data });
      router.push("/notes");
    } catch {
      // Keep the draft in the editor so the user can retry.
    }
  };

  if (noteId !== null && noteQuery.isLoading) {
    return <main className="mx-auto max-w-3xl px-4 py-5"><Skeleton active title paragraph={{ rows: 7 }} /></main>;
  }

  if (noteId !== null && (noteQuery.isError || !note)) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-5">
        <Alert type="error" showIcon message="Unable to load this note." action={<Button onClick={() => router.push("/notes")}>Back to notes</Button>} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-4xl p-2 sm:px-5 sm:py-4">
        <header className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-3 mb-3 flex min-h-10 items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50/95 px-3 py-2 backdrop-blur sm:-mx-5 sm:px-5 lg:top-16">
          <Button type="text" icon={<ArrowLeft size={16} />} onClick={() => router.push("/notes")} className="!pl-0 !text-slate-500 hover:!text-slate-900">
            Notes
          </Button>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-400 sm:inline">{isSaving ? "Saving…" : "Changes save when you click Save"}</span>
            <Button onClick={() => router.push("/notes")} disabled={isSaving}>Cancel</Button>
            <Button type="primary" htmlType="submit" form="note-editor-form" loading={isSaving} disabled={isSaving}>
              Save
            </Button>
          </div>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-2 sm:px-7 sm:py-6">
          {error && <Alert className="mb-4" type="error" showIcon message="Unable to save this note. Your draft is still here; try again." />}
          <Form<NoteEditorValues>
            id="note-editor-form"
            form={form}
            layout="vertical"
            onFinish={handleSave}
            requiredMark={false}
            initialValues={{ title: "", content: "", deadline: null }}
          >
            <Form.Item
              name="title"
              rules={[
                { required: true, whitespace: true, message: "Enter a title" },
                { max: 200, message: "Titles can be up to 200 characters" },
              ]}
              className="!mb-3"
            >
              <Input
                maxLength={200}
                aria-label="Note title"
                placeholder="Untitled"
                className="!h-auto !rounded-none !border-0 !px-0 !py-1 !text-2xl !font-semibold !shadow-none placeholder:!text-slate-300 focus:!shadow-none sm:!text-3xl"
              />
            </Form.Item>
            <Form.Item name="deadline" className="!mb-4">
              <DatePicker
                allowClear
                format="MMM D, YYYY"
                placeholder="Set a deadline"
                suffixIcon={<CalendarClock size={15} />}
                className="!w-full sm:!w-64"
              />
            </Form.Item>
            <Form.Item
              name="content"
              rules={[{ required: true, whitespace: true, message: "Enter some content" }]}
              className="!mb-0"
            >
              <NoteRichEditor />
            </Form.Item>
          </Form>
        </section>
      </div>
    </main>
  );
}
