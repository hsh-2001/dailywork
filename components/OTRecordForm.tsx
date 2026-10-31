"use client";

import { Form, Input, DatePicker, TimePicker, FormInstance, Grid, Radio, Select } from "antd";
import type { Dayjs } from "dayjs";
import type { IProjectResponse } from "@/shares/dtos/project/projectResponse";
import type { WorkDaySelection } from "@/shares/dtos/record/recordResponse";
import { CalendarDays } from "lucide-react";
import MobileDatePicker from "./MobileDatePicker";
import MobileTimePicker from "./MobileTimePicker";

export interface OTRecordFormValues {
  workDate: Dayjs;
  startTime: Dayjs;
  endTime?: Dayjs;
  breakStartTime?: Dayjs;
  breakEndTime?: Dayjs;
  project?: string;
  task?: string;
  note?: string;
  dayType: WorkDaySelection;
  bookingStatus: "PENDING" | "BOOKED" | "CANCELLED";
  submitStatus: "NOT_SUBMITTED" | "SUBMITTED" | "APPROVED" | "REJECTED";
}

interface OTRecordFormProps {
  form: FormInstance<OTRecordFormValues>;
  projects: IProjectResponse[];
  projectsLoading: boolean;
  currentProject?: string | null;
}

export default function OTRecordForm({
  form,
  projects,
  projectsLoading,
  currentProject,
}: OTRecordFormProps) {
  const screens = Grid.useBreakpoint();
  // `screens` is {} on the first render, so only treat as mobile once md is explicitly false
  const isMobile = screens.md === false;
  const size = isMobile ? "large" : "middle";
  const projectOptions = projects
    .filter((project) => project.status === "ACTIVE")
    .map((project) => ({ value: project.name, label: project.name }));
  if (currentProject && !projectOptions.some((option) => option.value === currentProject)) {
    projectOptions.push({
      value: currentProject,
      label: `${currentProject} (inactive)`,
    });
  }

  return (
    <Form
      form={form}
      layout="vertical"
      className="[&_.ant-form-item]:!mb-3 [&_.ant-form-item-label]:!pb-1"
      initialValues={{
        bookingStatus: "PENDING",
        submitStatus: "NOT_SUBMITTED",
        dayType: "NORMAL",
      }}
      requiredMark
      size={size}
      autoComplete="off"
      scrollToFirstError={{ behavior: "smooth", block: "center" }}
    >
      <Form.Item
        name="workDate"
        label="Work Date"
        rules={[{ required: true, message: "Please select work date" }]}
      >
        {isMobile ? (
          <MobileDatePicker title="Work date" />
        ) : (
          <DatePicker className="w-full" suffixIcon={<CalendarDays size={16} />} />
        )}
      </Form.Item>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Form.Item
          name="startTime"
          label="Start Time"
          rules={[{ required: true, message: "Select start time" }]}
        >
          {isMobile ? (
            <MobileTimePicker title="Start time" placeholder="Start" />
          ) : (
            <TimePicker className="w-full" format="HH:mm" />
          )}
        </Form.Item>

        <Form.Item
          name="endTime"
          label="End Time"
          dependencies={["startTime"]}
          rules={[
            { required: true, message: "Select end time" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const start = getFieldValue("startTime");
                if (
                  !value ||
                  !start ||
                  value.hour() !== start.hour() ||
                  value.minute() !== start.minute()
                ) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("End time must differ from start time"));
              },
            }),
          ]}
        >
          {isMobile ? (
            <MobileTimePicker title="End time" placeholder="End" />
          ) : (
            <TimePicker className="w-full" format="HH:mm" />
          )}
        </Form.Item>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Form.Item name="breakStartTime" label="Break Start">
          {isMobile ? (
            <MobileTimePicker title="Break start" placeholder="Optional" />
          ) : (
            <TimePicker className="w-full" format="HH:mm" placeholder="Optional" />
          )}
        </Form.Item>
        <Form.Item
          name="breakEndTime"
          label="Break End"
          dependencies={["startTime", "endTime", "breakStartTime"]}
          rules={[({ getFieldValue }) => ({
            validator(_, value) {
              const breakStart = getFieldValue("breakStartTime");
              const start = getFieldValue("startTime");
              const end = getFieldValue("endTime");
              if (!breakStart && !value) return Promise.resolve();
              if (!breakStart || !value) {
                return Promise.reject(new Error("Enter both break start and break end times"));
              }
              if (!start) return Promise.resolve();

              const minutes = (time: Dayjs) => time.hour() * 60 + time.minute();
              const workStart = minutes(start);
              const breakStartMinute = minutes(breakStart) < workStart
                ? minutes(breakStart) + 1440
                : minutes(breakStart);
              const breakEndMinute = minutes(value) <= minutes(breakStart)
                ? minutes(value) + 1440
                : minutes(value);
              if (breakStartMinute < workStart || breakEndMinute <= breakStartMinute) {
                return Promise.reject(new Error("Break time must be after work starts"));
              }
              if (end) {
                const workEnd = minutes(end) <= workStart ? minutes(end) + 1440 : minutes(end);
                if (breakEndMinute > workEnd) {
                  return Promise.reject(new Error("Break time must finish before work ends"));
                }
              }
              return Promise.resolve();
            },
          })]}
        >
          {isMobile ? (
            <MobileTimePicker title="Break end" placeholder="Optional" />
          ) : (
            <TimePicker className="w-full" format="HH:mm" placeholder="Optional" />
          )}
        </Form.Item>
      </div>

      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Form.Item name="project" label="Project">
          <Select
            allowClear
            placeholder="Select a project"
            options={projectOptions}
            loading={projectsLoading}
          />
        </Form.Item>

        <Form.Item name="task" label="Task">
          <Input placeholder="Enter task" enterKeyHint="next" allowClear />
        </Form.Item>
      </div>

      <Form.Item name="note" label="Remark">
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 6 }}
          placeholder="Enter note"
          enterKeyHint="done"
        />
      </Form.Item>

      <Form.Item name="dayType" label="Day type">
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          options={[
            { value: "NORMAL", label: "Normal day" },
            { value: "NORMAL_HOLIDAY", label: "Normal holiday" },
            { value: "SPECIAL_DAY", label: "Special day" },
          ]}
          className="flex flex-wrap"
        />
      </Form.Item>

      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Form.Item name="bookingStatus" label="Booking status" rules={[{ required: true }]}>
          <Select options={[
            { value: "PENDING", label: "Pending" },
            { value: "BOOKED", label: "Booked" },
            { value: "CANCELLED", label: "Cancelled" },
          ]} />
        </Form.Item>
        <Form.Item name="submitStatus" label="Submit status" rules={[{ required: true }]}>
          <Select options={[
            { value: "NOT_SUBMITTED", label: "Not submitted" },
            { value: "SUBMITTED", label: "Submitted" },
            { value: "APPROVED", label: "Approved" },
            { value: "REJECTED", label: "Rejected" },
          ]} />
        </Form.Item>
      </div>
    </Form>
  );
}
