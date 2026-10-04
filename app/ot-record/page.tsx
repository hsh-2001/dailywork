"use client";
import { useState } from "react";
import {
  useDeleteRecord,
  useRecords,
} from "@/hooks/record.hook";
import { Alert, Button, DatePicker, Select } from "antd";
import RecordList from "@/components/RecordList";
import { ClipboardList, Filter, Plus, RotateCcw } from "lucide-react";
import type { IRecordResponse } from "@/shares/dtos/record/recordResponse";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/project.hook";
import type { RecordFilters } from "@/shares/dtos/record/recordFilters";
import type { Dayjs } from "dayjs";

export default function OTRecordPage() {
  const router = useRouter();
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
  const [filters, setFilters] = useState<RecordFilters>({});
  const [project, setProject] = useState<string>();
  const [bookingStatus, setBookingStatus] = useState<string>();
  const [submitStatus, setSubmitStatus] = useState<string>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const { data, isLoading, isError, refetch } = useRecords({ ...pagination, ...filters });
  const projectsQuery = useProjects();

  const { mutate: deleteRecord } = useDeleteRecord();

  const handlePaginationChange = (pagination: {
    page: number;
    pageSize: number;
  }) => {
    setPagination(pagination);
  };

  const applyFilters = () => {
    setFilters({
      dateFrom: dateRange?.[0]?.format("YYYY-MM-DD"),
      dateTo: dateRange?.[1]?.format("YYYY-MM-DD"),
      project,
      bookingStatus,
      submitStatus,
    });
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const clearFilters = () => {
    setDateRange(null);
    setProject(undefined);
    setBookingStatus(undefined);
    setSubmitStatus(undefined);
    setFilters({});
    setPagination((current) => ({ ...current, page: 1 }));
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

            <div className="border-b border-slate-100 bg-slate-50/50 px-3.5 py-3 sm:px-5">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Filter size={14} className="text-slate-500" aria-hidden="true" />
                Filter work logs
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto_auto] lg:items-center">
                <DatePicker
                  allowClear
                  value={dateRange?.[0] ?? null}
                  onChange={(value) => setDateRange([value, dateRange?.[1] ?? null])}
                  disabledDate={(current) => Boolean(dateRange?.[1] && current.isAfter(dateRange[1], "day"))}
                  placeholder="From date"
                  className="!w-full"
                />
                <DatePicker
                  allowClear
                  value={dateRange?.[1] ?? null}
                  onChange={(value) => setDateRange([dateRange?.[0] ?? null, value])}
                  disabledDate={(current) => Boolean(dateRange?.[0] && current.isBefore(dateRange[0], "day"))}
                  placeholder="To date"
                  className="!w-full"
                />
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="All projects"
                  value={project}
                  onChange={setProject}
                  loading={projectsQuery.isLoading}
                  options={(projectsQuery.data?.data ?? []).map((item: { name: string }) => ({ value: item.name, label: item.name }))}
                />
                <Select
                  allowClear
                  placeholder="All booking statuses"
                  value={bookingStatus}
                  onChange={setBookingStatus}
                  options={[
                    { value: "PENDING", label: "Pending booking" },
                    { value: "BOOKED", label: "Booked" },
                    { value: "CANCELLED", label: "Booking cancelled" },
                  ]}
                />
                <Select
                  allowClear
                  placeholder="All submit statuses"
                  value={submitStatus}
                  onChange={setSubmitStatus}
                  options={[
                    { value: "NOT_SUBMITTED", label: "Not submitted" },
                    { value: "SUBMITTED", label: "Submitted" },
                    { value: "APPROVED", label: "Approved" },
                    { value: "REJECTED", label: "Rejected" },
                  ]}
                />
                <Button type="primary" onClick={applyFilters}>Apply</Button>
                <Button icon={<RotateCcw size={14} />} onClick={clearFilters}>Clear</Button>
              </div>
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
