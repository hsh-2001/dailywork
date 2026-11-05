import NoteEditRoute from "@/components/notes/NoteEditRoute";
import { Skeleton } from "antd";
import { Suspense } from "react";

export default function NoteEditRoutePage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-5"><Skeleton active title paragraph={{ rows: 7 }} /></main>}>
      <NoteEditRoute />
    </Suspense>
  );
}
