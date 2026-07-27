"use client";

import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  score: { label: "Satisfaction", color: "var(--color-primary)" },
} satisfies ChartConfig;

export function SatisfactionScoreCard({ score }: { score: number }) {
  const data = [{ name: "score", value: score, fill: "var(--color-score)" }];

  return (
    <div className="relative">
      <ChartContainer config={chartConfig} className="mx-auto aspect-square h-64">
        <RadialBarChart
          data={data}
          startAngle={90}
          endAngle={90 - 360 * (score / 100)}
          innerRadius={80}
          outerRadius={110}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar dataKey="value" background cornerRadius={10} />
        </RadialBarChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-primary">{score}</span>
        <span className="text-xs text-muted-foreground">out of 100</span>
      </div>
    </div>
  );
}
