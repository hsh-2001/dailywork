"use client";

import OTRecordForm, { OTRecordFormValues } from "@/components/OTRecordForm";
import {
  useCreateRecord,
  useUpdateRecord,
} from "@/hooks/record.hook";
import { useProjects } from "@/hooks/project.hook";
import { ICreateRecordRequest } from "@/shares/dtos/record/createRequest";
import { IRecordResponse } from "@/shares/dtos/record/recordResponse";
import { APP_TZ, toDateString, toGmt7Timestamp } from "@/utils/datetime";
import { ArrowLeft, Save } from "lucide-react";
import { Alert, Button, Form, Spin } from "antd";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";

function AddRecordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordParam = searchParams.get("record");
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
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        ...record,
        workDate: dayjs.tz(record.workDate, APP_TZ),
        startTime: dayjs(record.startTime).tz(APP_TZ),
        endTime: record.endTime ? dayjs(record.endTime).tz(APP_TZ) : undefined,
        breakStartTime: record.breakStartTime ? dayjs(record.breakStartTime).tz(APP_TZ) : undefined,
        breakEndTime: record.breakEndTime ? dayjs(record.breakEndTime).tz(APP_TZ) : undefined,
        project: record.project ?? undefined,
        task: record.task ?? undefined,
        note: record.note ?? undefined,
        bookingStatus: record.bookingStatus ?? "PENDING",
        submitStatus: record.submitStatus ?? "NOT_SUBMITTED",
      });
    }
  }, [form, record]);

  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      const values = await form.validateFields();
      const startTime = toGmt7Timestamp(values.workDate, values.startTime);
      const selectedEndTime = values.endTime;
      let endTime = selectedEndTime
        ? toGmt7Timestamp(values.workDate, selectedEndTime)
        : null;
      let breakStartTime = values.breakStartTime
        ? toGmt7Timestamp(values.workDate, values.breakStartTime)
        : null;
      let breakEndTime = values.breakEndTime
        ? toGmt7Timestamp(values.workDate, values.breakEndTime)
        : null;
      if (
        endTime &&
        selectedEndTime &&
        (selectedEndTime.hour() < values.startTime.hour() ||
          (selectedEndTime.hour() === values.startTime.hour() &&
            selectedEndTime.minute() < values.startTime.minute()))
      ) {
        endTime = dayjs(endTime).add(1, "day").toISOString();
      }
      if (breakStartTime && values.breakStartTime &&
        (values.breakStartTime.hour() < values.startTime.hour() ||
          (values.breakStartTime.hour() === values.startTime.hour() && values.breakStartTime.minute() < values.startTime.minute()))) {
        breakStartTime = dayjs(breakStartTime).add(1, "day").toISOString();
      }
      if (breakEndTime && values.breakEndTime && values.breakStartTime &&
        (values.breakEndTime.hour() < values.breakStartTime.hour() ||
          (values.breakEndTime.hour() === values.breakStartTime.hour() && values.breakEndTime.minute() <= values.breakStartTime.minute()))) {
        breakEndTime = dayjs(breakEndTime).add(1, "day").toISOString();
      } else if (breakEndTime && breakStartTime && dayjs(breakEndTime).isBefore(dayjs(breakStartTime))) {
        breakEndTime = dayjs(breakEndTime).add(1, "day").toISOString();
      }
      const payload: ICreateRecordRequest = {
        workDate: toDateString(values.workDate),
        startTime,
        endTime,
        breakStartTime,
        breakEndTime,
        project: values.project,
        task: values.task,
        note: values.note,
        bookingStatus: values.bookingStatus,
        submitStatus: values.submitStatus,
      };

      if (!values.endTime) {
        setSubmitError("Select an end time to save this work log.");
        return;
      }

      if (record) {
        await updateMutation.mutateAsync({ id: record.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      router.push("/ot-record");
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) return;
      if (
        isAxiosError<{ errorCode?: string; message?: string }>(error) &&
        error.response?.data.errorCode === "DUPLICATE_WORK_DATE"
      ) {
        setSubmitError(error.response.data.message ?? "A work log already exists for this date.");
        return;
      }
      if (isAxiosError<{ errorCode?: string; message?: string }>(error)) {
        const { errorCode, message } = error.response?.data ?? {};
        if (errorCode === "DB_ERROR") {
          setSubmitError("Couldn't save the work log. Check that the latest database migration has been applied, then try again.");
          return;
        }
        if (message) {
          setSubmitError(message);
          return;
        }
      }
      setSubmitError("Couldn't save this record. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6 sm:py-5">
        <Link
          href="/ot-record"
          className="mb-2 inline-flex min-h-8 items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Work logs
        </Link>

        <header className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Work logs</p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            {record ? "Edit work log" : "Add work log"}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
            Enter your work hours and add any useful details.
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          {submitError && <Alert className="mb-3" type="error" showIcon message={submitError} />}
          {projectsQuery.isError && (
            <Alert
              className="mb-3"
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
          {(!recordParam || record) ? (
            <Spin spinning={isPending}>
              <OTRecordForm
                form={form}
                projects={projectsQuery.data?.data ?? []}
                projectsLoading={projectsQuery.isLoading}
                currentProject={record?.project}
              />
              <div className="mt-3 flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
                <Button onClick={() => router.push("/ot-record")}>
                  Cancel
                </Button>
                <Button type="primary" icon={<Save size={16} />} loading={isPending} onClick={handleSubmit}>
                  {record ? "Save changes" : "Save record"}
                </Button>
              </div>
            </Spin>
          ) : (
            <Alert
              type="error"
              showIcon
              message="This work log link is invalid."
            />
          )}
        </section>
      </div>
    </main>
  );
}

export default function AddRecordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-5">
          <div className="mx-auto flex max-w-3xl justify-center rounded-xl border border-slate-200 bg-white p-5">
            <Spin />
          </div>
        </main>
      }
    >
      <AddRecordPageContent />
    </Suspense>
  );
}
