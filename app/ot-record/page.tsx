import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import OTRecordClient from "@/app/ot-record/OTRecordClient";
import { getInitialUserRecordPage } from "@/services/record.server";

export default async function OTRecordPage() {
  const initialData = await getInitialUserRecordPage(10);
  const queryClient = new QueryClient();
  if (initialData) {
    queryClient.setQueryData(["ot-records", { page: 1, pageSize: 10 }], initialData);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OTRecordClient />
    </HydrationBoundary>
  );
}
