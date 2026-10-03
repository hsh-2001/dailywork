"use client";

import OTRecordForm, { OTRecordFormValues } from "@/components/OTRecordForm";
import { useCreateRecord, useUpdateRecord } from "@/hooks/record.hook";
import { useProjects } from "@/hooks/project.hook";
import { ICreateRecordRequest } from "@/shares/dtos/record/createRequest";
import { IRecordResponse } from "@/shares/dtos/record/recordResponse";
import { toDateString } from "@/utils/datetime";
import { ArrowLeft, Clock, Save } from "lucide-react";
import { Alert, Button, Form, Spin } from "antd";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AddRecordPage() {
  const router = useRouter();
  const [recordParam] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("record");
  });
  const record = useMemo<IRecordResponse | null>(() => {
    if (!recordParam) return null;
    try {
      const parsed = JSON.parse(recordParam) as IRecordResponse;
      return typeof parsed.id === "number" ? parsed : null;
    } catch {
      return null;
    }
  }, [recordParam]);
  const [form] = Form.useForm<OTRecordFormValues>();
  const createMutation = useCreateRecord();
  const updateMutation = useUpdateRecord();
  const projectsQuery = useProjects();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEditing = Boolean(record);
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        ...record,
        workDate: dayjs(record.workDate),
        startTime: dayjs(record.startTime),
        endTime: dayjs(record.endTime),
        project: record.project ?? undefined,
        task: record.task ?? undefined,
        note: record.note ?? undefined,
      });
    }
  }, [form, record]);

  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      const values = await form.validateFields();
      const payload: ICreateRecordRequest = {
        workDate: toDateString(values.workDate),
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
        project: values.project,
        task: values.task,
        note: values.note,
      };

      if (record) {
        await updateMutation.mutateAsync({ id: record.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      router.push("/ot-record");
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) return;
      setSubmitError("Couldn't save this record. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <Link href="/ot-record" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700">
          <ArrowLeft size={16} /> Back to work logs
        </Link>

        <header className="mb-7 flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/20">
            <Clock size={22} strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Work logs</p>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">
              {isEditing ? "Edit record" : "Add a record"}
            </h1>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-7">
          {submitError && <Alert className="mb-5" type="error" showIcon message={submitError} />}
          {projectsQuery.isError && (
            <Alert
              className="mb-5"
              type="warning"
              showIcon
              message="Couldn't load projects"
              action={
                <Button size="small" onClick={() => projectsQuery.refetch()}>
                  Try again
                </Button>
              }
            />
          )}
          {!recordParam || record ? (
            <Spin spinning={isPending}>
              <OTRecordForm
                form={form}
                projects={projectsQuery.data?.data ?? []}
                projectsLoading={projectsQuery.isLoading}
                currentProject={record?.project}
              />
              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Button size="large" onClick={() => router.push("/ot-record")}>
                  Cancel
                </Button>
                <Button type="primary" size="large" icon={<Save size={16} />} loading={isPending} onClick={handleSubmit}>
                  {isEditing ? "Save changes" : "Save record"}
                </Button>
              </div>
            </Spin>
          ) : (
            <Alert type="error" showIcon message="This record link is invalid." />
          )}
        </section>
      </div>
    </main>
  );
}
