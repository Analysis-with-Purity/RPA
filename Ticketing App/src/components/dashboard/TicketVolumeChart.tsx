"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import type { TicketVolumePoint } from "@/lib/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  opened: { label: "Opened", color: "var(--color-chart-1)" },
  resolved: { label: "Resolved", color: "var(--color-chart-3)" },
} satisfies ChartConfig;

export function TicketVolumeChart({ data }: { data: TicketVolumePoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <AreaChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
        <defs>
          <linearGradient id="fillOpened" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-opened)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-opened)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillResolved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-resolved)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-resolved)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(value: string) =>
            new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                new Date(value as string).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
              indicator="dot"
            />
          }
        />
        <Area
          dataKey="opened"
          type="monotone"
          fill="url(#fillOpened)"
          stroke="var(--color-opened)"
          strokeWidth={2}
        />
        <Area
          dataKey="resolved"
          type="monotone"
          fill="url(#fillResolved)"
          stroke="var(--color-resolved)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
