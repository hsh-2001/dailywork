import { IRecordResponse } from "@/shares/dtos/record/recordResponse";
import { Button, Table, Tag } from "antd";
import { ColumnsType, TablePaginationConfig } from "antd/lib/table/interface";
import { Delete, Edit } from "lucide-react";

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

export default function RecordList({
  data,
  total,
  isLoading,
  pagination,
  onPaginationChange,
  onEdit,
  onDelete,
}: RecordListProps) {
  const columns: ColumnsType<IRecordResponse> = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Work Date", dataIndex: "workDate", key: "workDate" },
    {
      title: "Start Time",
      dataIndex: "startTime",
      key: "startTime",
      render: (value: string) =>
        new Date(value).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      title: "End Time",
      dataIndex: "endTime",
      key: "endTime",
      render: (value: string) =>
        new Date(value).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      title: "Total",
      dataIndex: "totalMinutes",
      key: "totalMinutes",
      render: (value: number | null) => {
        if (value == null) {
          return "-";
        }
        const hours = Math.floor(value / 60);
        const minutes = value % 60;
        return (
          <Tag>
            {" "}
            {hours}h {minutes}m{" "}
          </Tag>
        );
      },
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
      dataIndex: "id",
      key: "id",
      render: (value: number) => (
        <div className="flex gap-2">
          <Button onClick={() => onEdit(value)}>Edit</Button>
          <Button
            onClick={() => onDelete(value)}
            color="danger"
            variant="solid"
          >
            Delete
          </Button>
        </div>
      ),
    },
    {},
  ];

  const handleTableChange = (tablePagination: TablePaginationConfig) => {
    onPaginationChange({
      page: tablePagination.current ?? 1,
      pageSize: tablePagination.pageSize ?? 10,
    });
  };

  return (
    <Table<IRecordResponse>
      rowKey="id"
      columns={columns}
      dataSource={data ?? []}
      loading={isLoading}
      onChange={handleTableChange}
      pagination={{
        current: pagination.page ?? pagination.page,
        pageSize: pagination.pageSize ?? pagination.pageSize,
        total: total ?? 0,
        showSizeChanger: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} of ${total} records`,
        pageSizeOptions: [10, 20, 50, 100],
      }}
    />
  );
}
