import Link from "next/link";
import { Button, Grid, Pagination, Skeleton } from "antd";
import { ArrowRight, CalendarDays, Clock3, Pencil, Trash2 } from "lucide-react";
import type { IRecordResponse } from "@/shares/dtos/record/recordResponse";
import { formatTime } from "@/utils/datetime";

interface RecordListProps {
  data: IRecordResponse[];
  isLoading: boolean;
  total: number;
  pagination: {
    page: number;
    pageSize: number;
  };
  onPaginationChange: (pagination: { page: number; pageSize: number }) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const formatTotal = (value: number | null) => {
  if (value == null) return "—";
  return `${Math.floor(value / 60)}h ${value % 60}m`;
};

function LoadingRecords() {
  return (
    <div aria-label="Loading work logs" className="divide-y divide-slate-100">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="grid gap-3 px-4 py-3.5 md:grid-cols-[1fr_1fr_1.3fr_auto] md:items-center md:px-5"
        >
          <Skeleton active title={{ width: "45%" }} paragraph={{ rows: 1, width: "65%" }} />
          <Skeleton active title={false} paragraph={{ rows: 1, width: "75%" }} />
          <Skeleton active title={{ width: "35%" }} paragraph={{ rows: 1, width: "70%" }} />
          <Skeleton.Button active size="small" />
        </div>
      ))}
    </div>
  );
}

export default function RecordList({
  data,
  total,
  isLoading,
  pagination,
  onPaginationChange,
  onEdit,
  onDelete,
}: RecordListProps) {
  const hasRecords = data.length > 0;
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const firstItem = hasRecords
    ? (pagination.page - 1) * pagination.pageSize + 1
    : 0;
  const lastItem = hasRecords ? firstItem + data.length - 1 : 0;

  return (
    <>
      {isLoading ? (
        <LoadingRecords />
      ) : hasRecords ? (
        <>
          <div className="hidden grid-cols-[1fr_1fr_1.3fr_auto] gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Work date</span>
            <span>Hours</span>
            <span>Project &amp; task</span>
            <span className="pr-1">Duration</span>
          </div>

          <ul className="divide-y divide-slate-100">
            {data.map((record) => (
              <li key={record.id} className="group px-3.5 py-2.5 transition-colors hover:bg-slate-50/70 sm:px-5 md:py-3">
                <div className="md:hidden">
                  <div className="flex min-h-9 items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-[13px] font-semibold text-slate-900">
                      {record.workDate}
                    </p>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-blue-800">
                        {formatTotal(record.totalMinutes)}
                      </span>
                      <Button
                        size="small"
                        variant="text"
                        icon={<Pencil size={16} />}
                        aria-label={`Edit work log from ${record.workDate}`}
                        onClick={() => onEdit(record.id)}
                        title="Edit work log"
                        className="!h-8 !w-8 !min-w-8 !border-0 !bg-transparent !p-0 !text-blue-600 !shadow-none hover:!bg-transparent hover:!text-blue-800"
                      />
                      <Button
                        size="small"
                        color="danger"
                        variant="text"
                        icon={<Trash2 size={14} />}
                        aria-label={`Delete work log from ${record.workDate}`}
                        onClick={() => onDelete(record.id)}
                        className="!h-8 !min-w-8"
                      />
                    </div>
                  </div>
                  <div className="mt-0.5 flex min-w-0 items-center justify-between gap-2 text-[11px] leading-4">
                    <p className="min-w-0 truncate font-medium text-slate-700">
                      {[record.project, record.task].filter(Boolean).join(" · ") || "No project or task"}
                    </p>
                    <p className="flex shrink-0 items-center gap-1 whitespace-nowrap tabular-nums text-slate-500">
                      <Clock3 size={12} aria-hidden="true" />
                      {formatTime(record.startTime)}–{formatTime(record.endTime)}
                    </p>
                  </div>
                  {record.note && (
                    <p className="mt-1 line-clamp-2 whitespace-pre-line break-words border-l-2 border-slate-200 pl-2 text-[11px] leading-4 text-slate-500">
                      {record.note}
                    </p>
                  )}
                </div>

                <div className="hidden md:grid md:grid-cols-[1fr_1fr_1.3fr_auto] md:items-center md:gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <CalendarDays size={15} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-900">{record.workDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[13px] text-slate-600 md:pl-0">
                    <Clock3 size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="tabular-nums">{formatTime(record.startTime)} – {formatTime(record.endTime)}</span>
                  </div>

                  <div className="min-w-0 md:pr-2">
                    <p className="truncate text-[13px] font-medium text-slate-800">
                      {record.project || record.task || "No project or task"}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {record.project && record.task
                        ? record.task
                        : record.note || (record.project ? "No task details" : "Add project or task details")}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 md:justify-end md:border-0 md:pt-0">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-blue-800">
                      {formatTotal(record.totalMinutes)}
                    </span>
                    <div className="ml-2 flex items-center gap-1 md:ml-2">
                      <Button
                        size="small"
                        variant="text"
                        icon={<Pencil size={16} />}
                        aria-label={`Edit work log from ${record.workDate}`}
                        onClick={() => onEdit(record.id)}
                        title="Edit work log"
                        className="!h-8 !w-8 !min-w-8 !border-0 !bg-transparent !p-0 !text-blue-600 !shadow-none hover:!bg-transparent hover:!text-blue-800"
                      />
                      <Button
                        size="small"
                        color="danger"
                        variant="text"
                        icon={<Trash2 size={14} />}
                        aria-label={`Delete work log from ${record.workDate}`}
                        onClick={() => onDelete(record.id)}
                        className="!h-8 !min-w-8"
                      />
                    </div>
                  </div>
                </div>

                {record.note && record.project && record.task && (
                  <p className="mt-2 hidden line-clamp-2 whitespace-pre-line break-words border-l-2 border-slate-200 pl-2.5 text-[11px] leading-4 text-slate-500 md:ml-10 md:block">
                    {record.note}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-slate-500">
              Showing {firstItem}–{lastItem} of {total} work logs
            </p>
            <Pagination
              size="small"
              current={pagination.page}
              pageSize={pagination.pageSize}
              total={total}
              showSizeChanger={!isMobile}
              simple={isMobile}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onChange={(page, pageSize) => onPaginationChange({ page, pageSize })}
            />
          </div>
        </>
      ) : (
        <div className="px-5 py-12 text-center sm:py-16">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <CalendarDays size={22} aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">No work logs yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
            Add your first entry to keep your hours and project details together.
          </p>
          <Link href="/ot-record/add" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            Add work log <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      )}
    </>
  );
}
