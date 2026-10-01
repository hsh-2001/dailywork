"use client";
import { useState } from "react";
import {
  useCreateRecord,
  useDeleteRecord,
  useRecords,
  useUpdateRecord,
} from "@/hooks/record.hook";
import { Alert, Button, Form, Modal } from "antd";
import RecordList from "@/components/RecordList";
import OTRecordForm from "@/components/OTRecordForm";
import { Clock, Plus } from "lucide-react";
import { IRecordResponse } from "@/shares/dtos/record/recordResponse";
import dayjs from "dayjs";
import { toDateString } from "@/utils/datetime";

export default function OTRecordPage() {
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
  const { data, isLoading, isError, refetch } = useRecords(pagination);
  const [updateId, setUpdateId] = useState<number | null>(null);
  const [ loading, setLoading ] = useState(false);

  const { mutate: createRecord } = useCreateRecord();
  const { mutate: updateRecord } = useUpdateRecord();
  const { mutate: deleteRecord } = useDeleteRecord();

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);

  const handlePaginationChange = (pagination: {
    page: number;
    pageSize: number;
  }) => {
    setPagination(pagination);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      if (!values) return;
      const payload = {
        ...values,
        // `workDate` is a calendar date, not an instant. Sending the Dayjs
        // object directly makes JSON serialize it as UTC and can shift the day.
        workDate: toDateString(values.workDate),
        // Keep the existing ISO timestamp behavior for the time columns.
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
      };
      if (!isEditing) {
        createRecord(payload, {
          onSuccess: () => {
            setOpen(false);
            form.resetFields();
          },
        });
      } else {
        if (!updateId) return;
        updateRecord({ id: updateId, data: payload }, {
          onSuccess: () => {
            setUpdateId(null);
            setIsEditing(false);
            setLoading(false);
            setOpen(false);
          },
        })
      }
    } catch (error) {
      console.log("Validation failed:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setOpen(false);
    setIsEditing(false);
  };

  const handleEdit = (id: number) => {
    setUpdateId(id);
    const recordToEdit = data?.data.find(
      (record: IRecordResponse) => record.id === id,
    );
    if (recordToEdit) {
      form.setFieldsValue({
        ...recordToEdit,
        workDate: dayjs(recordToEdit.workDate),
        startTime: dayjs(recordToEdit.startTime),
        endTime: dayjs(recordToEdit.endTime),
      });
      setIsEditing(true);
      setOpen(true);
    }
  };

  const total = data?.pagination?.total ?? 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock size={22} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold leading-tight text-slate-900">
                Overtime records
              </h1>
              <p className="text-sm text-slate-500">
                Log, review and edit the overtime you&apos;ve worked.
              </p>
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<Plus size={16} />}
            onClick={() => setOpen(true)}
            className="w-full sm:w-auto"
          >
            New record
          </Button>
        </header>

        {/* Error state: keeps the page frame so the user can still act */}
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
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
              <h2 className="text-sm font-medium text-slate-700">
                All records
              </h2>
              {!isLoading && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium tabular-nums text-slate-600">
                  {total} {total === 1 ? "record" : "records"}
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
                onEdit={handleEdit}
                onDelete={(id: number) => {
                  Modal.confirm({
                    title: "Delete this record?",
                    content: "This can't be undone.",
                    centered: true,
                    okText: "Delete",
                    okType: "danger",
                    cancelText: "Keep it",
                    onOk: async () => {
                      try {
                        setLoading(true);
                        deleteRecord(id, {
                          onSuccess: () => {
                            setUpdateId(null);
                            setIsEditing(false);
                            setOpen(false);
                          }
                        });
                      } catch (error) {
                        console.error("Error deleting record:", error);
                      }
                    },
                  });
                }}
              />
            </div>
          </section>
        )}
      </div>

      <Modal
        title={
          <span className="text-lg font-semibold">
            {isEditing ? "Edit overtime record" : "New overtime record"}
          </span>
        }
        open={open}
        onCancel={handleCancel}
        onOk={handleSubmit}
        okText={isEditing ? "Save changes" : "Create record"}
        cancelText="Cancel"
        centered
        width={560}
        destroyOnHidden
        confirmLoading={loading}
      >
        <div className="pt-3">
          <OTRecordForm form={form} isEditing={isEditing} />
        </div>
      </Modal>
    </main>
  );
}
