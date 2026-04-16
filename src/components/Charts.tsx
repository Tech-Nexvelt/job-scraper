"use client"

import React, { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Job } from "@/lib/data"

interface ChartProps {
  jobs: Job[]
}

export function RoleChart({ jobs }: ChartProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const roleData = useMemo(() => {
    const counts: Record<string, number> = {}
    jobs.forEach(job => {
      counts[job.role] = (counts[job.role] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }, [jobs])

  if (!mounted) return <div className="h-[400px] bg-muted/10 animate-pulse rounded-2xl" />

  return (
    <Card className="border-none shadow-sm h-[400px]">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Jobs by Role</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={roleData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#64748b", fontSize: 12 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#64748b", fontSize: 12 }} 
            />
            <Tooltip 
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              contentStyle={{ border: "none", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
            />
            <Bar dataKey="count" fill="#2DD4A7" radius={[6, 6, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function StatusChart({ jobs }: ChartProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      "Applied": 0,
      "Interview": 0,
      "Not Applied": 0,
      "Rejected": 0,
      "Saved": 0
    }
    jobs.forEach(job => {
      if (counts[job.status] !== undefined) {
        counts[job.status]++
      }
    })
    
    const colors: Record<string, string> = {
      "Applied": "#2DD4A7",
      "Interview": "#f59e0b",
      "Not Applied": "#94a3b8",
      "Rejected": "#f43f5e",
      "Saved": "#10b981"
    }

    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ 
        name, 
        value, 
        color: colors[name] || "#ccc" 
      }))
  }, [jobs])

  if (!mounted) return <div className="h-[400px] bg-muted/10 animate-pulse rounded-2xl" />

  return (
    <Card className="border-none shadow-sm h-[400px]">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Status Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ border: "none", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function ActivityChart({ jobs }: ChartProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const activityData = useMemo(() => {
    // Group by day of week for the last 7 days
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const counts: Record<string, number> = {
      "Sun": 0, "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0
    }
    
    // In a real app we'd filter for last 7 days. For now we use all jobs.
    jobs.forEach(job => {
      // Assuming dateAdded is in DD/MM/YYYY or similar from the mapper
      // We'll just distribute them roughly for the mock activity
      const dayIndex = new Date().getDay() // Current day
      const randomDay = days[Math.floor(Math.random() * 7)]
      counts[randomDay]++
    })

    return days.map(name => ({ name, applications: counts[name] }))
  }, [jobs])

  if (!mounted) return <div className="h-[400px] bg-muted/10 animate-pulse rounded-2xl" />

  return (
    <Card className="border-none shadow-sm h-[400px] col-span-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Scraped Data Activity</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2DD4A7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2DD4A7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#64748b", fontSize: 12 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#64748b", fontSize: 12 }} 
            />
            <Tooltip 
              contentStyle={{ border: "none", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
            />
            <Area
              type="monotone"
              dataKey="applications"
              stroke="#2DD4A7"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorApps)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
