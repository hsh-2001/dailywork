"use client";
import { useState } from "react";
import {
  useDeleteRecord,
  useRecords,
} from "@/hooks/record.hook";
import { Alert, Button } from "antd";
import RecordList from "@/components/RecordList";
import { ClipboardList, Plus } from "lucide-react";
import { IRecordResponse } from "@/shares/dtos/record/recordResponse";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OTRecordPage() {
  const router = useRouter();
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
  const { data, isLoading, isError, refetch } = useRecords(pagination);

  const { mutate: deleteRecord } = useDeleteRecord();

  const handlePaginationChange = (pagination: {
    page: number;
    pageSize: number;
  }) => {
    setPagination(pagination);
  };

  const handleEdit = (record: IRecordResponse) => {
    const query = new URLSearchParams({ record: JSON.stringify(record) });
    router.push(`/ot-record/add?${query.toString()}`);
  };

  const total = data?.pagination?.total ?? 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
        <header className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              Work logs
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Track overtime by date and project.
            </p>
          </div>

          <Link href="/ot-record/add" className="shrink-0">
            <Button
              type="primary"
              icon={<Plus size={16} />}
              size="small"
              aria-label="Add work log"
              title="Add work log"
              className="!h-8 !w-8 !px-0"
            />
          </Link>
        </header>

        {isError ? (
          <Alert
            type="error"
            showIcon
            title="Couldn't load overtime records"
            description="Check your connection and try again."
            action={
              <Button size="small" danger onClick={() => refetch()}>
                Try again
              </Button>
            }
          />
        ) : (
          <section aria-labelledby="work-log-list-title" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3.5 py-2 sm:px-5">
              <div>
                <h2 id="work-log-list-title" className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                  <ClipboardList size={15} className="text-blue-700" aria-hidden="true" />
                  All entries
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-600">
                {total} {total === 1 ? "entry" : "entries"}
              </span>
            </div>

            <RecordList
              data={data?.data ?? []}
              pagination={pagination}
              isLoading={isLoading}
              total={total}
              onPaginationChange={handlePaginationChange}
              onEdit={(id: number) => {
                const record = data?.data.find((item: IRecordResponse) => item.id === id);
                if (record) handleEdit(record);
              }}
              onDelete={(id: number) => {
                if (!window.confirm("Delete this record? This can't be undone.")) return;
                deleteRecord(id, {
                  onError: (error) => console.error("Error deleting record:", error),
                });
              }}
            />
          </section>
        )}
      </div>
    </main>
  );
}
