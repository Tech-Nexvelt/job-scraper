"use client"

import React from "react"
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

const roleData = [
  { name: "Frontend", count: 5 },
  { name: "Backend", count: 4 },
  { name: "Full Stack", count: 3 },
  { name: "Data Analyst", count: 3 },
]

const statusData = [
  { name: "Applied", value: 6, color: "#3b82f6" },
  { name: "Interview", value: 3, color: "#f59e0b" },
  { name: "Not Applied", value: 4, color: "#94a3b8" },
  { name: "Rejected", value: 2, color: "#f43f5e" },
]

const activityData = [
  { name: "Mon", applications: 2 },
  { name: "Tue", applications: 4 },
  { name: "Wed", applications: 1 },
  { name: "Thu", applications: 5 },
  { name: "Fri", applications: 3 },
  { name: "Sat", applications: 0 },
  { name: "Sun", applications: 1 },
]

export function RoleChart() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

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
            <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function StatusChart() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

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

export function ActivityChart() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-[400px] bg-muted/10 animate-pulse rounded-2xl" />

  return (
    <Card className="border-none shadow-sm h-[400px] col-span-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Weekly Activity</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorApps)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
