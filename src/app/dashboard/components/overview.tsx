
"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface OverviewProps {
  data: { date: string, total: number }[] | undefined | null;
  loading: boolean;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-lg border bg-card p-3 shadow-sm">
        <p className="text-sm font-bold mb-2 text-card-foreground">Ventas totales</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="h-px w-4" style={{ backgroundColor: data.stroke }} />
          <span className="font-medium text-muted-foreground">{label}</span>
          <span className="ml-auto font-semibold text-card-foreground">{formatCurrency(data.value)}</span>
        </div>
      </div>
    );
  }
  return null;
};


export function Overview({ data, loading }: OverviewProps) {

  if (loading) {
    return (
      <div className="w-full h-[350px]">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  
  const chartData = data || [];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart
        data={chartData}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="0" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          interval={6}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${Number(value) / 1000}K`}
          domain={[0, 'dataMax + 1000']}
        />
        <Tooltip
            cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
            content={<CustomTooltip />}
        />
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="total"
          strokeWidth={2}
          stroke="hsl(var(--primary))"
          fillOpacity={1}
          fill="url(#colorTotal)"
          name="Total Facturado"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
