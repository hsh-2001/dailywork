"use client";
import { useState } from "react";
import {
  useDeleteRecord,
  useRecords,
} from "@/hooks/record.hook";
import { Alert, Button } from "antd";
import RecordList from "@/components/RecordList";
import { Clock, Plus } from "lucide-react";
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
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <header className="mb-7 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Your workspace</p>
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/20">
                <Clock size={22} strokeWidth={2.2} />
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">
                  Work logs
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Keep track of your overtime, one entry at a time.
                </p>
              </div>
            </div>
          </div>

          <Link href="/ot-record/add" className="block w-full sm:w-auto">
            <Button
              type="primary"
              size="large"
              icon={<Plus size={16} />}
              className="w-full sm:w-auto"
            >
              New record
            </Button>
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
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">All work logs</h2>
                <p className="mt-0.5 text-xs text-slate-500">Review and manage your entries</p>
              </div>
              {!isLoading && (
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold tabular-nums text-blue-700">
                  {total} {total === 1 ? "entry" : "entries"}
                </span>
              )}
            </div>

            <div className="overflow-x-auto p-2 sm:p-3">
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
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
