"use client";

import { Form, Input, DatePicker, TimePicker, FormInstance, Grid } from "antd";
import MobileDatePicker from "./MobileDatePicker";
import MobileTimePicker from "./MobileTimePicker";

export interface OTRecordFormValues {
  workDate: string;
  startTime: string;
  endTime: string;
  project?: string;
  task?: string;
  note?: string;
}

interface OTRecordFormProps {
  form: FormInstance<OTRecordFormValues>;
  isEditing?: boolean;
}

export default function OTRecordForm({ form, isEditing }: OTRecordFormProps) {
  const screens = Grid.useBreakpoint();
  // `screens` is {} on the first render, so only treat as mobile once md is explicitly false
  const isMobile = screens.md === false;
  const size = isMobile ? "large" : "middle";

  return (
    <Form
      form={form}
      layout="vertical"
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
        <Input placeholder="Enter project" enterKeyHint="next" allowClear />
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
    </Form>
  );
}