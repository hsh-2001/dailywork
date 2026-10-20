"use client";
import { useState } from "react";
import {
  useDeleteRecordDraft,
  useDeleteRecord,
  useRecordDrafts,
  useRecords,
  useUpdateRecordStatuses,
} from "@/hooks/record.hook";
import { Alert, Button, Checkbox, DatePicker, Grid, message, Modal, Select } from "antd";
import RecordList from "@/components/RecordList";
import { Check, ChevronDown, ClipboardList, Clock3, Coffee, Filter, Plus, RotateCcw } from "lucide-react";
import MobileDatePicker from "@/components/MobileDatePicker";
import type {
  IRecordResponse,
} from "@/shares/dtos/record/recordResponse";
import type { BookingStatus, SubmitStatus } from "@/shares/dtos/record/recordResponse";
import type { IRecordDraft } from "@/shares/dtos/record/recordDraft";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/project.hook";
import type { RecordFilters } from "@/shares/dtos/record/recordFilters";
import type { Dayjs } from "dayjs";
import { formatTime } from "@/utils/datetime";

const formatTotal = (minutes: number | null) =>
  minutes == null ? "—" : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

export default function OTRecordClient() {
  const router = useRouter();
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
  const [filters, setFilters] = useState<RecordFilters>({});
  const [project, setProject] = useState<string>();
  const [bookingStatus, setBookingStatus] = useState<string>();
  const [submitStatus, setSubmitStatus] = useState<string>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isWeekdaySummaryOpen, setIsWeekdaySummaryOpen] = useState(false);
  const [selectedWeekday, setSelectedWeekday] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkBookingStatus, setBulkBookingStatus] = useState<BookingStatus>();
  const [bulkSubmitStatus, setBulkSubmitStatus] = useState<SubmitStatus>();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const { data, isLoading, isError, refetch } = useRecords({ ...pagination, ...filters });
  const weekdayRecordsQuery = useRecords(
    { page: 1, pageSize: 100, ...filters },
    selectedWeekday !== null,
  );
  const activeFilterCount = [
    filters.dateFrom || filters.dateTo,
    filters.project,
    filters.bookingStatus,
    filters.submitStatus,
  ].filter(Boolean).length;
  const draftsQuery = useRecordDrafts();
  const projectsQuery = useProjects();

  const { mutate: deleteRecord } = useDeleteRecord();
  const { mutate: deleteDraft } = useDeleteRecordDraft();
  const { mutate: updateStatuses, isPending: isUpdatingStatuses } = useUpdateRecordStatuses();

  const clearSelection = () => {
    setSelectedIds([]);
    setBulkBookingStatus(undefined);
    setBulkSubmitStatus(undefined);
  };

  const handlePaginationChange = (pagination: {
    page: number;
    pageSize: number;
  }) => {
    clearSelection();
    setPagination(pagination);
  };

  const applyFilters = () => {
    clearSelection();
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
    clearSelection();
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

  const selectCurrentPage = (checked: boolean) => {
    if (!checked) {
      clearSelection();
      return;
    }
    setSelectedIds((data?.data ?? []).map((record: IRecordResponse) => record.id));
  };

  const handleSelectionChange = (ids: number[]) => {
    setSelectedIds(ids);
    if (ids.length === 0) {
      setBulkBookingStatus(undefined);
      setBulkSubmitStatus(undefined);
    }
  };

  const applyBulkStatuses = () => {
    if (selectedIds.length === 0 || (!bulkBookingStatus && !bulkSubmitStatus)) return;

    updateStatuses(
      {
        ids: selectedIds,
        ...(bulkBookingStatus ? { bookingStatus: bulkBookingStatus } : {}),
        ...(bulkSubmitStatus ? { submitStatus: bulkSubmitStatus } : {}),
      },
      {
        onSuccess: () => {
          clearSelection();
          message.success("Selected work log statuses updated");
        },
        onError: () => {
          message.error("Couldn't update work log statuses. Please try again.");
        },
      },
    );
  };

  const total = data?.pagination?.total ?? 0;
  const totalMinutes = data?.summary?.totalMinutes ?? 0;
  const totalHoursLabel = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  const currentPageRecords = data?.data ?? [];
  const allCurrentPageSelected =
    currentPageRecords.length > 0 && selectedIds.length === currentPageRecords.length;
  const selectedWeekdayRecords = (weekdayRecordsQuery.data?.data ?? []).filter((record) => {
    if (!selectedWeekday) return false;
    const weekday = new Date(`${record.workDate}T00:00:00Z`).getUTCDay();
    const weekdayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][weekday];
    return weekdayName === selectedWeekday;
  });

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

        {draftsQuery.isError && (
          <Alert
            className="mb-4"
            type="error"
            showIcon
            title="Couldn't load in-progress OT drafts"
            description="Check your Redis connection and try again."
            action={
              <Button size="small" danger onClick={() => draftsQuery.refetch()}>
                Try again
              </Button>
            }
          />
        )}

        {(draftsQuery.data?.length ?? 0) > 0 && (
          <section aria-labelledby="ot-drafts-title" className="mb-4 overflow-hidden rounded-xl border border-amber-200 bg-white">
            <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/60 px-4 py-3 sm:px-5">
              <div>
                <h2 id="ot-drafts-title" className="text-sm font-semibold text-slate-900">In-progress OT drafts</h2>
                <p className="mt-0.5 text-xs text-slate-500">Finish these to save them to your work logs.</p>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                {draftsQuery.data?.length}
              </span>
            </div>
            <ul className="divide-y divide-slate-100">
              {draftsQuery.data?.map((draft: IRecordDraft) => (
                <li key={draft.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{draft.workDate}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-600">
                      {formatTime(draft.startTime)} · {[draft.project, draft.task].filter(Boolean).join(" · ") || "No project or task"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="small"
                      danger
                      onClick={() => {
                        if (!window.confirm("Delete this unfinished OT draft?")) return;
                        deleteDraft(draft.id, {
                          onError: () => message.error("Couldn't delete OT draft. Please try again."),
                        });
                      }}
                    >
                      Discard
                    </Button>
                    <Link href={`/ot-record/add?draft=${encodeURIComponent(draft.id)}`}>
                      <Button size="small" type="primary">Finish</Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

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
              <button
                type="button"
                aria-expanded={isFilterOpen}
                aria-controls="work-log-filters"
                aria-label={`${isFilterOpen ? "Hide" : "Show"} work log filters`}
                onClick={() => setIsFilterOpen((isOpen) => !isOpen)}
                className="mb-2 flex w-full items-center justify-between text-left text-xs font-semibold text-slate-700"
              >
                <span className="flex items-center gap-1.5">
                  <Filter size={14} className="text-slate-500" aria-hidden="true" />
                  Filter work logs
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-blue-800" aria-label={`${activeFilterCount} active filters`}>
                      {activeFilterCount} active
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  {isFilterOpen ? "Hide" : "Show"}
                  <ChevronDown
                    size={14}
                    aria-hidden="true"
                    className={`transition-transform ${isFilterOpen ? "rotate-180" : ""}`}
                  />
                </span>
              </button>
              <div
                id="work-log-filters"
                hidden={!isFilterOpen}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto_auto] lg:items-center"
              >
                {isMobile ? (
                  <MobileDatePicker
                    allowClear
                    title="From date"
                    placeholder="From date"
                    value={dateRange?.[0] ?? null}
                    max={dateRange?.[1] ? new Date(dateRange[1].year(), dateRange[1].month(), dateRange[1].date()) : undefined}
                    onChange={(value) => setDateRange([value, dateRange?.[1] ?? null])}
                  />
                ) : (
                  <DatePicker
                    allowClear
                    value={dateRange?.[0] ?? null}
                    onChange={(value) => setDateRange([value, dateRange?.[1] ?? null])}
                    disabledDate={(current) => Boolean(dateRange?.[1] && current.isAfter(dateRange[1], "day"))}
                    placeholder="From date"
                    className="!w-full"
                  />
                )}
                {isMobile ? (
                  <MobileDatePicker
                    allowClear
                    title="To date"
                    placeholder="To date"
                    value={dateRange?.[1] ?? null}
                    min={dateRange?.[0] ? new Date(dateRange[0].year(), dateRange[0].month(), dateRange[0].date()) : undefined}
                    onChange={(value) => setDateRange([dateRange?.[0] ?? null, value])}
                  />
                ) : (
                  <DatePicker
                    allowClear
                    value={dateRange?.[1] ?? null}
                    onChange={(value) => setDateRange([dateRange?.[0] ?? null, value])}
                    disabledDate={(current) => Boolean(dateRange?.[0] && current.isBefore(dateRange[0], "day"))}
                    placeholder="To date"
                    className="!w-full"
                  />
                )}
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

            <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50/60 px-3.5 py-2.5 sm:px-5">
              <span className="text-xs font-medium text-slate-600">Total hours{activeFilterCount > 0 ? " (filtered)" : ""}</span>
              <span className="text-sm font-bold tabular-nums text-blue-800">{totalHoursLabel}</span>
            </div>
            {(data?.summary?.weekdays?.length ?? 0) > 0 && (
              <div className="border-b border-slate-100 px-3.5 py-3 sm:px-5">
                <button
                  type="button"
                  aria-expanded={isWeekdaySummaryOpen}
                  aria-controls="weekday-hours-summary"
                  onClick={() => setIsWeekdaySummaryOpen((isOpen) => !isOpen)}
                  className="flex w-full items-center justify-between text-left text-xs font-semibold text-slate-700"
                >
                  <span>
                    <span className="block">Hours by weekday{activeFilterCount > 0 ? " (filtered)" : ""}</span>
                  </span>
                  <span className="flex items-center gap-1 font-medium text-slate-500">
                    {isWeekdaySummaryOpen ? "Hide" : "Show"}
                    <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${isWeekdaySummaryOpen ? "rotate-180" : ""}`} />
                  </span>
                </button>
                <ul id="weekday-hours-summary" hidden={!isWeekdaySummaryOpen} className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
                  {data?.summary?.weekdays?.map((day) => (
                    <li key={day.day}>
                      <button
                        type="button"
                        onClick={() => setSelectedWeekday(day.day)}
                        aria-label={`Show ${day.day} work log details`}
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-left transition hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-blue-500"
                      >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-medium text-slate-600">{day.day.slice(0, 3)}</span>
                        <span className="text-xs font-semibold tabular-nums text-blue-800">
                          {Math.floor(day.totalMinutes / 60)}h {day.totalMinutes % 60}m
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] leading-4 tabular-nums text-slate-500">
                        <Coffee size={11} aria-hidden="true" className="shrink-0 text-amber-600" />
                        <span>Break</span>
                        <span className="ml-auto font-medium text-slate-700">
                          {day.breakMinutes > 0
                            ? `${Math.floor(day.breakMinutes / 60)}h ${day.breakMinutes % 60}m`
                            : "—"}
                        </span>
                      </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {currentPageRecords.length > 0 && (
              <div className="flex flex-col gap-2 border-b border-slate-100 px-3.5 py-3 sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Checkbox
                    checked={allCurrentPageSelected}
                    indeterminate={selectedIds.length > 0 && !allCurrentPageSelected}
                    onChange={(event) => selectCurrentPage(event.target.checked)}
                    disabled={isUpdatingStatuses}
                    aria-label="Select all work logs on this page"
                  >
                    Select page
                  </Checkbox>
                  {selectedIds.length > 0 && (
                    <span className="text-xs text-slate-500">
                      {selectedIds.length} selected
                    </span>
                  )}
                </div>
                {selectedIds.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
                    <Select
                      allowClear
                      placeholder="Keep booking status"
                      value={bulkBookingStatus}
                      disabled={isUpdatingStatuses}
                      onChange={(value: BookingStatus | undefined) => setBulkBookingStatus(value)}
                      options={[
                        { value: "PENDING", label: "Pending booking" },
                        { value: "BOOKED", label: "Booked" },
                        { value: "CANCELLED", label: "Booking cancelled" },
                      ]}
                    />
                    <Select
                      allowClear
                      placeholder="Keep submit status"
                      value={bulkSubmitStatus}
                      disabled={isUpdatingStatuses}
                      onChange={(value: SubmitStatus | undefined) => setBulkSubmitStatus(value)}
                      options={[
                        { value: "NOT_SUBMITTED", label: "Not submitted" },
                        { value: "SUBMITTED", label: "Submitted" },
                        { value: "APPROVED", label: "Approved" },
                        { value: "REJECTED", label: "Rejected" },
                      ]}
                    />
                    <Button
                      type="primary"
                      icon={<Check size={14} />}
                      onClick={applyBulkStatuses}
                      disabled={!bulkBookingStatus && !bulkSubmitStatus}
                      loading={isUpdatingStatuses}
                    >
                      Update {selectedIds.length} selected
                    </Button>
                  </div>
                )}
              </div>
            )}

            <RecordList
              data={data?.data ?? []}
              selectedIds={selectedIds}
              selectionDisabled={isUpdatingStatuses}
              onSelectionChange={handleSelectionChange}
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
      <Modal
        title={selectedWeekday ? `${selectedWeekday} work logs` : "Work logs"}
        open={selectedWeekday !== null}
        onCancel={() => setSelectedWeekday(null)}
        footer={null}
        destroyOnHidden
      >
        {weekdayRecordsQuery.isFetching ? (
          <p className="py-6 text-center text-sm text-slate-500">Loading work log details…</p>
        ) : weekdayRecordsQuery.isError ? (
          <div className="py-4">
            <Alert type="error" showIcon message="Unable to load work log details." />
            <Button className="mt-3" onClick={() => weekdayRecordsQuery.refetch()}>Try again</Button>
          </div>
        ) : selectedWeekdayRecords.length ? (
          <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
            {selectedWeekdayRecords.map((record) => (
              <li key={record.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{record.workDate}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs tabular-nums text-slate-600">
                      <Clock3 size={13} aria-hidden="true" />
                      {formatTime(record.startTime)} – {record.endTime ? formatTime(record.endTime) : "In progress"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold tabular-nums text-blue-800">
                    {formatTotal(record.totalMinutes)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-700">{[record.project, record.task].filter(Boolean).join(" · ") || "No project or task"}</p>
                {(record.breakStartTime || record.breakEndTime) && (
                  <p className="mt-1 text-xs text-slate-500">
                    Break: {record.breakStartTime ? formatTime(record.breakStartTime) : "—"} – {record.breakEndTime ? formatTime(record.breakEndTime) : "—"}
                  </p>
                )}
                {record.note && <p className="mt-1 whitespace-pre-line text-xs text-slate-500">{record.note}</p>}
                <p className="mt-2 text-[10px] text-slate-500">{record.bookingStatus.replaceAll("_", " ")} · {record.submitStatus.replaceAll("_", " ")}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">No {selectedWeekday?.toLowerCase()} work logs match the current filters.</p>
        )}
        {(weekdayRecordsQuery.data?.pagination.total ?? 0) > 100 && (
          <p className="mt-3 text-xs text-slate-500">Showing the first 100 matching work logs.</p>
        )}
      </Modal>
    </main>
  );
}
