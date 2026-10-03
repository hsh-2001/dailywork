"use client";

import NoteRichEditor from "@/components/notes/NoteRichEditor";
import { useCreateNote, useNote, useUpdateNote } from "@/hooks/note.hook";
import type { INoteRequest } from "@/shares/dtos/note/note";
import { Alert, Button, Form, Input, Skeleton } from "antd";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NoteEditorPage({ noteId }: { noteId: number | null }) {
  const router = useRouter();
  const [form] = Form.useForm<INoteRequest>();
  const noteQuery = useNote(noteId ?? 0);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const note = noteQuery.data?.data;
  const isSaving = createNote.isPending || updateNote.isPending;
  const error = createNote.isError || updateNote.isError;

  useEffect(() => {
    if (note) form.setFieldsValue({ title: note.title, content: note.content });
  }, [form, note]);

  const handleSave = async (values: INoteRequest) => {
    const data = { title: values.title.trim(), content: values.content.trim() };
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
      <div className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-5 sm:py-4">
        <header className="mb-3 flex min-h-10 items-center justify-between gap-3">
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

        <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 sm:px-7 sm:py-6">
          {error && <Alert className="mb-4" type="error" showIcon message="Unable to save this note. Your draft is still here; try again." />}
          <Form<INoteRequest>
            id="note-editor-form"
            form={form}
            layout="vertical"
            onFinish={handleSave}
            requiredMark={false}
            initialValues={{ title: "", content: "" }}
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
