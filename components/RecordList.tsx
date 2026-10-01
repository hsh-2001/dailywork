import { IRecordResponse } from "@/shares/dtos/record/recordResponse";
import { Button, Empty, Grid, Pagination, Spin, Table, Tag } from "antd";
import { ColumnsType, TablePaginationConfig } from "antd/lib/table/interface";
import { Clock, Pencil, Trash2 } from "lucide-react";
import { formatTime } from "@/utils/datetime"; // GMT+7 helper

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
  if (value == null) return "-";
  return `${Math.floor(value / 60)}h ${value % 60}m`;
};

export default function RecordList({
  data,
  total,
  isLoading,
  pagination,
  onPaginationChange,
  onEdit,
  onDelete,
}: RecordListProps) {
  const screens = Grid.useBreakpoint();
  // `screens` is {} on the first render, so only treat as mobile once md is explicitly false
  const isMobile = screens.md === false;

  const columns: ColumnsType<IRecordResponse> = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Work Date", dataIndex: "workDate", key: "workDate" },
    {
      title: "Start Time",
      dataIndex: "startTime",
      key: "startTime",
      render: formatTime,
    },
    {
      title: "End Time",
      dataIndex: "endTime",
      key: "endTime",
      render: formatTime,
    },
    {
      title: "Total",
      dataIndex: "totalMinutes",
      key: "totalMinutes",
      render: (value: number | null) =>
        value == null ? "-" : <Tag>{formatTotal(value)}</Tag>,
    },
    {
      title: "Project",
      dataIndex: "project",
      key: "project",
      render: (value: string | null) => value || "-",
    },
    {
      title: "Task",
      dataIndex: "task",
      key: "task",
      render: (value: string | null) => value || "-",
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      render: (value: string | null) => value || "-",
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button onClick={() => onEdit(record.id)}>Edit</Button>
          <Button
            onClick={() => onDelete(record.id)}
            color="danger"
            variant="solid"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleTableChange = (tablePagination: TablePaginationConfig) => {
    onPaginationChange({
      page: tablePagination.current ?? 1,
      pageSize: tablePagination.pageSize ?? 10,
    });
  };

  if (isMobile) {
    return (
      <Spin spinning={isLoading}>
        <div className="flex flex-col gap-3">
          {data.length === 0 && !isLoading && (
            <Empty description="No records" />
          )}

          {data.map((record) => (
            <div
              key={record.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              {/* Header: date + total */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{record.workDate}</div>
                  <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <Clock size={14} />
                    {formatTime(record.startTime)} –{" "}
                    {formatTime(record.endTime)}
                  </div>
                </div>
                {record.totalMinutes != null && (
                  <Tag className="!m-0">{formatTotal(record.totalMinutes)}</Tag>
                )}
              </div>

              {/* Details */}
              {(record.project || record.task || record.note) && (
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  {record.project && (
                    <>
                      <dt className="text-gray-500">Project</dt>
                      <dd className="m-0 break-words">{record.project}</dd>
                    </>
                  )}
                  {record.task && (
                    <>
                      <dt className="text-gray-500">Task</dt>
                      <dd className="m-0 break-words">{record.task}</dd>
                    </>
                  )}
                  {record.note && (
                    <>
                      <dt className="text-gray-500">Note</dt>
                      <dd className="m-0 break-words">{record.note}</dd>
                    </>
                  )}
                </dl>
              )}

              {/* Actions */}
              <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                <Button
                  block
                  icon={<Pencil size={14} />}
                  onClick={() => onEdit(record.id)}
                >
                  Edit
                </Button>
                <Button
                  block
                  color="danger"
                  variant="solid"
                  icon={<Trash2 size={14} />}
                  onClick={() => onDelete(record.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}

          <Pagination
            className="flex justify-center"
            size="small"
            simple
            current={pagination.page}
            pageSize={pagination.pageSize}
            total={total ?? 0}
            showSizeChanger={false}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onChange={(page, pageSize) => onPaginationChange({ page, pageSize })}
          />
          <div className="text-center text-xs text-gray-500">
            {total ?? 0} records
          </div>
        </div>
      </Spin>
    );
  }

  return (
    <Table<IRecordResponse>
      rowKey="id"
      columns={columns}
      dataSource={data ?? []}
      loading={isLoading}
      onChange={handleTableChange}
      scroll={{ x: "max-content" }} // horizontal scroll on tablets / narrow windows
      pagination={{
        current: pagination.page,
        pageSize: pagination.pageSize,
        total: total ?? 0,
        showSizeChanger: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} of ${total} records`,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
      }}
    />
  );
}