"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ConfigProvider } from "antd-mobile";
import enUS from "antd-mobile/es/locales/en-US";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <ConfigProvider locale={enUS}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ConfigProvider>
  );
}
