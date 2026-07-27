"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/**
 * Horizontal count bars — one series, one hue.
 *
 * Category identity lives on the y-axis, so colour carries no information and a single
 * blue is correct: a per-category palette here would imply a distinction that isn't in the
 * data, and tints of one hue are indistinguishable under colour-vision deficiency anyway.
 */
const chartConfig = {
  value: { label: "Tickets", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

export interface CountDatum {
  name: string;
  value: number;
}

export function CountBarChart({
  data,
  height = 240,
  emptyMessage = "Nothing to show.",
}: {
  data: CountDatum[];
  height?: number;
  emptyMessage?: string;
}) {
  if (data.length === 0) {
    return (
      <p className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  // Headroom so the tip label never runs past the plot edge.
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 4, right: 36, top: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis type="number" domain={[0, max]} hide />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={140}
          tickMargin={8}
          className="text-xs"
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar
          dataKey="value"
          fill="var(--color-value)"
          // Rounded at the data end, square at the baseline.
          radius={[0, 4, 4, 0]}
          maxBarSize={24}
        >
          {/* The value rides the tip; the axis carries identity, so no legend is needed. */}
          <LabelList
            dataKey="value"
            position="right"
            offset={8}
            className="fill-muted-foreground text-xs"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
