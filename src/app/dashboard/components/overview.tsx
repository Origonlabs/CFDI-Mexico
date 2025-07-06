
"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

const generateChartData = () => {
  const now = new Date();
  const past90days = subDays(now, 89);
  const days = eachDayOfInterval({ start: past90days, end: now });

  return days.map((day, index) => {
    const base = 4000;
    const seasonality = Math.sin(index / 20) * 1500;
    const monthSpike = index > 60 ? Math.pow(Math.abs(Math.cos((index - 60) / 4)), 20) * 2500 : 0;
    const noise = Math.random() * 500;
    
    const total = Math.floor(base + seasonality + monthSpike + noise);
    const previousTotal = Math.floor(total * (Math.sin(index/7) * 0.15 + 0.7));

    return {
      date: format(day, 'd MMM', { locale: es }),
      total,
      previousTotal,
    };
  });
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
};


export function Overview() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setData(generateChartData());
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[350px]">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart
        data={data}
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
            contentStyle={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)"
            }}
             labelStyle={{ textTransform: 'capitalize' }}
             formatter={(value: number, name: string) => [formatCurrency(value), name === 'total' ? 'Este Periodo' : 'Periodo Anterior']}
        />
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="total"
          strokeWidth={2}
          stroke="hsl(var(--primary))"
          fillOpacity={1}
          fill="url(#colorTotal)"
          name="Este Periodo"
        />
        <Area
          type="monotone"
          dataKey="previousTotal"
          strokeWidth={1.5}
          stroke="hsl(var(--muted-foreground))"
          fillOpacity={1}
          fill="url(#colorPrevious)"
          name="Periodo Anterior"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
