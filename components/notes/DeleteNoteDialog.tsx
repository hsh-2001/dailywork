"use client";

import { Alert, Button, Modal } from "antd";
import type { INoteResponse } from "@/shares/dtos/note/note";

interface DeleteNoteDialogProps {
  note: INoteResponse | null;
  isDeleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteNoteDialog({
  note,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}: DeleteNoteDialogProps) {
  return (
    <Modal
      title="Delete this note?"
      open={Boolean(note)}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
      closable={!isDeleting}
      maskClosable={!isDeleting}
    >
      <p className="text-sm text-slate-600">This action cannot be undone.</p>
      {note && <p className="mt-2 truncate text-sm font-medium text-slate-800">{note.title}</p>}
      {error && <Alert className="mt-4" type="error" showIcon message={error} />}
      <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
        <Button onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button danger type="primary" loading={isDeleting} onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
