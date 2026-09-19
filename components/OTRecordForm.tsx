"use client";

import { Form, Input, DatePicker, TimePicker, FormInstance } from "antd";

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

export default function OTRecordForm({ form , isEditing }: OTRecordFormProps) {
  return (
    <Form form={form} layout="vertical" requiredMark>
      <Form.Item
        name="workDate"
        label="Work Date"
        rules={[
          {
            required: true,
            message: "Please select work date",
          },
        ]}
      >
        <DatePicker className="w-full" />
      </Form.Item>

      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          name="startTime"
          label="Start Time"
          rules={[
            {
              required: true,
              message: "Please select start time",
            },
          ]}
        >
          <TimePicker className="w-full" format="HH:mm" />
        </Form.Item>

        <Form.Item
          name="endTime"
          label="End Time"
          rules={[
            {
              required: true,
              message: "Please select end time",
            },
          ]}
        >
          <TimePicker className="w-full" format="HH:mm" />
        </Form.Item>
      </div>

      <Form.Item name="project" label="Project">
        <Input placeholder="Enter project" />
      </Form.Item>

      <Form.Item name="task" label="Task">
        <Input placeholder="Enter task" />
      </Form.Item>

      <Form.Item name="note" label="Note">
        <Input.TextArea rows={4} placeholder="Enter note" />
      </Form.Item>
    </Form>
  );
}
