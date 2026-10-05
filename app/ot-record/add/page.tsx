"use client";

import OTRecordForm, { OTRecordFormValues } from "@/components/OTRecordForm";
import {
  useCreateRecord,
  useCreateRecordDraft,
  useFinishRecordDraft,
  useRecordDraft,
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
  const draftId = searchParams.get("draft");
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
  const createDraftMutation = useCreateRecordDraft();
  const finishDraftMutation = useFinishRecordDraft();
  const updateMutation = useUpdateRecord();
  const draftQuery = useRecordDraft(draftId ?? undefined);
  const projectsQuery = useProjects();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isFinishingDraft = Boolean(draftId);
  const isEditing = Boolean(record) || isFinishingDraft;
  const isPending =
    createMutation.isPending ||
    createDraftMutation.isPending ||
    finishDraftMutation.isPending ||
    updateMutation.isPending;
  const endTime = Form.useWatch("endTime", form);

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        ...record,
        workDate: dayjs.tz(record.workDate, APP_TZ),
        startTime: dayjs(record.startTime).tz(APP_TZ),
        endTime: record.endTime ? dayjs(record.endTime).tz(APP_TZ) : undefined,
        project: record.project ?? undefined,
        task: record.task ?? undefined,
        note: record.note ?? undefined,
        bookingStatus: record.bookingStatus ?? "PENDING",
        submitStatus: record.submitStatus ?? "NOT_SUBMITTED",
      });
    }
  }, [form, record]);

  useEffect(() => {
    const draft = draftQuery.data;
    if (!draft) return;
    form.setFieldsValue({
      workDate: dayjs.tz(draft.workDate, APP_TZ),
      startTime: dayjs(draft.startTime).tz(APP_TZ),
      project: draft.project ?? undefined,
      task: draft.task ?? undefined,
      note: draft.note ?? undefined,
      bookingStatus: draft.bookingStatus,
      submitStatus: draft.submitStatus,
    });
  }, [draftQuery.data, form]);

  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      const values = await form.validateFields();
      const startTime = toGmt7Timestamp(values.workDate, values.startTime);
      const selectedEndTime = values.endTime;
      let endTime = selectedEndTime
        ? toGmt7Timestamp(values.workDate, selectedEndTime)
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
      const payload: ICreateRecordRequest = {
        workDate: toDateString(values.workDate),
        startTime,
        endTime,
        project: values.project,
        task: values.task,
        note: values.note,
        bookingStatus: values.bookingStatus,
        submitStatus: values.submitStatus,
      };

      if (isFinishingDraft && !values.endTime) {
        setSubmitError("Select an end time to finish this OT draft.");
        return;
      }

      if (draftId) {
        await finishDraftMutation.mutateAsync({ id: draftId, data: payload });
      } else if (record) {
        await updateMutation.mutateAsync({ id: record.id, data: payload });
      } else if (!values.endTime) {
        await createDraftMutation.mutateAsync(payload);
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
      <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-7">
        <Link
          href="/ot-record"
          className="mb-3 inline-flex min-h-8 items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-700 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Work logs
        </Link>

        <header className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">Work logs</p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            {isFinishingDraft ? "Finish OT draft" : isEditing ? "Edit work log" : "Add work log"}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
            {isFinishingDraft
              ? "Add the end time to save this draft as a work log."
              : "Enter your work hours and add any useful details."}
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-5">
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
          {(!recordParam || record) && (!draftId || draftQuery.data) ? (
            <Spin spinning={isPending || (isFinishingDraft && draftQuery.isLoading)}>
              <OTRecordForm
                form={form}
                projects={projectsQuery.data?.data ?? []}
                projectsLoading={projectsQuery.isLoading}
                currentProject={record?.project}
              />
              <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <Button onClick={() => router.push("/ot-record")}>
                  Cancel
                </Button>
                <Button type="primary" icon={<Save size={16} />} loading={isPending} onClick={handleSubmit}>
                  {isFinishingDraft
                    ? "Finish OT"
                    : record
                      ? "Save changes"
                      : endTime
                        ? "Save record"
                        : "Start OT draft"}
                </Button>
              </div>
            </Spin>
          ) : (
            <Alert
              type="error"
              showIcon
              message={draftId && draftQuery.isLoading ? "Loading OT draft..." : "This work log or draft link is invalid."}
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
