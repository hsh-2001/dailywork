"use client";

import { Form, Input, DatePicker, TimePicker, FormInstance, Grid, Select } from "antd";
import type { Dayjs } from "dayjs";
import type { IProjectResponse } from "@/shares/dtos/project/projectResponse";
import MobileDatePicker from "./MobileDatePicker";
import MobileTimePicker from "./MobileTimePicker";

export interface OTRecordFormValues {
  workDate: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  project?: string;
  task?: string;
  note?: string;
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
      initialValues={{ bookingStatus: "PENDING", submitStatus: "NOT_SUBMITTED" }}
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
          <DatePicker className="w-full" />
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
                // Overnight shifts: remove this check if end time can be before start time
                if (!value || !start || value.isAfter(start)) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Must be after start"));
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

      <Form.Item name="note" label="Note">
        <Input.TextArea
          autoSize={{ minRows: 3, maxRows: 8 }}
          placeholder="Enter note"
          enterKeyHint="done"
        />
      </Form.Item>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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
