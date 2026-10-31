"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ConfigProvider } from "antd-mobile";
import enUS from "antd-mobile/es/locales/en-US";
import { ConfigProvider as AntdConfigProvider } from "antd";

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
      <AntdConfigProvider
        theme={{
          token: {
            colorPrimary: "#334155",
            colorLink: "#475569",
            colorLinkHover: "#1e293b",
            colorInfo: "#64748b",
            borderRadius: 8,
          },
          components: {
            Button: { primaryShadow: "none" },
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AntdConfigProvider>
    </ConfigProvider>
  );
}
