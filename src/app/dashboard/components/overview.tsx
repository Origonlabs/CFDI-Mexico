"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { format, subDays, eachDayOfInterval } from 'date-fns';

const generateChartData = () => {
  const now = new Date();
  const past90days = subDays(now, 89);
  const days = eachDayOfInterval({ start: past90days, end: now });

  return days.map((day, index) => {
    // Some wavy and spiky pattern to mimic the image
    const base = 1500;
    const seasonality = Math.sin(index / 15) * 500;
    const spikiness = Math.pow(Math.abs(Math.cos(index / 2.5)), 30) * 1500;
    const noise = Math.random() * 300;
    
    const visitors = Math.floor(base + seasonality + spikiness + noise);
    const previousVisitors = Math.floor(visitors * (Math.sin(index/5) * 0.15 + 0.6));

    return {
      date: format(day, 'MMM d'), // e.g., "Apr 2"
      visitors,
      previousVisitors,
    };
  });
};

export function Overview() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This runs only on the client, after the component has mounted.
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
          interval={3}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tick={false}
          domain={[0, 'dataMax + 500']}
        />
        <Tooltip
            cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
            contentStyle={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)"
            }}
             labelStyle={{ textTransform: 'capitalize' }}
        />
        <defs>
          <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="visitors"
          strokeWidth={2}
          stroke="hsl(var(--foreground))"
          fillOpacity={1}
          fill="url(#colorVisitors)"
          name="Current Visitors"
        />
        <Area
          type="monotone"
          dataKey="previousVisitors"
          strokeWidth={1.5}
          stroke="hsl(var(--muted-foreground))"
          fillOpacity={1}
          fill="url(#colorPrevious)"
          name="Previous Visitors"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
