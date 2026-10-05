import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import DashboardClient from "@/app/dashboard/DashboardClient";
import { getInitialUserRecordPage } from "@/services/record.server";

export default async function DashboardPage() {
  const initialData = await getInitialUserRecordPage(5);
  const queryClient = new QueryClient();
  if (initialData) {
    queryClient.setQueryData(["ot-records", { page: 1, pageSize: 5 }], initialData);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  );
}
