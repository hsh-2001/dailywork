import { Skeleton } from "antd";

export default function LoadingNote() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <Skeleton active title paragraph={{ rows: 7 }} />
    </main>
  );
}
