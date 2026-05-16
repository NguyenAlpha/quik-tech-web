"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useLanguage } from "@/lib/language-context"

const salesData = [
  { month: "Jan", revenue: 18600 },
  { month: "Feb", revenue: 21000 },
  { month: "Mar", revenue: 19400 },
  { month: "Apr", revenue: 24800 },
  { month: "May", revenue: 28300 },
  { month: "Jun", revenue: 32100 },
  { month: "Jul", revenue: 35400 },
  { month: "Aug", revenue: 38700 },
  { month: "Sep", revenue: 36200 },
  { month: "Oct", revenue: 42100 },
  { month: "Nov", revenue: 45200 },
  { month: "Dec", revenue: 48900 },
]

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function SalesChart() {
  const { t } = useLanguage()

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">{t.salesChart.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t.salesChart.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[hsl(var(--chart-1))]" />
              <span className="text-muted-foreground">{t.salesChart.revenue}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart
            data={salesData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <ChartTooltip
              cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "4 4" }}
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <span className="font-semibold">
                      ${Number(value).toLocaleString()}
                    </span>
                  )}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              fill="url(#fillRevenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
