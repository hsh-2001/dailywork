"use client";
import { useState } from "react";
import { useRecords } from "@/hooks/record.hook";
import { Alert } from "antd";
import RecordList from "@/components/RecordList";

export default function OTRecordPage() {
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
  const { data, isLoading, isError } = useRecords(pagination);

  const handlePaginationChange = (pagination: {
    page: number;
    pageSize: number;
  }) => {
    setPagination(pagination);
  };

  if (isError) {
    return <Alert type="error" title="Failed to load overtime records" />;
  }
  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold"> OT Records </h1>{" "}
        <p className="text-gray-500"> Manage overtime records </p>{" "}
      </div>{" "}
      <RecordList
        data={data?.data ?? []}
        pagination={pagination}
        isLoading={isLoading}
        total={data?.pagination?.total ?? 0}
        onPaginationChange={handlePaginationChange}
      />
    </div>
  );
}
